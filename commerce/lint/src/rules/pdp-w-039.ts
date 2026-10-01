import type { Rule } from "@pagefront/lint-core";
import { asObject, readConfigurator } from "./configurator-pricing.js";

/**
 * PDP-W-039 — Size advice carried as prose only.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires when `pagefront:sizeRecommendation` carries a non-empty
 * `description` and no `sizeAdjustment`, and the configurator has a
 * sizing dimension. `{system}` is the first sizing dimension's system.
 */
export const pdpW039: Rule = {
  id: "PDP-W-039",
  title: "Size advice carried as prose only",
  severity: "warning",
  target: "$.data['pagefront:sizeRecommendation']",
  check: (match, ctx) => {
    const recommendation = asObject(match.value);
    if (recommendation === null || recommendation["sizeAdjustment"] !== undefined) return null;
    const description = recommendation["description"];
    if (typeof description !== "string" || description.trim() === "") return null;
    const sizing = (readConfigurator(ctx.sheet)?.dimensions ?? []).find((d) => d.system !== undefined);
    return sizing?.system === undefined ? null : { values: { system: sizing.system } };
  },
  messageTemplate:
    "Size advice at `{path}` could not be stated in the Sheet's sizing system (`{system}`); it is carried as prose only.",
  remediation:
    "If the merchant states the advice in the sizing dimension's system, add a `sizeAdjustment` in that system. If it does not, no action: do not convert between systems.",
  introduced: "v0.9 (2026-10-01 revision)",
  specReference: "product.md#size-guidance-pagefrontsizechart-and-pagefrontsizerecommendation",
};
