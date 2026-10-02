import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-013 — Legacy HTTP Schema.org URI.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The catalogue targets "`$..availability`, `$..itemCondition`, and any
 * other Schema.org URI fields" — an open-ended set. Reduced here to
 * `$..*` with a string check: any string value anywhere in the sheet
 * matching `http://schema.org/...` fires, which covers every
 * "Schema.org URI field" by definition of carrying such a value, and
 * cannot fire on anything else.
 */
export const pdpW013: Rule = {
  id: "PDP-W-013",
  title: "Legacy HTTP Schema.org URI",
  severity: "warning",
  target: "$..*",
  check: (match) =>
    typeof match.value === "string" &&
    match.value.startsWith("http://schema.org/")
      ? { values: { value: match.value } }
      : null,
  messageTemplate: "Legacy HTTP Schema.org URI `{value}` at `{path}`.",
  remediation:
    "Change `http://schema.org/...` to `https://schema.org/...`. The value is otherwise unchanged.",
  introduced: "v0.6",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#offers",
};
