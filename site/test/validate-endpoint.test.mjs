/**
 * The Check endpoint (worker/validate.ts): the request contract, every
 * limit that keeps it a checker rather than a fetcher, type detection,
 * and the page check against a local server that plays the publisher.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { handle, validateSheetUrl, validateSheetText, dohTxtResolver, DOH_ENDPOINT, VALIDATE_PATH, FORMER_VALIDATE_PATHS } from "../worker/validate.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (...p) => readFileSync(join(here, "..", "..", "commerce", ...p), "utf8");
const CLEAN = fixture("lint", "test", "cli-fixtures", "clean.json");
const BROKEN = fixture("lint", "test", "cli-fixtures", "layer1-fails.json");
const ORGANIZATION = fixture("lint", "test", "fixtures", "org-e-001", "clean.json");
const COLLECTION = fixture("lint", "test", "fixtures", "col-e-001", "clean.json");

const assets = { fetch: async () => new Response("asset", { status: 200 }) };
const env = { ASSETS: assets };
const local = { allowedProtocols: ["http:"] };
const call = (path, init, options) => handle(new Request(`https://themachineweb.org${path}`, init), env, options);

test("other paths fall through to the assets binding", async () => {
  const res = await call("/pagefront");
  assert.equal(await res.text(), "asset");
  const page = await call("/pagefront/commerce/validate");
  assert.equal(await page.text(), "asset");
});

test("the endpoint answers at its path and at both former paths", async () => {
  assert.equal(VALIDATE_PATH, "/pagefront/commerce/validate.json");
  for (const path of [VALIDATE_PATH, ...FORMER_VALIDATE_PATHS]) {
    const res = await call(`${path}?sheet=${encodeURIComponent(CLEAN)}`);
    assert.equal(res.status, 200, path);
    assert.equal((await res.json()).kind, "report", path);
  }
});

test("request contract: GET with ?url=, CORS open, nothing cached", async () => {
  const missing = await call(VALIDATE_PATH);
  assert.equal(missing.status, 400);
  assert.equal((await missing.json()).kind, "bad-request");

  const put = await call(VALIDATE_PATH, { method: "PUT" });
  assert.equal(put.status, 405);

  const both = await call(`${VALIDATE_PATH}?url=https://a.example/s.json&sheet=%7B%7D`);
  assert.equal(both.status, 400);

  const preflight = await call(VALIDATE_PATH, { method: "OPTIONS" });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "*");

  const bad = await call(`${VALIDATE_PATH}?url=not-a-url`);
  assert.equal(bad.status, 400);
  assert.equal(bad.headers.get("access-control-allow-origin"), "*");
  assert.equal(bad.headers.get("cache-control"), "no-store");
});

test("?sheet= and POST validate the caller's own JSON without fetching", async () => {
  const inline = await call(`${VALIDATE_PATH}?sheet=${encodeURIComponent(CLEAN)}`);
  assert.equal(inline.status, 200);
  assert.equal((await inline.json()).kind, "report");

  const broken = await call(`${VALIDATE_PATH}?sheet=${encodeURIComponent(BROKEN)}`);
  assert.equal((await broken.json()).kind, "layer1");

  const posted = await call(VALIDATE_PATH, { method: "POST", body: CLEAN, headers: { "content-type": "application/json" } });
  assert.equal(posted.status, 200);
  assert.equal((await posted.json()).kind, "report");

  const notJson = await validateSheetText("<html>", {});
  assert.equal(notJson.body.kind, "invalid-json");

  const big = await validateSheetText("x".repeat(20), {}, { maxBytes: 10 });
  assert.equal(big.status, 413);

  const limited = await validateSheetText(CLEAN, { VALIDATE_RATE_TOTAL: { limit: async () => ({ success: false }) } });
  assert.equal(limited.status, 429);
});

test("type detection: product, organization, collection (not yet checkable), unresolvable", async () => {
  const product = await (await call(`${VALIDATE_PATH}?sheet=${encodeURIComponent(CLEAN)}`)).json();
  assert.equal(product.kind, "report");
  assert.equal(product.sheet_type, "product");

  const organization = await (await call(`${VALIDATE_PATH}?sheet=${encodeURIComponent(ORGANIZATION)}`)).json();
  assert.equal(organization.kind, "report");
  assert.equal(organization.sheet_type, "organization");

  const collection = await (await call(`${VALIDATE_PATH}?sheet=${encodeURIComponent(COLLECTION)}`)).json();
  assert.deepEqual(collection, { kind: "unsupported-type", sheet_type: "collection" });

  // Detection by the data block when $schema is absent.
  const byShape = JSON.parse(ORGANIZATION);
  delete byShape.$schema;
  const shaped = await (await call(`${VALIDATE_PATH}?sheet=${encodeURIComponent(JSON.stringify(byShape))}`)).json();
  assert.equal(shaped.sheet_type, "organization");

  // Neither $schema nor a recognisable data block: nothing is judged.
  const unresolvable = { release: "0.4.0", canonical_url: "https://merchant.example/x", data: { "@type": "Thing", name: "x" } };
  const unknown = await (await call(`${VALIDATE_PATH}?sheet=${encodeURIComponent(JSON.stringify(unresolvable))}`)).json();
  assert.deepEqual(unknown, { kind: "unknown-type" });
  const notAnObject = await (await call(`${VALIDATE_PATH}?sheet=${encodeURIComponent("[1,2]")}`)).json();
  assert.deepEqual(notAnObject, { kind: "unknown-type" });
});

test("https only, no credentials, by default", async () => {
  const http = await validateSheetUrl("http://merchant.example/sheet.json", {});
  assert.equal(http.status, 400);
  const creds = await validateSheetUrl("https://user:pw@merchant.example/sheet.json", {});
  assert.equal(creds.status, 400);
});

test("a sheet on this site's own host is read through the assets binding", async () => {
  let asked;
  const ownAssets = { fetch: async (req) => { asked = req.url; return new Response(CLEAN, { headers: { "content-type": "application/json" } }); } };
  const res = await handle(
    new Request(`https://themachineweb.org${VALIDATE_PATH}?url=https://themachineweb.org/pagefront/commerce/case-studies/x/sheet.json`),
    { ASSETS: ownAssets }
  );
  assert.equal(asked, "https://themachineweb.org/pagefront/commerce/case-studies/x/sheet.json");
  assert.equal((await res.json()).kind, "report");
});

test("rate limits: per host and total, 429 when either refuses", async () => {
  const refuse = { limit: async () => ({ success: false }) };
  const allow = { limit: async () => ({ success: true }) };
  const perHost = await validateSheetUrl("https://merchant.example/s.json", { VALIDATE_RATE_PER_HOST: refuse, VALIDATE_RATE_TOTAL: allow });
  assert.equal(perHost.status, 429);
  const total = await validateSheetUrl("https://merchant.example/s.json", { VALIDATE_RATE_PER_HOST: allow, VALIDATE_RATE_TOTAL: refuse });
  assert.equal(total.status, 429);
});

/**
 * A local publisher. Pages and sheets are generated per scenario so the
 * sheet's canonical_url can name the page that declares it.
 */
