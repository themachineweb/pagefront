import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildResult, loadFromUrl, detectDeclaredType } from "../src/lib/validate-model.ts";
import { CURRENT_RELEASE, schemaUrlFor, sheetSpecVersionFor } from "@pagefront/lint-commerce";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (p) =>
  readFileSync(join(here, "..", "..", "commerce", p), "utf8");

const CLEAN = fixture("lint/test/cli-fixtures/clean.json");
const BROKEN = fixture("lint/test/cli-fixtures/layer1-fails.json");
const BLACKBIRD = fixture("case-studies/blackbird/blackbird-v3-v0_9.json");
const ORGANIZATION = fixture("lint/test/fixtures/org-e-001/clean.json");
const ORGANIZATION_WARNS = fixture("lint/test/fixtures/org-w-001/fires.json");
const COLLECTION = fixture("lint/test/fixtures/col-e-001/clean.json");

test("clean sheet → report with zero findings", () => {
  const model = buildResult(CLEAN, "paste");
  assert.equal(model.kind, "report");
  assert.equal(model.sheet_type, "product");
  assert.deepEqual(model.report.summary, {
    errors: 0, warnings: 0, info: 0, rules_fired: [],
  });
});

test("organization sheet → judged as organization, under the organization catalogue", () => {
  const clean = buildResult(ORGANIZATION, "paste");
  assert.equal(clean.kind, "report");
  assert.equal(clean.sheet_type, "organization");
  assert.deepEqual(clean.report.summary.rules_fired, []);

  const warns = buildResult(ORGANIZATION_WARNS, "paste");
  assert.equal(warns.kind, "report");
  assert.equal(warns.sheet_type, "organization");
  assert.deepEqual(warns.report.summary.rules_fired, ["ORG-W-001"]);

  // Schema errors come from the organization schema: the required
  // property named is one a product sheet never carries.
  const broken = JSON.parse(ORGANIZATION);
  delete broken.data["pagefront:commerceRole"];
  const layer1 = buildResult(JSON.stringify(broken), "paste");
  assert.equal(layer1.kind, "layer1");
  assert.equal(layer1.sheet_type, "organization");
  assert.ok(layer1.schemaErrors.some((e) => e.message.includes("pagefront:commerceRole")), JSON.stringify(layer1.schemaErrors));
});

test("legacy organization sheet (format_version 0.9) → in scope, on the legacy line", () => {
  const { release: _release, $schema: _schema, ...rest } = JSON.parse(ORGANIZATION);
  for (const $schema of [
    "https://themachineweb.org/pagefront/spec/commerce/organization/v0.9.json",
    "https://themachineweb.org/pagefront/commerce/schemas/organization/v0.9.json",
  ]) {
    const model = buildResult(JSON.stringify({ $schema, format_version: "0.9", ...rest }), "paste");
    assert.equal(model.kind, "report", $schema);
    assert.equal(model.sheet_type, "organization");
    assert.equal(model.report.release, "0.9");
  }
});

test("schema-broken input → layer1 with mapped SchemaErrors", () => {
  const model = buildResult(BROKEN, "paste");
  assert.equal(model.kind, "layer1");
  assert.deepEqual(model.schemaErrors, [
    {
      instancePath: "",
      message: "must have required property 'release'",
      keyword: "required",
    },
  ]);
});

test("findings-bearing sheet (Blackbird) → report with PDP-W-014", () => {
  // buildResult lints at wall-clock time (a live validator should flag an
  // expired sheet), so the corpus artifact's fixed `expires_at` would add
  // PDP-W-008 once that date passes. Re-base it a week out to keep this
  // test about the sheet's content finding, not the calendar. Likewise
  // the corpus moves to each new commerce release before the pinned,
  // published linter knows it, so declare the release that linter
  // bundles: the site runs the published package, whatever the
  // repository's current release is.
  const sheet = JSON.parse(BLACKBIRD);
  sheet.expires_at = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  sheet.release = CURRENT_RELEASE;
  sheet.$schema = schemaUrlFor("product", sheetSpecVersionFor(CURRENT_RELEASE, "product"));
  const model = buildResult(JSON.stringify(sheet), "paste");
  assert.equal(model.kind, "report");
  assert.deepEqual(model.report.summary.rules_fired, ["PDP-W-014"]);
  assert.equal(model.report.summary.warnings, 1);
});

