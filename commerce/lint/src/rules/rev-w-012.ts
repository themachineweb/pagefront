import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, reviewEntries, reviewId, subjectType } from "./rev-shared.js";

/**
 * REV-W-012 — Variant bought without the data that knows it.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `itemReviewed` is the variant the author bought, purchase data the
 * publisher holds only when it matched an order or sent the invitation,
 * and only on a sheet whose subject is a `ProductGroup` ("Schema.org-
 * native" in review.md). One finding per condition met, at the entry's
 * `itemReviewed`.
 */
export const revW012: Rule = {
  id: "REV-W-012",
  title: "Variant bought without the data that knows it",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null) return null;
    const subject = subjectType(data);
    const hits: CheckHit[] = [];
    for (const { entry, path } of reviewEntries(data, match.path)) {
      if (entry["itemReviewed"] === undefined) continue;
      const field = `${path}['itemReviewed']`;
      const verification = entry["pagefront:purchaseVerification"];
      if (verification !== "order_matched" && verification !== "post_purchase_invitation") {
        const rendered = typeof verification === "string" ? verification : JSON.stringify(verification ?? null);
        hits.push({ path: field, values: { id: reviewId(entry), problem: `with \`pagefront:purchaseVerification\` \`${rendered}\`` } });
      }
      if (subject !== "ProductGroup") {
        hits.push({ path: field, values: { id: reviewId(entry), problem: `on a sheet whose subject is a \`${subject ?? "(no @type)"}\`` } });
      }
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` carries `itemReviewed` {problem}.",
  remediation:
    "Carry `itemReviewed` only where the publisher knows the order line (`order_matched` or `post_purchase_invitation`) and the subject is a `ProductGroup`; otherwise leave it out. It is purchase data, never the author's claim.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#schemaorg-native",
};