function publisher() {
  let base = "";
  const SHEET_TYPE = "application/pagefront+json";
  const sheetFor = (page, overrides = {}) => {
    const sheet = JSON.parse(CLEAN);
    sheet.canonical_url = `${base}${page}`;
    sheet.sheet_url = `${base}/sheets${page}.json`;
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) delete sheet[k]; else sheet[k] = v;
    }
    return JSON.stringify(sheet);
  };
  const element = (href, type = SHEET_TYPE) => `<link rel="alternate" type="${type}" href="${href}">`;
  const header = (href, type = SHEET_TYPE) => `<${href}>; rel="alternate"; type="${type}"`;
  const page = (links, extraHead = "") => `<!doctype html><html><head><title>Anorak</title>${links}${extraHead}</head><body><h1>Anorak</h1></body></html>`;
  const canonical = (href) => `<link rel="canonical" href="${href}">`;

  // name → { html?, headers?, status?, location?, sheet?, sheetHeaders? }
  const scenarios = {
    both: (p) => ({ html: page(element(`${base}/sheets${p}.json`)), headers: { link: header(`${base}/sheets${p}.json`) } }),
    "header-only": (p) => ({ html: page(""), headers: { link: header(`${base}/sheets${p}.json`) } }),
    "element-only": (p) => ({ html: page(element(`${base}/sheets${p}.json`)) }),
    neither: () => ({ html: page(`<link rel="alternate" type="application/rss+xml" href="/feed">`) }),
    "two-links": (p) => ({ html: page(element(`${base}/sheets${p}.json`) + element(`${base}/sheets${p}-fr.json`)) }),
    "json-type": (p) => ({ html: page(element(`${base}/sheets${p}.json`, "application/json")) }),
    "relative-href": (p) => ({ html: page(element(`/sheets${p}.json`)) }),
    disagree: (p) => ({ html: page(element(`${base}/sheets${p}.json`)), headers: { link: header(`${base}/sheets${p}-other.json`) } }),
    "canonical-mismatch": (p) => ({ html: page(element(`${base}/sheets${p}.json`)), sheet: sheetFor(p, { canonical_url: `${base}/somewhere-else` }) }),
    // The page names another URL as canonical and the sheet agrees with it: the submitted URL was only the way in.
    "non-canonical": (p) => ({ html: page(element(`${base}/sheets${p}.json`), canonical(`${base}/page/both`)), sheet: sheetFor(p, { canonical_url: `${base}/page/both` }) }),
    // The page names a canonical and the sheet names a third URL.
    "canonical-disagree": (p) => ({ html: page(element(`${base}/sheets${p}.json`), canonical(`${base}/page/both`)), sheet: sheetFor(p, { canonical_url: `${base}/page/other` }) }),
    // The page names itself as canonical, with a relative href.
    "self-canonical": (p) => ({ html: page(element(`${base}/sheets${p}.json`), canonical(p)) }),
    "sheet-url-absent": (p) => ({ html: page(element(`${base}/sheets${p}.json`)), sheet: sheetFor(p, { sheet_url: undefined }) }),
    "sheet-url-mismatch": (p) => ({ html: page(element(`${base}/sheets${p}.json`)), sheet: sheetFor(p, { sheet_url: `${base}/old/location.json` }) }),
    "ct-json": (p) => ({ html: page(element(`${base}/sheets${p}.json`)), sheetHeaders: { "content-type": "application/json" } }),
    "ct-other": (p) => ({ html: page(element(`${base}/sheets${p}.json`)), sheetHeaders: { "content-type": "text/plain" } }),
    "no-cors": (p) => ({ html: page(element(`${base}/sheets${p}.json`)), sheetHeaders: { "access-control-allow-origin": null } }),
    "robots-blocked": (p) => ({ html: page(element(`${base}/private${p}.json`)) }),
    "sheet-missing": (p) => ({ html: page(element(`${base}/sheets${p}-gone.json`)) }),
    "sheet-redirects": (p) => ({ html: page(element(`${base}/moved${p}.json`)) }),
    redirect: () => ({ status: 302, location: "/page/both" }),
    "redirect-loop-1": () => ({ status: 301, location: "/page/redirect-loop-2" }),
    "redirect-loop-2": () => ({ status: 301, location: "/page/redirect-loop-3" }),
    "redirect-loop-3": () => ({ status: 301, location: "/page/redirect-loop-4" }),
    "redirect-loop-4": () => ({ status: 301, location: "/page/both" }),
    // A server that echoes the first Accept media type as Content-Type: the page arrives labelled as a sheet.
    echo: (p) => ({ html: page(element(`${base}/sheets${p}.json`)), headers: { "content-type": "application/pagefront+json; charset=utf-8" } }),
    // The same server at the sheet URL: HTML labelled as the sheet.
    "sheet-echo": (p) => ({ html: page(element(`${base}/sheets${p}.json`)), sheet: "<!doctype html><html><head><title>Home</title></head><body></body></html>" }),
    // JSON at the sheet URL that carries no $schema.
    "sheet-noschema": (p) => ({ html: page(element(`${base}/sheets${p}.json`)), sheet: '{"a":1}', sheetHeaders: { "content-type": "application/json" } }),
  };

  const server = createServer((req, res) => {
    const url = new URL(req.url, base);
    const path = url.pathname;
    if (path === "/robots.txt") {
      res.writeHead(200, { "content-type": "text/plain" });
      return res.end("User-agent: *\nDisallow: /private/\n");
    }
    let m;
    if ((m = /^\/page\/([a-z0-9-]+)$/.exec(path))) {
      const scenario = scenarios[m[1]];
      if (!scenario) { res.writeHead(404); return res.end(); }
      const s = scenario(path);
      if (s.status) { res.writeHead(s.status, { location: s.location }); return res.end(); }
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", ...(s.headers ?? {}) });
      return res.end(s.html);
    }
    if ((m = /^\/moved\/page\/([a-z0-9-]+)\.json$/.exec(path))) {
      res.writeHead(307, { location: `/sheets/page/${m[1]}.json` });
      return res.end();
    }
    if ((m = /^\/(sheets|private)\/page\/([a-z0-9-]+)(-fr|-other)?\.json$/.exec(path))) {
      const name = m[2];
      const scenario = scenarios[name];
      if (!scenario || name.endsWith("gone")) { res.writeHead(404); return res.end(); }
      const s = scenario(`/page/${name}`);
      const headers = { "content-type": SHEET_TYPE, "access-control-allow-origin": "*", ...(s.sheetHeaders ?? {}) };
      for (const [k, v] of Object.entries(headers)) if (v === null) delete headers[k];
      res.writeHead(200, headers);
      // A redirected sheet is fetched from /sheets/…, which is where sheet_url points.
      return res.end(s.sheet ?? sheetFor(`/page/${name}`));
    }
    res.writeHead(404);
    res.end();
  });
  return {
    async start() {
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      base = `http://127.0.0.1:${server.address().port}`;
      return base;
    },
    stop() { server.closeAllConnections?.(); server.close(); },
  };
}

