import type { CheckHit, Rule } from "@pagefront/lint-core";
import { entryName, memberEntries, nonBlank } from "./col-shared.js";

/**
 * COL-W-002 — Member entry without `pagefront:sheetUrl`.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The hint is recommended on every member entry: a producer that emits
 * both sheets knows the URL, and without it a consumer reaches the
 * member sheet through its page. The hint is an optimisation that MAY
 * be stale; the rule asks for its presence and never checks that it
 * resolves. One finding per entry, at the entry's path.
 */
export const colW002: Rule = {
  id: "COL-W-002",
  title: "Member entry without pagefront:sheetUrl",
  severity: "warning",
  target: "$.data.hasPart",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      if (nonBlank(entry["pagefront:sheetUrl"])) continue;
      hits.push({ path, values: { name: entryName(entry) } });
    }
    return hits;
  },
  messageTemplate:
    "Member `{name}` at `{path}` carries no `pagefront:sheetUrl`; consumers must reach its sheet via `url` + `alternate`.",
  remediation:
    "Add `pagefront:sheetUrl` with the member's sheet URL when you emit that sheet. If the member has no sheet, the entry is complete as it stands.",
  introduced: "release 0.5.0",
  appliesFrom: "0.5.0",
  specReference: "collection.md#members",
};
