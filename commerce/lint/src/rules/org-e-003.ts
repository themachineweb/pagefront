import type { Rule } from "@pagefront/lint-core";
import { RELEASE_SCHEMA_MISMATCH, releaseSchemaMismatch } from "./release-schema.js";

/**
 * ORG-E-003 — Release / schema mismatch.
 * The organization-sheet counterpart of PDP-E-002. Transcribed from
 * commerce/spec/rules.md (normative).
 */
export const orgE003: Rule = {
  id: "ORG-E-003",
  ...RELEASE_SCHEMA_MISMATCH,
  check: releaseSchemaMismatch("organization"),
  introduced: "release 0.3.0",
  specReference: "organization.md#the-envelope",
};
