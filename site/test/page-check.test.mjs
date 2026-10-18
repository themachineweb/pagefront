/**
 * The page check's parsers (worker/page-check.ts), without a network:
 * the Link header, the <link> elements in a page head, the sheet-link
 * selector, and robots.txt.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { parseLinkHeader, parseHeadLinks, isSheetLink, robotsAllows, robotsPagefrontLine, txtRecordValue } from "../worker/page-check.ts";

test("Link header: several links, quoted parameters, commas inside <> and quotes", () => {
  const refs = parseLinkHeader(
    '<https://m.example/a,b.json>; rel="alternate"; type="application/pagefront+json"; title="Sheet, en", ' +
    '<https://m.example/feed>; rel=alternate; type=application/rss+xml, ' +
    '</style.css>; rel=preload; as=style'
  );
  assert.equal(refs.length, 3);
  assert.deepEqual(refs[0], { href: "https://m.example/a,b.json", params: { rel: "alternate", type: "application/pagefront+json", title: "Sheet, en" } });
  assert.deepEqual(refs[1].params, { rel: "alternate", type: "application/rss+xml" });
  assert.equal(refs[2].href, "/style.css");
  assert.deepEqual(parseLinkHeader(null), []);
  assert.deepEqual(parseLinkHeader(""), []);
});

test("Link header: the first occurrence of a parameter wins; profile is kept", () => {
  const [ref] = parseLinkHeader('<https://m.example/s.json>; rel="alternate"; rel="stylesheet"; type="application/pagefront+json"; profile="https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json"');
  assert.equal(ref.params.rel, "alternate");
  assert.equal(ref.params.profile, "https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json");
});

test("head links: quoted, single-quoted and unquoted attributes; elements after the head are ignored", () => {
  const html = `<!doctype html><html><head>
    <link rel="alternate" type="application/pagefront+json" href="https://m.example/s.json" title='Sheet'>
    <link rel=stylesheet href=/a.css>
    <LINK REL="Alternate" TYPE="application/pagefront+json; charset=utf-8" HREF="/relative.json" />
    </head><body><link rel="alternate" type="application/pagefront+json" href="https://m.example/in-body.json"></body></html>`;
  const refs = parseHeadLinks(html);
  assert.deepEqual(refs.map((r) => r.href), ["https://m.example/s.json", "/a.css", "/relative.json"]);
  assert.equal(refs[0].params.title, "Sheet");
  assert.equal(refs[2].params.rel, "Alternate");
});

test("sheet-link selection: rel and type together, case-insensitive, parameters on the type ignored", () => {
  const yes = { href: "x", params: { rel: "Alternate", type: "application/pagefront+json; charset=utf-8" } };
  const multiRel = { href: "x", params: { rel: "alternate nofollow", type: "application/pagefront+json" } };
  const jsonType = { href: "x", params: { rel: "alternate", type: "application/json" } };
  const titleOnly = { href: "x", params: { rel: "describedby", title: "Pagefront product sheet", type: "application/pagefront+json" } };
  const noType = { href: "x", params: { rel: "alternate" } };
  assert.equal(isSheetLink(yes), true);
  assert.equal(isSheetLink(multiRel), true);
  assert.equal(isSheetLink(jsonType), false);
  assert.equal(isSheetLink(titleOnly), false);
  assert.equal(isSheetLink(noType), false);
});

test("robots.txt: longest match wins, allow wins a tie, wildcards and $, missing group allows", () => {
  const robots = `
# comment
User-agent: Googlebot
Disallow: /

User-agent: *
Disallow: /private/
Allow: /private/sheets/
Disallow: /*.pdf$
Disallow: /tmp
Allow: /tmp
`;
  assert.equal(robotsAllows(robots, "/product/anorak.en.json"), true);
  assert.equal(robotsAllows(robots, "/private/anorak.en.json"), false);
  assert.equal(robotsAllows(robots, "/private/sheets/anorak.en.json"), true);
  assert.equal(robotsAllows(robots, "/docs/manual.pdf"), false);
  assert.equal(robotsAllows(robots, "/docs/manual.pdf?v=2"), true);
  assert.equal(robotsAllows(robots, "/tmp/x"), true, "allow wins the tie");
  assert.equal(robotsAllows(robots, "/anything", "Googlebot"), false);
  assert.equal(robotsAllows("User-agent: Other\nDisallow: /", "/x"), true, "no group for * and none for us");
  assert.equal(robotsAllows("User-agent: *\nDisallow:", "/x"), true, "empty Disallow allows all");
  assert.equal(robotsAllows("", "/x"), true);
});

test("robots.txt: the Pagefront line is the root sheet's URL; other fields and comments are ignored", () => {
  assert.equal(robotsPagefrontLine("User-agent: *\nDisallow: /private/\nPagefront: https://m.example/pagefront/org.en.json # root\n"), "https://m.example/pagefront/org.en.json");
  assert.equal(robotsPagefrontLine("pagefront:https://m.example/root.json"), "https://m.example/root.json");
  assert.equal(robotsPagefrontLine("User-agent: *\nDisallow: /\n"), undefined);
  assert.equal(robotsPagefrontLine("# Pagefront: https://m.example/commented-out.json\n"), undefined);
  assert.equal(robotsPagefrontLine(""), undefined);
});

test("TXT record value: quoted as DNS-over-HTTPS renders it, several strings concatenated, escapes, bare value", () => {
  // The data field of a real answer, as observed on 2026-10-16.
  assert.equal(txtRecordValue('"v=DMARC1; p=reject; rua=mailto:a@dmarc.example,mailto:b@example"'), "v=DMARC1; p=reject; rua=mailto:a@dmarc.example,mailto:b@example");
  assert.equal(txtRecordValue('"https://merchant.example/pagefront/org.en.json"'), "https://merchant.example/pagefront/org.en.json");
  assert.equal(txtRecordValue('"https://merchant.example/pagefront/" "org.en.json"'), "https://merchant.example/pagefront/org.en.json");
  assert.equal(txtRecordValue('"a \\"quoted\\" b\\\\c"'), 'a "quoted" b\\c');
  assert.equal(txtRecordValue("  https://merchant.example/root.json  "), "https://merchant.example/root.json");
  assert.equal(txtRecordValue(""), "");
});
