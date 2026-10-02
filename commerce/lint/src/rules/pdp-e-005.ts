import type { Rule } from "@pagefront/lint-core";
import { hostOf, renderHost } from "./sheet-url-host.js";

/**
 * PDP-E-005 — Seller sheet URL off the product sheet's host.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires when an offer's `seller` carries `pagefront:sheetUrl` whose host
 * differs from the host of the sheet's own `sheet_url`, or has no host.
 * The seller's `@id` plays no part: the linking contract lets it be
 * minted on another domain the organization controls. The finding sits
 * at the `pagefront:sheetUrl` path.
 */
export const pdpE005: Rule = {
  id: "PDP-E-005",
  title: "Seller sheet URL off the product sheet's host",
  severity: "error",
  target: "$.data.offers[*]",
  check: (match, ctx) => {
    const offer = match.value;
    if (typeof offer !== "object" || offer === null) return null;
    const seller = (offer as Record<string, unknown>)["seller"];
    if (typeof seller !== "object" || seller === null || Array.isArray(seller)) return null;
    const s = seller as Record<string, unknown>;
    if (s["pagefront:sheetUrl"] === undefined) return null;
    const urlHost = hostOf(s["pagefront:sheetUrl"]);
    const sheetHost = hostOf(ctx.sheet.sheet_url);
    if (urlHost !== null && urlHost === sheetHost) return null;
    return {
      path: `${match.path}['seller']['pagefront:sheetUrl']`,
      values: { sheetUrlHost: renderHost(urlHost), sheetHost: renderHost(sheetHost) },
    };
  },
  messageTemplate:
    "Seller sheet URL at `{path}` is on host `{sheetUrlHost}`; the product sheet is on `{sheetHost}`.",
  remediation: "Publish the seller's organization sheet on the storefront host.",
  introduced: "v0.9",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "organization.md#linking-contract-identity-only",
};
