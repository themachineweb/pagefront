import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord } from "./rev-shared.js";
import { hostOf, renderHost } from "./sheet-url-host.js";

/**
 * REV-E-009 — Subject sheet URL off the canonical host.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The `about` reference and the `pagefront:sheetUrl` on it share the
 * canonical host, as members and parents do in the Collection Sheet
 * ("Identity" in review.md). A hint with no host (a blank string among
 * them) is treated as absent and skipped. The finding sits at the hint.
 */
export const revE009: Rule = {
  id: "REV-E-009",
  title: "Subject sheet URL off the canonical host",
  severity: "error",
  target: "$.data.about",
  check: (match, ctx) => {
    const about = asRecord(match.value);
    if (about === null) return null;
    const urlHost = hostOf(about["pagefront:sheetUrl"]);
    if (urlHost === null) return null;
    const canonicalHost = hostOf(ctx.sheet.canonical_url);
    if (urlHost === canonicalHost) return null;
    return {
      path: `${match.path}['pagefront:sheetUrl']`,
      values: { sheetUrlHost: renderHost(urlHost), host: renderHost(canonicalHost) },
    };
  },
  messageTemplate: "Sheet URL at `{path}` is on host `{sheetUrlHost}`; the canonical page is on `{host}`.",
  remediation:
    "Point the subject's `pagefront:sheetUrl` at its sheet on the storefront host, the host of `canonical_url`. A consumer rejects a hint off that host and falls back to the subject's `url`.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#identity",
};
