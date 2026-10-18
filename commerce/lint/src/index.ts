/**
 * @pagefront/lint-commerce — public surface.
 *
 * Everything a consumer may rely on is exported here, and nothing
 * else: `lintSheet` (Layer 2 only, for already-validated Sheets),
 * `validateAndLint` (Layer 1 → Layer 2, the CLI's own pipeline),
 * `validateOrganizationSheet` (Layer 1 for the Commerce Organization
 * Sheet alone), the three page-type catalogue objects, and the types
 * those signatures mention.
 * The bundled schemas (`generated/`), the compiled validators and the
 * individual rule modules are internal. The release manifest
 * (`RELEASE_MANIFEST`, `sheetSpecVersionFor`, `schemaUrlFor`) and the
 * list of bundled schema ids (`BUNDLED_SCHEMA_IDS`) are exported so
 * callers can resolve a release to its sheet-spec versions and tell
 * which `$schema` values this package validates.
 */
export { lintSheet } from "./lint-sheet.js";
export { validateAndLint } from "./validate-and-lint.js";
export type { SchemaError, ValidateAndLintResult } from "./validate-and-lint.js";
export { validateOrganizationSheet } from "./validate-organization.js";
export type { ValidateOrganizationResult } from "./validate-organization.js";
export { commerceCatalogue } from "./catalogue.js";
export { organizationCatalogue } from "./organization-catalogue.js";
export { collectionCatalogue } from "./collection-catalogue.js";
export { detectSheetType, detectSheetLine } from "./sheet-type.js";
export type { SheetType, SheetLine } from "./sheet-type.js";
export {
  RELEASE_MANIFEST,
  KNOWN_RELEASES,
  CURRENT_RELEASE,
  sheetSpecVersionFor,
  schemaUrlFor,
} from "./releases.js";
export { SCHEMA_IDS as BUNDLED_SCHEMA_IDS } from "./generated/schema-ids.js";
export type {
  Report,
  Finding,
  Summary,
  Severity,
  LintOptions,
  Sheet,
} from "@pagefront/lint-core";