const line = (lines, check) => {
  const found = lines.find((l) => l.check === check);
  assert.ok(found, `no line "${check}" in ${JSON.stringify(lines.map((l) => l.check))}`);
  return found;
};
const statuses = (lines) => Object.fromEntries(lines.map((l) => [l.check, l.status]));

test("page check: discovery with both carriers, header only, element only, neither, two links", async () => {
  const pub = publisher();
  const base = await pub.start();
  const check = async (name) => (await validateSheetUrl(`${base}/page/${name}`, {}, local)).body;
  try {
    const both = await check("both");
    assert.equal(both.kind, "page-check");
    assert.deepEqual(statuses(both.discovery), {
      "Link response header declares the sheet": "pass",
      "<link> element in the page head declares the sheet": "pass",
      "Both carriers present (recommended)": "pass",
      'type="application/pagefront+json" on the declaration': "pass",
      "Exactly one such link per carrier": "pass",
      "Selection used rel and type only": "info",
      "href is absolute, or resolves to an absolute URL": "pass",
      "Header and element point at the same URL": "pass",
    });
    assert.equal(both.sheet_url, `${base}/sheets/page/both.json`);
    assert.equal(both.conformance.kind, "report");
    assert.equal(both.conformance.sheet_type, "product");
    assert.deepEqual(statuses(both.coherence), {
      "canonical_url equals the page URL": "pass",
      "sheet_url, where present, equals the URL the sheet was fetched from": "pass",
    });

    const headerOnly = await check("header-only");
    assert.equal(line(headerOnly.discovery, "Link response header declares the sheet").status, "pass");
    assert.equal(line(headerOnly.discovery, "<link> element in the page head declares the sheet").status, "fail");
    assert.equal(line(headerOnly.discovery, "Both carriers present (recommended)").status, "warning");
    assert.equal(line(headerOnly.discovery, "Header and element point at the same URL").status, "info");
    assert.equal(headerOnly.conformance.kind, "report");

    const elementOnly = await check("element-only");
    assert.equal(line(elementOnly.discovery, "Link response header declares the sheet").status, "fail");
    assert.equal(line(elementOnly.discovery, "<link> element in the page head declares the sheet").status, "pass");
    assert.equal(line(elementOnly.discovery, "Both carriers present (recommended)").status, "warning");
    assert.equal(elementOnly.conformance.kind, "report");

    const neither = await check("neither");
    assert.equal(line(neither.discovery, "Link response header declares the sheet").status, "fail");
    assert.equal(line(neither.discovery, "<link> element in the page head declares the sheet").status, "fail");
    assert.equal(line(neither.discovery, "Both carriers present (recommended)").status, "fail");
    assert.equal(neither.conformance, null);
    assert.equal(neither.sheet_url, undefined);
    assert.ok(!JSON.stringify(neither).includes("<h1>"), "fetched content must never be echoed");

    const two = await check("two-links");
    assert.equal(line(two.discovery, "Exactly one such link per carrier").status, "fail");

    const jsonType = await check("json-type");
    const typeLine = line(jsonType.discovery, 'type="application/pagefront+json" on the declaration');
    assert.equal(typeLine.status, "fail");
    assert.match(line(jsonType.discovery, "<link> element in the page head declares the sheet").detail, /application\/json/);
    assert.equal(jsonType.conformance, null, "a near miss is not selected");

    const relative = await check("relative-href");
    assert.equal(line(relative.discovery, "href is absolute, or resolves to an absolute URL").status, "pass");
    assert.equal(relative.sheet_url, `${base}/sheets/page/relative-href.json`);

    const disagree = await check("disagree");
    assert.equal(line(disagree.discovery, "Header and element point at the same URL").status, "fail");
    assert.equal(disagree.sheet_url, `${base}/sheets/page/disagree-other.json`, "the header is authoritative");
  } finally {
    pub.stop();
  }
});

