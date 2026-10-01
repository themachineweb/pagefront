/**
 * The Layer 1 validators, compiled ahead of time from every bundled
 * schema (commerce/schemas/) by scripts/compile-validators.mjs into
 * dist/schema-validators.js (the last step of `npm run build`). This
 * declaration is the module's type; the script copies it beside the
 * generated file.
 */
import type { ValidateFunction } from "ajv";

/** One validator per bundled schema, keyed by the schema's `$id`. */
export const VALIDATORS: Readonly<Record<string, ValidateFunction>>;
