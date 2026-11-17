import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord } from "./rev-shared.js";

/**
 * REV-W-011 — `numberOfItems` and the list disagree.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `numberOfItems` equals the array length and exists so a consumer can
 * tell a truncated document from a whole one ("Size and ordering" in
 * review.md). Silent when the field is absent. The finding sits at the
 * field.
 */
export const revW011: Rule = {
  id: "REV-W-011",
  title: "numberOfItems and the list disagree",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null || data["numberOfItems"] === undefined) return null;
    const declared = data["numberOfItems"];
    const list = data["itemListElement"];
    const actual = Array.isArray(list) ? list.length : 0;
    if (declared === actual) return null;
    return {
      path: `${match.path}['numberOfItems']`,
      values: { declared: typeof declared === "number" ? declared : JSON.stringify(declared), actual },
    };
  },
  messageTemplate: "`numberOfItems` at `{path}` is {declared}; `itemListElement` carries {actual} entries.",
  remediation: "Set `numberOfItems` to the length of `itemListElement`, or leave it out.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#size-and-ordering",
};
