import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asObject, isZero, optionKey, own, parseDecimal, seg } from "./configurator-pricing.js";

/**
 * PDP-E-008 — Base option modifier is not zero.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * One finding per `baseConfiguration` pair whose modifier is present and
 * differs from zero as a number, at the modifier's own path. A base
 * option with no modifier is PDP-W-032's concern.
 */
export const pdpE008: Rule = {
  id: "PDP-E-008",
  title: "Base option modifier is not zero",
  severity: "error",
  target: "$.data.offers[*]['pagefront:configuratorPricing']",
  check: (match) => {
    const block = asObject(match.value);
    const base = asObject(block?.["baseConfiguration"]);
    const modifiers = asObject(block?.["modifiers"]);
    if (base === null || modifiers === null) return null;
    const hits: CheckHit[] = [];
    for (const [dimension, raw] of Object.entries(base)) {
      const option = optionKey(raw);
      if (option === undefined) continue;
      const stated = own(asObject(own(modifiers, dimension)), option);
      const modifier = parseDecimal(stated);
      if (modifier === undefined || isZero(modifier)) continue;
      hits.push({
        path: `${match.path}['modifiers']${seg(dimension)}${seg(option)}`,
        values: { dimension, option, modifier: String(stated) },
      });
    }
    return hits.length > 0 ? hits : null;
  },
  messageTemplate:
    "Modifier for base option `{option}` of `{dimension}` at `{path}` is `{modifier}`; the base option's modifier is `0`.",
  remediation:
    "Set the base option's modifier to zero and express the other options of the dimension as differences from it. If the modifier is right, `basePrice` is the total of another configuration: correct `baseConfiguration` or `basePrice`.",
  introduced: "v0.9 (2026-10-01 revision)",
  specReference: "product.md#configurator-pricing-and-price-bands",
};
