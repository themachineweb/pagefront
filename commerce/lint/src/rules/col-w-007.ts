import type { CheckHit, Rule } from "@pagefront/lint-core";
import { entryName, memberEntries, nonBlank } from "./col-shared.js";

/**
 * COL-W-007 — Parent entry without `pagefront:sheetUrl`.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * A category's parents are category sheets and a collection's parent
 * is a collection sheet, so the producer that emits the sheet has
 * emitted its parents and knows their addresses. The hint is an
 * optimisation that MAY be stale; the rule asks for its presence and
 * never checks that it resolves. One finding per entry, at the entry's
 * path.
 */
export const colW007: Rule = {
  id: "COL-W-007",
  title: "Parent entry without pagefront:sheetUrl",
  severity: "warning",
  target: "$.data.isPartOf",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      if (nonBlank(entry["pagefront:sheetUrl"])) continue;
      hits.push({ path, values: { name: entryName(entry) } });
    }
    return hits;
  },
  messageTemplate:
    "Parent `{name}` at `{path}` carries no `pagefront:sheetUrl`; consumers must reach its sheet via `url` + `alternate`.",
  remediation:
    "Emit the parent's sheet and add `pagefront:sheetUrl` with its address. A category's parents are category sheets, and a collection nests only in a collection that has a sheet.",
  introduced: "catalogue 0.20.0",
  appliesFrom: "0.5.0",
  specReference: "collection.md#hierarchy",
};
