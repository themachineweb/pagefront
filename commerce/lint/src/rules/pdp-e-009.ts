import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asObject, resolveConfigurator, seg, TEXT_KEY } from "./configurator-pricing.js";

/**
 * PDP-E-009 — Modifier for an unknown dimension or option.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Applies to a pricing block whose `configurator` reference resolves.
 * A `modifiers` key naming no dimension, or a dimension declared
 * `affectsPrice: false`, fires once at that key; under a priced
 * dimension, each option key that is not one of its options fires at
 * its own path. Under a priced text dimension, `*` is the one valid key.
 */
export const pdpE009: Rule = {
  id: "PDP-E-009",
  title: "Modifier for an unknown dimension or option",
  severity: "error",
  target: "$.data.offers[*]['pagefront:configuratorPricing']",
  check: (match, ctx) => {
    const block = asObject(match.value);
    const modifiers = asObject(block?.["modifiers"]);
    if (block === null || modifiers === null) return null;
    const configurator = resolveConfigurator(block, ctx.sheet);
    if (configurator === null) return null;
    const hits: CheckHit[] = [];
    for (const [dimension, entry] of Object.entries(modifiers)) {
      const path = `${match.path}['modifiers']${seg(dimension)}`;
      const d = configurator.byName.get(dimension);
      if (d === undefined) {
        hits.push({
          path,
          values: { dimension, problem: `names \`${dimension}\`, which is not a dimension of the configurator` },
        });
        continue;
      }
      if (!d.priced) {
        hits.push({
          path,
          values: { dimension, problem: `names \`${dimension}\`, which is declared \`affectsPrice: false\`` },
        });
        continue;
      }
      for (const option of Object.keys(asObject(entry) ?? {})) {
        if (d.text ? option === TEXT_KEY : d.optionKeys !== null && d.optionKeys.includes(option)) continue;
        hits.push({
          path: `${path}${seg(option)}`,
          values: {
            dimension,
            option,
            problem: `names \`${option}\`, which is not an option of \`${dimension}\``,
          },
        });
      }
    }
    return hits.length > 0 ? hits : null;
  },
  messageTemplate: "Modifier at `{path}` {problem}.",
  remediation:
    "Spell dimension names and option values as the configurator spells them. Remove modifiers for dimensions that do not change the price, or remove `affectsPrice: false` from a dimension that does.",
  introduced: "v0.9 (2026-10-01 revision)",
  specReference: "product.md#configurator-pricing-and-price-bands",
};
