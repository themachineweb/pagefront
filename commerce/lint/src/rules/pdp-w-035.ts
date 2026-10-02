import type { Rule } from "@pagefront/lint-core";
import {
  asObject,
  compareDecimal,
  isZero,
  parseDecimal,
  type Decimal,
} from "./configurator-pricing.js";

/**
 * PDP-W-035 — `basePrice` may be a component price.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Heuristic, one finding per pricing block: (a) `basePrice` equals the
 * largest modifier of one dimension's `modifiers` entry, or (b)
 * `basePrice` is below every non-zero modifier of one entry that has at
 * least one.
 */
export const pdpW035: Rule = {
  id: "PDP-W-035",
  title: "`basePrice` may be a component price",
  severity: "warning",
  target: "$.data.offers[*]['pagefront:configuratorPricing']",
  check: (match) => {
    const block = asObject(match.value);
    const modifiers = asObject(block?.["modifiers"]);
    const basePrice = parseDecimal(block?.["basePrice"]);
    if (modifiers === null || basePrice === undefined) return null;
    for (const entry of Object.values(modifiers)) {
      const amounts = Object.values(asObject(entry) ?? {})
        .map(parseDecimal)
        .filter((d): d is Decimal => d !== undefined);
      if (amounts.length === 0) continue;
      const largest = amounts.reduce((a, b) => (compareDecimal(b, a) > 0 ? b : a));
      if (compareDecimal(basePrice, largest) === 0) return {};
      const nonZero = amounts.filter((d) => !isZero(d));
      if (nonZero.length > 0 && nonZero.every((d) => compareDecimal(basePrice, d) < 0)) return {};
    }
    return null;
  },
  messageTemplate: "basePrice may be a component price, not a configured total.",
  remediation:
    "Confirm that `basePrice` is what a buyer pays for the whole of `baseConfiguration`. If it is the price of one part, replace it with the configured total and recompute the modifiers as differences from that total.",
  introduced: "v0.9 (2026-10-01 revision)",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#configurator-pricing-and-price-bands",
};
