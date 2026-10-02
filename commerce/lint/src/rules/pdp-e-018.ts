import type { Rule } from "@pagefront/lint-core";
import { UNKNOWN_RELEASE, unknownRelease } from "./release-schema.js";

/**
 * PDP-E-018 — Unknown release.
 * Transcribed from commerce/spec/rules.md (normative); the check is
 * shared between the two catalogues (release-schema.ts).
 *
 * `appliesFrom` is "0.0.0": the rule judges the declared release
 * itself, so it cannot be gated by it. It never fires on a sheet of a
 * published release.
 */
export const pdpE018: Rule = {
  id: "PDP-E-018",
  ...UNKNOWN_RELEASE,
  check: unknownRelease,
  introduced: "release 0.4.0",
  appliesFrom: "0.0.0",
  specReference: "product.md#the-envelope",
};
