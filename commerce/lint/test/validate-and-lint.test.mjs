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

test("release line: a sheet carrying both fields fails Layer 1", () => {
  const both = load("clean.json");
  both.format_version = "0.9";
  const result = validateAndLint(both, OPTIONS);
  assert.equal(result.layer, 1);
  assert.ok(result.schemaErrors.some((e) => e.keyword === "additionalProperties"));
  // Layer 2 alone reports the same condition as a finding.
  assert.deepEqual(lintSheet(both, OPTIONS).summary.rules_fired, ["PDP-E-016"]);
});

test("unknown release: Layer 1 fails with one error naming the release; Layer 2 alone fires PDP-E-018", () => {
  for (const release of ["0.6.0", "0.3", "9.9.9"]) {
    const sheet = load("clean.json");
    sheet.release = release;
    assert.deepEqual(validateAndLint(sheet, OPTIONS), {
      layer: 1,
      schemaErrors: [
        { instancePath: "/release", message: `names no release this linter knows: ${release}`, keyword: "release" },
      ],
    });
    assert.deepEqual(lintSheet(sheet, OPTIONS).summary.rules_fired, ["PDP-E-018"]);
  }
});

/** clean.json rewritten as a release 0.3.0 sheet (Product Sheet spec 0.9.0). */
function release030() {
  const sheet = load("clean.json");
  sheet.release = "0.3.0";
  sheet.$schema = "https://themachineweb.org/pagefront/spec/commerce/product/v0.9.0.json";
  return sheet;
}

test("current release sheet: validated against the schema its release bundles", () => {
  const sheet = load("clean.json");
  assert.equal(sheet.$schema, "https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json");
  const result = validateAndLint(sheet, OPTIONS);
  assert.equal(result.layer, 2);
  assert.equal(result.report.release, "0.4.0");
  assert.equal(result.report.sheet_spec_version, "0.10.0");
  assert.deepEqual(result.report.summary.rules_fired, []);
});

test("release 0.3.0 sheet: still validated against its own frozen schema", () => {
  const result = validateAndLint(release030(), OPTIONS);
  assert.equal(result.layer, 2);
  assert.equal(result.report.release, "0.3.0");
  assert.equal(result.report.sheet_spec_version, "0.9.0");
  assert.deepEqual(result.report.summary.rules_fired, []);
});

test("a sheet is judged by the release it declares: a $schema that disagrees is PDP-E-002, at Layer 2", () => {
  // The schema is resolved from `release` and the sheet type, so the
  // sheet passes Layer 1 against the schema its release bundles, and
  // the rule names the disagreement.
  const cases = [
    // still pointing at the legacy schema
    ["https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json",
      "`release` `0.4.0` bundles Product Sheet spec `0.10.0` but `$schema` URL declares version `0.9`."],
    // the previous release's schema
    ["https://themachineweb.org/pagefront/spec/commerce/product/v0.9.0.json",
      "`release` `0.4.0` bundles Product Sheet spec `0.10.0` but `$schema` URL declares version `0.9.0`."],
    // a version that was never published
    ["https://themachineweb.org/pagefront/spec/commerce/product/v0.99.0.json",
      "`release` `0.4.0` bundles Product Sheet spec `0.10.0` but `$schema` URL declares version `0.99.0`."],
    // the right version at another URL
    ["https://merchant.example/schemas/product/v0.10.0.json",
      "`release` `0.4.0` bundles Product Sheet spec `0.10.0` but `$schema` is not that schema's URL, `https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json`."],
  ];
  for (const [$schema, message] of cases) {
    const sheet = load("clean.json");
    sheet.$schema = $schema;
    const result = validateAndLint(sheet, OPTIONS);
    assert.equal(result.layer, 2, $schema);
    assert.deepEqual(result.report.summary.rules_fired, ["PDP-E-002"], $schema);
    assert.equal(result.report.findings[0].message, message);
  }
});

test("$schema absent: required by the schema from release 0.4.0, never by a rule", () => {
  // Release 0.4.0 (Product Sheet spec 0.10.0): the schema requires
  // $schema, so the failure is a Layer 1 error and nothing else.
  const current = load("clean.json");
  delete current.$schema;
  assert.deepEqual(validateAndLint(current, OPTIONS), {
    layer: 1,
    schemaErrors: [
      { instancePath: "", message: "must have required property '$schema'", keyword: "required" },
    ],
  });
  // PDP-E-002 is quiet on it: requiredness is the schema's statement.
  assert.deepEqual(lintSheet(current, OPTIONS).summary.rules_fired, []);

  // Release 0.3.0 (spec 0.9.0) does not require $schema: the sheet is
  // valid and gets no finding.
  const earlier = release030();
  delete earlier.$schema;
  const linted = validateAndLint(earlier, OPTIONS);
  assert.equal(linted.layer, 2);
  assert.deepEqual(linted.report.summary.rules_fired, []);

  // The legacy line keeps $schema optional, at both layers.
  const legacy = load("clean.json");
  delete legacy.$schema;
  delete legacy.release;
  legacy.format_version = "0.9";
  const legacyResult = validateAndLint(legacy, OPTIONS);
  assert.equal(legacyResult.layer, 2);
  assert.deepEqual(legacyResult.report.summary.rules_fired, []);
});

test("legacy sheets resolve through $schema: an unpublished one fails Layer 1 at /$schema", () => {
  const legacy = load("clean.json");
  delete legacy.release;
  legacy.format_version = "0.9";
  legacy.$schema = "https://themachineweb.org/pagefront/spec/commerce/product/v0.7.json";
  assert.deepEqual(validateAndLint(legacy, OPTIONS), {
    layer: 1,
    schemaErrors: [
      {
        instancePath: "/$schema",
        message: "names no schema this linter bundles: https://themachineweb.org/pagefront/spec/commerce/product/v0.7.json",
        keyword: "$schema",
      },
    ],
  });
});

test("release gating: PDP-E-017 applies from release 0.4.0", () => {
  const withBadExclusion = (sheet) => {
    sheet.data["pagefront:configurator"] = {
      "@type": "pagefront:Configurator",
      dimensions: [{ name: "finish", affectsPrice: false, options: [{ value: "matte" }, { value: "gloss" }] }],
      exclusions: [{ finish: "satin" }],
    };
    return sheet;
  };
  const current = validateAndLint(withBadExclusion(load("clean.json")), OPTIONS);
  assert.equal(current.layer, 2);
  assert.ok(current.report.summary.rules_fired.includes("PDP-E-017"));

  const earlier = validateAndLint(withBadExclusion(release030()), OPTIONS);
  assert.equal(earlier.layer, 2);
  assert.ok(!earlier.report.summary.rules_fired.includes("PDP-E-017"));
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
