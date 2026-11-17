import type { CheckHit, Rule } from "@pagefront/lint-core";
import { memberEntries, reviewId } from "./rev-shared.js";

/**
 * REV-E-014 — Aspects without their source.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `pagefront:aspectSource` is required when `pagefront:aspect` is
 * present: a consumer weights the author's choice, the publisher's
 * tagging and a classifier's inference differently. The schema requires
 * it; this rule reports the condition for callers that lint without
 * validating. One finding per entry, at its path.
 */
export const revE014: Rule = {
  id: "REV-E-014",
  title: "Aspects without their source",
  severity: "error",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      if (entry["pagefront:aspect"] === undefined || entry["pagefront:aspectSource"] !== undefined) continue;
      hits.push({ path, values: { id: reviewId(entry) } });
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` carries `pagefront:aspect` without `pagefront:aspectSource`.",
  remediation: "Add `pagefront:aspectSource`: `author`, `publisher` or `inferred`, saying who assigned the aspects.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#aspects-pagefrontaspect",
};
