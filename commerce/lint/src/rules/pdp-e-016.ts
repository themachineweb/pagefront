import type { Rule } from "@pagefront/lint-core";
import { BOTH_VERSION_FIELDS, bothVersionFields } from "./release-schema.js";

/**
 * PDP-E-016 — Sheet carries both format_version and release.
 * Transcribed from commerce/spec/rules.md (normative); the check is
 * shared with ORG-E-002 (release-schema.ts).
 */
export const pdpE016: Rule = {
  id: "PDP-E-016",
  ...BOTH_VERSION_FIELDS,
  check: bothVersionFields,
  introduced: "release 0.3.0",
  specReference: "product.md#the-envelope",
};
