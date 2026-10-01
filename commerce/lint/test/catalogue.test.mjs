import test from "node:test";
import assert from "node:assert/strict";
import { lintSheet } from "../dist/index.js";

const baseSheet = {
  release: "0.3.0",
  canonical_url: "https://merchant.example/widget",
  sheet_url: "https://merchant.example/widget.pagefront.json",
  generated_at: "2026-08-10T00:00:00Z",
};

const OPTS = { checkedAt: "2026-01-01T00:00:00Z", linterVersion: "0.1.0" };

// The data blocks carry description and brand so that only the rule under
// test fires as the catalogue grows; fixture-level coverage of the other
// rules lives in the conformance harness.
test("PDP-W-001 fires exactly once on a sheet without images", () => {
  const report = lintSheet(
    {
      ...baseSheet,
      data: {
        "@type": "Product",
        name: "Widget",
        description: "A widget.",
        brand: { "@type": "Brand", name: "Widgets Inc" },
      },
    },
    OPTS
  );
  assert.equal(report.findings.length, 1);
  const [finding] = report.findings;
  assert.equal(finding.rule, "PDP-W-001");
  assert.equal(finding.severity, "warning");
  assert.equal(finding.path, "$['data']");
  assert.equal(finding.message, "No images declared at `$['data']`.");
  assert.deepEqual(report.summary, {
    errors: 0,
    warnings: 1,
    info: 0,
    rules_fired: ["PDP-W-001"],
  });
  assert.equal(report.catalogue_version, "0.15.0");
  assert.equal(report.release, "0.3.0");
  assert.equal(report.sheet_spec_version, null);
});

test("PDP-W-001 does not fire when an image array is present", () => {
  const report = lintSheet(
    {
      ...baseSheet,
      data: {
        "@type": "Product",
        name: "Widget",
        description: "A widget.",
        brand: { "@type": "Brand", name: "Widgets Inc" },
        image: [{ "@type": "ImageObject", url: "https://merchant.example/w.jpg" }],
      },
    },
    OPTS
  );
  assert.equal(report.findings.length, 0);
  assert.deepEqual(report.summary, {
    errors: 0,
    warnings: 0,
    info: 0,
    rules_fired: [],
  });
});
