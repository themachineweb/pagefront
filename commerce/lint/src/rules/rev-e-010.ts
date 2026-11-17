import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, memberEntries, ORGANIZATION_TYPES, reviewId } from "./rev-shared.js";

/**
 * REV-E-010 — Review by an organization.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * This sheet carries consumer reviews; a `Review` whose author is a
 * publication or the merchant is a different trust class and belongs
 * elsewhere ("What this spec does not do" in review.md). One finding per
 * entry, at its `author`.
 */
export const revE010: Rule = {
  id: "REV-E-010",
  title: "Review by an organization",
  severity: "error",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      const author = asRecord(entry["author"]);
      const type = author?.["@type"];
      if (typeof type !== "string" || !(ORGANIZATION_TYPES as readonly string[]).includes(type)) continue;
      hits.push({ path: `${path}['author']`, values: { id: reviewId(entry), type } });
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` has an `author` of `@type` `{type}`; this sheet carries consumer reviews.",
  remediation:
    "Carry consumer reviews only, each `author` a `Person` with `name` as displayed. An expert, editorial or merchant review is left out of this sheet.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#what-this-spec-does-not-do",
};
