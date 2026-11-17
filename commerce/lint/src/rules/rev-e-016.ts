import type { Rule } from "@pagefront/lint-core";
import { RELEASE_SCHEMA_MISMATCH, releaseSchemaMismatch } from "./release-schema.js";

/**
 * REV-E-016 — Release / schema mismatch.
 * The review-sheet counterpart of PDP-E-002, ORG-E-003 and COL-E-003.
 * Transcribed from commerce/spec/rules.md (normative); the check is
 * shared (release-schema.ts).
 *
 * The Review Sheet spec has no legacy draft line, so the rule does not
 * run on legacy sheets.
 */
export const revE016: Rule = {
  id: "REV-E-016",
  ...RELEASE_SCHEMA_MISMATCH,
  check: releaseSchemaMismatch("review"),
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#the-envelope",
};
