import type { Rule } from "@pagefront/lint-core";
import { BOTH_VERSION_FIELDS, bothVersionFields } from "./release-schema.js";

/**
 * ORG-E-002 — Sheet carries both format_version and release.
 * The organization-sheet counterpart of PDP-E-016. Transcribed from
 * commerce/spec/rules.md (normative).
 */
export const orgE002: Rule = {
  id: "ORG-E-002",
  ...BOTH_VERSION_FIELDS,
  check: bothVersionFields,
  introduced: "release 0.3.0",
  specReference: "organization.md#the-envelope",
};
