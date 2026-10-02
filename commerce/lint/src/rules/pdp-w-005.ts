import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-005 — Material composition percentages don't sum to 100.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The catalogue targets both `pagefront:materialComposition` and its
 * textile alias `pagefront:fabricComposition`; a Rule carries one
 * JSONPath, expressed here as an RFC 9535 multi-selector bracket. Each
 * match is one composition array. Per the catalogue, the rule does not
 * fire if any entry omits `percentage`; an empty array is read as having
 * no percentage-declaring entries and does not fire (the catalogue's
 * "all entries declare" would be vacuously true on it, but a sum of 0
 * on zero materials is not the transcription-error signal this rule
 * exists for). Per the catalogue, `{sum}` is rendered with at most two
 * decimal places, so floating-point summation noise never reaches the
 * report.
 */
export const pdpW005: Rule = {
  id: "PDP-W-005",
  title: "Material composition percentages don't sum to 100",
  severity: "warning",
  target: "$.data['pagefront:materialComposition','pagefront:fabricComposition']",
  check: (match) => {
    const entries = match.value;
    if (!Array.isArray(entries) || entries.length === 0) return null;
    const percentages: number[] = [];
    for (const entry of entries) {
      const p =
        typeof entry === "object" && entry !== null
          ? (entry as Record<string, unknown>)["percentage"]
          : undefined;
      if (typeof p !== "number") return null;
      percentages.push(p);
    }
    const sum = percentages.reduce((a, b) => a + b, 0);
    return sum >= 99.5 && sum <= 100.5
      ? null
      : { values: { sum: Math.round(sum * 100) / 100 } };
  },
  messageTemplate:
    "Material composition percentages at `{path}` sum to `{sum}`, not approximately 100.",
  remediation:
    "Verify the composition data. If a material is missing, add it. If the values are correct but the publisher's source data uses percentages for a different denominator, omit `percentage` rather than use a value that doesn't represent a fraction of total composition.",
  introduced: "v0.6",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#materials-material-and-pagefrontmaterialcomposition",
};
