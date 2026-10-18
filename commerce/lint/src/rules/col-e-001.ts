import type { CheckHit, Rule } from "@pagefront/lint-core";
import { entryName, matchedField, memberEntries, nonBlank } from "./col-shared.js";

/**
 * COL-E-001 — Member entry without `@id`.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `@id` is the identity every reference to a set or a product carries
 * and is matched by exact string, so a `hasPart` or `isPartOf` entry
 * without one names nothing a consumer can recognise. One finding per
 * entry, at the entry's path.
 */
export const colE001: Rule = {
  id: "COL-E-001",
  title: "Member entry without @id",
  severity: "error",
  target: "$.data['hasPart','isPartOf']",
  check: (match) => {
    const field = matchedField(match.path);
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      if (nonBlank(entry["@id"])) continue;
      hits.push({ path, values: { name: entryName(entry), field } });
    }
    return hits;
  },
  messageTemplate: "Entry `{name}` at `{path}` in `{field}` carries no `@id`.",
  remediation:
    "Add `@id`, the exact `@id` string the member or parent declares in its own sheet. An entry that cannot name its target's identity does not belong in the array.",
  introduced: "release 0.5.0",
  appliesFrom: "0.5.0",
  specReference: "collection.md#members",
};
