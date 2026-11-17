/**
 * Tests for the Commerce Review Sheet: the editable schema head
 * (commerce/spec/review.json, compiled here because no release bundles
 * it yet, so the package carries no frozen review schema), the
 * sheet-type dispatch, and the review catalogue on the worked example of
 * review.md, which lints clean. The catalogue applies from release
 * 0.6.0, which has not landed: the Layer 2 and end-to-end tests run
 * against the test manifest (test/manifest/releases.json) through the
 * test-only hook, and one test keeps the production path, whose latest
 * release bundles no review schema. See test/README.md.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020Module from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import {
  validateAndLint,
  lintSheet,
  detectSheetType,
  reviewCatalogue,
  collectionCatalogue,
  organizationCatalogue,
  commerceCatalogue,
} from "../dist/index.js";
import { installTestManifest, clearTestManifest } from "../dist/test-hooks.js";

const here = dirname(fileURLToPath(import.meta.url));
const HEAD = JSON.parse(readFileSync(join(here, "..", "..", "spec", "review.json"), "utf8"));
const TEST_MANIFEST = JSON.parse(readFileSync(join(here, "manifest", "releases.json"), "utf8"));
const OPTS = { checkedAt: "2026-01-01T00:00:00Z", linterVersion: "0.0.0-test" };

/** Run `fn` against the test manifest, with the head installed as the Layer 1 schema for review 0.1.0. */
function underTestManifest(fn) {
  installTestManifest({ manifest: TEST_MANIFEST, schemas: { [HEAD.$id]: HEAD } });
  try {
    return fn();
  } finally {
    clearTestManifest();
  }
}

/** The REV-E-001 clean fixture: the worked example of review.md on merchant.example. */
function loadExample() {
  return JSON.parse(readFileSync(join(here, "fixtures", "rev-e-001", "clean.json"), "utf8"));
}

/** The worked example as review.md prints it, in its envelope, on merchant.com. */
function loadWorkedExample() {
  const md = readFileSync(join(here, "..", "..", "spec", "review.md"), "utf8");
  const block = (section) => JSON.parse(md.split(section)[1].split("```json\n")[1].split("\n```")[0]);
  const envelope = block("## The envelope");
  envelope.data = block("## Worked example");
  return envelope;
}

const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module;
const addFormats = addFormatsModule.default ?? addFormatsModule;
const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);
const validateHead = ajv.compile(HEAD);
const errorsFor = (sheet) => (validateHead(sheet) ? [] : validateHead.errors.map((e) => [e.instancePath, e.keyword]));

test("the schema head names Review Sheet spec 0.1.0 and validates the worked example of review.md", () => {
  assert.equal(HEAD.$id, "https://themachineweb.org/pagefront/spec/commerce/review/v0.1.0.json");
  assert.deepEqual(errorsFor(loadWorkedExample()), []);
  assert.deepEqual(errorsFor(loadExample()), []);
});

test("schema head: the envelope is the shared one", () => {
  const sheet = loadExample();
  delete sheet.sheet_url;
  delete sheet.expires_at;
  assert.deepEqual(errorsFor(sheet), [], "sheet_url and expires_at are optional");
  const both = loadExample();
  both.format_version = "0.9";
  assert.ok(errorsFor(both).some(([, k]) => k === "additionalProperties"), "format_version beside release");
  for (const field of ["$schema", "release", "schema_org_version", "canonical_url", "generated_at", "data"]) {
    const missing = loadExample();
    delete missing[field];
    assert.ok(errorsFor(missing).some(([p, k]) => p === "" && k === "required"), `${field} is required`);
  }
});

test("schema head: the data block requires the subject, the policy and the list", () => {
  for (const field of ["@context", "@type", "@id", "inLanguage", "about", "pagefront:reviewPolicy", "itemListElement"]) {
    const sheet = loadExample();
    delete sheet.data[field];
    assert.ok(errorsFor(sheet).some(([p, k]) => p === "/data" && k === "required"), `${field} is required`);
  }
  const empty = loadExample();
  empty.data.itemListElement = [];
  empty.data.numberOfItems = 0;
  assert.deepEqual(errorsFor(empty), [], "itemListElement may be empty");
  const type = loadExample();
  type.data["@type"] = "Collection";
  assert.ok(errorsFor(type).some(([p, k]) => p === "/data/@type" && k === "const"));
  const noPrefix = loadExample();
  noPrefix.data["@context"] = ["https://schema.org"];
  assert.ok(errorsFor(noPrefix).some(([p, k]) => p === "/data/@context" && k === "contains"));
});

