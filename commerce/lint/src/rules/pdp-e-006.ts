import type { Rule } from "@pagefront/lint-core";
import { hostOf, renderHost } from "./sheet-url-host.js";

/**
 * PDP-E-006 — Brand sheet URL off the brand's host.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires when the data block's `brand` carries `pagefront:sheetUrl` whose
 * host differs from the host of the brand's `@id`. A brand with no `@id`,
 * or an `@id` without a host, fires too: there is no host for the URL to
 * match. The finding sits at the `pagefront:sheetUrl` path.
 */
export const pdpE006: Rule = {
  id: "PDP-E-006",
  title: "Brand sheet URL off the brand's host",
  severity: "error",
  target: "$.data.brand",
  check: (match) => {
    const brand = match.value;
    if (typeof brand !== "object" || brand === null || Array.isArray(brand)) return null;
    const b = brand as Record<string, unknown>;
    if (b["pagefront:sheetUrl"] === undefined) return null;
    const urlHost = hostOf(b["pagefront:sheetUrl"]);
    const idHost = hostOf(b["@id"]);
    if (urlHost !== null && urlHost === idHost) return null;
    return {
      path: `${match.path}['pagefront:sheetUrl']`,
      values: { sheetUrlHost: renderHost(urlHost), idHost: renderHost(idHost) },
    };
  },
  messageTemplate:
    "Brand sheet URL at `{path}` is on host `{sheetUrlHost}`; the brand's `@id` is on `{idHost}`.",
  remediation:
    "Point `pagefront:sheetUrl` at the sheet the brand publishes on its own host, or remove it.",
  introduced: "v0.9",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "organization.md#linking-contract-identity-only",
};
