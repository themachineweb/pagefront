import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-015 — Price-on-request without contact channel.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Bespoke check: `method` is anything other than `unspecified` and none
 * of `contactUrl`, `contactEmail`, `contactPhone` is declared (key
 * presence — the catalogue's "declares none of").
 */
export const pdpW015: Rule = {
  id: "PDP-W-015",
  title: "Price-on-request without contact channel",
  severity: "warning",
  target: "$.data.offers[*]['pagefront:priceOnRequest']",
  check: (match) => {
    const block = match.value;
    if (typeof block !== "object" || block === null) return null;
    const b = block as Record<string, unknown>;
    const method = b["method"];
    if (typeof method !== "string" || method === "unspecified") return null;
    if (
      b["contactUrl"] !== undefined ||
      b["contactEmail"] !== undefined ||
      b["contactPhone"] !== undefined
    ) {
      return null;
    }
    return { values: { method } };
  },
  messageTemplate:
    "Price-on-request at `{path}` declares method `{method}` but no contact channel (`contactUrl`, `contactEmail`, or `contactPhone`).",
  remediation:
    "Add the contact channel matching the declared method (e.g., `contactUrl` for `authorized_retailer` and `dealer_network`, `contactEmail` for `email`, `contactPhone` for `phone`, `contactUrl` for `quote_form`). If no such channel exists, change `method` to `unspecified`.",
  introduced: "v0.6",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#price-on-request-offers",
};
