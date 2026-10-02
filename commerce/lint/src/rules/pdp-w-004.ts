import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-004 — Offer price without currency.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Bespoke cross-field check: fires when the offer has `price` but
 * neither `priceCurrency` nor `priceSpecification`. The target matches
 * every `offers` entry (Offer or AggregateOffer); the check is
 * type-agnostic, since a bare `price` is equally ambiguous on either.
 */
export const pdpW004: Rule = {
  id: "PDP-W-004",
  title: "Offer price without currency",
  severity: "warning",
  target: "$.data.offers[*]",
  check: (match) => {
    const offer = match.value;
    if (typeof offer !== "object" || offer === null) return null;
    const o = offer as Record<string, unknown>;
    return o["price"] !== undefined &&
      o["priceCurrency"] === undefined &&
      o["priceSpecification"] === undefined
      ? {}
      : null;
  },
  messageTemplate: "Offer at `{path}` has `price` but no `priceCurrency`.",
  remediation:
    "Add a `priceCurrency` field with the ISO 4217 currency code matching the offer's currency.",
  introduced: "v0.6",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#offers",
};
