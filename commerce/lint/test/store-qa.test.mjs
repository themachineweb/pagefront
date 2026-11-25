/**
 * "Store Q&A" (organization.md): the `question` array a Commerce
 * Organization Sheet may carry since Organization Sheet spec 0.7.0, and
 * ORG-W-010, the structure-first rule. The fixtures of ORG-W-010 declare
 * release 0.7.0, whose organization schema (0.7.0) is the editable head
 * and not yet frozen. This file validates them at Layer 1 against that
 * head under the test manifest, and checks the worked examples: the
 * Kimaï and Nitto organization sheets carry `question` arrays derived
 * from their FAQ pages under the structure-first rule, so they validate
 * at their declared release and, moved to 0.7.0, lint without ORG-W-010.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lintSheet } from "../dist/index.js";
import { schemaErrorsFor } from "../dist/validate-and-lint.js";
import { installTestManifest, clearTestManifest } from "../dist/test-hooks.js";

const here = dirname(fileURLToPath(import.meta.url));
const spec = (name) => JSON.parse(readFileSync(join(here, "..", "..", "spec", name), "utf8"));
const PRODUCT_HEAD = spec("product.json");
const ORGANIZATION_HEAD = spec("organization.json");
const TEST_MANIFEST = JSON.parse(readFileSync(join(here, "manifest", "releases.json"), "utf8"));
const OPTS = { checkedAt: "2026-01-01T00:00:00Z", linterVersion: "0.0.0-test" };

function withHeads(fn) {
  installTestManifest({
    manifest: TEST_MANIFEST,
    schemas: { [PRODUCT_HEAD.$id]: PRODUCT_HEAD, [ORGANIZATION_HEAD.$id]: ORGANIZATION_HEAD },
  });
  try {
    return fn();
  } finally {
    clearTestManifest();
  }
}

const fixtureDir = join(here, "fixtures", "org-w-010");
let checked = 0;
for (const file of readdirSync(fixtureDir).filter((f) => f.endsWith(".json") && !f.endsWith(".expected.json"))) {
  checked++;
  test(`org-w-010/${file} is valid at Layer 1 against the schema its release resolves to`, () => {
    const sheet = JSON.parse(readFileSync(join(fixtureDir, file), "utf8"));
    const errors = withHeads(() => schemaErrorsFor(sheet));
    assert.deepEqual(errors, [], `org-w-010/${file}: ${JSON.stringify(errors)}`);
  });
}
test("the Layer 1 check covered the five fixtures of ORG-W-010", () => {
  assert.equal(checked, 5);
});

test("the organization head is spec 0.7.0, which the 0.7.0 row of the test manifest resolves to, and types question", () => {
  assert.equal(ORGANIZATION_HEAD.$id, "https://themachineweb.org/pagefront/spec/commerce/organization/v0.7.0.json");
  const row = TEST_MANIFEST.releases.find((r) => r.release === "0.7.0");
  assert.equal(row.sheets.organization, "0.7.0");
  assert.deepEqual(ORGANIZATION_HEAD.$defs.dataBlock.properties.question.items, { $ref: "#/$defs/questionObject" });
  assert.deepEqual(ORGANIZATION_HEAD.$defs.questionObject.required, PRODUCT_HEAD.$defs.questionObject.required);
  assert.deepEqual(ORGANIZATION_HEAD.$defs.answerObject.properties, PRODUCT_HEAD.$defs.answerObject.properties);
});

const caseStudy = (path) => JSON.parse(readFileSync(join(here, "..", "..", "case-studies", path), "utf8"));
const WORKED = [
  ["kimai/kimai.en-GB.json", 25],
  ["nitto/nitto-knitwear.fr.json", 8],
];
for (const [path, count] of WORKED) {
  test(`${path} carries ${count} store questions, validates at its declared release, and lints without ORG-W-010 at 0.7.0`, () => {
    const sheet = caseStudy(path);
    assert.equal(sheet.data.question.length, count);
    for (const q of sheet.data.question) {
      assert.equal(q["@type"], "Question");
      assert.ok(typeof q.acceptedAnswer.text === "string" && q.acceptedAnswer.text.trim() !== "");
    }
    // At the declared release the frozen schema admits the array (the data
    // block permits additional Schema.org properties) and the rule is gated off.
    assert.deepEqual(schemaErrorsFor(sheet), []);
    const declared = lintSheet(sheet, OPTS);
    assert.equal(declared.summary.errors, 0);
    assert.ok(!declared.summary.rules_fired.includes("ORG-W-010"));
    // Moved to release 0.7.0, the head admits it and the rule runs and stays silent.
    const moved = {
      ...sheet,
      release: "0.7.0",
      $schema: "https://themachineweb.org/pagefront/spec/commerce/organization/v0.7.0.json",
    };
    const errors = withHeads(() => schemaErrorsFor(moved));
    assert.deepEqual(errors, [], JSON.stringify(errors));
    const report = withHeads(() => lintSheet(moved, OPTS));
    assert.equal(report.summary.errors, 0);
    assert.ok(!report.summary.rules_fired.includes("ORG-W-010"), JSON.stringify(report.findings));
  });
}