test("page check: the hop (status, redirects, Content-Type, size, robots, CORS)", async () => {
  const pub = publisher();
  const base = await pub.start();
  const check = async (name) => (await validateSheetUrl(`${base}/page/${name}`, {}, local)).body;
  try {
    const both = await check("both");
    assert.deepEqual(statuses(both.hop), {
      "Sheet URL fetches": "pass",
      "Content-Type is the sheet media type": "pass",
      "Size": "pass",
      "Not blocked by robots.txt": "pass",
      "Access-Control-Allow-Origin present on the sheet response": "pass",
    });
    assert.match(line(both.hop, "Size").detail, /^\d+ bytes$/);

    assert.equal(line((await check("ct-json")).hop, "Content-Type is the sheet media type").status, "warning");
    assert.equal(line((await check("ct-other")).hop, "Content-Type is the sheet media type").status, "fail");
    assert.equal(line((await check("no-cors")).hop, "Access-Control-Allow-Origin present on the sheet response").status, "warning");

    const blocked = await check("robots-blocked");
    assert.equal(line(blocked.hop, "Not blocked by robots.txt").status, "fail");
    assert.equal(blocked.conformance.kind, "report", "the sheet is still judged");

    const missing = await check("sheet-missing");
    assert.equal(line(missing.hop, "Sheet URL fetches").status, "fail");
    assert.match(line(missing.hop, "Sheet URL fetches").detail, /HTTP 404/);
    assert.equal(missing.conformance, null);

    const moved = await check("sheet-redirects");
    const fetched = line(moved.hop, "Sheet URL fetches");
    assert.equal(fetched.status, "pass");
    assert.match(fetched.detail, /1 redirect followed/);
    assert.equal(line(moved.coherence, "sheet_url, where present, equals the URL the sheet was fetched from").status, "pass",
      "compared with the URL after the sheet's own redirects");
  } finally {
    pub.stop();
  }
});

test("page check: coherence (canonical_url, sheet_url absent, sheet_url mismatch) and a redirecting page", async () => {
  const pub = publisher();
  const base = await pub.start();
  const check = async (name) => (await validateSheetUrl(`${base}/page/${name}`, {}, local)).body;
  try {
    const mismatch = await check("canonical-mismatch");
    const canonical = line(mismatch.coherence, "canonical_url equals the page URL");
    assert.equal(canonical.status, "fail");
    assert.match(canonical.detail, /somewhere-else/);
    assert.match(canonical.detail, /declares no rel="canonical"/);
    assert.equal(mismatch.coherence.find((l) => l.check === "Submitted URL is the canonical page"), undefined);

    // Submitted URL is not the canonical page, and the sheet agrees with the page's canonical.
    const nonCanonical = await check("non-canonical");
    const submitted = line(nonCanonical.coherence, "Submitted URL is the canonical page");
    assert.equal(submitted.status, "info");
    assert.match(submitted.detail, /page\/both/);
    assert.equal(line(nonCanonical.coherence, "canonical_url equals the page URL").status, "pass");
    assert.equal(nonCanonical.coherence[0].check, "Submitted URL is the canonical page", "the note comes first");

    // The sheet disagrees with the page's own canonical.
    const disagree = await check("canonical-disagree");
    const disagreeLine = line(disagree.coherence, "canonical_url equals the page URL");
    assert.equal(disagreeLine.status, "fail");
    assert.match(disagreeLine.detail, /page\/other.*page\/both/);

    // A page naming itself canonical, by a relative href: no note, a pass.
    const self = await check("self-canonical");
    assert.equal(self.coherence.find((l) => l.check === "Submitted URL is the canonical page"), undefined);
    assert.equal(line(self.coherence, "canonical_url equals the page URL").status, "pass");

    // A fragment on the submitted URL does not count against the comparison.
    const fragment = (await validateSheetUrl(`${base}/page/both#top`, {}, local)).body;
    assert.equal(fragment.kind, "page-check");
    assert.equal(line(fragment.coherence, "canonical_url equals the page URL").status, "pass");

    const absent = await check("sheet-url-absent");
    assert.equal(line(absent.coherence, "sheet_url, where present, equals the URL the sheet was fetched from").status, "info");

    const sheetMismatch = await check("sheet-url-mismatch");
    const hint = line(sheetMismatch.coherence, "sheet_url, where present, equals the URL the sheet was fetched from");
    assert.equal(hint.status, "info");
    assert.match(hint.detail, /old\/location/);

    const redirected = await check("redirect");
    assert.equal(redirected.kind, "page-check");
    assert.equal(redirected.page_url, `${base}/page/redirect`);
    assert.equal(redirected.final_url, `${base}/page/both`);
    assert.equal(redirected.redirects, 1);
    assert.equal(line(redirected.coherence, "canonical_url equals the page URL").status, "pass",
      "canonical_url is compared with the page URL after its own redirects");

    const tooMany = await check("redirect-loop-1");
    assert.equal(tooMany.kind, "fetch-error");
    assert.match(tooMany.detail, /more than 3 redirects/);
  } finally {
    pub.stop();
  }
});

test("a page is read to the end of its head only; the body is never downloaded", async () => {
  let bodyBytesWritten = 0;
  let ended = false;
  const server = createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.write(`<!doctype html><html><head><title>Big</title><link rel="alternate" type="application/pagefront+json" href="/missing.json"></head>`);
    // A body that never ends: the check must finish without it.
    const filler = "<p>" + "x".repeat(65_536) + "</p>\n";
    const timer = setInterval(() => {
      if (res.writableEnded || res.destroyed) return clearInterval(timer);
      if (res.write(filler)) bodyBytesWritten += filler.length;
    }, 5);
    res.on("close", () => { ended = true; clearInterval(timer); });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const started = Date.now();
    const { body } = await validateSheetUrl(`${base}/page`, {}, { ...local, fetchTimeoutMs: 5_000 });
    assert.equal(body.kind, "page-check");
    assert.equal(body.discovery.find((l) => l.check === "<link> element in the page head declares the sheet").status, "pass");
    assert.ok(Date.now() - started < 4_000, "the check waited for the body");
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.ok(ended, "the connection was not cancelled after the head");
  } finally {
    server.closeAllConnections?.();
    server.close();
  }
});

