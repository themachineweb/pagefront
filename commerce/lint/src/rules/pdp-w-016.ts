import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-016 — Possibly-missed price.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Bespoke cross-field check: `availability` and `priceCurrency` present,
 * but no `price`, no `priceSpecification`, no `pagefront:priceOnRequest`.
 */
export const pdpW016: Rule = {
  id: "PDP-W-016",
  title: "Possibly-missed price",
  severity: "warning",
  target: "$.data.offers[*]",
  check: (match) => {
    const offer = match.value;
    if (typeof offer !== "object" || offer === null) return null;
    const o = offer as Record<string, unknown>;
    return o["availability"] !== undefined &&
      o["priceCurrency"] !== undefined &&
      o["price"] === undefined &&
      o["priceSpecification"] === undefined &&
      o["pagefront:priceOnRequest"] === undefined
      ? {}
      : null;
  },
  messageTemplate:
    "Offer at `{path}` has commercial structure (availability, priceCurrency) but no price declaration (no `price`, no `priceSpecification`, no `pagefront:priceOnRequest`).",
  remediation:
    "Add `price` (and confirm `priceCurrency`) if the price was missed during extraction. If the merchant intentionally publishes no price, declare `pagefront:priceOnRequest` with an appropriate `method` and contact channel.",
  introduced: "v0.6",
  specReference: "product.md#price-on-request-offers",
};
