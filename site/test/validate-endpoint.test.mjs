/**
 * The validator endpoint (worker/validate.ts): the request contract and
 * every limit that keeps it a validator rather than a fetcher.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { handle, validateSheetUrl, validateSheetText, VALIDATE_PATH } from "../worker/validate.ts";

const here = dirname(fileURLToPath(import.meta.url));
const CLEAN = readFileSync(join(here, "..", "..", "commerce", "lint", "test", "cli-fixtures", "clean.json"), "utf8");
const BROKEN = readFileSync(join(here, "..", "..", "commerce", "lint", "test", "cli-fixtures", "layer1-fails.json"), "utf8");

const assets = { fetch: async () => new Response("asset", { status: 200 }) };
const env = { ASSETS: assets };
const local = { allowedProtocols: ["http:"] };
const call = (path, init, options) => handle(new Request(`https://themachineweb.org${path}`, init), env, options);

test("other paths fall through to the assets binding", async () => {
  const res = await call("/pagefront");
  assert.equal(await res.text(), "asset");
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

test("fetch outcomes: report, layer 1, no sheet, too large, not JSON, timeout", async () => {
  const server = createServer((req, res) => {
    const route = {
      "/clean.json": [200, "application/json", CLEAN],
      "/broken.json": [200, "application/json", BROKEN],
      "/page.html": [200, "text/html", "<!doctype html><p>hello</p>"],
      "/big.json": [200, "application/json", "[" + "1,".repeat(600_000) + "1]"],
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

    const html = await validateSheetUrl(`${base}/page.html`, {}, local);
    assert.equal(html.body.kind, "no-sheet");
    assert.ok(!JSON.stringify(html.body).includes("hello"), "fetched content must never be echoed");

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
