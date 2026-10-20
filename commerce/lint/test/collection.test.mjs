/**
 * Tests for the Commerce Collection Sheet: the editable schema head
 * (commerce/spec/collection.json, compiled here because no release
 * bundles it yet, so the package carries no frozen collection schema),
 * the sheet-type dispatch, and the collection catalogue on the worked
 * example of collection.md, which lints clean. The catalogue applies
 * from release 0.5.0, which has not landed: the Layer 2 and end-to-end
 * tests run against the test manifest (test/manifest/releases.json)
 * through the test-only hook, and one test keeps the production path,
 * which knows no 0.5.0 and bundles no collection schema. See
 * test/README.md.
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
  collectionCatalogue,
  organizationCatalogue,
  commerceCatalogue,
} from "../dist/index.js";
import { installTestManifest, clearTestManifest } from "../dist/test-hooks.js";

const here = dirname(fileURLToPath(import.meta.url));
const HEAD = JSON.parse(readFileSync(join(here, "..", "..", "spec", "collection.json"), "utf8"));
const TEST_MANIFEST = JSON.parse(readFileSync(join(here, "manifest", "releases.json"), "utf8"));
const OPTS = { checkedAt: "2026-01-01T00:00:00Z", linterVersion: "0.0.0-test" };

/** Run `fn` against the test manifest, with the head installed as the Layer 1 schema for collection 0.1.0. */
function underTestManifest(fn) {
  installTestManifest({ manifest: TEST_MANIFEST, schemas: { [HEAD.$id]: HEAD } });
  try {
    return fn();
  } finally {
    clearTestManifest();
  }
}

/** The COL-E-001 clean fixture: the "Members" example of collection.md on merchant.example. */
function loadExample() {
  return JSON.parse(readFileSync(join(here, "fixtures", "col-e-001", "clean.json"), "utf8"));
}

const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module;
const addFormats = addFormatsModule.default ?? addFormatsModule;
const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);
const validateHead = ajv.compile(HEAD);
const errorsFor = (sheet) => (validateHead(sheet) ? [] : validateHead.errors.map((e) => [e.instancePath, e.keyword]));