/** An origin that may or may not declare its entry point. */
function originServer() {
  let base = "";
  const mode = { wellKnown: "absent", robots: "absent", dns: "absent", root: "page" };
  const rootSheet = () => ORGANIZATION;
  const seen = [];
  /** The same server under its other name: the host a redirect or an off-origin pointer lands on. */
  const other = () => base.replace("127.0.0.1", "localhost");
  /** The injected TXT resolver: what a DNS-over-HTTPS answer would have yielded for _pagefront.<host>. */
  const resolveTxt = async (name) => {
    seen.push(name);
    const expectedHost = mode.root === "redirect" ? "localhost" : new URL(base).hostname;
    if (name !== `_pagefront.${expectedHost}`) return [];
    switch (mode.dns) {
      case "absent": return [];
      case "record": return [`${base}/pagefront/org.en.json`];
      case "delegated": return [`${other()}/pagefront/org.en.json`];
      case "several": return ["v=spf1 -all", `${base}/pagefront/org.en.json`, `${base}/pagefront/other.en.json`];
      case "relative": return ["/pagefront/org.en.json"];
      case "error": return undefined;
      case "throws": throw new Error("resolver down");
      default: return [];
    }
  };
  const server = createServer((req, res) => {
    const path = new URL(req.url, base).pathname;
    if (path === "/.well-known/pagefront") {
      if (mode.wellKnown === "303") { res.writeHead(303, { location: `${mode.root === "redirect" ? other() : base}/pagefront/org.en.json` }); return res.end(); }
      if (mode.wellKnown === "303-off-origin") { res.writeHead(303, { location: `${mode.root === "redirect" ? base : other()}/pagefront/org.en.json` }); return res.end(); }
      if (mode.wellKnown === "302-relative") { res.writeHead(302, { location: "/pagefront/org.en.json" }); return res.end(); }
      if (mode.wellKnown === "direct") { res.writeHead(200, { "content-type": "application/pagefront+json", "access-control-allow-origin": "*" }); return res.end(rootSheet()); }
      if (mode.wellKnown === "html") { res.writeHead(200, { "content-type": "text/html" }); return res.end("<!doctype html><p>no</p>"); }
      res.writeHead(404); return res.end();
    }
    if (path === "/robots.txt") {
      if (mode.robots === "absent") { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "content-type": "text/plain" });
      if (mode.robots === "line") return res.end(`User-agent: *\nDisallow: /private/\nPagefront: ${base}/pagefront/org.en.json\n`);
      if (mode.robots === "other-line") return res.end(`User-agent: *\nPagefront: ${base}/pagefront/other.en.json\n`);
      if (mode.robots === "relative") return res.end("Pagefront: /pagefront/org.en.json\n");
      if (mode.robots === "off-origin") return res.end(`User-agent: *\nPagefront: ${other()}/pagefront/org.en.json\n`);
      return res.end("User-agent: *\nDisallow: /private/\n");
    }
    if (path === "/pagefront/org.en.json" || path === "/pagefront/other.en.json") {
      res.writeHead(200, { "content-type": "application/pagefront+json", "access-control-allow-origin": "*" });
      return res.end(rootSheet());
    }
    if (path === "/" && mode.root === "missing") { res.writeHead(404); return res.end(); }
    if (path === "/" && mode.root === "redirect" && (req.headers.host ?? "").startsWith("127.0.0.1")) {
      res.writeHead(301, { location: `${other()}/` }); return res.end();
    }
    if (path === "/") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(`<!doctype html><html><head><title>Home</title><link rel="alternate" type="application/pagefront+json" href="${base}/pagefront/org.en.json"></head><body></body></html>`);
    }
    if (path === "/about") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(`<!doctype html><html><head><title>About</title></head><body></body></html>`);
    }
    res.writeHead(404); res.end();
  });
  return {
    mode,
    seen,
    resolveTxt,
    other,
    async start() { await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); base = `http://127.0.0.1:${server.address().port}`; return base; },
    stop() { server.closeAllConnections?.(); server.close(); },
  };
}

