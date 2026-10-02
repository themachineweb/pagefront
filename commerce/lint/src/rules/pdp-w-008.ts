import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-008 — Sheet expires_at is past or trivially close to generated_at.
 * Transcribed from commerce/spec/rules.md (normative), with two
 * reductions the catalogue text leaves open:
 *
 * - The catalogue names both `$.expires_at` and `$.generated_at` as the
 *   target; a Rule carries one JSONPath. The target here is
 *   `$.expires_at` — the rule cannot fire without it (the field is
 *   optional) — and `generated_at` is read via RuleContext.
 * - The catalogue message's `{past | trivially close to generated_at}`
 *   prose alternation is realized as the `{reason}` placeholder carrying
 *   one of those two literal texts; when both conditions hold, `past`
 *   wins (the catalogue's order).
 *
 * "The time of linting" is the run's `checked_at` (ctx.checkedAt), not
 * the wall clock, so fixture output stays deterministic.
 */
export const pdpW008: Rule = {
  id: "PDP-W-008",
  title: "Sheet expires_at is past or trivially close to generated_at",
  severity: "warning",
  target: "$.expires_at",
  check: (match, ctx) => {
    const expiresAt = Date.parse(String(match.value));
    if (Number.isNaN(expiresAt)) return null;
    const generatedAt = Date.parse(String(ctx.sheet.generated_at));
    const past = expiresAt < Date.parse(ctx.checkedAt);
    const close = !Number.isNaN(generatedAt) && expiresAt - generatedAt < 60_000;
    if (!past && !close) return null;
    return {
      values: {
        expires_at: String(match.value),
        reason: past ? "past" : "trivially close to generated_at",
      },
    };
  },
  messageTemplate: "Sheet `expires_at` is `{expires_at}`, which is {reason}.",
  remediation:
    "Set `expires_at` to a sensible window after `generated_at`. For static product catalogs, hours to days; for sheets with live pricing or inventory signals, minutes.",
  introduced: "v0.6",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#the-envelope",
};
