import { valueAtPath, type Rule } from "@pagefront/lint-core";
import { asObject } from "./configurator-pricing.js";

/**
 * PDP-W-036 — Option value looks like a display label.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Heuristic on string option values: whitespace, an uppercase letter,
 * or a decimal number followed by letters to the end (a unit suffix).
 * Options of a sizing dimension (one declaring `system`) are exempt;
 * PDP-W-037 checks those.
 */
const UNIT_SUFFIX = /^-?\d+(\.\d+)?\p{L}+$/u;

export const pdpW036: Rule = {
  id: "PDP-W-036",
  title: "Option value looks like a display label",
  severity: "warning",
  target: "$.data['pagefront:configurator'].dimensions[*].options[*]",
  check: (match, ctx) => {
    const value = asObject(match.value)?.["value"];
    if (typeof value !== "string") return null;
    const dimension = asObject(valueAtPath(ctx.sheet, match.path.replace(/\['options'\]\[\d+\]$/, "")));
    if (typeof dimension?.["system"] === "string") return null;
    return /\s/.test(value) || /\p{Lu}/u.test(value) || UNIT_SUFFIX.test(value) ? {} : null;
  },
  messageTemplate: "Option value should be a stable identifier; put the label in description.",
  remediation:
    "Replace the value with a lowercase identifier without spaces (`yellow_gold`, `0.5`) and move the label to `description`. Put a unit in the dimension's `note`. Update the pricing block's keys, `baseConfiguration`, `when` and `exclusions` to the new value.",
  introduced: "v0.9 (2026-10-01 revision)",
  specReference: "product.md#configurator-pricing-and-price-bands",
};
