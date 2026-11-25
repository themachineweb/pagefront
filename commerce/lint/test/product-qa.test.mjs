/**
 * "Product Q&A" (product.md): the provenance rule and the recommended
 * properties Product Sheet spec 0.13.0 adds. The fixtures of PDP-W-045,
 * PDP-W-046 and PDP-W-047 declare release 0.7.0, whose Product Sheet
 * schema (0.13.0) is the editable head and not yet frozen. This file
 * validates them at Layer 1 against that head under the test manifest,
 * so the conformance fixtures are known to be schema-plausible sheets,
 * and checks the schema's change: a Question may carry suggestedAnswer
 * entries alone, or no answer at all (PDP-W-046's case, a warning and no
 * Layer 1 failure), while an answer's text stays non-empty and author
 * is a string or an object.
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

let checked = 0;
for (const ruleDir of ["pdp-w-045", "pdp-w-046", "pdp-w-047"]) {
  const dir = join(here, "fixtures", ruleDir);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && !f.endsWith(".expected.json"))) {
    checked++;
    test(`${ruleDir}/${file} is valid at Layer 1 against the schema its release resolves to`, () => {
      const errors = withHead(() => schemaErrorsFor(load(ruleDir, file)));
      assert.deepEqual(errors, [], `${ruleDir}/${file}: ${JSON.stringify(errors)}`);
    });
  }
}
test("the Layer 1 check covered the ten fixtures of the three rules", () => {
  assert.equal(checked, 10);
});

test("the head is Product Sheet spec 0.13.0, which the 0.7.0 row of the test manifest resolves to", () => {
  assert.equal(HEAD.$id, "https://themachineweb.org/pagefront/spec/commerce/product/v0.13.0.json");
  const row = TEST_MANIFEST.releases.find((r) => r.release === "0.7.0");
  assert.equal(row.sheets.product, "0.13.0");
});

const questionErrors = (question) => {
  const sheet = load("pdp-w-046", "clean.json");
  sheet.data.question = [question];
  return withHead(() => schemaErrorsFor(sheet));
};

test("a Question with suggestedAnswer entries alone, or with no answer, passes Layer 1", () => {
  assert.deepEqual(
    questionErrors({
      "@type": "Question",
      name: "Will the bracelet fit a 19 cm wrist?",
      suggestedAnswer: [{ "@type": "Answer", text: "Fits my 19.5 cm wrist.", author: "M. Dubois" }],
    }),
    []
  );
  assert.deepEqual(questionErrors({ "@type": "Question", name: "Is this watch water-resistant?" }), []);
});

test("an answer with empty text, or an author that is neither a string nor an object, fails Layer 1", () => {
  assert.notEqual(
    questionErrors({ "@type": "Question", name: "Q", acceptedAnswer: { "@type": "Answer", text: "" } }).length,
    0
  );
  assert.notEqual(
    questionErrors({
      "@type": "Question",
      name: "Q",
      suggestedAnswer: [{ "@type": "Answer", text: "An answer.", author: 7 }],
    }).length,
    0
  );
});

test("url, keywords and dateModified are typed on Question and Answer", () => {
  assert.deepEqual(
    questionErrors({
      "@type": "Question",
      name: "Is this watch water-resistant?",
      url: "https://merchant.example/products/aurora-dive-watch#faq-water-resistance",
      keywords: ["Care", "Specifications"],
      acceptedAnswer: { "@type": "Answer", text: "Yes, to 100 metres.", dateModified: "2026-03-14" },
    }),
    []
  );
  assert.notEqual(
    questionErrors({
      "@type": "Question",
      name: "Q",
      keywords: 3,
      acceptedAnswer: { "@type": "Answer", text: "Yes.", dateModified: "March 2026" },
    }).length,
    0
  );
});
