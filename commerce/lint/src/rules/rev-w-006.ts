import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, memberEntries, nonBlank, reviewId } from "./rev-shared.js";

/**
 * REV-W-006 — Platform source without a name.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `pagefront:reviewSource.name` is required for a `third_party` or
 * `marketplace` source: the platform's name is what a consumer checks
 * the review against. One finding per entry, at its source.
 */
export const revW006: Rule = {
  id: "REV-W-006",
  title: "Platform source without a name",
  severity: "warning",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      const source = asRecord(entry["pagefront:reviewSource"]);
      const kind = source?.["kind"];
      if (source === null || (kind !== "third_party" && kind !== "marketplace") || nonBlank(source["name"])) continue;
      hits.push({ path: `${path}['pagefront:reviewSource']`, values: { id: reviewId(entry), kind: kind as string } });
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` names a `{kind}` source without `name`.",
  remediation: "Add `name`, the review platform's or marketplace's name, and `url`, the review on that platform, to `pagefront:reviewSource`.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#pagefront-declarations",
};
