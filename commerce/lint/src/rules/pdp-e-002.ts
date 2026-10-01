import type { Rule } from "@pagefront/lint-core";
import { RELEASE_SCHEMA_MISMATCH, releaseSchemaMismatch } from "./release-schema.js";

/**
 * PDP-E-002 — Release / schema mismatch (until release 0.3.0: "Format
 * version / schema mismatch"). Transcribed from commerce/spec/rules.md
 * (normative); the check is shared with ORG-E-003 (release-schema.ts).
 */
export const pdpE002: Rule = {
  id: "PDP-E-002",
  ...RELEASE_SCHEMA_MISMATCH,
  check: releaseSchemaMismatch("product"),
  introduced: "v0.6",
  specReference: "product.md#the-envelope",
};
