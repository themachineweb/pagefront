import type { CheckHit, Rule } from "@pagefront/lint-core";
import { memberEntries, reviewId } from "./rev-shared.js";

/**
 * REV-E-011 — Translation on a review entry.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `reviewBody` and `name` are the text as the author wrote it; a
 * translation is not carried ("Language" in review.md). One finding per
 * field present, at the entry's path.
 */
export const revE011: Rule = {
  id: "REV-E-011",
  title: "Translation on a review entry",
  severity: "error",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      for (const field of ["workTranslation", "translationOfWork"]) {
        if (entry[field] === undefined) continue;
        hits.push({ path: `${path}['${field}']`, values: { id: reviewId(entry), field } });
      }
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` carries `{field}`; the sheet carries originals only.",
  remediation:
    "Remove the translation. Carry the author's text in `reviewBody` and `name` with its language in `inLanguage`; translation is the consumer's operation.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#language",
};
