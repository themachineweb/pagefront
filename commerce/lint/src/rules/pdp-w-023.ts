import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-023 — Recall notice coexists with InStock offer.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The target's RFC 9535 filter selects only recall notices, so the
 * check needs no noticeType gate; `offers` is read via the rule
 * context, per the catalogue's target line. "Either scheme variant"
 * (PDP-W-013's equivalence): https:// or http:// schema.org InStock.
 * `{offerPath}` is the path of the first offer declaring InStock,
 * built in the engine's normalized path style.
 */
const IN_STOCK = new Set([
  "https://schema.org/InStock",
  "http://schema.org/InStock",
]);

export const pdpW023: Rule = {
  id: "PDP-W-023",
  title: "Recall notice coexists with InStock offer",
  severity: "warning",
  target: "$.data['pagefront:safetyNotice'][?@.noticeType == 'recall']",
  check: (_match, ctx) => {
    const data =
      typeof ctx.sheet.data === "object" && ctx.sheet.data !== null
        ? (ctx.sheet.data as Record<string, unknown>)
        : {};
    const offers = data["offers"];
    if (!Array.isArray(offers)) return null;
    const index = offers.findIndex(
      (offer) =>
        typeof offer === "object" &&
        offer !== null &&
        IN_STOCK.has((offer as Record<string, unknown>)["availability"] as string)
    );
    if (index === -1) return null;
    return { values: { offerPath: `$['data']['offers'][${index}]` } };
  },
  messageTemplate:
    "Recall safety notice at `{path}` coexists with offer at `{offerPath}` declaring `InStock`; the recall overrides commercial signals and the offer data likely needs updating.",
  remediation:
    "Update the offer's `availability` to reflect the corrective measure (typically `Discontinued` or `OutOfStock`). If the recall has been resolved and the product legitimately relisted, remove the stale `pagefront:safetyNotice` entry instead.",
  introduced: "v0.8",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#safety-notices",
};
