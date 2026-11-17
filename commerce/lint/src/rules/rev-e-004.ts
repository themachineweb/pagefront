import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, memberEntries, reviewId } from "./rev-shared.js";

/**
 * REV-E-004 — Review entry without a rating.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `reviewRating` is a `Rating` with `ratingValue`, required on every
 * entry: a review with no rating is not carried, a rating with no text
 * is. One finding per entry, at the entry's path.
 */
export const revE004: Rule = {
  id: "REV-E-004",
  title: "Review entry without a rating",
  severity: "error",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      const rating = asRecord(entry["reviewRating"]);
      if (rating === null) {
        hits.push({ path, values: { id: reviewId(entry), problem: "carries no `reviewRating`" } });
      } else if (rating["ratingValue"] === undefined || rating["ratingValue"] === null) {
        hits.push({ path, values: { id: reviewId(entry), problem: "carries a `reviewRating` without `ratingValue`" } });
      }
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` {problem}.",
  remediation:
    "Carry `reviewRating` as a `Rating` with `ratingValue` on every review, with `bestRating` and `worstRating` where the scale is not 1 to 5. A review with no rating is left out of the sheet.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#schemaorg-native",
};
