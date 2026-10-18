import type { Rule } from "@pagefront/lint-core";
import { asObject, own } from "./configurator-pricing.js";
import { isAbsoluteHttpUrl } from "./checkout-template.js";

/**
 * PDP-E-021 — Offer `url` is not an absolute URL.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * An Offer's `url` is the page on which the shopper buys it ("Where to
 * buy"); when present it must be a full absolute URL with the scheme
 * http or https. Silent when the Offer carries no `url` (PDP-W-040's
 * concern on a sheet with several offers). Applies from release 0.5.0.
 */
export const pdpE021: Rule = {
  id: "PDP-E-021",
  title: "Offer url is not an absolute URL",
  severity: "error",
  target: "$.data.offers[*]",
  check: (match) => {
    const offer = asObject(match.value);
    if (offer === null || !Object.prototype.hasOwnProperty.call(offer, "url")) return null;
    const url = own(offer, "url");
    if (isAbsoluteHttpUrl(url)) return null;
    return { path: `${match.path}['url']`, values: { url: JSON.stringify(url) } };
  },
  messageTemplate: "Offer `url` at `{path}` is `{url}`, which is not an absolute `http` or `https` URL.",
  remediation: "Give the offer the absolute URL of the page where it is bought.",
  introduced: "release 0.5.0",
  // The requirement is introduced by release 0.5.0 (Product Sheet spec 0.11.0).
  appliesFrom: "0.5.0",
  specReference: "product.md#where-to-buy",
};
