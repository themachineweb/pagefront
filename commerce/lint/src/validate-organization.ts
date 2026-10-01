/**
 * Layer 1 validation for the Commerce Organization Sheet — the
 * organization analogue of validateAndLint's first stage. There is
 * deliberately no Layer 2 here: the commerce rule catalogue is
 * product-scoped, and an organization catalogue does not exist yet
 * (dispatching per-page-type schemas and catalogues is tracked as
 * "Rule namespaces" in core/spec/linter.md), so a schema-valid
 * document simply passes.
 *
 * As with the product pipeline, Ajv is an implementation detail:
 * callers see `SchemaError`, never Ajv's own error type.
 */
import type { SchemaError } from "./validate-and-lint.js";
import { schemaErrorsFor } from "./validate-and-lint.js";

export type ValidateOrganizationResult =
  | { valid: true }
  | { valid: false; schemaErrors: SchemaError[] };

/**
 * Validate a parsed-but-unvalidated document against a bundled
 * Commerce Organization Sheet JSON Schema: the one its `$schema` names,
 * or, when it declares none, the organization schema for its line (the
 * sheet-spec version its `release` bundles, or the legacy format 0.9
 * schema for a sheet carrying `format_version`).
 */
export function validateOrganizationSheet(
  input: unknown
): ValidateOrganizationResult {
  const schemaErrors = schemaErrorsFor(input, "organization");
  return schemaErrors.length > 0 ? { valid: false, schemaErrors } : { valid: true };
}
