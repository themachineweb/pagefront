import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-025 — Feature value embeds a unit in a string.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The catalogue pattern: optional sign, digits with optional decimal
 * separator, whitespace, then any alphabetic unit token or unit
 * symbol. The whitespace is optional in the regex — the catalogue's
 * own firing example `"12″"` has none. The unit token excludes digits
 * and the separator characters, so a plain formatted number
 * (`"1,500.00"`) is not a number-then-unit match and does not fire.
 * `{name}` is schema-required on every feature entry.
 */
const NUMBER_THEN_UNIT = /^[+-]?\d+(?:[.,]\d+)?\s*[^\s0-9.,+-]+$/;

export const pdpW025: Rule = {
  id: "PDP-W-025",
  title: "Feature value embeds a unit in a string",
  severity: "warning",
  target: "$.data['pagefront:featureGroup'][*].feature[*]",
  check: (match) => {
    const entry = match.value;
    if (typeof entry !== "object" || entry === null) return null;
    const e = entry as Record<string, unknown>;
    if (e["unitCode"] !== undefined) return null;
    if (typeof e["value"] !== "string" || !NUMBER_THEN_UNIT.test(e["value"])) {
      return null;
    }
    return { values: { name: String(e["name"]), value: e["value"] } };
  },
  messageTemplate:
    "Feature `{name}` at `{path}` carries value `{value}`, which parses as a number plus a unit.",
  remediation:
    "Move the numeric part into `value`, express the unit as a `unitCode`, and if the merchant's display formatting matters, carry the original string in `pagefront:presentationValue`.",
  introduced: "v0.8",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#feature-groups",
};
