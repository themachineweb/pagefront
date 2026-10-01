import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validateAndLint, lintSheet } from "../dist/index.js";

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  "cli-fixtures"
);

function load(fixture) {
  return JSON.parse(readFileSync(join(FIXTURES, fixture), "utf8"));
}

const OPTIONS = { checkedAt: "2026-01-01T00:00:00Z", linterVersion: "0.0.0-test" };

test("schema-broken input yields layer 1 with mapped SchemaErrors", () => {
  const result = validateAndLint(load("layer1-fails.json"), OPTIONS);
  assert.deepEqual(result, {
    layer: 1,
    schemaErrors: [
      {
        instancePath: "",
        message: "must have required property 'release'",
        keyword: "required",
      },
    ],
  });
});

test("valid sheet yields layer 2 with a Report identical to lintSheet's", () => {
  for (const fixture of ["clean.json", "warns.json", "errors.json"]) {
    const sheet = load(fixture);
    const result = validateAndLint(sheet, OPTIONS);
    assert.equal(result.layer, 2, fixture);
    assert.deepEqual(result.report, lintSheet(sheet, OPTIONS), fixture);
  }
});

test("legalEntity organization: stub, inline, and neither (v0.9 anyOf)", () => {
  // Reference-stub form ({@type, @id}, no name) passes Layer 1 (the
  // v0.9 anyOf) and is clean at Layer 2: PDP-W-024 exempts reference-form
  // organizations, whose address lives on the referenced Commerce
  // Organization Sheet. Both halves are needed for the stub form to be
  // clean end to end.
  const stub = load("legalentity-stub.json");
  const stubResult = validateAndLint(stub, OPTIONS);
  assert.equal(stubResult.layer, 2);
  assert.deepEqual(stubResult.report.summary, {
    errors: 0, warnings: 0, info: 0, rules_fired: [],
  });

  // Inline form (name present, no @id) validates exactly as before.
  const inline = JSON.parse(JSON.stringify(stub));
  inline.data["pagefront:legalEntity"][0].organization = {
    "@type": "Organization",
    name: "Merchant Example GmbH",
    address: { "@type": "PostalAddress", addressCountry: "DE" },
  };
  assert.equal(validateAndLint(inline, OPTIONS).layer, 2);

  // Neither name nor @id still fails Layer 1, on the anyOf.
  const neither = JSON.parse(JSON.stringify(stub));
  neither.data["pagefront:legalEntity"][0].organization = {
    "@type": "Organization",
    url: "https://merchant.example",
  };
  const failed = validateAndLint(neither, OPTIONS);
  assert.equal(failed.layer, 1);
  assert.ok(failed.schemaErrors.some((e) => e.keyword === "anyOf"));
  assert.ok(
    failed.schemaErrors.every((e) =>
      e.instancePath.startsWith("/data/pagefront:legalEntity/0/organization")
    )
  );
});

test("legacy line: a format_version sheet validates against the frozen v0.9 schema and lints", () => {
  const legacy = load("clean.json");
  delete legacy.release;
  legacy.format_version = "0.9";
  legacy.$schema = "https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json";
  const result = validateAndLint(legacy, OPTIONS);
  assert.equal(result.layer, 2);
  assert.equal(result.report.release, "0.9");
  assert.equal(result.report.sheet_spec_version, "0.9");
  assert.deepEqual(result.report.summary.rules_fired, []);

  // The legacy envelope requires format_version 0.9 exactly.
  legacy.format_version = "0.8";
  const failed = validateAndLint(legacy, OPTIONS);
  assert.equal(failed.layer, 1);
  assert.ok(failed.schemaErrors.some((e) => e.keyword === "const" && e.instancePath === "/format_version"));
});

test("release line: a sheet carrying both fields fails Layer 1; release must be a full semver", () => {
  const both = load("clean.json");
  both.format_version = "0.9";
  const result = validateAndLint(both, OPTIONS);
  assert.equal(result.layer, 1);
  assert.ok(result.schemaErrors.some((e) => e.keyword === "additionalProperties"));
  // Layer 2 alone reports the same condition as a finding.
  assert.deepEqual(lintSheet(both, OPTIONS).summary.rules_fired, ["PDP-E-016"]);

  const short = load("clean.json");
  short.release = "0.3";
  const failed = validateAndLint(short, OPTIONS);
  assert.equal(failed.layer, 1);
  assert.ok(failed.schemaErrors.some((e) => e.keyword === "pattern" && e.instancePath === "/release"));
});

test("release 0.3.0 sheet: validated against the frozen schema its $schema names", () => {
  const sheet = load("clean.json");
  assert.equal(sheet.$schema, "https://themachineweb.org/pagefront/spec/commerce/product/v0.9.0.json");
  const result = validateAndLint(sheet, OPTIONS);
  assert.equal(result.layer, 2);
  assert.equal(result.report.release, "0.3.0");
  assert.equal(result.report.sheet_spec_version, "0.9.0");
  assert.deepEqual(result.report.summary.rules_fired, []);
});

test("unknown schema version: Layer 1 fails with one error naming the $schema, no other schema is tried", () => {
  const sheet = load("clean.json");
  sheet.$schema = "https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json";
  assert.deepEqual(validateAndLint(sheet, OPTIONS), {
    layer: 1,
    schemaErrors: [
      {
        instancePath: "/$schema",
        message:
          "names no schema this linter bundles: https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json",
        keyword: "$schema",
      },
    ],
  });
});

test("a sheet is validated against the schema it names, whatever line its envelope field suggests", () => {
  // A release sheet still pointing at the legacy schema is judged by the
  // legacy schema: it lacks format_version and carries an unknown field.
  const sheet = load("clean.json");
  sheet.$schema = "https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json";
  const result = validateAndLint(sheet, OPTIONS);
  assert.equal(result.layer, 1);
  assert.ok(result.schemaErrors.some((e) => e.keyword === "required" && /format_version/.test(e.message)));
  // Layer 2 alone names the mismatch.
  assert.equal(
    lintSheet(sheet, OPTIONS).findings[0].message,
    "`release` `0.3.0` bundles Product Sheet spec `0.9.0` but `$schema` URL declares version `0.9`."
  );
});

test("no $schema: the schema is the one the sheet's release or format_version leads to", () => {
  const release = load("clean.json");
  delete release.$schema;
  assert.equal(validateAndLint(release, OPTIONS).layer, 2);

  const legacy = load("clean.json");
  delete legacy.$schema;
  delete legacy.release;
  legacy.format_version = "0.9";
  assert.equal(validateAndLint(legacy, OPTIONS).layer, 2);
});

test("the pre-2026-09-08 legacy identifier still resolves to the legacy schema", () => {
  const legacy = load("clean.json");
  delete legacy.release;
  legacy.format_version = "0.9";
  legacy.$schema = "https://themachineweb.org/pagefront/commerce/schemas/product/v0.9.json";
  assert.equal(validateAndLint(legacy, OPTIONS).layer, 2);
});

test("options default the same way as lintSheet (package linter_version)", () => {
  const result = validateAndLint(load("clean.json"), {
    checkedAt: "2026-01-01T00:00:00Z",
  });
  assert.equal(result.layer, 2);
  const pkg = JSON.parse(
    readFileSync(join(FIXTURES, "..", "..", "package.json"), "utf8")
  );
  assert.equal(result.report.linter_version, pkg.version);
});
