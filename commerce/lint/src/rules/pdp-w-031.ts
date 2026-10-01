import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-031 — Seller reference not locatable.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires when an offer's `seller` carries `@id` but no
 * `pagefront:sheetUrl`, and the offer carries neither
 * `hasMerchantReturnPolicy` nor `shippingDetails`: the terms it would
 * inherit sit on a seller sheet no consumer can locate. The finding
 * sits at the `seller` path.
 */
export const pdpW031: Rule = {
  id: "PDP-W-031",
  title: "Seller reference not locatable",
  severity: "warning",
  target: "$.data.offers[*]",
  check: (match) => {
    const offer = match.value;
    if (typeof offer !== "object" || offer === null) return null;
    const o = offer as Record<string, unknown>;
    const seller = o["seller"];
    if (typeof seller !== "object" || seller === null || Array.isArray(seller)) return null;
    const s = seller as Record<string, unknown>;
    if (s["@id"] === undefined || s["pagefront:sheetUrl"] !== undefined) return null;
    if (o["hasMerchantReturnPolicy"] !== undefined || o["shippingDetails"] !== undefined) return null;
    return { path: `${match.path}['seller']` };
  },
  messageTemplate:
    "Seller at `{path}` has an `@id` but no `pagefront:sheetUrl`, and the Offer states no return or shipping terms of its own.",
  remediation: "Add `pagefront:sheetUrl` to the seller reference, or state the terms on the Offer.",
  introduced: "v0.9",
  specReference: "organization.md#linking-contract-identity-only",
};