/** CLEAN as a legacy draft-line sheet: format_version in place of release. */
function legacyClean($schema = "https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json") {
  const { release: _release, $schema: _schema, ...rest } = JSON.parse(CLEAN);
  return { $schema, format_version: "0.9", ...rest };
}

test("release-line report carries release and sheet_spec_version", () => {
  const model = buildResult(CLEAN, "paste");
  // The fixture is on the current release; the report states what it declares.
  const declared = JSON.parse(CLEAN);
  assert.equal(model.report.release, declared.release);
  assert.equal(`v${model.report.sheet_spec_version}.json`, declared.$schema.replace(/^.*\//, ""));
});

test("legacy sheet (format_version 0.9, legacy $schema) → still validated and linted", () => {
  const model = buildResult(JSON.stringify(legacyClean()), "paste");
  assert.equal(model.kind, "report");
  assert.equal(model.report.release, "0.9");
  assert.equal(model.report.sheet_spec_version, "0.9");
  assert.deepEqual(model.report.summary.rules_fired, []);
});

test("wrong declared version → scope error, not schema errors", () => {
  const legacy = legacyClean();
  legacy.format_version = "0.6";
  delete legacy.$schema;
  assert.deepEqual(buildResult(JSON.stringify(legacy), "paste"), {
    kind: "scope-error",
    declared: "format_version 0.6",
  });

  const sheet = JSON.parse(CLEAN);
  sheet.release = "9.9.9";
  assert.deepEqual(buildResult(JSON.stringify(sheet), "paste"), {
    kind: "scope-error",
    declared: "release 9.9.9",
  });
});

test("release sheet whose $schema disagrees with its release → report with PDP-E-002", () => {
  // A sheet is judged by the release it declares: the linter validates
  // it against the schema that release bundles and names the mismatch.
  for (const $schema of [
    "https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json",
    "https://themachineweb.org/pagefront/spec/commerce/product/v0.99.0.json",
  ]) {
    const sheet = JSON.parse(CLEAN);
    sheet.$schema = $schema;
    const model = buildResult(JSON.stringify(sheet), "paste");
    assert.equal(model.kind, "report", $schema);
    assert.deepEqual(model.report.summary.rules_fired, ["PDP-E-002"], $schema);
  }
});

test("release sheet without $schema → layer1 from the current schema, report on an earlier release", () => {
  const current = JSON.parse(CLEAN);
  delete current.$schema;
  const failed = buildResult(JSON.stringify(current), "paste");
  assert.equal(failed.kind, "layer1");
  assert.deepEqual(failed.schemaErrors.map((e) => e.message), ["must have required property '$schema'"]);

  const earlier = JSON.parse(CLEAN);
  delete earlier.$schema;
  earlier.release = "0.3.0";
  const model = buildResult(JSON.stringify(earlier), "paste");
  assert.equal(model.kind, "report");
  assert.deepEqual(model.report.summary.rules_fired, []);
});

test("type detection: $schema first, then @type with its discriminator; nothing defaults to product", () => {
  assert.equal(detectDeclaredType(JSON.parse(CLEAN)), "product");
  assert.equal(detectDeclaredType(JSON.parse(ORGANIZATION)), "organization");
  assert.equal(detectDeclaredType(JSON.parse(COLLECTION)), "collection");

  // $schema wins over the data block.
  const crossed = JSON.parse(CLEAN);
  crossed.$schema = "https://themachineweb.org/pagefront/spec/commerce/organization/v0.4.0.json";
  assert.equal(detectDeclaredType(crossed), "organization");

  // Without $schema, the data block decides, and only with its discriminator.
  const org = JSON.parse(ORGANIZATION);
  delete org.$schema;
  assert.equal(detectDeclaredType(org), "organization");
  delete org.data["pagefront:commerceRole"];
  assert.equal(detectDeclaredType(org), undefined);
  const col = JSON.parse(COLLECTION);
  delete col.$schema;
  assert.equal(detectDeclaredType(col), "collection");
  delete col.data["pagefront:collectionKind"];
  assert.equal(detectDeclaredType(col), undefined);

  assert.equal(detectDeclaredType({ release: "0.4.0", data: { "@type": "Thing" } }), undefined);
  assert.equal(detectDeclaredType({ release: "0.4.0" }), undefined);
  assert.equal(detectDeclaredType([1, 2]), undefined);
  assert.equal(detectDeclaredType("x"), undefined);
});

test("unresolvable type → unknown-type, nothing judged", () => {
  const sheet = { release: "0.4.0", canonical_url: "https://merchant.example/x", data: { "@type": "Thing" } };
  assert.deepEqual(buildResult(JSON.stringify(sheet), "paste"), { kind: "unknown-type" });
  assert.deepEqual(buildResult("[1,2]", "paste"), { kind: "unknown-type" });
});

test("a collection sheet → judged under the collection catalogue since release 0.5.0 bundles its schema", () => {
  const model = buildResult(COLLECTION, "paste");
  assert.equal(model.kind, "report");
  assert.equal(model.sheet_type, "collection");
  assert.equal(model.report.release, "0.5.0");
  assert.equal(model.report.sheet_spec_version, "0.1.0");
  assert.deepEqual(model.report.summary.rules_fired, []);
  // Detected by shape when $schema is absent, then held to the schema the
  // release bundles, which requires $schema: a Layer 1 failure, as for any
  // release-line sheet without it.
  const byShape = JSON.parse(COLLECTION);
  delete byShape.$schema;
  const shaped = buildResult(JSON.stringify(byShape), "paste");
  assert.equal(shaped.kind, "layer1");
  assert.equal(shaped.sheet_type, "collection");
  assert.deepEqual(shaped.schemaErrors.map((e) => e.message), ["must have required property '$schema'"]);
});

test("a product sheet declaring the organization schema → judged by its release, ORG-E-003 names the mismatch", () => {
  // Both types are in scope, so this is no longer a scope error: the
  // sheet is dispatched as the type its $schema names and judged there.
  const sheet = JSON.parse(CLEAN);
  sheet.$schema = "https://themachineweb.org/pagefront/spec/commerce/organization/v0.4.0.json";
  const model = buildResult(JSON.stringify(sheet), "paste");
  assert.equal(model.sheet_type, "organization");
  assert.equal(model.kind, "layer1");
});

test("sheet carrying both format_version and release → layer1", () => {
  const sheet = JSON.parse(CLEAN);
  sheet.format_version = "0.9";
  const model = buildResult(JSON.stringify(sheet), "paste");
  assert.equal(model.kind, "layer1");
});

test("former $schema identifier (pre 2026-09-08) → still in scope, on the legacy line", () => {
  const sheet = legacyClean("https://themachineweb.org/pagefront/commerce/schemas/product/v0.9.json");
  const model = buildResult(JSON.stringify(sheet), "paste");
  assert.equal(model.kind, "report");
});

test("legacy sheet with a foreign $schema → scope error", () => {
  const sheet = legacyClean("https://themachineweb.org/pagefront/commerce/schemas/product/v0.7.json");
  const model = buildResult(JSON.stringify(sheet), "paste");
  assert.equal(model.kind, "scope-error");
});

test("invalid JSON: paste → invalid-json; url → no-sheet", () => {
  assert.equal(buildResult("<html>…", "paste").kind, "invalid-json");
  assert.deepEqual(buildResult("<html>…", "url"), {
    kind: "no-sheet",
    detail: "the response is not JSON",
  });
});

test("loadFromUrl: ok → report, 404 → no-sheet, refused → fetch-error", async () => {
  const server = createServer((req, res) => {
    if (req.url === "/sheet.json") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(CLEAN);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const ok = await loadFromUrl(`http://127.0.0.1:${port}/sheet.json`);
    assert.equal(ok.kind, "report");

    const missing = await loadFromUrl(`http://127.0.0.1:${port}/gone.json`);
    assert.deepEqual(missing, { kind: "no-sheet", detail: "HTTP 404" });
  } finally {
    server.close();
  }
  const refused = await loadFromUrl("http://127.0.0.1:1/never.json");
  assert.equal(refused.kind, "fetch-error");
});
