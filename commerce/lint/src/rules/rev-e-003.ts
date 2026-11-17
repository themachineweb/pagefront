import type { CheckHit, Rule } from "@pagefront/lint-core";
import { memberEntries, nonBlank } from "./rev-shared.js";

/**
 * REV-E-003 — Review entry without `@id`.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `@id` is the identity a consumer deduplicates a review on, across
 * fetches, across language sheets and against the source platform. One
 * finding per entry, at the entry's path.
 */
export const revE003: Rule = {
  id: "REV-E-003",
  title: "Review entry without @id",
  severity: "error",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      if (nonBlank(entry["@id"])) continue;
      hits.push({ path, values: {} });
    }
    return hits;
  },
  messageTemplate: "Review at `{path}` carries no `@id`.",
  remediation:
    "Give every review a stable `@id`, the same across fetches and language sheets; a syndicated review derives it from the platform's own identifier.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#schemaorg-native",
};