test("the schema head names Collection Sheet spec 0.1.0 and validates the worked example", () => {
  assert.equal(HEAD.$id, "https://themachineweb.org/pagefront/spec/commerce/collection/v0.1.0.json");
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

test("schema head: the data block requires the kind, the members and the page", () => {
  for (const field of ["@context", "@type", "@id", "name", "inLanguage", "url", "pagefront:collectionKind", "hasPart"]) {
    const sheet = loadExample();
    delete sheet.data[field];
    assert.ok(errorsFor(sheet).some(([p, k]) => p === "/data" && k === "required"), `${field} is required`);
  }
  const empty = loadExample();
  empty.data.hasPart = [];
  assert.deepEqual(errorsFor(empty), [], "hasPart may be empty");
  const kind = loadExample();
  kind.data["pagefront:collectionKind"] = "taxonomy";
  assert.ok(errorsFor(kind).some(([, k]) => k === "enum"));
  const type = loadExample();
  type.data["@type"] = "ProductGroup";
  assert.ok(errorsFor(type).some(([p, k]) => p === "/data/@type" && k === "const"));
});

test("schema head: @context is the array form with the pagefront prefix", () => {
  const bare = loadExample();
  bare.data["@context"] = "https://schema.org";
  assert.ok(errorsFor(bare).some(([p]) => p === "/data/@context"));
  const noPrefix = loadExample();
  noPrefix.data["@context"] = ["https://schema.org"];
  assert.ok(errorsFor(noPrefix).some(([p, k]) => p === "/data/@context" && k === "contains"));
});

test("schema head: a member entry carries @type, @id and url; the brand reference carries @type and @id", () => {
  for (const field of ["@type", "@id", "url"]) {
    const sheet = loadExample();
    delete sheet.data.hasPart[0][field];
    assert.ok(errorsFor(sheet).some(([p, k]) => p === "/data/hasPart/0" && k === "required"), `member ${field}`);
    const parent = loadExample();
    delete parent.data.isPartOf[0][field];
    assert.ok(errorsFor(parent).some(([p, k]) => p === "/data/isPartOf/0" && k === "required"), `parent ${field}`);
  }
  const kind = loadExample();
  kind.data.hasPart[0]["pagefront:collectionKind"] = "menu";
  assert.ok(errorsFor(kind).some(([p, k]) => p === "/data/hasPart/0/pagefront:collectionKind" && k === "enum"));
  const brand = loadExample();
  brand.data.brand = { "@type": "Brand" };
  assert.ok(errorsFor(brand).some(([p, k]) => p === "/data/brand" && k === "required"));
  brand.data.brand = { "@type": "Brand", "@id": "https://merchant.example/#brand", "pagefront:sheetUrl": "https://merchant.example/pagefront/commerce/organization/merchant.en.json" };
  assert.deepEqual(errorsFor(brand), []);
});

test("the worked example lints clean against the collection catalogue, under the test manifest", () => {
  const report = underTestManifest(() => lintSheet(loadExample(), OPTS));
  assert.deepEqual(report.summary, { errors: 0, warnings: 0, info: 0, rules_fired: [] });
  assert.equal(report.catalogue_version, "0.18.0");
  assert.equal(report.release, "0.5.0");
  assert.equal(report.sheet_spec_version, "0.1.0");
});

test("end to end under the test manifest: Layer 1 against the head, then the collection catalogue", () => {
  const result = underTestManifest(() => validateAndLint(loadExample(), OPTS));
  assert.equal(result.layer, 2);
  assert.deepEqual(result.report.summary.rules_fired, []);
  // A schema failure is reported at Layer 1, against the head.
  const broken = loadExample();
  delete broken.data["pagefront:collectionKind"];
  const failed = underTestManifest(() => validateAndLint(broken, OPTS));
  assert.equal(failed.layer, 1);
  assert.ok(failed.schemaErrors.some((e) => e.instancePath === "/data" && e.keyword === "required"));
  // The release gate: the rules apply from 0.5.0 and skip a lower declared release.
  const earlier = loadExample();
  earlier.release = "0.4.0";
  delete earlier.data.hasPart[0]["@id"];
  assert.deepEqual(underTestManifest(() => lintSheet(earlier, OPTS)).summary.rules_fired, []);
  // ... and COL-E-003 fires under the test manifest, which bundles collection 0.1.0 in 0.5.0.
  const other = loadExample();
  other.$schema = "https://themachineweb.org/pagefront/spec/commerce/collection/v0.2.0.json";
  assert.deepEqual(underTestManifest(() => lintSheet(other, OPTS)).summary.rules_fired, ["COL-E-003"]);
});

test("sheet-type dispatch: $schema wins, the data block is the fallback, and no other catalogue runs", () => {
  const example = loadExample();
  assert.equal(detectSheetType(example), "collection");
  // Fallback: no $schema, a Collection data block carrying the kind.
  const bare = loadExample();
  delete bare.$schema;
  assert.equal(detectSheetType(bare), "collection");
  assert.deepEqual(underTestManifest(() => lintSheet(bare, OPTS)).summary.rules_fired, []);
  // Without the kind the fallback does not apply (the sheet is not recognisably a collection sheet).
  const noKind = loadExample();
  delete noKind.$schema;
  delete noKind.data["pagefront:collectionKind"];
  assert.equal(detectSheetType(noKind), "product");
  // A declared schema wins over shape: a product $schema on this data block routes to the product catalogue.
  const declared = loadExample();
  declared.$schema = "https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json";
  assert.equal(detectSheetType(declared), "product");

  // The three catalogues carry disjoint rule prefixes.
  const prefixes = (c) => new Set(c.rules.map((r) => r.id.slice(0, 4)));
  assert.deepEqual([...prefixes(collectionCatalogue)], ["COL-"]);
  assert.deepEqual([...prefixes(organizationCatalogue)], ["ORG-"]);
  assert.deepEqual([...prefixes(commerceCatalogue)], ["PDP-"]);
  // The example satisfies no product-rule requirement (no identifier, no offers, no images) and
  // no organization rule's trigger, yet reports nothing: only the collection catalogue ran.
  assert.ok(underTestManifest(() => lintSheet(example, OPTS)).findings.every((f) => f.rule.startsWith("COL-")));
});

test("production path: release 0.5.0 bundles the Collection Sheet spec; earlier releases do not", () => {
  // Without the test manifest the package knows the bundled releases.
  // Since 0.5.0 that includes the collection schema: the worked example
  // validates at Layer 1 and lints with the collection catalogue. A sheet
  // declaring 0.4.0 names a release that bundles no schema for its type;
  // it is not validated against another type's schema, and nothing crashes.
  const example = loadExample();
  const result = validateAndLint(example, OPTS);
  assert.notEqual(result.layer, 1, JSON.stringify(result));
  assert.equal(result.report.release, "0.5.0");
  assert.equal(result.report.sheet_spec_version, "0.1.0");
  assert.deepEqual(result.report.summary.rules_fired, []);
  const earlier = loadExample();
  earlier.release = "0.4.0";
  assert.deepEqual(validateAndLint(earlier, OPTS), {
    layer: 1,
    schemaErrors: [
      { instancePath: "/release", message: "release 0.4.0 bundles no Collection Sheet schema", keyword: "release" },
    ],
  });
  // The Collection Sheet spec has no legacy draft line. A legacy sheet
  // resolves through its $schema: since 0.5.0 that names the bundled
  // release-line schema, which requires `release` and rejects
  // `format_version`, so the sheet fails Layer 1 against it; without a
  // $schema, the line itself has no schema for the type.
  const legacy = loadExample();
  delete legacy.release;
  legacy.format_version = "0.9";
  assert.deepEqual(validateAndLint(legacy, OPTS).schemaErrors, [
    { instancePath: "", message: "must have required property 'release'", keyword: "required" },
    { instancePath: "", message: "must NOT have additional properties", keyword: "additionalProperties" },
  ]);
  const legacyBare = { ...legacy };
  delete legacyBare.$schema;
  assert.equal(detectSheetType(legacyBare), "collection");
  assert.deepEqual(validateAndLint(legacyBare, OPTS).schemaErrors, [
    { instancePath: "/format_version", message: "the legacy draft line has no Collection Sheet schema", keyword: "format_version" },
  ]);
  // Legacy gating: no collection rule applies to the legacy line, so Layer 2 alone is silent on it.
  assert.deepEqual(lintSheet(legacy, OPTS).summary.rules_fired, []);
  assert.deepEqual(lintSheet(legacyBare, OPTS).summary.rules_fired, []);
});
