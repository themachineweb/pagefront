import type { CheckHit, Rule } from "@pagefront/lint-core";
import { numericPrice, priceSpecificationEntries } from "./offer-price.js";

/**
 * PDP-E-004 — Offer price disagrees with its mirroring price specification.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * A mirroring entry carries a numeric `price` in the Offer's own
 * currency and none of the fields that legitimately make an entry's
 * amount differ from `price` (`priceType` for sale pricing,
 * `eligibleQuantity` for tiers, `validFrom`/`validThrough` for
 * scheduled prices). One finding per disagreeing entry, at the entry.
 */
const DIFFERENTIATING_FIELDS = ["priceType", "eligibleQuantity", "validFrom", "validThrough"];

export const pdpE004: Rule = {
  id: "PDP-E-004",
  title: "Offer price disagrees with its mirroring price specification",
  severity: "error",
  target: "$.data.offers[*]",
  check: (match) => {
    const offer = match.value;
    if (typeof offer !== "object" || offer === null) return null;
    const o = offer as Record<string, unknown>;
    const price = numericPrice(o["price"]);
    const currency = o["priceCurrency"];
    if (price === undefined || typeof currency !== "string") return null;
    const hits: CheckHit[] = [];
    for (const { entry, path } of priceSpecificationEntries(o, match.path)) {
      if (entry["priceCurrency"] !== currency) continue;
      if (DIFFERENTIATING_FIELDS.some((field) => entry[field] !== undefined)) continue;
      const specPrice = numericPrice(entry["price"]);
      if (specPrice === undefined || specPrice === price) continue;
      hits.push({
        path,
        values: { price: String(o["price"]), specPrice: String(entry["price"]) },
      });
    }
    return hits.length > 0 ? hits : null;
  },
  messageTemplate:
    "Price specification at `{path}` states `{specPrice}` but its Offer's `price` is `{price}`.",
  remediation:
    "Make the two amounts equal, or remove the duplicated amount from the specification entry and keep `valueAddedTaxIncluded` (and `priceCurrency`) on it.",
  introduced: "v0.9",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#tax-inclusion",
};
