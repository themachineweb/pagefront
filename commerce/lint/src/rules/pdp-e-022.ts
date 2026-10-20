import type { Rule } from "@pagefront/lint-core";
import { asObject } from "./configurator-pricing.js";
import { isUnavailable } from "./unavailable-offer.js";

/**
 * PDP-E-022 — Checkout template on an unavailable offer.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * An Offer whose `availability` is OutOfStock, SoldOut or Discontinued
 * cannot be bought now, so it MUST NOT carry `checkoutPageURLTemplate`
 * ("Unavailable offers without a price"); `url` stays, since the page
 * is where a shopper asks to be notified. Fires whether or not the
 * offer states a price. Applies from release 0.6.0, whose Product Sheet
 * spec 0.12.0 introduces the requirement.
 */
export const pdpE022: Rule = {
  id: "PDP-E-022",
  title: "Checkout template on an unavailable offer",
  severity: "error",
  target: "$.data.offers[*]",
  check: (match) => {
    const offer = asObject(match.value);
    if (offer === null || !Object.prototype.hasOwnProperty.call(offer, "checkoutPageURLTemplate")) return null;
    if (!isUnavailable(offer)) return null;
    return { path: `${match.path}['checkoutPageURLTemplate']`, values: { availability: String(offer["availability"]) } };
  },
  messageTemplate: "Checkout template at `{path}` sits on an Offer whose `availability` is `{availability}`, which cannot be bought now.",
  remediation: "Remove the template; keep `url`, the page where a shopper can ask to be notified.",
  introduced: "release 0.6.0",
  // The requirement is introduced by release 0.6.0 (Product Sheet spec 0.12.0).
  appliesFrom: "0.6.0",
  specReference: "product.md#tax-inclusion",
};
