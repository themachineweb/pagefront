import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, matchedField, memberEntries } from "./col-shared.js";
import { hostOf, renderHost } from "./sheet-url-host.js";

/**
 * COL-E-005 — Referenced sheet URL off its edge's host.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * A collection sheet and the sheets it references in `hasPart` and
 * `isPartOf` share a host (collection.md, "Identity"): a member's
 * `pagefront:sheetUrl` is checked against the *canonical host*. The
 * `brand` reference of a brand collection resolves under the brand edge
 * of the organization linking contract, as PDP-E-006 checks it on a
 * product sheet: against the host of the brand's `@id`. A hint with no
 * host (a blank string among them) is treated as absent and skipped:
 * a blank member hint is COL-W-002's finding. One finding per hint, at
 * the `pagefront:sheetUrl` path.
 */
export const colE005: Rule = {
  id: "COL-E-005",
  title: "Referenced sheet URL off its edge's host",
  severity: "error",
  target: "$.data['hasPart','isPartOf','brand']",
  check: (match, ctx) => {
    const field = matchedField(match.path);
    const hits: CheckHit[] = [];
    if (field === "brand") {
      const brand = asRecord(match.value);
      if (brand === null) return null;
      // A value with no host (a blank string among them) is treated as absent.
      const urlHost = hostOf(brand["pagefront:sheetUrl"]);
      if (urlHost === null) return null;
      const idHost = hostOf(brand["@id"]);
      if (urlHost === idHost) return null;
      return {
        path: `${match.path}['pagefront:sheetUrl']`,
        values: {
          sheetUrlHost: renderHost(urlHost),
          expected: `the brand's \`@id\` is on \`${renderHost(idHost)}\``,
        },
      };
    }
    const canonicalHost = hostOf(ctx.sheet.canonical_url);
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      const urlHost = hostOf(entry["pagefront:sheetUrl"]);
      if (urlHost === null || urlHost === canonicalHost) continue;
      hits.push({
        path: `${path}['pagefront:sheetUrl']`,
        values: {
          sheetUrlHost: renderHost(urlHost),
          expected: `the canonical page is on \`${renderHost(canonicalHost)}\``,
        },
      });
    }
    return hits;
  },
  messageTemplate: "Sheet URL at `{path}` is on host `{sheetUrlHost}`; {expected}.",
  remediation:
    "Point `pagefront:sheetUrl` at the sheet on the host the edge requires: a member or parent sheet on the storefront host, a brand sheet on the host of the brand's `@id`. A consumer rejects a hint off that host and falls back to the entry's `url`.",
  introduced: "release 0.5.0",
  appliesFrom: "0.5.0",
  specReference: "collection.md#identity",
};
