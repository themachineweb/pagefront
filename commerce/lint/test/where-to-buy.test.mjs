/**
 * "Where to buy" (product.md): the checkout template fixtures of
 * PDP-E-019, PDP-E-020, PDP-E-021 and PDP-W-040 declare release 0.5.0, whose Product Sheet
 * schema (0.11.0) is the editable head and not yet frozen. This file
 * validates them at Layer 1 against that head under the test manifest,
 * so the conformance fixtures are known to be schema-plausible sheets,
 * and exercises the RFC 6570 parser directly.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { schemaErrorsFor } from "../dist/validate-and-lint.js";
import { installTestManifest, clearTestManifest } from "../dist/test-hooks.js";
import { parseTemplate, expandTemplate, checkoutTemplateProblem } from "../dist/rules/checkout-template.js";

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

for (const ruleDir of ["pdp-e-019", "pdp-e-020", "pdp-e-021", "pdp-w-040"]) {
  const dir = join(here, "fixtures", ruleDir);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && !f.endsWith(".expected.json"))) {
    test(`${ruleDir}/${file} is valid at Layer 1 against the schema its release resolves to`, () => {
      const sheet = JSON.parse(readFileSync(join(dir, file), "utf8"));
      const errors = withHead(() => schemaErrorsFor(sheet));
      assert.deepEqual(errors, [], `${ruleDir}/${file}: ${JSON.stringify(errors)}`);
    });
  }
}

test("the Offer block admits url and checkoutPageURLTemplate without a schema change", () => {
  assert.equal(HEAD.$defs.offer.additionalProperties, true);
  assert.equal("checkoutPageURLTemplate" in HEAD.$defs.offer.properties, false);
});

test("RFC 6570 parser: variables, operators, modifiers and the literal rules", () => {
  assert.deepEqual(parseTemplate("https://merchant.example/cart/4521:{quantity}"), { variables: ["quantity"] });
  assert.deepEqual(parseTemplate("https://merchant.example/cart/4521:1"), { variables: [] });
  assert.deepEqual(parseTemplate("https://m.example/c{?quantity,variant}{&quantity*}{#quantity:3}"), { variables: ["quantity", "variant"] });
  assert.deepEqual(parseTemplate("https://m.example/c?q={a.b}{+x_1}{%2Fy}"), { variables: ["a.b", "x_1", "%2Fy"] });
  assert.match(parseTemplate("https://m.example/{quantity").detail, /never closed/);
  assert.match(parseTemplate("https://m.example/quantity}").detail, /outside an expression/);
  assert.match(parseTemplate("https://m.example/{}").detail, /is empty/);
  assert.match(parseTemplate("https://m.example/{=quantity}").detail, /reserved/);
  assert.match(parseTemplate("https://m.example/{quantity:0}").detail, /not a variable specifier/);
  assert.match(parseTemplate("https://m.example/{quantity,}").detail, /not a variable specifier/);
  assert.match(parseTemplate("https://m.example/a b").detail, /a space at position 19/);
  assert.match(parseTemplate("https://m.example/100%").detail, /percent-encoded/);
  assert.deepEqual(parseTemplate("https://m.example/100%25/{quantity}"), { variables: ["quantity"] });
  assert.match(parseTemplate('https://m.example/"x"').detail, /`"`/);
});

test("RFC 6570 expansion with quantity set to 1, per operator", () => {
  const q = { quantity: "1" };
  assert.equal(expandTemplate("https://m.example/cart/4521:{quantity}", q), "https://m.example/cart/4521:1");
  assert.equal(expandTemplate("https://m.example/c{+quantity}{#quantity}", q), "https://m.example/c1#1");
  assert.equal(expandTemplate("https://m.example/c{.quantity}{/quantity}", q), "https://m.example/c.1/1");
  assert.equal(expandTemplate("https://m.example/c{;quantity}{?quantity}{&quantity}", q), "https://m.example/c;quantity=1?quantity=1&quantity=1");
  assert.equal(expandTemplate("https://m.example/c{?quantity,quantity}", q), "https://m.example/c?quantity=1&quantity=1");
  assert.equal(expandTemplate("https://m.example/c/{quantity:1}{quantity*}", { quantity: "12" }), "https://m.example/c/112");
  assert.equal(expandTemplate("https://m.example/c{?other}", q), "https://m.example/c", "an undefined variable expands to nothing");
  assert.equal(expandTemplate("", q), "");
});

test("checkoutTemplateProblem: the one defined variable is quantity, compared exactly, and the expansion is an absolute https URL", () => {
  assert.equal(checkoutTemplateProblem("https://m.example/cart/1:{quantity}"), null);
  assert.equal(checkoutTemplateProblem("https://m.example/cart/1:1"), null);
  assert.equal(checkoutTemplateProblem("https://m.example/cart{?quantity}"), null);
  assert.deepEqual(checkoutTemplateProblem(""), { kind: "not-https", expansion: "" });
  assert.deepEqual(checkoutTemplateProblem("/cart/1:{quantity}"), { kind: "not-https", expansion: "/cart/1:1" });
  assert.deepEqual(checkoutTemplateProblem("http://m.example/cart/{quantity}"), { kind: "not-https", expansion: "http://m.example/cart/1" });
  assert.deepEqual(checkoutTemplateProblem("https://m.example/cart/{Quantity}"), { kind: "undefined-variables", variables: ["Quantity"] });
  assert.deepEqual(checkoutTemplateProblem("https://m.example/{variant}:{quantity}/{variant}"), { kind: "undefined-variables", variables: ["variant"] });
  assert.deepEqual(checkoutTemplateProblem(4521), { kind: "not-string" });
  assert.equal(checkoutTemplateProblem("https://m.example/{quantity").kind, "invalid");
});
