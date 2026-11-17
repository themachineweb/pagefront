import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, memberEntries, reviewId } from "./rev-shared.js";

/**
 * REV-W-011 — Media from an imported source.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Media provenance is weaker than text provenance: `associatedMedia` on a
 * review whose origin was not retained is reported for review. One
 * finding per entry, at its `associatedMedia`.
 */
export const revW011: Rule = {
  id: "REV-W-011",
  title: "Media from an imported source",
  severity: "warning",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      if (entry["associatedMedia"] === undefined) continue;
      if (asRecord(entry["pagefront:reviewSource"])?.["kind"] !== "imported") continue;
      hits.push({ path: `${path}['associatedMedia']`, values: { id: reviewId(entry) } });
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` carries `associatedMedia` from an `imported` source.",
  remediation: "Confirm the media came with the review. Where its origin is not retained, leave `associatedMedia` out.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#schemaorg-native",
};
