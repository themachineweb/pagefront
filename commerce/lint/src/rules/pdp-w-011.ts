import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-011 — Multi-language reference without availableLanguages.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The catalogue's "recognizable language segment (`/fr/`, `/en/`,
 * `.fr.`, `.en.`, etc.)" is realized as: a path segment that is a
 * two-letter lowercase code optionally followed by a region subtag
 * (`/fr/`, `/en-GB/`), or a two-letter lowercase dotted label
 * (`.fr.`). Both the canonical URL and the Sheet's `sheet_url` are
 * inspected — the dotted-label form covers language-suffixed Sheet
 * names such as `….en.json` (pass #6, from the case-study run). The
 * catalogue declares the check heuristic and false positives
 * acceptable. "Does not declare" covers both an absent
 * `pagefront:availableLanguages` and an empty array (an empty
 * declaration declares nothing).
 */
const LANGUAGE_SEGMENT = /\/[a-z]{2}(?:-[A-Za-z]{2,4})?\/|\.[a-z]{2}\./;

export const pdpW011: Rule = {
  id: "PDP-W-011",
  title: "Multi-language reference without availableLanguages",
  severity: "warning",
  target: "$.data",
  check: (match, ctx) => {
    const canonicalUrl = ctx.sheet.canonical_url;
    if (typeof canonicalUrl !== "string") return null;
    const sheetUrl = ctx.sheet.sheet_url;
    const signal =
      LANGUAGE_SEGMENT.test(canonicalUrl) ||
      (typeof sheetUrl === "string" && LANGUAGE_SEGMENT.test(sheetUrl));
    if (!signal) return null;
    const data = match.value;
    const declared =
      typeof data === "object" && data !== null
        ? (data as Record<string, unknown>)["pagefront:availableLanguages"]
        : undefined;
    if (Array.isArray(declared) && declared.length > 0) return null;
    return { values: { canonical_url: canonicalUrl } };
  },
  messageTemplate:
    "Sheet at `{canonical_url}` appears to be part of a multi-language site but does not declare `pagefront:availableLanguages`.",
  remediation:
    "Add a `pagefront:availableLanguages` array listing the URLs of sibling sheets in other languages, with their BCP 47 language tags.",
  introduced: "v0.6",
  specReference: "product.md#internationalization",
};
