import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-018 — Inconsistent per-variant URL presence.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires on each url-less entry when at least one sibling declares a
 * non-empty `url` — the sibling comparison runs over ctx.allMatches
 * (every `hasVariant` entry). The catalogue's "`@type` is `ProductGroup`
 * (or `data.hasVariant` is present)" gate is satisfied by the target
 * itself: `$.data.hasVariant[*]` only matches when `hasVariant` is
 * present.
 */
const hasUrl = (value: unknown): boolean =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Record<string, unknown>)["url"] === "string" &&
  ((value as Record<string, unknown>)["url"] as string).trim() !== "";

export const pdpW018: Rule = {
  id: "PDP-W-018",
  title: "Inconsistent per-variant URL presence",
  severity: "warning",
  target: "$.data.hasVariant[*]",
  check: (match, ctx) => {
    if (ctx.allMatches.length < 2) return null;
    if (hasUrl(match.value)) return null;
    return ctx.allMatches.some((m) => hasUrl(m.value)) ? {} : null;
  },
  messageTemplate:
    "Variant at `{path}` has no `url`, but other variants in the same ProductGroup declare one.",
  remediation:
    "Add a `url` to this variant matching its distinct addressable page state, consistent with its siblings. If this variant genuinely shares the exact same URL as the others with no parameter-based differentiation (case 1 in the spec), the per-variant `url` should instead be omitted from *all* entries so presence is uniform.",
  introduced: "v0.7",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#per-variant-urls",
};
