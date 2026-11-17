import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, enumText, memberEntries, reviewId, SOURCE_KINDS } from "./rev-shared.js";

/**
 * REV-E-006 — Review source absent, or `kind` outside the enum.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `pagefront:reviewSource` says where the review entered the publisher's
 * possession: an object whose `kind` is a closed enum with `undisclosed`.
 * The finding sits at the entry when the field is absent and at the
 * field otherwise.
 */
export const revE006: Rule = {
  id: "REV-E-006",
  title: "Review source absent, or kind outside the enum",
  severity: "error",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      const id = reviewId(entry);
      if (entry["pagefront:reviewSource"] === undefined) {
        hits.push({ path, values: { id, problem: "is absent" } });
        continue;
      }
      const field = `${path}['pagefront:reviewSource']`;
      const source = asRecord(entry["pagefront:reviewSource"]);
      if (source === null) {
        hits.push({ path: field, values: { id, problem: "is not an object" } });
        continue;
      }
      const kind = source["kind"];
      if (kind === undefined) {
        hits.push({ path: field, values: { id, problem: "carries no `kind`" } });
        continue;
      }
      if (typeof kind === "string" && (SOURCE_KINDS as readonly string[]).includes(kind)) continue;
      const rendered = typeof kind === "string" ? kind : JSON.stringify(kind);
      hits.push({ path: field, values: { id, problem: `declares \`kind\` \`${rendered}\`, which is not one of ${enumText(SOURCE_KINDS)}` } });
    }
    return hits;
  },
  messageTemplate: "`pagefront:reviewSource` on review `{id}` at `{path}` {problem}.",
  remediation:
    "Declare `pagefront:reviewSource` on every review as an object whose `kind` is `first_party`, `third_party`, `marketplace`, `imported` or `undisclosed`, with the platform's `name` and the review's `url` for a third-party or marketplace source.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#pagefront-declarations",
};
