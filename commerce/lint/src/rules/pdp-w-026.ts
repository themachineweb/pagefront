import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-026 — Safety data sheet without a language declaration.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires only on entries with role `safety_data_sheet`; "lacks
 * `inLanguage`, or … empty or whitespace-only" per the Definitions
 * section.
 */
export const pdpW026: Rule = {
  id: "PDP-W-026",
  title: "Safety data sheet without a language declaration",
  severity: "warning",
  target: "$.data['pagefront:document'][*]",
  check: (match) => {
    const doc = match.value;
    if (typeof doc !== "object" || doc === null) return null;
    const d = doc as Record<string, unknown>;
    if (d["role"] !== "safety_data_sheet") return null;
    const lang = d["inLanguage"];
    const missing =
      lang === undefined ||
      lang === null ||
      (typeof lang === "string" && lang.trim() === "");
    return missing ? {} : null;
  },
  messageTemplate: "Safety data sheet at `{path}` declares no `inLanguage`.",
  remediation:
    "Add the document's BCP 47 language tag as `inLanguage`. If the document is multilingual, declare the primary language.",
  introduced: "v0.8",
  specReference: "product.md#documents",
};
