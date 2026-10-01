import type { Rule } from "@pagefront/lint-core";
import { priceSpecificationEntries, statesPrice } from "./offer-price.js";

/**
 * PDP-W-028 — Offer price without a tax-inclusion statement.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires when the offer states a price (`price`, or a non-empty
 * `priceSpecification`) and no `priceSpecification` entry carries a
 * boolean `valueAddedTaxIncluded`. Price-on-request offers are exempt.
 */
export const pdpW028: Rule = {
  id: "PDP-W-028",
  title: "Offer price without a tax-inclusion statement",
  severity: "warning",
  target: "$.data.offers[*]",
  check: (match) => {
    const offer = match.value;
    if (typeof offer !== "object" || offer === null) return null;
    const o = offer as Record<string, unknown>;
    if (!statesPrice(o)) return null;
    const stated = priceSpecificationEntries(o, match.path).some(
      ({ entry }) => typeof entry["valueAddedTaxIncluded"] === "boolean"
    );
    return stated ? null : {};
  },
  messageTemplate:
    "Offer at `{path}` states a price but not whether value-added tax is included.",
  remediation:
    "Add a `UnitPriceSpecification` entry mirroring `price` with `valueAddedTaxIncluded` set to `true` or `false`; on an Offer that already uses `priceSpecification`, set the flag on each entry.",
  introduced: "v0.9",
  specReference: "product.md#tax-inclusion",
};
