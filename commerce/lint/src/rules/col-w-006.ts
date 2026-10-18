import type { CheckHit, Rule } from "@pagefront/lint-core";
import { memberEntries, nonBlank } from "./col-shared.js";

/**
 * COL-W-006 — Duplicate member.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `hasPart` is the set's direct membership, read as exhaustive; the
 * same `@id` twice is a duplicated tile or a merge error. The first
 * occurrence stands; every later one fires, at its own path, naming the
 * index of the first.
 */
export const colW006: Rule = {
  id: "COL-W-006",
  title: "Duplicate member",
  severity: "warning",
  target: "$.data.hasPart",
  check: (match) => {
    const seen = new Map<string, string>();
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      const id = entry["@id"];
      if (!nonBlank(id)) continue;
      const first = seen.get(id);
      if (first === undefined) {
        seen.set(id, path);
        continue;
      }
      hits.push({ path, values: { id, first } });
    }
    return hits;
  },
  messageTemplate: "Member `{id}` at `{path}` repeats the entry at `{first}`.",
  remediation:
    "Keep one entry per member. A product assigned to the set once appears once; a product in several sets appears once in each of them.",
  introduced: "release 0.5.0",
  appliesFrom: "0.5.0",
  specReference: "collection.md#members",
};