test("entry point: a bare origin is asked for /.well-known/pagefront, then robots.txt, and the root sheet is judged", async () => {
  const srv = originServer();
  const base = await srv.start();
  const check = async (path = "/") => (await validateSheetUrl(`${base}${path}`, {}, { ...local, resolveTxt: srv.resolveTxt })).body;
  const txtCheck = `DNS TXT record at _pagefront.${new URL(base).hostname} declares the root sheet`;
  try {
    srv.mode.wellKnown = "303";
    let body = await check();
    assert.equal(body.kind, "page-check");
    assert.equal(line(body.entry_point, "/.well-known/pagefront declares the root sheet").status, "pass");
    assert.match(line(body.entry_point, "/.well-known/pagefront declares the root sheet").detail, /303 See Other/);
    assert.equal(line(body.entry_point, "robots.txt declares the root sheet").status, "info");
    assert.equal(line(body.entry_point, txtCheck).status, "info");
    assert.equal(line(body.entry_point, txtCheck).detail, `no record at _pagefront.${new URL(base).hostname}`);
    assert.deepEqual(srv.seen, [`_pagefront.${new URL(base).hostname}`], "the TXT record is resolved at the underscored name of the origin's host");
    assert.equal(body.entry_point[0].check, "Origin");
    assert.match(body.entry_point[0].detail, /no redirect to another host/);
    assert.equal(body.sheet_url, `${base}/pagefront/org.en.json`);
    assert.equal(line(body.discovery, "Page carriers").status, "info");
    assert.equal(body.discovery.length, 1, "no page carriers are reported for a sheet reached through the entry point");
    assert.equal(line(body.hop, "Sheet URL fetches").status, "pass");
    assert.equal(line(body.coherence, "canonical_url equals the page URL").status, "info");
    assert.equal(body.conformance.kind, "report");
    assert.equal(body.conformance.sheet_type, "organization");

    srv.mode.wellKnown = "302-relative";
    body = await check();
    assert.equal(line(body.entry_point, "/.well-known/pagefront declares the root sheet").status, "warning");
    assert.equal(body.sheet_url, `${base}/pagefront/org.en.json`, "a relative Location resolves against the well-known URI");

    srv.mode.wellKnown = "direct";
    body = await check();
    assert.equal(line(body.entry_point, "/.well-known/pagefront declares the root sheet").status, "pass");
    assert.equal(body.sheet_url, `${base}/.well-known/pagefront`);
    assert.equal(body.conformance.kind, "report");

    srv.mode.wellKnown = "html";
    body = await check();
    assert.equal(line(body.entry_point, "/.well-known/pagefront declares the root sheet").status, "fail");

    srv.mode.wellKnown = "absent";
    srv.mode.robots = "line";
    body = await check();
    assert.equal(line(body.entry_point, "/.well-known/pagefront declares the root sheet").status, "info");
    assert.equal(line(body.entry_point, "robots.txt declares the root sheet").status, "pass");
    assert.equal(body.sheet_url, `${base}/pagefront/org.en.json`);
    assert.match(line(body.discovery, "Page carriers").detail, /robots\.txt/);
    assert.equal(body.conformance.kind, "report");

    srv.mode.robots = "relative";
    body = await check();
    assert.equal(line(body.entry_point, "robots.txt declares the root sheet").status, "fail");

    srv.mode.wellKnown = "303";
    srv.mode.robots = "other-line";
    body = await check();
    assert.equal(line(body.entry_point, "The carriers name the same root sheet").status, "warning");
    assert.equal(body.sheet_url, `${base}/pagefront/org.en.json`, "the well-known URI is followed");

    // No carrier: information only, and the origin's page is checked as a page.
    srv.mode.wellKnown = "absent";
    srv.mode.robots = "plain";
    body = await check();
    assert.equal(body.kind, "page-check");
    assert.deepEqual(body.entry_point.map((l) => l.status), ["info", "info", "info", "info", "info"]);
    assert.equal(line(body.discovery, "<link> element in the page head declares the sheet").status, "pass");
    assert.equal(body.conformance.kind, "report");

    // Not a bare origin: no entry-point probe.
    srv.mode.wellKnown = "303";
    body = await check("/about");
    assert.equal(body.entry_point, undefined);
    assert.equal(body.conformance, null);
  } finally {
    srv.stop();
  }
});

test("entry point: the DNS TXT record is the third carrier, tried after the two HTTP carriers, and may delegate the root off-origin", async () => {
  const srv = originServer();
  const base = await srv.start();
  const host = new URL(base).hostname;
  const check = async () => (await validateSheetUrl(`${base}/`, {}, { ...local, resolveTxt: srv.resolveTxt })).body;
  const txtCheck = `DNS TXT record at _pagefront.${host} declares the root sheet`;
  try {
    // The record alone declares the root; it is followed and the root sheet is judged.
    srv.mode.dns = "record";
    let body = await check();
    assert.equal(line(body.entry_point, "/.well-known/pagefront declares the root sheet").status, "info");
    assert.equal(line(body.entry_point, "robots.txt declares the root sheet").status, "info");
    assert.equal(line(body.entry_point, txtCheck).status, "pass");
    assert.equal(line(body.entry_point, txtCheck).detail, `${base}/pagefront/org.en.json`);
    assert.equal(body.sheet_url, `${base}/pagefront/org.en.json`);
    assert.match(line(body.discovery, "Page carriers").detail, new RegExp(`TXT record at _pagefront\\.${host.replace(/\./g, "\\.")}`));
    assert.equal(body.conformance.kind, "report");
    assert.equal(body.conformance.sheet_type, "organization");

    // A record naming another host is a delegation, reported as such and followed.
    srv.mode.dns = "delegated";
    body = await check();
    assert.equal(line(body.entry_point, txtCheck).status, "pass");
    assert.match(line(body.entry_point, txtCheck).detail, /; delegated to localhost:\d+$/);
    assert.equal(body.sheet_url, `${base.replace("127.0.0.1", "localhost")}/pagefront/org.en.json`);
    assert.equal(line(body.hop, "Sheet URL fetches").status, "pass");
    assert.equal(body.conformance.kind, "report");

    // Several records: the first well-formed one is used.
    srv.mode.dns = "several";
    body = await check();
    assert.equal(line(body.entry_point, txtCheck).status, "pass");
    assert.match(line(body.entry_point, txtCheck).detail, /3 records, the first well-formed one is used/);
    assert.equal(body.sheet_url, `${base}/pagefront/org.en.json`);

    // A value that is not an absolute URL fails the carrier; the origin's page is checked.
    srv.mode.dns = "relative";
    body = await check();
    assert.equal(line(body.entry_point, txtCheck).status, "fail");
    assert.equal(body.sheet_url, `${base}/pagefront/org.en.json`, "reached through the page's own <link>");
    assert.equal(line(body.discovery, "<link> element in the page head declares the sheet").status, "pass");

    // Resolution failures are information.
    srv.mode.dns = "error";
    body = await check();
    assert.equal(line(body.entry_point, txtCheck).status, "info");
    assert.equal(line(body.entry_point, txtCheck).detail, "could not be resolved");
    srv.mode.dns = "throws";
    body = await check();
    assert.equal(line(body.entry_point, txtCheck).status, "info");

    // The HTTP carriers are tried first: a well-known 303 wins, and agreement with the record is reported.
    srv.mode.dns = "record";
    srv.mode.wellKnown = "303";
    body = await check();
    assert.equal(line(body.entry_point, "The carriers name the same root sheet").status, "pass");
    assert.equal(body.sheet_url, `${base}/pagefront/org.en.json`);
    assert.match(line(body.discovery, "Page carriers").detail, /well-known/);
    srv.mode.robots = "other-line";
    body = await check();
    assert.equal(line(body.entry_point, "The carriers name the same root sheet").status, "warning");
    assert.match(line(body.entry_point, "The carriers name the same root sheet").detail, /DNS: /);
  } finally {
    srv.stop();
  }
});

