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

/** Fixed options making expected reports byte-stable. */
const FIXED_OPTIONS = {
  checkedAt: "2026-01-01T00:00:00Z",
  linterVersion: "0.0.0-test",
};

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

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
      const actual = lintSheet(input, FIXED_OPTIONS);
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
