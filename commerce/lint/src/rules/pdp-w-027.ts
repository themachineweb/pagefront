import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-027 — Empty accepted answer.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The target selects `acceptedAnswer` objects, so presence is given by
 * the match; the check tests `text` (absent, empty, or whitespace-only
 * — the schema requires non-empty `text`, so only the whitespace arm
 * is reachable on Layer-1-valid input; the others are defensive).
 * `{name}` is the parent question's `name` (schema-required), read
 * from the sheet via the match's path index; `(unnamed)` defensively
 * on invalid input.
 */
export const pdpW027: Rule = {
  id: "PDP-W-027",
  title: "Empty accepted answer",
  severity: "warning",
  target: "$.data.question[*].acceptedAnswer",
  check: (match, ctx) => {
    const answer = match.value;
    if (typeof answer !== "object" || answer === null) return null;
    const text = (answer as Record<string, unknown>)["text"];
    const empty =
      text === undefined ||
      text === null ||
      (typeof text === "string" && text.trim() === "");
    if (!empty) return null;

    let name = "(unnamed)";
    const index = /\['question'\]\[(\d+)\]/.exec(match.path)?.[1];
    const data =
      typeof ctx.sheet.data === "object" && ctx.sheet.data !== null
        ? (ctx.sheet.data as Record<string, unknown>)
        : {};
    if (index !== undefined && Array.isArray(data["question"])) {
      const question = (data["question"] as unknown[])[Number(index)];
      if (
        typeof question === "object" &&
        question !== null &&
        typeof (question as Record<string, unknown>)["name"] === "string"
      ) {
        name = (question as Record<string, unknown>)["name"] as string;
      }
    }
    return { values: { name } };
  },
  messageTemplate: "Question `{name}` at `{path}` has an `acceptedAnswer` with no text.",
  remediation:
    "Populate `acceptedAnswer.text` with the answer prose, or remove the `acceptedAnswer` (and consider whether an unanswered question belongs in the sheet at all).",
  introduced: "v0.8",
  specReference: "product.md#product-qa",
};
