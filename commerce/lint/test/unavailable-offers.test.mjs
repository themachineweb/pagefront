/**
 * "Unavailable offers without a price" (product.md): an offer the page
 * shows as OutOfStock, SoldOut or Discontinued, with no price shown, is
 * published without a price. The fixtures of PDP-E-022 and the
 * sold-out fixtures of PDP-W-016, PDP-W-028 and PDP-W-029 declare
 * release 0.6.0, whose Product Sheet schema (0.12.0) is the editable
 * head and not yet frozen. This file validates them at Layer 1 against
 * that head under the test manifest, so the conformance fixtures are
 * known to be schema-plausible sheets, and checks the schema's fourth
 * price alternative: an InStock (or PreOrder) offer without a price is
 * a Layer 1 failure.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { schemaErrorsFor } from "../dist/validate-and-lint.js";
import { installTestManifest, clearTestManifest } from "../dist/test-hooks.js";

const here = dirname(fileURLToPath(import.meta.url));
const HEAD = JSON.parse(readFileSync(join(here, "..", "..", "spec", "product.json"), "utf8"));
const TEST_MANIFEST = JSON.parse(readFileSync(join(here, "manifest", "releases.json"), "utf8"));

function withHead(fn) {
  installTestManifest({ manifest: TEST_MANIFEST, schemas: { [HEAD.$id]: HEAD } });
  try {
    return fn();
  } finally {
    clearTestManifest();
  }
}

const load = (ruleDir, file) => JSON.parse(readFileSync(join(here, "fixtures", ruleDir, file), "utf8"));

// The fixtures this change adds: those declaring release 0.6.0 in the
// four directories, plus PDP-E-022's earlier-release fixture. The older
// fixtures of PDP-W-016, PDP-W-028 and PDP-W-029 predate Layer 1
// validation of fixtures and are left as they are.
let checked = 0;
for (const ruleDir of ["pdp-e-022", "pdp-w-016", "pdp-w-028", "pdp-w-029"]) {
  const dir = join(here, "fixtures", ruleDir);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && !f.endsWith(".expected.json"))) {
    const sheet = load(ruleDir, file);
    if (sheet.release !== "0.6.0" && ruleDir !== "pdp-e-022") continue;
    checked++;
    test(`${ruleDir}/${file} is valid at Layer 1 against the schema its release resolves to`, () => {
      const errors = withHead(() => schemaErrorsFor(sheet));
      assert.deepEqual(errors, [], `${ruleDir}/${file}: ${JSON.stringify(errors)}`);
    });
  }
}
test("the Layer 1 check covered the ten fixtures this change adds", () => {
  assert.equal(checked, 10);
});

test("the head is Product Sheet spec 0.12.0, which the 0.6.0 row of the test manifest resolves to", () => {
  assert.equal(HEAD.$id, "https://themachineweb.org/pagefront/spec/commerce/product/v0.12.0.json");
  const row = TEST_MANIFEST.releases.find((r) => r.release === "0.6.0");
  assert.equal(row.sheets.product, "0.12.0");
});

test("an offer without a price fails Layer 1 unless its availability is OutOfStock, SoldOut or Discontinued", () => {
  const offerErrors = (availability) => {
    const sheet = load("pdp-w-016", "clean-sold-out.json");
    sheet.data.offers[0].availability = availability;
    return withHead(() => schemaErrorsFor(sheet));
  };
  for (const ok of [
    "https://schema.org/OutOfStock", "https://schema.org/SoldOut", "https://schema.org/Discontinued",
    "http://schema.org/OutOfStock", "http://schema.org/SoldOut", "http://schema.org/Discontinued",
  ]) {
    assert.deepEqual(offerErrors(ok), [], ok);
  }
  for (const needsPrice of [
    "https://schema.org/InStock", "https://schema.org/PreOrder", "https://schema.org/BackOrder",
    "https://schema.org/MadeToOrder", "https://schema.org/LimitedAvailability", "https://schema.org/InStoreOnly",
  ]) {
    const errors = offerErrors(needsPrice);
    assert.ok(errors.length > 0, needsPrice);
    assert.ok(errors.some((e) => e.keyword === "anyOf" && e.instancePath === "/data/offers/0"), `${needsPrice}: ${JSON.stringify(errors)}`);
  }
});

test("an unavailable offer with a price still validates, as before", () => {
  const sheet = load("pdp-e-022", "fires-discontinued-with-price.json");
  delete sheet.data.offers[0].checkoutPageURLTemplate;
  assert.deepEqual(withHead(() => schemaErrorsFor(sheet)), []);
});
