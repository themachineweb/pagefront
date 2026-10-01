/**
 * The bundle built by scripts/bundle-schemas.mjs: every frozen schema
 * under commerce/schemas/ and the release manifest, carried verbatim.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SCHEMAS } from "../dist/generated/schemas.js";
import { SCHEMA_IDS } from "../dist/generated/schema-ids.js";
import {
  RELEASE_MANIFEST,
  CURRENT_RELEASE,
  sheetSpecVersionFor,
  schemaUrlFor,
} from "../dist/releases.js";

const commerce = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const schemasDir = join(commerce, "schemas");

/** Every frozen schema file, as [type, file, parsed]. */
function frozenSchemas() {
  const out = [];
  for (const type of readdirSync(schemasDir, { withFileTypes: true })) {
    if (!type.isDirectory()) continue;
    for (const file of readdirSync(join(schemasDir, type.name))) {
      out.push([type.name, file, JSON.parse(readFileSync(join(schemasDir, type.name, file), "utf8"))]);
    }
  }
  return out;
}

test("the bundle carries every file under commerce/schemas/, verbatim, keyed by $id", () => {
  const frozen = frozenSchemas();
  assert.ok(frozen.length >= 4, `expected the frozen store, found ${frozen.length} files`);
  for (const [type, file, schema] of frozen) {
    assert.equal(
      schema.$id,
      `https://themachineweb.org/pagefront/spec/commerce/${type}/${file}`,
      `commerce/schemas/${type}/${file}: $id is not its published URL`
    );
    assert.deepEqual(SCHEMAS[schema.$id], schema, `bundle is stale for commerce/schemas/${type}/${file} — run npm run build`);
  }
  assert.equal(Object.keys(SCHEMAS).length, frozen.length);
  assert.deepEqual([...SCHEMA_IDS].sort(), Object.keys(SCHEMAS).sort());
});

test("the two lines are both bundled: legacy format 0.9 and the release schemas", () => {
  for (const type of ["product", "organization"]) {
    const legacy = SCHEMAS[RELEASE_MANIFEST.legacy.schemas[type]];
    assert.equal(legacy.properties.format_version.const, "0.9");
    assert.equal(legacy.properties.release, undefined);
    for (const { release } of RELEASE_MANIFEST.releases) {
      const schema = SCHEMAS[schemaUrlFor(type, sheetSpecVersionFor(release, type))];
      assert.ok(schema, `no frozen ${type} schema for release ${release}`);
      assert.ok(schema.required.includes("release"));
      assert.equal(schema.properties.format_version, undefined);
    }
  }
});

test("bundled release manifest matches commerce/spec/releases.json", () => {
  const fromSpec = JSON.parse(readFileSync(join(commerce, "spec", "releases.json"), "utf8"));
  assert.deepEqual(JSON.parse(JSON.stringify(RELEASE_MANIFEST)), fromSpec, "bundle is stale — run npm run build");
  assert.equal(CURRENT_RELEASE, fromSpec.releases[fromSpec.releases.length - 1].release);
  assert.equal(sheetSpecVersionFor("9.9.9", "product"), undefined);
});

test("the editable heads equal the latest frozen schemas while nothing is unreleased", () => {
  // commerce/spec/{product,organization}.json are the heads: their $id
  // names the version they will next be released as. When that version
  // is already frozen, the head must be that file, byte for byte.
  for (const type of ["product", "organization"]) {
    const headText = readFileSync(join(commerce, "spec", `${type}.json`), "utf8");
    const file = JSON.parse(headText).$id.replace(/^.*\//, "");
    let frozenText;
    try {
      frozenText = readFileSync(join(schemasDir, type, file), "utf8");
    } catch {
      continue; // the head names an unreleased version: nothing to compare
    }
    assert.equal(headText, frozenText, `commerce/spec/${type}.json differs from frozen ${type}/${file}: a changed head must name a new version in its $id`);
  }
});
