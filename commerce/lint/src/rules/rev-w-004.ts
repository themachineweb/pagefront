import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, memberEntries, ratingNumber, reviewId } from "./rev-shared.js";

/**
 * REV-W-004 — Rating above 5 without its scale.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `bestRating` and `worstRating` are required when the scale is not 1 to
 * 5; a `ratingValue` above 5 shows another scale is in use, and without
 * `bestRating` a consumer cannot normalise it. One finding per entry, at
 * its `reviewRating`.
 */
export const revW004: Rule = {
  id: "REV-W-004",
  title: "Rating above 5 without its scale",
  severity: "warning",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      const rating = asRecord(entry["reviewRating"]);
      if (rating === null) continue;
      const value = ratingNumber(rating["ratingValue"]);
      if (value === null || value <= 5) continue;
      if (rating["bestRating"] !== undefined && rating["bestRating"] !== null) continue;
      hits.push({ path: `${path}['reviewRating']`, values: { id: reviewId(entry), value } });
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` rates `{value}` with no `bestRating`; a scale other than 1 to 5 declares its bounds.",
  remediation: "Add `bestRating` and `worstRating` to `reviewRating` wherever the scale is not 1 to 5.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#schemaorg-native",
};
