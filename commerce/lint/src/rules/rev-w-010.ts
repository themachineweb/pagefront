import type { CheckHit, Rule } from "@pagefront/lint-core";
import { memberEntries, nonBlank, reviewId } from "./rev-shared.js";

/**
 * REV-W-010 — Review text without its language.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `inLanguage` is required on an entry carrying `reviewBody` or `name`:
 * a review is in its author's language, which the sheet's own
 * `inLanguage` does not state ("Language" in review.md). One finding per
 * entry, at its path.
 */
export const revW010: Rule = {
  id: "REV-W-010",
  title: "Review text without its language",
  severity: "warning",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      if (!(nonBlank(entry["reviewBody"]) || nonBlank(entry["name"])) || nonBlank(entry["inLanguage"])) continue;
      hits.push({ path, values: { id: reviewId(entry) } });
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` carries text without `inLanguage`.",
  remediation: "Add `inLanguage` to the entry, the BCP 47 tag of the language the author wrote in.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#language",
};
