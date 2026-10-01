import type { Rule } from "@pagefront/lint-core";
import { asObject, CORRESPONDING_SIZE_SYSTEM, readConfigurator } from "./configurator-pricing.js";

/**
 * PDP-E-014 — Size advice in another system than the sizing dimension.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires when the adjustment carries a `sizeSystem`, the configurator has
 * a sizing dimension in `UK`, `EU`, `US` or `JP`, and the adjustment's
 * system corresponds to none of them. The `https://schema.org/` prefix
 * on `sizeSystem` is accepted.
 */
export const pdpE014: Rule = {
  id: "PDP-E-014",
  title: "Size advice in another system than the sizing dimension",
  severity: "error",
  target: "$.data['pagefront:sizeRecommendation'].sizeAdjustment",
  check: (match, ctx) => {
    const sizeSystem = asObject(match.value)?.["sizeSystem"];
    if (typeof sizeSystem !== "string") return null;
    const systems = (readConfigurator(ctx.sheet)?.dimensions ?? [])
      .map((d) => d.system)
      .filter((s): s is string => s !== undefined && Object.hasOwn(CORRESPONDING_SIZE_SYSTEM, s));
    if (systems.length === 0) return null;
    const bare = sizeSystem.replace(/^https?:\/\/schema\.org\//, "");
    if (systems.some((s) => CORRESPONDING_SIZE_SYSTEM[s] === bare)) return null;
    return { values: { sizeSystem, dimensionSystem: systems[0] } };
  },
  messageTemplate:
    "Size adjustment at `{path}` is in `{sizeSystem}` but the Sheet's sizing dimension is in `{dimensionSystem}`.",
  remediation:
    "State the adjustment in the sizing dimension's system if the merchant states it there. If the merchant's advice is in another system, remove `sizeAdjustment` and keep the merchant's wording in `description`.",
  introduced: "v0.9 (2026-10-01 revision)",
  specReference: "product.md#size-guidance-pagefrontsizechart-and-pagefrontsizerecommendation",
};