test("schema head: the policy and every declaration are closed enums with undisclosed", () => {
  const policy = loadExample();
  policy.data["pagefront:reviewPolicy"].collection = "selected";
  assert.ok(errorsFor(policy).some(([p, k]) => p === "/data/pagefront:reviewPolicy/collection" && k === "enum"));
  const undisclosedPolicy = loadExample();
  undisclosedPolicy.data["pagefront:reviewPolicy"] = { "@type": "pagefront:ReviewPolicy", collection: "undisclosed" };
  assert.deepEqual(errorsFor(undisclosedPolicy), []);
  for (const [field, bad] of [
    ["pagefront:reviewSubject", "service"],
    ["pagefront:purchaseVerification", "verified"],
    ["pagefront:reviewIncentive", "gift"],
  ]) {
    const outside = loadExample();
    outside.data.itemListElement[2][field] = bad;
    assert.ok(errorsFor(outside).some(([p, k]) => p === `/data/itemListElement/2/${field}` && k === "enum"), `${field} enum`);
    const undisclosed = loadExample();
    undisclosed.data.itemListElement[2][field] = "undisclosed";
    assert.equal(errorsFor(undisclosed).length, field === "pagefront:reviewSubject" ? 1 : 0, `${field} undisclosed`);
    const absent = loadExample();
    delete absent.data.itemListElement[2][field];
    assert.ok(errorsFor(absent).some(([p, k]) => p === "/data/itemListElement/2" && k === "required"), `${field} required`);
  }
  const kind = loadExample();
  kind.data.itemListElement[2]["pagefront:reviewSource"] = { kind: "syndicated" };
  assert.ok(errorsFor(kind).some(([p, k]) => p === "/data/itemListElement/2/pagefront:reviewSource/kind" && k === "enum"));
  const aspect = loadExample();
  aspect.data.itemListElement[0]["pagefront:aspect"][0].aspect = "scent";
  assert.ok(errorsFor(aspect).some(([p, k]) => p === "/data/itemListElement/0/pagefront:aspect/0/aspect" && k === "enum"));
  const source = loadExample();
  source.data.itemListElement[0]["pagefront:aspectSource"] = "guessed";
  assert.ok(errorsFor(source).some(([p, k]) => p === "/data/itemListElement/0/pagefront:aspectSource" && k === "enum"));
  const rating = loadExample();
  delete rating.data.itemListElement[2].reviewRating.ratingValue;
  assert.ok(errorsFor(rating).some(([p, k]) => p === "/data/itemListElement/2/reviewRating" && k === "required"));
});

test("the worked example lints clean against the review catalogue, under the test manifest", () => {
  const report = underTestManifest(() => lintSheet(loadExample(), OPTS));
  assert.deepEqual(report.summary, { errors: 0, warnings: 0, info: 0, rules_fired: [] });
  assert.equal(report.catalogue_version, "0.21.0");
  assert.equal(report.release, "0.6.0");
  assert.equal(report.sheet_spec_version, "0.1.0");
});

test("end to end under the test manifest: Layer 1 against the head, then the review catalogue", () => {
  const result = underTestManifest(() => validateAndLint(loadExample(), OPTS));
  assert.equal(result.layer, 2);
  assert.deepEqual(result.report.summary.rules_fired, []);
  const broken = loadExample();
  delete broken.data["pagefront:reviewPolicy"];
  const failed = underTestManifest(() => validateAndLint(broken, OPTS));
  assert.equal(failed.layer, 1);
  assert.ok(failed.schemaErrors.some((e) => e.instancePath === "/data" && e.keyword === "required"));
  // The release gate: the rules apply from 0.6.0 and skip a lower declared release.
  const earlier = loadExample();
  earlier.release = "0.5.0";
  delete earlier.data.itemListElement[0]["@id"];
  assert.deepEqual(underTestManifest(() => lintSheet(earlier, OPTS)).summary.rules_fired, []);
});

test("sheet-type dispatch: $schema wins, the data block is the fallback, and no other catalogue runs", () => {
  const example = loadExample();
  assert.equal(detectSheetType(example), "review");
  const bare = loadExample();
  delete bare.$schema;
  assert.equal(detectSheetType(bare), "review");
  assert.deepEqual(underTestManifest(() => lintSheet(bare, OPTS)).summary.rules_fired, []);
  // Without the policy the fallback does not apply (the sheet is not recognisably a review sheet).
  const noPolicy = loadExample();
  delete noPolicy.$schema;
  delete noPolicy.data["pagefront:reviewPolicy"];
  assert.equal(detectSheetType(noPolicy), "product");
  const declared = loadExample();
  declared.$schema = "https://themachineweb.org/pagefront/spec/commerce/collection/v0.1.0.json";
  assert.equal(detectSheetType(declared), "collection");

  const prefixes = (c) => new Set(c.rules.map((r) => r.id.slice(0, 4)));
  assert.deepEqual([...prefixes(reviewCatalogue)], ["REV-"]);
  assert.deepEqual([...prefixes(collectionCatalogue)], ["COL-"]);
  assert.deepEqual([...prefixes(organizationCatalogue)], ["ORG-"]);
  assert.deepEqual([...prefixes(commerceCatalogue)], ["PDP-"]);
  assert.equal(reviewCatalogue.rules.length, 27);
  assert.ok(underTestManifest(() => lintSheet(example, OPTS)).findings.every((f) => f.rule.startsWith("REV-")));
});

test("production path: no bundled release carries the Review Sheet spec yet", () => {
  const example = loadExample();
  example.release = "0.5.0";
  assert.deepEqual(validateAndLint(example, OPTS), {
    layer: 1,
    schemaErrors: [
      { instancePath: "/release", message: "release 0.5.0 bundles no Review Sheet schema", keyword: "release" },
    ],
  });
  // No legacy draft line: without a release and a $schema the type has no legacy schema.
  const legacyBare = loadExample();
  delete legacyBare.release;
  delete legacyBare.$schema;
  legacyBare.format_version = "0.9";
  assert.equal(detectSheetType(legacyBare), "review");
  assert.deepEqual(validateAndLint(legacyBare, OPTS).schemaErrors, [
    { instancePath: "/format_version", message: "the legacy draft line has no Review Sheet schema", keyword: "format_version" },
  ]);
  assert.deepEqual(lintSheet(legacyBare, OPTS).summary.rules_fired, []);
});
