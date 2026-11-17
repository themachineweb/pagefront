import type { CheckHit, Rule } from "@pagefront/lint-core";

/**
 * REV-W-001 — Empty `itemListElement`.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The array MAY be empty: a subject with no review yet has one. An
 * emission pipeline that lost the reviews produces the same shape, so the
 * warning asks for review and is no failure.
 */
export const revW001: Rule = {
  id: "REV-W-001",
  title: "Empty itemListElement",
  severity: "warning",
  target: "$.data.itemListElement",
  check: (match) => (Array.isArray(match.value) && match.value.length === 0 ? { values: {} } : null),
  messageTemplate: "`itemListElement` at `{path}` is empty: the sheet carries no review.",
  remediation:
    "Confirm the subject has no review under the declared policy. If the publisher shows reviews for it, list them.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#required-core-fields",
};
