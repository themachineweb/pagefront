import test from "node:test";
import assert from "node:assert/strict";
import { renderText } from "../dist/index.js";

const report = {
  sheet: "https://merchant.example/widget",
  checked_at: "2026-01-01T00:00:00Z",
  linter_version: "0.0.0-test",
  release: "0.3.0",
  sheet_spec_version: "0.9.0",
  catalogue_version: "0.8.0",
  findings: [
    {
      rule: "E-001",
      severity: "error",
      path: "$['data']['isVariantOf']",
      values: { id: "https://merchant.example/gone#group" },
      message: "Reference to https://merchant.example/gone#group does not resolve.",
      remediation: "Declare the referenced entity or fix the @id.",
    },
    {
      rule: "W-001",
      severity: "warning",
      path: "$['data']['offers'][0]",
      values: {},
      message: "Offer is missing a priceValidUntil.",
      remediation: "Add priceValidUntil to the offer.",
    },
  ],
  summary: {
    errors: 1,
    warnings: 1,
    info: 0,
    rules_fired: ["E-001", "W-001"],
  },
};

const emptyReport = {
  ...report,
  findings: [],
  summary: { errors: 0, warnings: 0, info: 0, rules_fired: [] },
};

test("renderText renders findings, header, and summary (plain)", () => {
  assert.equal(
    renderText(report),
    `https://merchant.example/widget
linted 2026-01-01T00:00:00Z · linter 0.0.0-test · release 0.3.0 · sheet spec 0.9.0 · catalogue 0.8.0

error    E-001  $['data']['isVariantOf']
  Reference to https://merchant.example/gone#group does not resolve.
  fix: Declare the referenced entity or fix the @id.

warning  W-001  $['data']['offers'][0]
  Offer is missing a priceValidUntil.
  fix: Add priceValidUntil to the offer.

1 error · 1 warning · 0 info
rules fired: E-001, W-001
`
  );
});

test("renderText renders a clean report as 'no findings'", () => {
  assert.equal(
    renderText(emptyReport),
    `https://merchant.example/widget
linted 2026-01-01T00:00:00Z · linter 0.0.0-test · release 0.3.0 · sheet spec 0.9.0 · catalogue 0.8.0

no findings
`
  );
});

test("renderText color mode wraps only the severity label", () => {
  const out = renderText(report, { color: true });
  assert.ok(out.includes("\x1b[31merror  \x1b[0m  E-001"));
  assert.ok(out.includes("\x1b[33mwarning\x1b[0m  W-001"));
  // Everything outside severity labels is unstyled: stripping ANSI
  // sequences must reproduce the plain rendering exactly.
  assert.equal(out.replace(/\x1b\[[0-9]+m/g, ""), renderText(report));
});
