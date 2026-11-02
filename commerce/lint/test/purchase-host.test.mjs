/**
 * "Purchase host" (product.md, "Where to buy") and `pagefront:checkoutHosts`
 * (organization.md, "Seller block"): the fixtures of PDP-W-041 and
 * ORG-W-008 declare release 0.6.0, whose Product Sheet schema (0.12.0)
 * and Organization Sheet schema (0.6.0) are the editable heads and not
 * yet frozen. This file validates them at Layer 1 against those heads
 * under the test manifest, so the conformance fixtures are known to be
 * schema-plausible sheets.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { schemaErrorsFor } from "../dist/validate-and-lint.js";
import { installTestManifest, clearTestManifest } from "../dist/test-hooks.js";

const here = dirname(fileURLToPath(import.meta.url));
const PRODUCT_HEAD = JSON.parse(readFileSync(join(here, "..", "..", "spec", "product.json"), "utf8"));
const ORGANIZATION_HEAD = JSON.parse(readFileSync(join(here, "..", "..", "spec", "organization.json"), "utf8"));
const TEST_MANIFEST = JSON.parse(readFileSync(join(here, "manifest", "releases.json"), "utf8"));

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

for (const ruleDir of ["pdp-w-041", "org-w-008"]) {
  const dir = join(here, "fixtures", ruleDir);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && !f.endsWith(".expected.json"))) {
    test(`${ruleDir}/${file} is valid at Layer 1 against the schema its release resolves to`, () => {
      const sheet = JSON.parse(readFileSync(join(dir, file), "utf8"));
      const errors = withHeads(() => schemaErrorsFor(sheet));
      assert.deepEqual(errors, [], `${ruleDir}/${file}: ${JSON.stringify(errors)}`);
    });
  }
}

test("the organization head admits pagefront:checkoutHosts as an array of strings, at spec 0.6.0", () => {
  assert.equal(ORGANIZATION_HEAD.$id, "https://themachineweb.org/pagefront/spec/commerce/organization/v0.6.0.json");
  assert.deepEqual(ORGANIZATION_HEAD.$defs.dataBlock.properties["pagefront:checkoutHosts"], {
    type: "array",
    items: { type: "string" },
  });
});
