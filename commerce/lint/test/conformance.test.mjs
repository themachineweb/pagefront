/**
 * Conformance fixture harness — the test suite the spec's Status section
 * refers to. See test/README.md for the fixture conventions.
 *
 * Rule directories under test/fixtures/ are discovered automatically:
 * adding a new rule's fixtures requires no registration here.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lintSheet } from "../dist/index.js";
import { installTestManifest, clearTestManifest } from "../dist/test-hooks.js";

/** Fixed options making expected reports byte-stable. */
const FIXED_OPTIONS = {
  checkedAt: "2026-01-01T00:00:00Z",
  linterVersion: "0.0.0-test",
};

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, "fixtures");

// The collection fixtures (and ORG-W-007's and the "Where to buy" rules') declare release 0.5.0, the
// release that bundles Collection Sheet spec 0.1.0 and has not landed:
// they run against the test manifest (test/manifest/releases.json),
// which adds that row to the bundled manifest. Every other fixture runs
// against the bundled manifest, as production does. See test/README.md.
const TEST_MANIFEST = JSON.parse(readFileSync(join(here, "manifest", "releases.json"), "utf8"));
// The "Where to buy" rules (product.md), all applying from release 0.5.0.
const WHERE_TO_BUY = new Set(["pdp-e-019", "pdp-e-020", "pdp-e-021", "pdp-w-040"]);
// The rules with fixtures for an unavailable offer without a price
// (product.md, "Unavailable offers without a price"): those fixtures
// declare release 0.6.0, which the test manifest adds ahead of its
// release. The directories' other fixtures declare earlier releases,
// which the test manifest lists identically.
const UNAVAILABLE_OFFERS = new Set(["pdp-e-022", "pdp-w-016", "pdp-w-028", "pdp-w-029"]);
const runsAgainstTestManifest = (ruleDir) =>
  ruleDir.startsWith("col-") || ruleDir === "org-w-007" || WHERE_TO_BUY.has(ruleDir) || UNAVAILABLE_OFFERS.has(ruleDir);

const ruleDirs = readdirSync(fixturesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const ruleDir of ruleDirs) {
  const dir = join(fixturesDir, ruleDir);
  // Input files are every *.json that isn't an expected report — the
  // fires/clean pair, plus per-behavior variants like fires-past.json
  // for rules with more than one distinct firing behavior.
  const inputFiles = readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.endsWith(".expected.json"))
    .sort();
  for (const inputFile of inputFiles) {
    const expectedFile = inputFile.replace(/\.json$/, ".expected.json");
    test(`${ruleDir}: ${inputFile} matches ${expectedFile}`, () => {
      const input = JSON.parse(readFileSync(join(dir, inputFile), "utf8"));
      const expected = readFileSync(join(dir, expectedFile), "utf8");
      if (runsAgainstTestManifest(ruleDir)) installTestManifest({ manifest: TEST_MANIFEST });
      let actual;
      try {
        actual = lintSheet(input, FIXED_OPTIONS);
      } finally {
        clearTestManifest();
      }
      // Compare pretty-printed JSON strings: on mismatch, the assertion
      // error renders a readable line-by-line diff of the two reports.
      assert.equal(
        JSON.stringify(actual, null, 2) + "\n",
        expected,
        `${ruleDir}/${inputFile}: actual report differs from expected`
      );
    });
  }
}
