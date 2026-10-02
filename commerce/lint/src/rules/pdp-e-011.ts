import type { CheckHit, Rule } from "@pagefront/lint-core";
import {
  asObject,
  baseConfigurationProblems,
  compareDecimal,
  computeBand,
  formatDecimal,
  isComplete,
  missingModifierProblems,
  parseDecimal,
  pricingBlock,
  resolveConfigurator,
} from "./configurator-pricing.js";

/**
 * PDP-E-011 — AggregateOffer band disagrees with computed band.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Applies to an `AggregateOffer` whose pricing block is complete. Silent
 * when the band cannot be computed: the reference does not resolve, the
 * block fires PDP-E-007 or PDP-W-032, or every configuration is
 * excluded. One finding per disagreeing bound, at the bound.
 */
export const pdpE011: Rule = {
  id: "PDP-E-011",
  title: "AggregateOffer band disagrees with computed band",
  severity: "error",
  target: "$.data.offers[*]",
  check: (match, ctx) => {
    const offer = asObject(match.value);
    if (offer === null || offer["@type"] !== "AggregateOffer") return null;
    const block = pricingBlock(offer);
    if (block === null || !isComplete(block)) return null;
    const configurator = resolveConfigurator(block, ctx.sheet);
    if (configurator === null) return null;
    if (baseConfigurationProblems(configurator, block).length > 0) return null;
    if (missingModifierProblems(configurator, block).length > 0) return null;
    const band = computeBand(configurator, block);
    if (band === null) return null;
    const hits: CheckHit[] = [];
    const bounds = [
      { bound: "lowPrice", extreme: "cheapest", computed: band.min },
      { bound: "highPrice", extreme: "dearest", computed: band.max },
    ];
    for (const { bound, extreme, computed } of bounds) {
      const stated = parseDecimal(offer[bound]);
      if (stated === undefined || compareDecimal(stated, computed) === 0) continue;
      hits.push({
        path: `${match.path}['${bound}']`,
        values: { bound, extreme, stated: String(offer[bound]), computed: formatDecimal(computed) },
      });
    }
    return hits.length > 0 ? hits : null;
  },
  messageTemplate:
    "`{bound}` at `{path}` is `{stated}` but the {extreme} non-excluded configuration computed from the pricing block totals `{computed}`.",
  remediation:
    "Correct the bound, or correct the price list: a missing adjustment, a missing exclusion and a wrong modifier each move the computed band. If the price list is known to have gaps, declare `pricing: \"partial\"`.",
  introduced: "v0.9 (2026-10-01 revision)",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#configurator-pricing-and-price-bands",
};
