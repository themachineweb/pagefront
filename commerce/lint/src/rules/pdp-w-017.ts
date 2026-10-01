import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-017 — Non-canonical BCP 47 language tag.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The catalogue's target — "`$.data.inLanguage` and any other
 * `inLanguage` fields in the Sheet" — is expressed as `$..inLanguage`,
 * which matches every `inLanguage` field at any depth.
 *
 * Canonical case per RFC 5646 §2.1.1: language subtag lowercase,
 * two-letter region subtags uppercase, four-letter (script) subtags
 * title-case — but only before the first singleton (a single-character
 * subtag: an extension singleton like `u`/`t`, or private-use `x`).
 * Every subtag from the first singleton onward, inclusive, is
 * lowercase. Case conventions only: no IANA-registry canonicalization
 * (preferred-value substitution, extlang reduction). Only string
 * values are checked; non-string values are Layer 1's concern.
 */
function canonicalCase(tag: string): string {
  let afterSingleton = false;
  return tag
    .split("-")
    .map((subtag, index) => {
      const lower = subtag.toLowerCase();
      if (subtag.length === 1) afterSingleton = true;
      if (index === 0 || afterSingleton) return lower;
      if (subtag.length === 2 && /^[a-z]{2}$/i.test(subtag)) {
        return lower.toUpperCase();
      }
      if (subtag.length === 4 && /^[a-z]{4}$/i.test(subtag)) {
        return lower[0].toUpperCase() + lower.slice(1);
      }
      return lower;
    })
    .join("-");
}

export const pdpW017: Rule = {
  id: "PDP-W-017",
  title: "Non-canonical BCP 47 language tag",
  severity: "warning",
  target: "$..inLanguage",
  check: (match) => {
    if (typeof match.value !== "string") return null;
    const canonical = canonicalCase(match.value);
    return canonical === match.value
      ? null
      : { values: { value: match.value, canonical } };
  },
  messageTemplate:
    'Language tag at `{path}` uses non-canonical case: `"{value}"`. Canonical form is `"{canonical}"`.',
  remediation:
    "Normalize the tag to canonical BCP 47 case. The semantic meaning is unchanged; only the case differs.",
  introduced: "v0.6",
  specReference: "product.md#upstream-equivalent-forms",
};
