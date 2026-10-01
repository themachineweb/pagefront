import { fieldAbsentOrEmpty, type Rule } from "@pagefront/lint-core";

/**
 * PDP-W-002 — Recommended field absent: description.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Spec check: "`data.description` is absent or empty." The helper's
 * empty-array and null cases are unreachable — the schema types
 * `description` as a string. The helper also treats a whitespace-only
 * string as empty; the catalogue says only "empty", so this is a
 * deliberate reading (consistent with the catalogue rules that spell
 * out "empty or whitespace-only").
 */
export const pdpW002: Rule = {
  id: "PDP-W-002",
  title: "Recommended field absent: description",
  severity: "warning",
  target: "$.data",
  check: fieldAbsentOrEmpty("description"),
  messageTemplate: "No description at `{path}`.",
  remediation:
    "Add a `description` field with a 1–3 paragraph prose description of the product. The description should match the Sheet's `inLanguage`.",
  introduced: "v0.6",
  specReference: "product.md#required-and-recommended-core-fields",
};
