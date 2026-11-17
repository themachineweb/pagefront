import type { CheckHit, Rule } from "@pagefront/lint-core";
import { enumText, memberEntries, reviewId, INCENTIVES } from "./rev-shared.js";

/**
 * REV-E-008 — `pagefront:reviewIncentive` absent or outside the enum.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * One of the four declarations required on every review entry, a closed
 * enum with `undisclosed`: absence is a broken sheet, where `undisclosed`
 * is a statement ("Undisclosed and unclassified are statements" in review.md). The finding
 * sits at the entry when the field is absent and at the field otherwise.
 */
export const revE008: Rule = {
  id: "REV-E-008",
  title: "Incentive absent or outside the enum",
  severity: "error",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      const value = entry["pagefront:reviewIncentive"];
      if (value === undefined) {
        hits.push({ path, values: { id: reviewId(entry), problem: "absent" } });
        continue;
      }
      if (typeof value === "string" && (INCENTIVES as readonly string[]).includes(value)) continue;
      const rendered = typeof value === "string" ? value : JSON.stringify(value);
      hits.push({
        path: `${path}['pagefront:reviewIncentive']`,
        values: { id: reviewId(entry), problem: `\`${rendered}\`, which is not one of ${enumText(INCENTIVES)}` },
      });
    }
    return hits;
  },
  messageTemplate: "`pagefront:reviewIncentive` on review `{id}` at `{path}` is {problem}.",
  remediation:
    "Declare `pagefront:reviewIncentive` on every review as `none`, `discount`, `free_product`, `sample_program` or `undisclosed`; a publisher that does not know writes `undisclosed`, never nothing.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#pagefront-declarations",
};
