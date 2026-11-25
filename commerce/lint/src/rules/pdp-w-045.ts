import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-045 — Suggested answer without an author.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The target selects `suggestedAnswer` entries, so presence is given by
 * the match; the check tests `author`: absent, an empty or
 * whitespace-only string, or an object with neither a non-empty `name`
 * nor a non-empty `@id`. An array of authors (Schema.org allows several)
 * passes when it is non-empty and every element passes on its own; the
 * schema admits a string or an object, so the array arm is defensive.
 * The message has no rule-specific placeholder beyond `{path}`.
 */
function names(author: unknown): boolean {
  if (typeof author === "string") return author.trim() !== "";
  if (Array.isArray(author)) return author.length > 0 && author.every(names);
  if (typeof author !== "object" || author === null) return false;
  const o = author as Record<string, unknown>;
  const has = (key: string) => typeof o[key] === "string" && (o[key] as string).trim() !== "";
  return has("name") || has("@id");
}

export const pdpW045: Rule = {
  id: "PDP-W-045",
  title: "Suggested answer without an author",
  severity: "warning",
  target: "$.data.question[*].suggestedAnswer[*]",
  check: (match) => {
    const answer = match.value;
    if (typeof answer !== "object" || answer === null) return null;
    return names((answer as Record<string, unknown>)["author"]) ? null : { values: {} };
  },
  messageTemplate: "Suggested answer at `{path}` names no author.",
  remediation:
    "Add `author` naming the contributor as shown on the page. If the answer is in fact the publisher's, move it to `acceptedAnswer`. If the contributor cannot be recovered, drop the entry.",
  introduced: "release 0.7.0",
  appliesFrom: "0.7.0",
  appliesToLegacy: false,
  specReference: "product.md#provenance",
};
