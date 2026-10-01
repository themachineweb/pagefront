import type { Sheet } from "@pagefront/lint-core";
import { SCHEMA_IDS } from "./generated/schema-ids.js";
import {
  CURRENT_RELEASE,
  legacySchemaUrl,
  schemaUrlFor,
  sheetSpecVersionFor,
} from "./releases.js";
import { detectSheetLine, detectSheetType } from "./sheet-type.js";
import type { SheetType } from "./sheet-type.js";

/**
 * Which frozen schema a sheet is validated against. The package bundles
 * every schema ever published (commerce/schemas/), keyed by `$id`, and a
 * sheet is validated against the one its `$schema` names, on either
 * line. Nothing is substituted: a `$schema` that names no bundled schema
 * is reported as such, and the sheet is not validated against a
 * neighbouring version.
 */
export type SchemaResolution =
  | { kind: "schema"; id: string }
  /** `$schema` is a string that names no schema this package bundles. */
  | { kind: "unknown"; declared: string };

/**
 * The identifiers the legacy schemas carried before 2026-09-08
 * (`…/pagefront/commerce/schemas/<type>/v0.9.json`); sheets declaring
 * them validate against the legacy schema they became.
 */
const FORMER_LEGACY_ID = /^https:\/\/themachineweb\.org\/pagefront\/commerce\/schemas\/(product|organization)\/v0\.9\.json$/;

/**
 * Resolve the schema for a document. A declared `$schema` is taken at
 * its word. Without one, the schema is the one the sheet's own
 * statements lead to: the legacy schema for a sheet on the legacy line,
 * and for a sheet on the release line the sheet-spec version its
 * `release` bundles (the current release's when the release is not in
 * the manifest). `sheetType` forces the type for callers that validate
 * one type only.
 */
export function resolveSchema(sheet: Sheet, sheetType?: SheetType): SchemaResolution {
  const declared = sheet.$schema;
  if (typeof declared === "string") {
    if (SCHEMA_IDS.includes(declared)) return { kind: "schema", id: declared };
    const former = FORMER_LEGACY_ID.exec(declared);
    if (former !== null) return { kind: "schema", id: legacySchemaUrl(former[1] as SheetType) };
    return { kind: "unknown", declared };
  }
  const type = sheetType ?? detectSheetType(sheet);
  if (detectSheetLine(sheet) === "legacy") return { kind: "schema", id: legacySchemaUrl(type) };
  const release = typeof sheet.release === "string" ? sheet.release : CURRENT_RELEASE;
  const version =
    sheetSpecVersionFor(release, type) ?? (sheetSpecVersionFor(CURRENT_RELEASE, type) as string);
  return { kind: "schema", id: schemaUrlFor(type, version) };
}
