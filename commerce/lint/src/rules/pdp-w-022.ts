import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-022 — Empty product highlight entry.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires on any entry that is empty or whitespace-only. `{index}` is the
 * entry's array position, taken from the match's resolved path. The
 * schema types entries as strings; a non-string entry never reaches
 * this rule on Layer-1-valid input and does not fire.
 */
export const pdpW022: Rule = {
  id: "PDP-W-022",
  title: "Empty product highlight entry",
  severity: "warning",
  target: "$.data['pagefront:productHighlights'][*]",
  check: (match) => {
    if (typeof match.value !== "string" || match.value.trim() !== "") return null;
    const index = /\[(\d+)\]$/.exec(match.path)?.[1] ?? "";
    return { values: { index } };
  },
  messageTemplate:
    "`pagefront:productHighlights[{index}]` is empty or whitespace-only; highlights must carry the publisher's selling-point text.",
  remediation:
    "Populate the entry with the highlight text from the merchant's page, or remove the entry. If the pipeline cannot recover the text, drop the entry rather than emitting a placeholder — a shorter honest list beats a ranked list with blanks.",
  introduced: "v0.8",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#product-highlights",
};
