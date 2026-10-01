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
 * The one page type this validator covers, on both lines. The schemas
 * in scope are derived from the linter's release manifest, the same one
 * its Layer 1 dispatch uses: the Product Sheet schema of every release
 * it lists, the legacy draft line's schema, and the identifier that
 * schema carried before 2026-09-08. No version is written here by hand.
 */
const PRODUCT_SCHEMAS: readonly string[] = [
  ...RELEASE_MANIFEST.releases.map((r) =>
    RELEASE_MANIFEST.schema_url_template.replace("{sheet}", "product").replace("{version}", r.sheets.product)
  ),
  RELEASE_MANIFEST.legacy.schemas.product,
  "https://themachineweb.org/pagefront/commerce/schemas/product/v0.9.json",
];
const LEGACY_FORMATS: readonly string[] = RELEASE_MANIFEST.legacy.format_versions;

export type RenderModel =
  /** Paste input that isn't JSON. */
  | { kind: "invalid-json"; message: string }
  /** A URL that yields no sheet: HTTP error, or a non-JSON body. */
  | { kind: "no-sheet"; detail: string }
  /** The fetch itself failed (network, and most commonly CORS). */
  | { kind: "fetch-error"; detail: string }
  /** The sheet declares a format/schema this validator doesn't cover. */
  | { kind: "scope-error"; declared: string }
  /** Layer 1 (JSON Schema) failed — structural errors, no findings. */
  | { kind: "layer1"; schemaErrors: SchemaError[] }
  /** Layer 2 ran — the canonical report. */
  | { kind: "report"; report: Report };

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

  // Declared-version pre-check (page-side by design, not library): a
  // sheet for another page type, or one declaring a release or a legacy
  // format this validator does not cover, would otherwise hit a product
  // schema and produce a wall of misleading structural errors. The
  // dispatch is on `$schema`: the product schemas of both lines are in
  // scope, and the library validates against the one the sheet names.
  if (typeof parsed === "object" && parsed !== null) {
    const envelope = parsed as Record<string, unknown>;
    const declaredSchema = envelope["$schema"];
    if (typeof declaredSchema === "string" && !PRODUCT_SCHEMAS.includes(declaredSchema)) {
      return { kind: "scope-error", declared: declaredSchema };
    }
    const declaredRelease = envelope["release"];
    if (typeof declaredRelease === "string" && !KNOWN_RELEASES.includes(declaredRelease)) {
      return { kind: "scope-error", declared: `release ${declaredRelease}` };
    }
    const declaredFormat = envelope["format_version"];
    if (
      declaredRelease === undefined &&
      typeof declaredFormat === "string" &&
      !LEGACY_FORMATS.includes(declaredFormat)
    ) {
      return { kind: "scope-error", declared: `format_version ${declaredFormat}` };
    }
  }

  const result = validateAndLint(parsed);
  return result.layer === 1
    ? { kind: "layer1", schemaErrors: result.schemaErrors }
    : { kind: "report", report: result.report };
}

/**
 * Fetch a sheet URL from the visitor's browser and build the render
 * model. No proxy fallback exists or ever will: if the publisher's
 * server doesn't send CORS headers, the honest answer is the
 * fetch-error explainer plus the paste fallback.
 */
export async function loadFromUrl(url: string): Promise<RenderModel> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { accept: "application/json" } });
  } catch (error) {
    return { kind: "fetch-error", detail: (error as Error).message };
  }
  if (!response.ok) {
    return { kind: "no-sheet", detail: `HTTP ${response.status}` };
  }
  return buildResult(await response.text(), "url");
}
