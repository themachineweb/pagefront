import type { CheckHit, Rule } from "@pagefront/lint-core";
import { enumText, memberEntries, reviewId, REVIEW_SUBJECTS } from "./rev-shared.js";

/**
 * REV-E-005 — `pagefront:reviewSubject` absent or outside the enum.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * One of the four declarations required on every review entry, a closed
 * enum with `undisclosed`: absence is a broken sheet, where `undisclosed`
 * is a statement ("Undisclosed and unclassified are statements" in review.md). The finding
 * sits at the entry when the field is absent and at the field otherwise.
 */
export const revE005: Rule = {
  id: "REV-E-005",
  title: "Review subject absent or outside the enum",
  severity: "error",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      const value = entry["pagefront:reviewSubject"];
      if (value === undefined) {
        hits.push({ path, values: { id: reviewId(entry), problem: "absent" } });
        continue;
      }
      if (typeof value === "string" && (REVIEW_SUBJECTS as readonly string[]).includes(value)) continue;
      const rendered = typeof value === "string" ? value : JSON.stringify(value);
      hits.push({
        path: `${path}['pagefront:reviewSubject']`,
        values: { id: reviewId(entry), problem: `\`${rendered}\`, which is not one of ${enumText(REVIEW_SUBJECTS)}` },
      });
    }
    return hits;
  },
  messageTemplate: "`pagefront:reviewSubject` on review `{id}` at `{path}` is {problem}.",
  remediation:
    "Declare `pagefront:reviewSubject` on every review as `product` (the product's intrinsic qualities), `seller` (the transaction), `mixed` (both in one text) or `unclassified` (no one has read it for its subject). Additional values require a spec amendment.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#pagefront-declarations",
};
