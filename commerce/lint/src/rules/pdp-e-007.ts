import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asObject, baseConfigurationProblems, resolveConfigurator } from "./configurator-pricing.js";

/**
 * PDP-E-007 — Base configuration incomplete.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Applies to a pricing block whose `configurator` reference resolves.
 * One finding per omitted priced dimension (in dimension order), then
 * one per `baseConfiguration` pair naming no dimension or a value that
 * is not one of the dimension's options (in document order), all at the
 * `baseConfiguration` path.
 */
export const pdpE007: Rule = {
  id: "PDP-E-007",
  title: "Base configuration incomplete",
  severity: "error",
  target: "$.data.offers[*]['pagefront:configuratorPricing']",
  check: (match, ctx) => {
    const block = asObject(match.value);
    if (block === null) return null;
    const configurator = resolveConfigurator(block, ctx.sheet);
    if (configurator === null) return null;
    const path = `${match.path}['baseConfiguration']`;
    const hits: CheckHit[] = baseConfigurationProblems(configurator, block).map((p): CheckHit => {
      if (p.kind === "omitted") {
        return { path, values: { dimension: p.dimension, problem: `omits priced dimension \`${p.dimension}\`` } };
      }
      if (p.kind === "unknown-dimension") {
        return {
          path,
          values: {
            dimension: p.dimension,
            problem: `names \`${p.dimension}\`, which is not a dimension of the configurator`,
          },
        };
      }
      return {
        path,
        values: {
          dimension: p.dimension,
          value: p.value,
          problem: `names \`${p.value}\` for \`${p.dimension}\`, which is not one of its options`,
        },
      };
    });
    return hits.length > 0 ? hits : null;
  },
  messageTemplate: "Base configuration at `{path}` {problem}.",
  remediation:
    "Name exactly one option for every priced dimension, spelled as the configurator's `options` spell it. If a dimension never changes the price, declare `affectsPrice: false` on it and leave it out.",
  introduced: "v0.9 (2026-10-01 revision)",
  specReference: "product.md#configurator-pricing-and-price-bands",
};
