import type { CheckHit, Rule } from "@pagefront/lint-core";
import { memberEntries, reviewId } from "./rev-shared.js";

/**
 * REV-W-014 — Unclassified review with aspects.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `unclassified` says no one has read the review for its subject;
 * aspects are a classification, so the two never go together. One
 * finding per entry, at its `pagefront:aspect`.
 */
export const revW014: Rule = {
  id: "REV-W-014",
  title: "Unclassified review with aspects",
  severity: "warning",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      if (entry["pagefront:reviewSubject"] !== "unclassified") continue;
      const aspects = entry["pagefront:aspect"];
      if (!Array.isArray(aspects) || aspects.length === 0) continue;
      hits.push({ path: `${path}['pagefront:aspect']`, values: { id: reviewId(entry) } });
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` is `unclassified` and carries `pagefront:aspect` entries; aspects are a classification.",
  remediation:
    "Declare the subject the aspects show (`product`, `seller` or `mixed`), or remove the aspects from a review no one has classified.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#pagefront-declarations",
};
