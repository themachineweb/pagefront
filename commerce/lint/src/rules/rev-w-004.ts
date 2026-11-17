import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, memberEntries, reviewId } from "./rev-shared.js";

/**
 * REV-W-004 — Personal data on the author.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `author` is a `Person` with `name` as displayed and no other personal
 * data ("Schema.org-native" in review.md). One finding per field present,
 * at the entry's `author`.
 */
export const revW004: Rule = {
  id: "REV-W-004",
  title: "Personal data on the author",
  severity: "warning",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      const author = asRecord(entry["author"]);
      if (author === null) continue;
      for (const field of ["email", "telephone", "address"]) {
        if (author[field] === undefined) continue;
        hits.push({ path: `${path}['author']`, values: { id: reviewId(entry), field } });
      }
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` carries `{field}` on its `author`; a review carries the name as displayed and no other personal data.",
  remediation: "Remove `email`, `telephone` and `address` from `author`; keep `name` as the page displays it.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#schemaorg-native",
};