test("entry point: the origin is normalised through its own redirects for /, and a well-known or robots pointer off that origin fails", async () => {
  const srv = originServer();
  const base = await srv.start();
  const check = async () => (await validateSheetUrl(`${base}/`, {}, { ...local, resolveTxt: srv.resolveTxt })).body;
  const wk = "/.well-known/pagefront declares the root sheet";
  const rb = "robots.txt declares the root sheet";
  try {
    // No redirect: a well-known 303 to another host fails, is not followed, and the page is checked.
    srv.mode.wellKnown = "303-off-origin";
    let body = await check();
    assert.equal(line(body.entry_point, wk).status, "fail");
    assert.match(line(body.entry_point, wk).detail, /^Entry point at \/\.well-known\/pagefront points to localhost:\d+; the well-known URI and the robots\.txt line must resolve on the origin that serves them\.$/);
    assert.match(line(body.entry_point, wk).remediation, new RegExp(`^Serve the root sheet on ${base.replace(/[.]/g, "\\.")}, or publish the pointer as a _pagefront DNS TXT record`));
    assert.equal(line(body.entry_point, "Entry point").status, "info", "no carrier declared a root, so the origin's page is checked");
    assert.equal(line(body.discovery, "<link> element in the page head declares the sheet").status, "pass");

    // A robots line naming another host fails the same way.
    srv.mode.wellKnown = "absent";
    srv.mode.robots = "off-origin";
    body = await check();
    assert.equal(line(body.entry_point, rb).status, "fail");
    assert.match(line(body.entry_point, rb).detail, /^Entry point at the robots\.txt Pagefront: line points to localhost:\d+;/);
    assert.ok(line(body.entry_point, rb).remediation);

    // A DNS record naming another host is a delegation, never a finding, even beside the failing pointers.
    srv.mode.dns = "delegated";
    body = await check();
    assert.equal(line(body.entry_point, rb).status, "fail");
    assert.match(line(body.entry_point, `DNS TXT record at _pagefront.${new URL(base).hostname} declares the root sheet`).detail, /delegated to localhost:\d+/);
    assert.equal(body.sheet_url, `${srv.other()}/pagefront/org.en.json`);
    assert.equal(body.conformance.kind, "report");

    // The site redirects / to its other name: that host is the origin, so pointers to it pass,
    // the TXT name is built from it, and a pointer back to the submitted host fails.
    srv.mode.root = "redirect";
    srv.mode.dns = "absent";
    srv.mode.robots = "absent";
    srv.mode.wellKnown = "303";
    srv.seen.length = 0;
    body = await check();
    assert.equal(body.entry_point[0].check, "Origin");
    assert.match(body.entry_point[0].detail, /^http:\/\/localhost:\d+, reached from http:\/\/127\.0\.0\.1:\d+\/ after 1 redirect; the carriers are read there$/);
    assert.equal(line(body.entry_point, wk).status, "pass");
    assert.equal(body.sheet_url, `${srv.other()}/pagefront/org.en.json`);
    assert.deepEqual(srv.seen, ["_pagefront.localhost"], "the TXT name uses the normalised host");
    assert.equal(line(body.entry_point, "DNS TXT record at _pagefront.localhost declares the root sheet").detail, "no record at _pagefront.localhost");
    assert.match(line(body.discovery, "Page carriers").detail, /well-known/);
    assert.equal(body.final_url, `${srv.other()}/`);
    assert.equal(body.redirects, 1);

    srv.mode.wellKnown = "303-off-origin";
    body = await check();
    assert.equal(line(body.entry_point, wk).status, "fail");
    assert.match(line(body.entry_point, wk).detail, /points to 127\.0\.0\.1:\d+;/);

    // No root declared on the redirected origin: the landing page is checked, from the response already fetched.
    srv.mode.wellKnown = "absent";
    body = await check();
    assert.equal(body.final_url, `${srv.other()}/`);
    assert.equal(line(body.discovery, "<link> element in the page head declares the sheet").status, "pass");

    // An origin whose / answers an error and declares no root: the entry-point lines still come back.
    srv.mode.root = "missing";
    body = await check();
    assert.equal(body.kind, "no-sheet");
    assert.equal(body.detail, "HTTP 404");
    assert.equal(body.entry_point[0].check, "Origin");
    assert.match(body.entry_point[0].detail, /no redirect to another host/);
    assert.equal(line(body.entry_point, "Entry point").status, "info");
  } finally {
    srv.stop();
  }
});

test("the body decides what a response is: a page labelled as a sheet is a page with the echo finding, at the page and at the sheet URL", async () => {
  const srv = publisher();
  const base = await srv.start();
  const check = async (name) => (await validateSheetUrl(`${base}/page/${name}`, {}, local)).body;
  try {
    const echo = await check("echo");
    assert.equal(echo.kind, "page-check");
    const finding = line(echo.discovery, "Content-Type matches the body");
    assert.equal(echo.discovery[0], finding, "the finding comes first");
    assert.equal(finding.status, "warning");
    assert.equal(finding.detail, `Response at ${base}/page/echo is labelled application/pagefront+json but the body is HTML (begins with \`<!doctype html><html><head><title>Anorak\`). The server appears to echo the Accept header.`);
    assert.match(finding.remediation, /^Serve HTML with its own Content-Type regardless of Accept, or implement negotiation properly: return the sheet, or a 303 to it, only when it exists\.$/);
    assert.equal(line(echo.discovery, "<link> element in the page head declares the sheet").status, "pass");
    assert.equal(line(echo.hop, "Sheet URL fetches").status, "pass");
    assert.equal(echo.conformance.kind, "report");

    const sheetEcho = await check("sheet-echo");
    const hopFinding = line(sheetEcho.hop, "Content-Type matches the body");
    assert.equal(hopFinding.status, "warning");
    assert.match(hopFinding.detail, new RegExp(`^Response at ${base.replace(/[.]/g, "\\.")}/sheets/page/sheet-echo\\.json is labelled application/pagefront\\+json but the body is HTML \\(begins with \`<!doctype html>`));
    assert.equal(sheetEcho.conformance.kind, "no-sheet");

    const noSchema = await check("sheet-noschema");
    const noSchemaFinding = line(noSchema.hop, "Content-Type matches the body");
    assert.equal(noSchemaFinding.status, "warning");
    assert.match(noSchemaFinding.detail, /labelled application\/json but the body is JSON without \$schema \(begins with `\{"a":1\}`\)\.$/);
    assert.equal(noSchema.conformance.kind, "unknown-type");

    // A page whose label and body agree carries no such line.
    const both = await check("both");
    assert.equal(both.discovery.find((l) => l.check === "Content-Type matches the body"), undefined);
    assert.equal(both.hop.find((l) => l.check === "Content-Type matches the body"), undefined);
  } finally {
    srv.stop();
  }
});

