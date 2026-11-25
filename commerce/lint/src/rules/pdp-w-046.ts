import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-046 — Question with no answer.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires on a `question` entry with no `acceptedAnswer` and with
 * `suggestedAnswer` absent or an empty array. An `acceptedAnswer` that
 * is present but empty is PDP-W-027's, so presence alone (any value
 * other than undefined) silences this rule. `{name}` is the question's
 * own `name` (schema-required); `(unnamed)` defensively on invalid
 * input.
 */
export const pdpW046: Rule = {
  id: "PDP-W-046",
  title: "Question with no answer",
  severity: "warning",
  target: "$.data.question[*]",
  check: (match) => {
    const question = match.value;
    if (typeof question !== "object" || question === null) return null;
    const q = question as Record<string, unknown>;
    if (q["acceptedAnswer"] !== undefined) return null;
    const suggested = q["suggestedAnswer"];
    if (Array.isArray(suggested) && suggested.length > 0) return null;
    const name = typeof q["name"] === "string" ? (q["name"] as string) : "(unnamed)";
    return { values: { name } };
  },
  messageTemplate: "Question `{name}` at `{path}` has no answer.",
  remediation: "Add the answer, or remove the question.",
  introduced: "release 0.7.0",
  appliesFrom: "0.7.0",
  appliesToLegacy: false,
  specReference: "product.md#product-qa",
};
