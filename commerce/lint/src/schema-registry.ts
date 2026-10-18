import type { Sheet } from "@pagefront/lint-core";
import { SCHEMA_IDS } from "./generated/schema-ids.js";
import { overrides } from "./overrides.js";
import {
  currentRelease,
  knownReleases,
  legacySchemaUrl,
  schemaUrlFor,
  sheetSpecVersionFor,
} from "./releases.js";
import { detectSheetLine, detectSheetType } from "./sheet-type.js";
import type { SheetType } from "./sheet-type.js";

/**
 * Which frozen schema a sheet is validated against. The package bundles
 * every schema ever published (commerce/schemas/), keyed by `$id`. A
 * sheet is judged by the release it declares: on the release line the
 * schema is the one the release manifest gives for the declared
 * `release` and the sheet's type, whatever `$schema` says (a `$schema`
 * that disagrees is PDP-E-002's finding, at Layer 2). Legacy sheets,
 * which declare no release, keep resolving through their `$schema`.
 */
export type SchemaResolution =
  | { kind: "schema"; id: string }
  /** `release` names no release in the manifest. */
  | { kind: "unknown-release"; declared: string }
  /**
   * The release bundles no schema for the sheet's type: the type joined
   * the line after that release (`release` is the release tried, the
   * declared one or the current one), or the sheet is on the legacy
   * draft line and the type was never on it (`release` is null).
   */
  | { kind: "unbundled-type"; sheetType: SheetType; release: string | null }
  /** A legacy sheet's `$schema` names no schema this package bundles. */
  | { kind: "unknown-schema"; declared: string };

/**
 * The identifiers the legacy schemas carried before 2026-09-08
 * (`…/pagefront/commerce/schemas/<type>/v0.9.json`); sheets declaring
 * them validate against the legacy schema they became.
 */
const FORMER_LEGACY_ID = /^https:\/\/themachineweb\.org\/pagefront\/commerce\/schemas\/(product|organization)\/v0\.9\.json$/;

/**
 * Resolve the schema for a document.
 *
 * - Release line (`release` present): the sheet-spec version the
 *   manifest bundles in that release for the sheet's type. The type
 *   comes from the usual dispatch (`$schema` path, else data-block
 *   shape), so it does not depend on `$schema` being present.
 * - Legacy line (`format_version`, no `release`): the schema `$schema`
 *   names when it is bundled, the legacy schema for the pre-2026-09-08
 *   identifier or when `$schema` is absent.
 * - Neither field: the schema `$schema` names when it is bundled, else
 *   the current release's, whose `required` then reports the missing
 *   `release`.
 *
 * `sheetType` forces the type for callers that validate one type only.
 */
export function resolveSchema(sheet: Sheet, sheetType?: SheetType): SchemaResolution {
  const type = sheetType ?? detectSheetType(sheet);
  const declared = sheet.$schema;

  if (sheet.release !== undefined) {
    // A non-string release is validated against the current schema,
    // whose `release` pattern rejects it.
    if (typeof sheet.release !== "string") return currentSchema(type);
    if (!knownReleases().includes(sheet.release)) return { kind: "unknown-release", declared: sheet.release };
    const version = sheetSpecVersionFor(sheet.release, type);
    if (version === undefined) return { kind: "unbundled-type", sheetType: type, release: sheet.release };
    return { kind: "schema", id: schemaUrlFor(type, version) };
  }

  if (typeof declared === "string") {
    if (SCHEMA_IDS.includes(declared) || overrides().validators?.[declared] !== undefined) {
      return { kind: "schema", id: declared };
    }
    const former = FORMER_LEGACY_ID.exec(declared);
    if (former !== null) return { kind: "schema", id: legacySchemaUrl(former[1] as SheetType) as string };
    if (detectSheetLine(sheet) === "legacy") return { kind: "unknown-schema", declared };
  }
  if (detectSheetLine(sheet) === "legacy") {
    const legacy = legacySchemaUrl(type);
    return legacy === undefined
      ? { kind: "unbundled-type", sheetType: type, release: null }
      : { kind: "schema", id: legacy };
  }
  return currentSchema(type);
}

/** The current release's schema for a type, or unbundled-type when the current release has none. */
function currentSchema(type: SheetType): SchemaResolution {
  const release = currentRelease();
  const version = sheetSpecVersionFor(release, type);
  if (version === undefined) return { kind: "unbundled-type", sheetType: type, release };
  return { kind: "schema", id: schemaUrlFor(type, version) };
}
