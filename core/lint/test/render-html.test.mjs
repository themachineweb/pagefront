import test from "node:test";
import assert from "node:assert/strict";
import { renderHtml } from "../dist/index.js";

const base = {
  sheet: "https://merchant.example/widget",
  checked_at: "2026-01-01T00:00:00Z",
  linter_version: "0.0.0-test",
  release: "0.3.0",
  sheet_spec_version: "0.9.0",
  catalogue_version: "0.8.0",
  findings: [],
  summary: { errors: 0, warnings: 0, info: 0, rules_fired: [] },
};

const report = {
  ...base,
  findings: [
    {
      rule: "E-001",
      severity: "error",
      path: "$['data']['isVariantOf']",
      values: {},
      message: "Reference to <#group> does not resolve & fails.",
      remediation: 'Declare the referenced "entity".',
    },
    {
      rule: "W-001",
      severity: "warning",
      path: "$['data']",
      values: {},
      message: "Product has no image.",
      remediation: "Add an image entry.",
    },
  ],
  summary: { errors: 1, warnings: 1, info: 0, rules_fired: ["E-001", "W-001"] },
};

test("renderHtml is a self-contained document with header, findings, summary", () => {
  const html = renderHtml(report);
  assert.match(html, /^<!doctype html>\n/);
  assert.ok(html.includes("<title>Pagefront lint report — https://merchant.example/widget</title>"));
  assert.ok(html.includes('<a href="https://merchant.example/widget">https://merchant.example/widget</a>'));
  assert.ok(html.includes("linted 2026-01-01T00:00:00Z · linter 0.0.0-test · release 0.3.0 · sheet spec 0.9.0 · catalogue 0.8.0"));
  assert.ok(html.includes("1 error</span>"));
  assert.ok(html.includes("1 warning</span>"));
  assert.ok(html.includes("rules fired: E-001, W-001"));
  // Both findings, in report order, severity-labelled.
  const first = html.indexOf(">error</span>");
  const second = html.indexOf(">warning</span>");
  assert.ok(first !== -1 && second !== -1 && first < second);
  // No external asset references — the document must work offline.
  assert.ok(!/\b(?:src|link|@import)\b/.test(html));
});

test("renderHtml escapes report content", () => {
  const html = renderHtml(report);
  assert.ok(html.includes("Reference to &lt;#group&gt; does not resolve &amp; fails."));
  assert.ok(html.includes("fix: Declare the referenced &quot;entity&quot;."));
  assert.ok(!html.includes("<#group>"));
});

test("renderHtml linkifies only http(s) sheet values", () => {
  const hostile = renderHtml({
    ...base,
    // eslint-disable-next-line no-script-url
    sheet: "javascript:alert(1)",
  });
  assert.ok(!hostile.includes("<a "));
  assert.ok(hostile.includes("javascript:alert(1)</p>"));
});

test("renderHtml renders a clean report without a findings list", () => {
  const html = renderHtml(base);
  assert.ok(html.includes('<p class="clean">no findings</p>'));
  assert.ok(!html.includes("<ol"));
});
