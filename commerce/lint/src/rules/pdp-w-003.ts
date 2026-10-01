import { fieldAbsentOrEmpty, type Rule } from "@pagefront/lint-core";

/**
 * PDP-W-003 — Recommended field absent: brand.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Spec check: "`data.brand` is absent." The helper additionally fires on
 * null, empty arrays, and empty/whitespace strings — all unreachable for
 * `brand`, which the schema types as an object; and it does not fire on
 * an empty object. On Layer-1-valid input the helper is therefore
 * exactly "absent".
 */
export const pdpW003: Rule = {
  id: "PDP-W-003",
  title: "Recommended field absent: brand",
  severity: "warning",
  target: "$.data",
  check: fieldAbsentOrEmpty("brand"),
  messageTemplate: "No brand declared at `{path}`.",
  remediation:
    "Add a `brand` field with a typed `Brand` or `Organization` value, including at minimum `name` and optionally `url`.",
  introduced: "v0.6",
  specReference: "product.md#required-and-recommended-core-fields",
};
