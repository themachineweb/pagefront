import type { Rule } from "@pagefront/lint-core";
import { asObject, compareDecimal, parseDecimal, pricingBlock } from "./configurator-pricing.js";

/**
 * PDP-E-010 — Offer price disagrees with base price.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * An `Offer` carrying a pricing block has `price` equal to the block's
 * `basePrice` as a number, whatever the block's `pricing` value. The
 * finding sits at the Offer's `price`.
 */
export const pdpE010: Rule = {
  id: "PDP-E-010",
  title: "Offer price disagrees with base price",
  severity: "error",
  target: "$.data.offers[*]",
  check: (match) => {
    const offer = asObject(match.value);
    if (offer === null || offer["@type"] !== "Offer") return null;
    const block = pricingBlock(offer);
    if (block === null) return null;
    const price = parseDecimal(offer["price"]);
    const basePrice = parseDecimal(block["basePrice"]);
    if (price === undefined || basePrice === undefined) return null;
    if (compareDecimal(price, basePrice) === 0) return null;
    return {
      path: `${match.path}['price']`,
      values: { price: String(offer["price"]), basePrice: String(block["basePrice"]) },
    };
  },
  messageTemplate:
    "Offer `price` at `{path}` is `{price}` but its pricing block's `basePrice` is `{basePrice}`.",
  remediation:
    "Make the two amounts equal. If `price` is the amount the page shows on load, set `baseConfiguration` to the configuration the page preselects and `basePrice` to its total.",
  introduced: "v0.9 (2026-10-01 revision)",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#configurator-pricing-and-price-bands",
};
