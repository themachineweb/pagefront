/**
 * The Layer 1 → Layer 2 sequencing as a library function — the same
 * pipeline the CLI runs, importable by CI scripts and production
 * validation layers. Ajv is an implementation detail behind this
 * boundary: callers see `SchemaError`, never Ajv's own error type.
 */
import type { LintOptions, Report, Sheet } from "@pagefront/lint-core";
import { lintSheet } from "./lint-sheet.js";
import { resolveSchema } from "./schema-registry.js";
import type { SheetType } from "./sheet-type.js";
import { VALIDATORS } from "./schema-validators.js";

/**
 * One Layer 1 (JSON Schema) validation failure, in a shape this
 * package owns. `instancePath` is a JSON Pointer to the offending
 * location (`""` for the document root); `keyword` is the schema
 * keyword that failed (e.g. `"required"`, `"format"`).
 */
export interface SchemaError {
  instancePath: string;
  message: string;
  keyword: string;
}

export type ValidateAndLintResult =
  | { layer: 1; schemaErrors: SchemaError[] }
  | { layer: 2; report: Report };

// The validators are compiled ahead of time (see schema-validators.d.ts):
// nothing here generates code at load time, so the pipeline runs where
// eval is unavailable, and consumers calling it in a loop pay no
// compilation cost.

/**
 * Layer 1 for one document: validate it against the frozen schema its
 * `$schema` names, or, when it declares none, the schema its own
 * statements lead to (see schema-registry.ts). Returns the errors, empty
 * when the document is valid. A `$schema` naming no bundled schema is a
 * Layer 1 failure of its own, reported at `/$schema` with the keyword
 * `$schema`: the document is not validated against some other version.
 */
export function schemaErrorsFor(input: unknown, sheetType?: SheetType): SchemaError[] {
  const envelope = (typeof input === "object" && input !== null ? input : {}) as Sheet;
  const resolution = resolveSchema(envelope, sheetType);
  if (resolution.kind === "unknown") {
    return [
      {
        instancePath: "/$schema",
        message: `names no schema this linter bundles: ${resolution.declared}`,
        keyword: "$schema",
      },
    ];
  }
  const validate = VALIDATORS[resolution.id];
  if (validate(input)) return [];
  return (validate.errors ?? []).map((error) => ({
    instancePath: error.instancePath,
    message: error.message ?? "invalid",
    keyword: error.keyword,
  }));
}

/**
 * Validate a parsed-but-unvalidated document against a bundled JSON
 * Schema (Layer 1), and — only if it passes — lint it against the
 * commerce rule catalogue (Layer 2). The engine assumes a schema-valid
 * Sheet, so a failing document never reaches the catalogue; Layer 1
 * success is also what makes the internal cast to `Sheet` sound (the
 * schema requires the envelope fields).
 *
 * The package bundles every schema ever published, on both lines: the
 * sheet-spec versions of each release, and the legacy draft line's
 * format 0.9 schemas. A document is validated against the one its
 * `$schema` names. A `$schema` naming a version this package does not
 * bundle fails Layer 1 with a single error saying so.
 *
 * Layer 2 dispatches by page type (see sheet-type.ts): product sheets
 * lint with the product catalogue, Commerce Organization Sheets with
 * the organization catalogue.
 */
export function validateAndLint(
  input: unknown,
  options?: LintOptions
): ValidateAndLintResult {
  const schemaErrors = schemaErrorsFor(input);
  if (schemaErrors.length > 0) return { layer: 1, schemaErrors };
  return { layer: 2, report: lintSheet(input as Sheet, options) };
}
