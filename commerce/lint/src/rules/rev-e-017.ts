import type { Rule } from "@pagefront/lint-core";
import { UNKNOWN_RELEASE, unknownRelease } from "./release-schema.js";

/**
 * REV-E-017 — Unknown release.
 * The review-sheet counterpart of PDP-E-018, ORG-E-004 and COL-E-004.
 * Transcribed from commerce/spec/rules.md (normative); the check is
 * shared (release-schema.ts).
 *
 * `appliesFrom` is "0.0.0": the rule judges the declared release
 * itself, so it cannot be gated by it. It never fires on a sheet of a
 * published release.
 */
export const revE017: Rule = {
  id: "REV-E-017",
  ...UNKNOWN_RELEASE,
  check: unknownRelease,
  introduced: "release 0.6.0",
  appliesFrom: "0.0.0",
  specReference: "review.md#the-envelope",
};
