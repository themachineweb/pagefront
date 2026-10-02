import type { Rule } from "@pagefront/lint-core";
import {
  entryStatesPrice,
  hasPricedDimension,
  offerEntries,
  pricingBlock,
  readConfigurator,
} from "./configurator-pricing.js";

/**
 * PDP-W-033 — Priced configurator with no offer pricing it.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires when the configurator has a priced dimension, no `offers` entry
 * carries a pricing block, and no `offers` entry states a price. The
 * last case is PDP-W-034's; the two never fire on the same Sheet.
 */
export const pdpW033: Rule = {
  id: "PDP-W-033",
  title: "Priced configurator with no offer pricing it",
  severity: "warning",
  target: "$.data['pagefront:configurator']",
  check: (_match, ctx) => {
    const configurator = readConfigurator(ctx.sheet);
    if (configurator === null || !hasPricedDimension(configurator)) return null;
    const offers = offerEntries(ctx.sheet);
    if (offers.some((o) => pricingBlock(o) !== null)) return null;
    if (offers.some(entryStatesPrice)) return null;
    return {};
  },
  messageTemplate: "Configurator at `{path}` has priced dimensions but no offer prices it.",
  remediation:
    "Add an offer carrying `pagefront:configuratorPricing` for this configurator. If no option changes the price, declare `affectsPrice: false` on each dimension.",
  introduced: "v0.9 (2026-10-01 revision)",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#configurator-pricing-and-price-bands",
};
