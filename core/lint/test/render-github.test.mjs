import test from "node:test";
import assert from "node:assert/strict";
import { renderGithub } from "../dist/index.js";

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

function finding(overrides) {
  return {
    rule: "W-001",
    severity: "warning",
    path: "$['data']['offers'][0]",
    values: {},
    message: "Offer is missing a priceValidUntil.",
    remediation: "Add priceValidUntil to the offer.",
    ...overrides,
  };
}

test("renderGithub emits one annotation per finding, severity-mapped", () => {
  const report = {
    ...base,
    findings: [
      finding({ rule: "E-001", severity: "error", path: "$['data']" }),
      finding(),
      finding({ rule: "I-001", severity: "info" }),
    ],
    summary: { errors: 1, warnings: 1, info: 1, rules_fired: ["E-001", "W-001", "I-001"] },
  };
  assert.equal(
    renderGithub(report),
    `::error title=E-001 at $['data']::Offer is missing a priceValidUntil. Fix: Add priceValidUntil to the offer.
::warning title=W-001 at $['data']['offers'][0]::Offer is missing a priceValidUntil. Fix: Add priceValidUntil to the offer.
::notice title=I-001 at $['data']['offers'][0]::Offer is missing a priceValidUntil. Fix: Add priceValidUntil to the offer.
`
  );
});

test("renderGithub escapes per the actions/toolkit rules", () => {
  const report = {
    ...base,
    findings: [
      finding({
        // Property values (title): %, CR/LF, colon, comma escape.
        path: "$['data']['x:y,z']",
        // Message data: %, CR/LF escape; colon and comma pass through.
        message: "50% off\nsecond line: a, b",
        remediation: "Keep 100%.",
      }),
    ],
    summary: { errors: 0, warnings: 1, info: 0, rules_fired: ["W-001"] },
  };
  assert.equal(
    renderGithub(report),
    "::warning title=W-001 at $['data']['x%3Ay%2Cz']::50%25 off%0Asecond line: a, b Fix: Keep 100%25.\n"
  );
});

test("renderGithub renders a clean report as empty output", () => {
  assert.equal(renderGithub(base), "");
});
