import type { Rule } from "@pagefront/lint-core";
import { pricedConfiguratorId, pricingBlock } from "./configurator-pricing.js";

/**
 * PDP-E-012 — Configurator priced by more than one offer.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires on each `offers` entry whose pricing block names a configurator
 * that an earlier entry already prices (exact string match on
 * `configurator.@id`); `{firstPath}` is the first such entry.
 */
function pricedId(offer: unknown): string | undefined {
  const block = pricingBlock(offer);
  return block === null ? undefined : pricedConfiguratorId(block);
}

export const pdpE012: Rule = {
  id: "PDP-E-012",
  title: "Configurator priced by more than one offer",
  severity: "error",
  target: "$.data.offers[*]",
  check: (match, ctx) => {
    const value = pricedId(match.value);
    if (value === undefined) return null;
    const first = ctx.allMatches.find((m) => pricedId(m.value) === value);
    if (first === undefined || first.path === match.path) return null;
    return { values: { value, firstPath: first.path } };
  },
  messageTemplate:
    "Offer at `{path}` prices configurator `{value}`, which the offer at `{firstPath}` already prices.",
  remediation:
    "Keep one pricing block per configurator. Publish each further market's price list in that market's own Sheet.",
  introduced: "v0.9 (2026-10-01 revision)",
  specReference: "product.md#configurator-pricing-and-price-bands",
};
