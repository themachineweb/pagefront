import type { CheckHit, Rule } from "@pagefront/lint-core";
import { memberEntries, nonBlank } from "./rev-shared.js";

/**
 * REV-W-003 — Duplicate review.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The same `@id` twice in one sheet is a merge error in the producer; a
 * consumer deduplicating on `@id` silently drops one. The first
 * occurrence stands; every later one is reported.
 */
export const revW003: Rule = {
  id: "REV-W-003",
  title: "Duplicate review",
  severity: "warning",
  target: "$.data.itemListElement",
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
  messageTemplate: "Review `{id}` at `{path}` repeats the entry at `{first}`.",
  remediation: "Keep one entry per review. A review carried in two language sheets appears once in each, under the same `@id`.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#schemaorg-native",
};
