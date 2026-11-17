import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, memberEntries, ratingNumber, reviewId } from "./rev-shared.js";

/**
 * REV-E-015 — Rating above 5 without its scale.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `bestRating` and `worstRating` are required when the scale is not 1
 * to 5; a `ratingValue` above 5 shows another scale is in use, and
 * without its bounds a consumer cannot normalise it. The schema requires
 * both on such a value; this rule reports the condition for callers that
 * lint without validating. One finding per entry, at its `reviewRating`.
 */
const present = (value: unknown) => value !== undefined && value !== null;

export const revE015: Rule = {
  id: "REV-E-015",
  title: "Rating above 5 without its scale",
  severity: "error",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      const rating = asRecord(entry["reviewRating"]);
      if (rating === null) continue;
      const value = ratingNumber(rating["ratingValue"]);
      if (value === null || value <= 5) continue;
      const best = present(rating["bestRating"]);
      const worst = present(rating["worstRating"]);
      if (best && worst) continue;
      const missing = !best && !worst ? "bestRating` or `worstRating" : !best ? "bestRating" : "worstRating";
      hits.push({ path: `${path}['reviewRating']`, values: { id: reviewId(entry), value, missing } });
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` rates `{value}` with no `{missing}`; a scale other than 1 to 5 declares its bounds.",
  remediation: "Add `bestRating` and `worstRating` to `reviewRating` wherever the scale is not 1 to 5.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#schemaorg-native",
};
