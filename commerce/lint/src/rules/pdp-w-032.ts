import type { CheckHit, Rule } from "@pagefront/lint-core";
import {
  asObject,
  isComplete,
  missingModifierProblems,
  resolveConfigurator,
} from "./configurator-pricing.js";

/**
 * PDP-W-032 — Priced option without a modifier.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Applies to a resolving pricing block whose `pricing` is absent or
 * `complete`. One finding per priced option with no modifier, one per
 * priced text dimension with no `*` modifier, and one per priced select
 * dimension that enumerates no options, all at the block.
 */
export const pdpW032: Rule = {
  id: "PDP-W-032",
  title: "Priced option without a modifier",
  severity: "warning",
  target: "$.data.offers[*]['pagefront:configuratorPricing']",
  check: (match, ctx) => {
    const block = asObject(match.value);
    if (block === null || !isComplete(block)) return null;
    const configurator = resolveConfigurator(block, ctx.sheet);
    if (configurator === null) return null;
    const hits: CheckHit[] = missingModifierProblems(configurator, block).map((p): CheckHit =>
      p.kind === "no-text-modifier"
        ? {
            values: {
              dimension: p.dimension,
              problem: `states no \`*\` modifier for text dimension \`${p.dimension}\``,
            },
          }
        : p.kind === "no-options"
        ? {
            values: {
              dimension: p.dimension,
              problem: `cannot state modifiers for \`${p.dimension}\`, a priced dimension that enumerates no options`,
            },
          }
        : {
            values: {
              dimension: p.dimension,
              option: p.option,
              problem: `states no modifier for option \`${p.option}\` of \`${p.dimension}\``,
            },
          }
    );
    return hits.length > 0 ? hits : null;
  },
  messageTemplate: "Pricing block at `{path}` {problem}, and `pricing` is not `partial`.",
  remediation:
    "State the modifier, zero included; for a text dimension, state it under the key `\"*\"`. If the dimension never changes the price, declare `affectsPrice: false` on it. If the price is not known, declare `pricing: \"partial\"`.",
  introduced: "v0.9 (2026-10-01 revision)",
  specReference: "product.md#configurator-pricing-and-price-bands",
};
