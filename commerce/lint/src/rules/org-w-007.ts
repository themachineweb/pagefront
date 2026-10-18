import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord } from "./org-shared.js";
import { hostOf, renderHost } from "./sheet-url-host.js";

/**
 * ORG-W-007 — Catalogue entry off the sheet's host.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `hasOfferCatalog` is the catalogue entry point: its entries reference
 * Commerce Collection Sheets on the organization sheet's own host
 * (organization.md, "Catalogue entry point"). An entry whose
 * `pagefront:sheetUrl` is on another host leads a consumer off the
 * publisher's storefront, where the collection sheets it would find
 * are not this publisher's statement. A hint with no host is treated as
 * absent and skipped. One finding per entry, at the `pagefront:sheetUrl`
 * path.
 */
export const orgW007: Rule = {
  id: "ORG-W-007",
  title: "Catalogue entry off the sheet's host",
  severity: "warning",
  target: "$.data.hasOfferCatalog",
  check: (match, ctx) => {
    const catalog = asRecord(match.value);
    if (catalog === null || !Array.isArray(catalog["itemListElement"])) return null;
    const canonicalHost = hostOf(ctx.sheet.canonical_url);
    const hits: CheckHit[] = [];
    catalog["itemListElement"].forEach((item: unknown, i: number) => {
      const entry = asRecord(item);
      if (entry === null) return;
      // A value with no host (a blank string among them) is treated as absent.
      const urlHost = hostOf(entry["pagefront:sheetUrl"]);
      if (urlHost === null || urlHost === canonicalHost) return;
      hits.push({
        path: `${match.path}['itemListElement'][${i}]['pagefront:sheetUrl']`,
        values: { sheetUrlHost: renderHost(urlHost), host: renderHost(canonicalHost) },
      });
    });
    return hits;
  },
  messageTemplate:
    "Catalogue entry sheet URL at `{path}` is on host `{sheetUrlHost}`; the canonical page is on `{host}`.",
  remediation:
    "Point `pagefront:sheetUrl` at the collection sheet on this organization sheet's own host. A root in another language is reached through `pagefront:availableLanguages` on the root sheet, never through a second host here.",
  introduced: "release 0.5.0",
  appliesFrom: "0.5.0",
  specReference: "organization.md#catalogue-entry-point-any-role",
};
