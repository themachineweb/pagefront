import type { Rule } from "@pagefront/lint-core";
import { asObject } from "./configurator-pricing.js";

/**
 * PDP-E-013 — Text dimension with options.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires on a dimension whose `inputType` is `text` and whose `options`
 * is an array with at least one entry.
 */
export const pdpE013: Rule = {
  id: "PDP-E-013",
  title: "Text dimension with options",
  severity: "error",
  target: "$.data['pagefront:configurator'].dimensions[*]",
  check: (match) => {
    const d = asObject(match.value);
    if (d === null || d["inputType"] !== "text") return null;
    if (!Array.isArray(d["options"]) || d["options"].length === 0) return null;
    return { values: { dimension: typeof d["name"] === "string" ? d["name"] : "(unnamed)" } };
  },
  messageTemplate:
    "Dimension `{dimension}` at `{path}` declares `inputType: \"text\"` and enumerates options.",
  remediation:
    "Remove `options` from a free-text dimension, or remove `inputType: \"text\"` from a dimension the buyer picks a value in.",
  introduced: "v0.9 (2026-10-01 revision)",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#configurator-pricing-and-price-bands",
};
