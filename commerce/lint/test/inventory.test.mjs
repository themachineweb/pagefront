import test from "node:test";
import assert from "node:assert/strict";
import { DATA_BLOCK_PROPERTIES } from "../dist/generated/schema-properties.js";
import { SCHEMAS } from "../dist/generated/schemas.js";
import { CURRENT_RELEASE, schemaUrlFor, sheetSpecVersionFor } from "../dist/releases.js";

test("PDP-I-001 property inventory is the dataBlock of the current release's Product Sheet schema", () => {
  const schema = SCHEMAS[schemaUrlFor("product", sheetSpecVersionFor(CURRENT_RELEASE, "product"))];
  assert.deepEqual([...DATA_BLOCK_PROPERTIES], Object.keys(schema.$defs.dataBlock.properties).sort());
});
