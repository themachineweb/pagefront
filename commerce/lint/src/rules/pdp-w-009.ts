import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-009 — Empty hasVariant.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Bespoke cross-field check: `@type` is `ProductGroup` and `hasVariant`
 * is absent or an empty array.
 */
export const pdpW009: Rule = {
  id: "PDP-W-009",
  title: "Empty hasVariant",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = match.value;
    if (typeof data !== "object" || data === null) return null;
    const d = data as Record<string, unknown>;
    const variants = d["hasVariant"];
    return d["@type"] === "ProductGroup" &&
      (variants === undefined ||
        (Array.isArray(variants) && variants.length === 0))
      ? {}
      : null;
  },
  messageTemplate: "ProductGroup at `{path}` has no variants.",
  remediation:
    "Add variant entries to `hasVariant`. If the product genuinely has no variants, change `@type` to `Product`.",
  introduced: "v0.6",
  specReference: "product.md#configurator-vs-productgroup-guidance",
};
