import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, memberEntries, PRODUCT_ASPECTS, reviewId, SELLER_ASPECTS } from "./rev-shared.js";

/**
 * REV-W-008 — Subject and aspects disagree.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The aspect list is split along the subject line. A `product` review
 * whose every aspect is seller-side, or a `seller` review whose every
 * aspect is product-side, declares one thing and details another. Aspects
 * outside the closed list are not judged; a `mixed` review never fires.
 * One finding per entry, at its `pagefront:aspect`.
 */
export const revW008: Rule = {
  id: "REV-W-008",
  title: "Subject and aspects disagree",
  severity: "warning",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      const subject = entry["pagefront:reviewSubject"];
      if (subject !== "product" && subject !== "seller") continue;
      const aspects = Array.isArray(entry["pagefront:aspect"]) ? entry["pagefront:aspect"] : [];
      const names = aspects
        .map((a) => asRecord(a)?.["aspect"])
        .filter((a): a is string => typeof a === "string")
        .filter((a) => (PRODUCT_ASPECTS as readonly string[]).includes(a) || (SELLER_ASPECTS as readonly string[]).includes(a));
      if (names.length === 0) continue;
      const otherSide = subject === "product" ? SELLER_ASPECTS : PRODUCT_ASPECTS;
      if (!names.every((a) => (otherSide as readonly string[]).includes(a))) continue;
      hits.push({
        path: `${path}['pagefront:aspect']`,
        values: { id: reviewId(entry), subject, side: subject === "product" ? "seller" : "product" },
      });
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` declares `pagefront:reviewSubject` `{subject}` and every aspect it carries is {side}-side.",
  remediation:
    "Declare the subject the aspects describe: `seller` for delivery, service, returns, packaging, payment and communication, `product` for the product's qualities, `mixed` where the text covers both.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#aspects-pagefrontaspect",
};
