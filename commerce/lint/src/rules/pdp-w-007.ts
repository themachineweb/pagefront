import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-007 — ProductGroup with single variant.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Bespoke cross-field check: `@type` is `ProductGroup` and `hasVariant`
 * has exactly one entry.
 */
export const pdpW007: Rule = {
  id: "PDP-W-007",
  title: "ProductGroup with single variant",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = match.value;
    if (typeof data !== "object" || data === null) return null;
    const d = data as Record<string, unknown>;
    const variants = d["hasVariant"];
    return d["@type"] === "ProductGroup" &&
      Array.isArray(variants) &&
      variants.length === 1
      ? {}
      : null;
  },
  messageTemplate: "ProductGroup at `{path}` has only one variant.",
  remediation:
    "Either add the missing variants to `hasVariant`, or change `@type` to `Product` and model the single variant directly. The `productGroupID` field should be replaced with `productID` or `sku` if switching to Product.",
  introduced: "v0.6",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#configurator-vs-productgroup-guidance",
};
