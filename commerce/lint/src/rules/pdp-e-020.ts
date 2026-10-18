import type { Rule } from "@pagefront/lint-core";
import { asObject } from "./configurator-pricing.js";
import { declaresRegion } from "./checkout-template.js";

/**
 * PDP-E-020 — Checkout template without a region.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * An Offer that carries `checkoutPageURLTemplate` declares the market the
 * checkout serves with `areaServed` or `eligibleRegion` ("Where to buy").
 * A region property that is empty or whitespace-only counts as absent.
 * The template's own validity is PDP-E-019's concern. Applies from
 * release 0.5.0, whose Product Sheet spec 0.11.0 introduces the
 * requirement.
 */
export const pdpE020: Rule = {
  id: "PDP-E-020",
  title: "Checkout template without a region",
  severity: "error",
  target: "$.data.offers[*]",
  check: (match) => {
    const offer = asObject(match.value);
    if (offer === null || !Object.prototype.hasOwnProperty.call(offer, "checkoutPageURLTemplate")) return null;
    return declaresRegion(offer) ? null : { path: match.path, values: {} };
  },
  messageTemplate: "Offer at `{path}` carries `checkoutPageURLTemplate` and neither `areaServed` nor `eligibleRegion`.",
  remediation: "Declare the region the checkout serves, or remove the template.",
  introduced: "release 0.5.0",
  // The requirement is introduced by release 0.5.0 (Product Sheet spec 0.11.0).
  appliesFrom: "0.5.0",
  specReference: "product.md#where-to-buy",
};
