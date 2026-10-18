import type { Rule } from "@pagefront/lint-core";
import { RELEASE_SCHEMA_MISMATCH, releaseSchemaMismatch } from "./release-schema.js";

/**
 * COL-E-003 — Release / schema mismatch.
 * The collection-sheet counterpart of PDP-E-002 and ORG-E-003.
 * Transcribed from commerce/spec/rules.md (normative); the check is
 * shared (release-schema.ts).
 *
 * The Collection Sheet spec has no legacy draft line, so the rule does
 * not run on legacy sheets.
 */
export const colE003: Rule = {
  id: "COL-E-003",
  ...RELEASE_SCHEMA_MISMATCH,
  check: releaseSchemaMismatch("collection"),
  introduced: "release 0.5.0",
  appliesFrom: "0.5.0",
  specReference: "collection.md#the-envelope",
};
