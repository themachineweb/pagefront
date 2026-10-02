import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-014 — ProductGroup variant URL absent on distinctly-addressable
 * variants. Transcribed from commerce/spec/rules.md (normative), with
 * two reductions:
 *
 * - The catalogue's target is `$.data.hasVariant[*]`, but the check and
 *   message are group-level ("ProductGroup at `{path}` has `{count}`
 *   variants…", firing when *none* of the entries declare a `url`). The
 *   target here is `$.data`, producing the one group-level finding the
 *   message describes.
 * - A variant identifier is contained in the group's `url` when a
 *   variant's `sku` or bare `@id` token (`#` stripped) appears in it as
 *   a whole token — delimited on both sides by one of `/ - _ . ? = & #`
 *   or the string's start/end. An identifier appearing only as part of
 *   a longer alphanumeric run (sku `12` inside `product-12345`) does
 *   not count, so coincidental substrings no longer suppress the
 *   warning.
 *
 * Per the catalogue: no fire without a top-level `url` (page-less
 * parent), and the partial-population case belongs to PDP-W-018. Per the
 * pass-#6 editor decision, same-document fragment `@id`s on variants
 * identify but do not address — they neither suppress the rule nor
 * change when it fires; only the message wording acknowledges them.
 */
export const pdpW014: Rule = {
  id: "PDP-W-014",
  title: "ProductGroup variant URL absent on distinctly-addressable variants",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = match.value;
    if (typeof data !== "object" || data === null) return null;
    const d = data as Record<string, unknown>;
    if (d["@type"] !== "ProductGroup") return null;
    const variants = d["hasVariant"];
    if (!Array.isArray(variants) || variants.length < 2) return null;
    const groupUrl = d["url"];
    if (typeof groupUrl !== "string" || groupUrl.trim() === "") return null;

    const entries = variants.filter(
      (v): v is Record<string, unknown> => typeof v === "object" && v !== null
    );
    const anyUrl = entries.some(
      (v) => typeof v["url"] === "string" && (v["url"] as string).trim() !== ""
    );
    if (anyUrl) return null;

    const DELIMITER = "[/\\-_.?=&#]";
    const containsAsToken = (url: string, id: string): boolean => {
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|${DELIMITER})${escaped}(?:${DELIMITER}|$)`).test(url);
    };
    const urlContainsVariantId = entries.some((v) => {
      const ids = [
        typeof v["sku"] === "string" ? (v["sku"] as string) : undefined,
        typeof v["@id"] === "string"
          ? (v["@id"] as string).replace(/^#/, "")
          : undefined,
      ];
      return ids.some(
        (id) => id !== undefined && id !== "" && containsAsToken(groupUrl, id)
      );
    });
    if (urlContainsVariantId) return null;

    return { values: { count: variants.length } };
  },
  messageTemplate:
    "ProductGroup at `{path}` has `{count}` variants with no declared per-variant `url`s. If each variant is genuinely reachable at its own address — its own page or a variant-selecting parameter — declare it in the variant's `url` field; a fragment `@id` identifies the variant but does not promise it is addressable.",
  remediation:
    "For each variant entry in `hasVariant`, add a `url` field with the variant's addressable URL — its own page (case 3) or the shared page with its variant-selecting query parameter (case 2). If all variants share the exact same URL with no parameter-based differentiation (case 1), the per-variant `url` field can be omitted.",
  introduced: "v0.6",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#per-variant-urls",
};
