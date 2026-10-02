import type { Rule } from "@pagefront/lint-core";
import { statesPrice } from "./offer-price.js";

/**
 * PDP-W-029 — Offer price without a declared region.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires when the offer states a price and carries neither `areaServed`
 * nor `eligibleRegion`. `ineligibleRegion` alone does not satisfy the
 * check. Price-on-request offers are exempt.
 */
export const pdpW029: Rule = {
  id: "PDP-W-029",
  title: "Offer price without a declared region",
  severity: "warning",
  target: "$.data.offers[*]",
  check: (match) => {
    const offer = match.value;
    if (typeof offer !== "object" || offer === null) return null;
    const o = offer as Record<string, unknown>;
    if (!statesPrice(o)) return null;
    return o["areaServed"] === undefined && o["eligibleRegion"] === undefined ? {} : null;
  },
  messageTemplate: "Offer at `{path}` states a price but no region it applies to.",
  remediation:
    "Declare `areaServed` (or `eligibleRegion`) for the market whose displayed price this is. Where the market cannot be determined from the storefront, stating the tax basis via `valueAddedTaxIncluded` is the higher priority; see \"Tax inclusion.\"",
  introduced: "v0.9",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#tax-inclusion",
};
