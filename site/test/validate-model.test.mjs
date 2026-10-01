import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildResult, loadFromUrl } from "../src/lib/validate-model.ts";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (p) =>
  readFileSync(join(here, "..", "..", "commerce", p), "utf8");

const CLEAN = fixture("lint/test/cli-fixtures/clean.json");
const BROKEN = fixture("lint/test/cli-fixtures/layer1-fails.json");
const BLACKBIRD = fixture("case-studies/blackbird/blackbird-v3-v0_9.json");

test("clean sheet → report with zero findings", () => {
  const model = buildResult(CLEAN, "paste");
  assert.equal(model.kind, "report");
  assert.deepEqual(model.report.summary, {
    errors: 0, warnings: 0, info: 0, rules_fired: [],
  });
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
  // test about the sheet's content finding, not the calendar.
  const sheet = JSON.parse(BLACKBIRD);
  sheet.expires_at = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
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
  assert.equal(model.report.release, "0.3.0");
  assert.equal(model.report.sheet_spec_version, "0.9.0");
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
  sheet.release = "0.4.0";
  assert.deepEqual(buildResult(JSON.stringify(sheet), "paste"), {
    kind: "scope-error",
    declared: "release 0.4.0",
  });
});

test("release sheet pointing $schema at the legacy schema → in scope, and reported as a problem", () => {
  // The legacy schema URL is a product schema, so the sheet is in scope.
  // How the mismatch surfaces depends on the linter version: 0.10.0 lints
  // it and fires PDP-E-002; from 0.11.0 the sheet is validated against the
  // schema it names and fails Layer 1.
  const sheet = JSON.parse(CLEAN);
  sheet.$schema = "https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json";
  const model = buildResult(JSON.stringify(sheet), "paste");
  if (model.kind === "report") {
    assert.deepEqual(model.report.summary.rules_fired, ["PDP-E-002"]);
  } else {
    assert.equal(model.kind, "layer1");
  }
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

test("foreign $schema → scope error", () => {
  const sheet = JSON.parse(CLEAN);
  sheet.$schema = "https://themachineweb.org/pagefront/commerce/schemas/product/v0.7.json";
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
