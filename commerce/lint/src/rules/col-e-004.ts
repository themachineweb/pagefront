import type { Rule } from "@pagefront/lint-core";
import { UNKNOWN_RELEASE, unknownRelease } from "./release-schema.js";

/**
 * COL-E-004 — Unknown release.
 * The collection-sheet counterpart of PDP-E-018 and ORG-E-004.
 * Transcribed from commerce/spec/rules.md (normative); the check is
 * shared (release-schema.ts).
 *
 * `appliesFrom` is "0.0.0": the rule judges the declared release
 * itself, so it cannot be gated by it. It never fires on a sheet of a
 * published release.
 */
export const colE004: Rule = {
  id: "COL-E-004",
  ...UNKNOWN_RELEASE,
  check: unknownRelease,
  introduced: "release 0.5.0",
  appliesFrom: "0.0.0",
  specReference: "collection.md#the-envelope",
};