test("the default TXT resolver reads the DNS-over-HTTPS JSON answer: NOERROR with records, NXDOMAIN as none, other codes and transport errors as failure", async () => {
  const answers = {
    "_pagefront.merchant.example": { Status: 0, Answer: [{ name: "_pagefront.merchant.example", type: 16, TTL: 300, data: '"https://merchant.example/pagefront/org.en.json"' }] },
    "_pagefront.none.example": { Status: 3, Authority: [] },
    "_pagefront.fail.example": { Status: 2 },
  };
  const requests = [];
  const fetcher = async (url, init) => {
    requests.push({ url, accept: init.headers.accept });
    const name = new URL(url).searchParams.get("name");
    if (name === "_pagefront.down.example") return new Response("", { status: 502 });
    return new Response(JSON.stringify(answers[name]), { status: 200, headers: { "content-type": "application/dns-json" } });
  };
  const resolve = dohTxtResolver(fetcher);
  assert.deepEqual(await resolve("_pagefront.merchant.example"), ["https://merchant.example/pagefront/org.en.json"]);
  assert.deepEqual(await resolve("_pagefront.none.example"), []);
  assert.equal(await resolve("_pagefront.fail.example"), undefined);
  assert.equal(await resolve("_pagefront.down.example"), undefined);
  assert.equal(requests[0].url, `${DOH_ENDPOINT}?name=_pagefront.merchant.example&type=TXT`);
  assert.equal(requests[0].accept, "application/dns-json");
});

test("fetch outcomes for a sheet URL: report, layer 1, no sheet, too large, not JSON or HTML, timeout", async () => {
  const server = createServer((req, res) => {
    const route = {
      "/clean.json": [200, "application/json", CLEAN],
      "/broken.json": [200, "application/json", BROKEN],
      "/plain.txt": [200, "text/plain", "hello"],
      "/big.json": [200, "application/json", "[" + "1,".repeat(600_000) + "1]"],
      "/mislabelled.json": [200, "text/html", CLEAN],
      "/noschema.json": [200, "application/json", '{"a":1}'],
    }[req.url];
    if (req.url === "/slow.json") return; // never answers
    if (!route) { res.writeHead(404); return res.end(); }
    res.writeHead(route[0], { "content-type": route[1] });
    res.end(route[2]);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const ok = await validateSheetUrl(`${base}/clean.json`, {}, local);
    assert.equal(ok.status, 200);
    assert.equal(ok.body.kind, "report");
    assert.equal(ok.body.sheet_url, `${base}/clean.json`);
    assert.equal(ok.body.report.summary.errors, 0);

    const layer1 = await validateSheetUrl(`${base}/broken.json`, {}, local);
    assert.equal(layer1.body.kind, "layer1");
    assert.ok(layer1.body.schemaErrors.length > 0);

    const gone = await validateSheetUrl(`${base}/gone.json`, {}, local);
    assert.deepEqual(gone.body, { kind: "no-sheet", detail: "HTTP 404", sheet_url: `${base}/gone.json` });

    // Not a sheet by its body: the page path is tried (headers, head) before any verdict, and nothing is echoed.
    const plain = await validateSheetUrl(`${base}/plain.txt`, {}, local);
    assert.equal(plain.body.kind, "page-check");
    assert.equal(plain.body.conformance, null);
    assert.equal(plain.body.discovery.find((l) => l.check === "Content-Type matches the body"), undefined, "text/plain never claimed a sheet");
    assert.ok(!JSON.stringify(plain.body).includes("hello"), "fetched content must never be echoed");

    // The body decides: a sheet labelled text/html is a sheet.
    const mislabelled = await validateSheetUrl(`${base}/mislabelled.json`, {}, local);
    assert.equal(mislabelled.body.kind, "report");

    // JSON without $schema is not a sheet: the page path runs and the label finding names what the body is.
    const noSchema = await validateSheetUrl(`${base}/noschema.json`, {}, local);
    assert.equal(noSchema.body.kind, "page-check");
    assert.equal(noSchema.body.discovery[0].check, "Content-Type matches the body");
    assert.equal(noSchema.body.discovery[0].status, "warning");
    assert.equal(noSchema.body.discovery[0].detail, `Response at ${base}/noschema.json is labelled application/json but the body is JSON without $schema (begins with \`{"a":1}\`).`);
    assert.equal(noSchema.body.conformance, null);

    const big = await validateSheetUrl(`${base}/big.json`, {}, local);
    assert.equal(big.body.kind, "no-sheet");
    assert.match(big.body.detail, /larger than/);

    const slow = await validateSheetUrl(`${base}/slow.json`, {}, { ...local, fetchTimeoutMs: 300 });
    assert.equal(slow.body.kind, "fetch-error");
    assert.match(slow.body.detail, /within 300 ms/);
  } finally {
    server.closeAllConnections?.();
    server.close();
  }
});
