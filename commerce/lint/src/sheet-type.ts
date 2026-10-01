import type { Sheet } from "@pagefront/lint-core";

/**
 * Sheet-type detection for page-type dispatch: organization sheets are
 * a different page type from product sheets, and each page type's
 * rules must never run on the other's sheets.
 *
 * The envelope `$schema` is authoritative when it names a page type:
 * `/spec/commerce/organization/` or `/spec/commerce/product/` in its
 * path, or the `/schemas/organization/` and `/schemas/product/` paths
 * the schemas were identified by before 2026-09-08. The
 * data-block fallback — `@type` of `Organization` / `OnlineStore` /
 * `OnlineBusiness` with `pagefront:commerceRole` present — applies
 * only when `$schema` is absent or names neither, so a declared schema
 * always wins over shape heuristics. The default is `product`, the
 * page type the catalogue predates dispatch with.
 */
export type SheetType = "product" | "organization";

/**
 * The two lines a sheet can belong to. A sheet on the *release* line
 * carries `release` and validates against the current sheet-spec
 * schemas; a sheet on the *legacy* draft line carries `format_version`
 * (≤ 0.9) and validates against the frozen legacy schemas.
 */
export type SheetLine = "release" | "legacy";

/** The legacy line's `$schema` version segment: two parts, `v0.9.json`. */
const LEGACY_SCHEMA_SEGMENT = /\/v\d+\.\d+\.json$/;

/**
 * Line detection reads the envelope field first: `release` puts a sheet
 * on the release line (also when `format_version` is present beside it,
 * which the release-line schemas and PDP-E-016 / ORG-E-002 reject), and
 * `format_version` alone puts it on the legacy line. A sheet carrying
 * neither is placed by its `$schema`: a two-part version segment, or
 * the pre-2026-09-08 `/schemas/` path, is legacy; anything else is the
 * release line, whose schema then reports the missing `release`.
 */
export function detectSheetLine(sheet: Sheet): SheetLine {
  if (sheet.release !== undefined) return "release";
  if (sheet.format_version !== undefined) return "legacy";
  const schema = sheet.$schema;
  if (typeof schema === "string") {
    if (LEGACY_SCHEMA_SEGMENT.test(schema)) return "legacy";
    if (schema.includes("/schemas/organization/") || schema.includes("/schemas/product/")) return "legacy";
  }
  return "release";
}

const ORG_DATA_TYPES = new Set(["Organization", "OnlineStore", "OnlineBusiness"]);

export function detectSheetType(sheet: Sheet): SheetType {
  const schema = sheet.$schema;
  if (typeof schema === "string") {
    if (schema.includes("/spec/commerce/organization/")) return "organization";
    if (schema.includes("/spec/commerce/product/")) return "product";
    if (schema.includes("/schemas/organization/")) return "organization";
    if (schema.includes("/schemas/product/")) return "product";
  }
  const data = sheet.data;
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const d = data as Record<string, unknown>;
    if (
      typeof d["@type"] === "string" &&
      ORG_DATA_TYPES.has(d["@type"]) &&
      d["pagefront:commerceRole"] !== undefined
    ) {
      return "organization";
    }
  }
  return "product";
}
