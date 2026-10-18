/**
 * The validator page's core logic, factored out of the DOM so it can
 * be unit-tested: parse → declared-version pre-check → validateAndLint
 * → a render model the page turns into elements. Everything here is
 * pure except loadFromUrl's fetch (the visitor's browser fetches the
 * sheet — the standard's infrastructure never dereferences anyone's
 * URL).
 */
import { validateAndLint, KNOWN_RELEASES, RELEASE_MANIFEST } from "@pagefront/lint-commerce";
import type { Report, SchemaError } from "@pagefront/lint-commerce";

/**
 * The page types this validator covers, on both lines. Everything
 * below derives from the linter's release manifest, the one its own
 * Layer 1 resolution uses; no version and no type name is written here
 * by hand.
 *
 * - Page types: the sheet types the current release bundles a schema
 *   for. A sheet of a type the specs define and no release bundles yet
 *   (a type a later release adds) is reported as such;
 *   it is never judged as a product sheet.
 * - Release line: a sheet is judged by the release it declares, so the
 *   scope question is whether that release is one the linter knows. The
 *   linter then validates against the schema the release bundles for
 *   the sheet's type, and reports a `$schema` that disagrees (PDP-E-002,
 *   ORG-E-003).
 * - Legacy line: the legacy format, and each type's legacy schema or the
 *   identifier it carried before 2026-09-08.
 */
const CURRENT = RELEASE_MANIFEST.releases[RELEASE_MANIFEST.releases.length - 1];
const SUPPORTED_TYPES: readonly string[] = Object.keys(CURRENT.sheets);
const LEGACY_SCHEMAS: readonly string[] = SUPPORTED_TYPES
  .filter((type) => type in RELEASE_MANIFEST.legacy.schemas)
  .flatMap((type) => [
    RELEASE_MANIFEST.legacy.schemas[type as keyof typeof RELEASE_MANIFEST.legacy.schemas],
    `https://themachineweb.org/pagefront/commerce/schemas/${type}/v0.9.json`,
  ]);
const LEGACY_FORMATS: readonly string[] = RELEASE_MANIFEST.legacy.format_versions;
/** The page type a `$schema` under the Pagefront commerce paths names. */
const PAGE_TYPE_IN_SCHEMA = /\/pagefront\/(?:spec\/commerce|commerce\/schemas)\/([a-z]+)\//;

/** The commerce sheet types the specs define; the pinned linter may bundle fewer. */
export type DeclaredType = "product" | "organization" | "collection";
export const SHEET_LABEL: Record<DeclaredType, string> = {
  product: "Product sheet",
  organization: "Organization sheet",
  collection: "Collection sheet",
};

/**
 * The sheet's type, read from the document: the `$schema` URL first,
 * then the data block's `@type` together with the role or kind
 * discriminator the type carries. Undefined when neither resolves;
 * nothing defaults to product.
 */
export function detectDeclaredType(sheet: unknown): DeclaredType | undefined {
  if (typeof sheet !== "object" || sheet === null || Array.isArray(sheet)) return undefined;
  const envelope = sheet as Record<string, unknown>;
  const declared = envelope["$schema"];
  if (typeof declared === "string") {
    const named = PAGE_TYPE_IN_SCHEMA.exec(declared)?.[1];
    if (named === "product" || named === "organization" || named === "collection") return named;
  }
  const data = envelope["data"];
  if (typeof data !== "object" || data === null) return undefined;
  const block = data as Record<string, unknown>;
  const type = block["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.includes("Product") || types.includes("ProductGroup")) return "product";
  if ((types.includes("Organization") || types.includes("OnlineStore") || types.includes("OnlineBusiness")) && block["pagefront:commerceRole"] !== undefined) {
    return "organization";
  }
  if (types.includes("Collection") && block["pagefront:collectionKind"] !== undefined) return "collection";
  return undefined;
}

export type RenderModel =
  /** Paste input that isn't JSON. */
  | { kind: "invalid-json"; message: string }
  /** A URL that yields no sheet: HTTP error, or a non-JSON body. */
  | { kind: "no-sheet"; detail: string }
  /** The fetch itself failed (network, and most commonly CORS). */
  | { kind: "fetch-error"; detail: string }
  /** The sheet declares a format/schema this validator doesn't cover. */
  | { kind: "scope-error"; declared: string }
  /** Neither `$schema` nor the data block says which sheet type this is. */
  | { kind: "unknown-type" }
  /** A sheet type the specs define and the pinned linter has no schema for yet. */
  | { kind: "unsupported-type"; sheet_type: DeclaredType }
  /** Layer 1 (JSON Schema) failed — structural errors, no findings. */
  | { kind: "layer1"; sheet_type: DeclaredType; schemaErrors: SchemaError[] }
  /** Layer 2 ran — the canonical report. */
  | { kind: "report"; sheet_type: DeclaredType; report: Report };

/**
 * Build the render model from raw sheet text. `source` decides how a
 * JSON parse failure reads: pasted text that isn't JSON is the
 * visitor's typo; a URL body that isn't JSON means there is no sheet
 * at that URL.
 */
export function buildResult(
  text: string,
  source: "url" | "paste"
): RenderModel {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return source === "paste"
      ? { kind: "invalid-json", message: (error as Error).message }
      : { kind: "no-sheet", detail: "the response is not JSON" };
  }

  // Type first: the document says what it is, or the check stops here.
  // The linter would otherwise fall back to the product schema and
  // produce a wall of misleading structural errors.
  const sheet_type = detectDeclaredType(parsed);
  if (sheet_type === undefined) return { kind: "unknown-type" };
  if (!SUPPORTED_TYPES.includes(sheet_type)) return { kind: "unsupported-type", sheet_type };

  // Declared-version pre-check (page-side by design, not library): a
  // sheet declaring a release or a legacy format this validator does
  // not cover is out of scope.
  if (typeof parsed === "object" && parsed !== null) {
    const envelope = parsed as Record<string, unknown>;
    const declaredSchema = envelope["$schema"];
    const declaredRelease = envelope["release"];
    const declaredFormat = envelope["format_version"];
    if (typeof declaredRelease === "string") {
      if (!KNOWN_RELEASES.includes(declaredRelease)) {
        return { kind: "scope-error", declared: `release ${declaredRelease}` };
      }
    } else if (declaredRelease === undefined && typeof declaredFormat === "string") {
      if (!LEGACY_FORMATS.includes(declaredFormat)) {
        return { kind: "scope-error", declared: `format_version ${declaredFormat}` };
      }
      if (typeof declaredSchema === "string" && !LEGACY_SCHEMAS.includes(declaredSchema)) {
        return { kind: "scope-error", declared: declaredSchema };
      }
    }
  }

  // The linter's own dispatch reads the same signals in the same order,
  // so the schema and catalogue it picks agree with sheet_type.
  const result = validateAndLint(parsed);
  return result.layer === 1
    ? { kind: "layer1", sheet_type, schemaErrors: result.schemaErrors }
    : { kind: "report", sheet_type, report: result.report };
}

/**
 * Fetch a sheet URL from the visitor's browser and build the render
 * model. The Check page sends URLs to the server endpoint instead,
 * because a page's Link header is not readable cross-origin; this
 * stays for callers that hold a CORS-open sheet URL.
 */
export async function loadFromUrl(url: string): Promise<RenderModel> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { accept: "application/pagefront+json, application/json;q=0.9" } });
  } catch (error) {
    return { kind: "fetch-error", detail: (error as Error).message };
  }
  if (!response.ok) {
    return { kind: "no-sheet", detail: `HTTP ${response.status}` };
  }
  return buildResult(await response.text(), "url");
}
