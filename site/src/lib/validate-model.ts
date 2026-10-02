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
 * The one page type this validator covers, on both lines. Everything
 * below derives from the linter's release manifest, the one its own
 * Layer 1 resolution uses; no version is written here by hand.
 *
 * - Release line: a sheet is judged by the release it declares, so the
 *   scope question is whether that release is one the linter knows. The
 *   linter then validates against the schema the release bundles, and
 *   reports a `$schema` that disagrees (PDP-E-002).
 * - Legacy line: the legacy format, and the legacy product schema or the
 *   identifier it carried before 2026-09-08.
 */
const LEGACY_PRODUCT_SCHEMAS: readonly string[] = [
  RELEASE_MANIFEST.legacy.schemas.product,
  "https://themachineweb.org/pagefront/commerce/schemas/product/v0.9.json",
];
const LEGACY_FORMATS: readonly string[] = RELEASE_MANIFEST.legacy.format_versions;
/** A `$schema` that names another page type's schema: out of scope here. */
const OTHER_PAGE_TYPE = /\/pagefront\/(spec\/commerce|commerce\/schemas)\/(?!product\/)[a-z]+\//;

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
  // schema and produce a wall of misleading structural errors.
  if (typeof parsed === "object" && parsed !== null) {
    const envelope = parsed as Record<string, unknown>;
    const declaredSchema = envelope["$schema"];
    const declaredRelease = envelope["release"];
    const declaredFormat = envelope["format_version"];
    if (typeof declaredSchema === "string" && OTHER_PAGE_TYPE.test(declaredSchema)) {
      return { kind: "scope-error", declared: declaredSchema };
    }
    if (typeof declaredRelease === "string") {
      if (!KNOWN_RELEASES.includes(declaredRelease)) {
        return { kind: "scope-error", declared: `release ${declaredRelease}` };
      }
    } else if (declaredRelease === undefined && typeof declaredFormat === "string") {
      if (!LEGACY_FORMATS.includes(declaredFormat)) {
        return { kind: "scope-error", declared: `format_version ${declaredFormat}` };
      }
      if (typeof declaredSchema === "string" && !LEGACY_PRODUCT_SCHEMAS.includes(declaredSchema)) {
        return { kind: "scope-error", declared: declaredSchema };
      }
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
