import { valueAtPath, type Rule } from "@pagefront/lint-core";
import { asObject } from "./configurator-pricing.js";

/**
 * PDP-W-037 — Option in a sizing dimension is not a size.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Heuristic on string option values of a dimension whose `system` is
 * `UK`, `EU`, `US` or `JP`: the value is written as that system writes
 * a size. Other systems are out of scope.
 */
const NUMERIC_SIZE = /^\d+(\.\d+|½)?$/;
const SIZE_IN_SYSTEM: Record<string, RegExp> = {
  UK: /^[A-Z]\s*½?$/,
  EU: NUMERIC_SIZE,
  US: NUMERIC_SIZE,
  JP: NUMERIC_SIZE,
};

export const pdpW037: Rule = {
  id: "PDP-W-037",
  title: "Option in a sizing dimension is not a size",
  severity: "warning",
  target: "$.data['pagefront:configurator'].dimensions[*].options[*]",
  check: (match, ctx) => {
    const value = asObject(match.value)?.["value"];
    if (typeof value !== "string") return null;
    const dimension = asObject(valueAtPath(ctx.sheet, match.path.replace(/\['options'\]\[\d+\]$/, "")));
    const system = dimension?.["system"];
    if (typeof system !== "string" || !Object.hasOwn(SIZE_IN_SYSTEM, system)) return null;
    return SIZE_IN_SYSTEM[system].test(value) ? null : {};
  },
  messageTemplate: "Option does not look like a size in the declared system.",
  remediation:
    "Remove the entry if it is a service, and describe the service in the dimension's `note` or in `pagefront:madeToOrderTerms.aftermarketServices`. If it is a size, write it as the system writes it, without the system's name.",
  introduced: "v0.9 (2026-10-01 revision)",
  specReference: "product.md#configurator-pricing-and-price-bands",
};
