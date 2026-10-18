import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asObject, own } from "./configurator-pricing.js";

/**
 * PDP-W-040 — Offer without `url` among several offers.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * An Offer without `url` is bought on the product's page; that default
 * serves a single offer. When `offers` is an array with more than one
 * entry, each entry should state its own `url` ("Where to buy"). One
 * finding per entry without it; silent on a single offer. Applies from
 * release 0.5.0.
 */
export const pdpW040: Rule = {
  id: "PDP-W-040",
  title: "Offer without url among several offers",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = asObject(match.value);
    const offers = own(data, "offers");
    if (!Array.isArray(offers) || offers.length < 2) return null;
    const hits: CheckHit[] = [];
    offers.forEach((entry, index) => {
      const offer = asObject(entry);
      if (offer !== null && !Object.prototype.hasOwnProperty.call(offer, "url")) {
        hits.push({ path: `${match.path}['offers'][${index}]`, values: {} });
      }
    });
    return hits.length > 0 ? hits : null;
  },
  messageTemplate: "Offer at `{path}` has no `url`, and the sheet carries several offers.",
  remediation: "Give each offer the URL of the page where it is bought.",
  introduced: "release 0.5.0",
  // "Where to buy" is introduced by release 0.5.0 (Product Sheet spec 0.11.0).
  appliesFrom: "0.5.0",
  specReference: "product.md#where-to-buy",
};
