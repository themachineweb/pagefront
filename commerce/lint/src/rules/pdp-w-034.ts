import type { Rule } from "@pagefront/lint-core";
import {
  entryStatesPrice,
  hasPricedDimension,
  pricingBlock,
  readConfigurator,
} from "./configurator-pricing.js";

/**
 * PDP-W-034 — Offer beside a configurator with no pricing block.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires once per Sheet, at the first `offers` entry that states a
 * price, when the Sheet carries a configurator with a priced dimension
 * and no `offers` entry carries a pricing block.
 */
export const pdpW034: Rule = {
  id: "PDP-W-034",
  title: "Offer beside a configurator with no pricing block",
  severity: "warning",
  target: "$.data.offers[*]",
  check: (match, ctx) => {
    const configurator = readConfigurator(ctx.sheet);
    if (configurator === null || !hasPricedDimension(configurator)) return null;
    if (ctx.allMatches.some((m) => pricingBlock(m.value) !== null)) return null;
    const first = ctx.allMatches.find((m) => entryStatesPrice(m.value));
    return first !== undefined && first.path === match.path ? {} : null;
  },
  messageTemplate:
    "Offer price is not linked to the configurator; state which configuration it prices.",
  remediation:
    "Add `pagefront:configuratorPricing` to the offer: give the configurator an `@id`, reference it, and name the configuration the price is the total of. When only that one total is known, declare `pricing: \"partial\"`.",
  introduced: "v0.9 (2026-10-01 revision)",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#configurator-pricing-and-price-bands",
};
