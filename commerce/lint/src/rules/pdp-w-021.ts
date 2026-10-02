import {
  isFullAbsoluteUrl,
  isInlineDeclaration,
  isSameDocumentId,
  type CheckHit,
  type Rule,
} from "@pagefront/lint-core";

/**
 * PDP-W-021 — Cross-Sheet variant link missing `sheet_url` traversal hint.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The target selects the `hasVariant` array (forward links) and the
 * `isVariantOf` object (backward link); per the catalogue, the shape
 * variance is handled here in the check, with per-entry findings via
 * path overrides. A link is cross-Sheet by form and base together: the
 * entry is reference form (Definitions — a stub; an inline declaration
 * never fires, whatever its `@id`'s base) and its `@id` is a full
 * absolute URL that is not a same-document `@id`. The earlier
 * forward-direction inline-`offers` carve-out is subsumed by the form
 * test (`offers` is a substantive property). `{name}` is the entry's
 * `name`, or `(unnamed)` when absent — always `(unnamed)` on a firing
 * entry, since a `name` would make it an inline declaration.
 */
function sheetUrlMissing(e: Record<string, unknown>): boolean {
  const v = e["sheet_url"];
  return v === undefined || (typeof v === "string" && v.trim() === "");
}

export const pdpW021: Rule = {
  id: "PDP-W-021",
  title: "Cross-Sheet variant link missing `sheet_url` traversal hint",
  severity: "warning",
  target: "$.data['hasVariant','isVariantOf']",
  check: (match, ctx) => {
    const entries: Array<{ entry: unknown; path: string }> = Array.isArray(match.value)
      ? match.value.map((entry, i) => ({ entry, path: `${match.path}[${i}]` }))
      : [{ entry: match.value, path: match.path }];

    const hits: CheckHit[] = [];
    for (const { entry, path } of entries) {
      if (typeof entry !== "object" || entry === null) continue;
      const e = entry as Record<string, unknown>;
      if (isInlineDeclaration(e)) continue; // declares its entity here, not a stub
      if (!isFullAbsoluteUrl(e["@id"])) continue; // internal @id: not a separate Sheet
      if (isSameDocumentId(e["@id"], ctx.sheet)) continue; // full URL on this Sheet's base: same document
      if (!sheetUrlMissing(e)) continue;
      const name = typeof e["name"] === "string" ? (e["name"] as string) : "(unnamed)";
      hits.push({ path, values: { name } });
    }
    return hits;
  },
  messageTemplate:
    "Variant link `{name}` at `{path}` appears to reference a separate Sheet by `@id` but omits the recommended `sheet_url`; consumers must reach the target Sheet via `url` + `describedby`.",
  remediation:
    "Add `sheet_url` with the target's Sheet URL — the variant's Sheet URL on a parent `hasVariant` entry, or the parent's Sheet URL on a variant's `isVariantOf`. If you do not emit a separate Sheet for the target (the family is modeled inline in one ProductGroup Sheet), no cross-Sheet link exists and `sheet_url` does not apply.",
  introduced: "v0.7",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#multi-sheet-variant-families",
};
