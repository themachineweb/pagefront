import {
  collectDeclaredIds,
  isInlineDeclaration,
  isSameDocumentId,
  valueAtPath,
  type Rule,
} from "@pagefront/lint-core";
import { readConfigurator } from "./configurator-pricing.js";

/**
 * PDP-E-001 — Broken @id reference.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The target matches every `@id` in the Sheet; the check fires only on
 * *reference-form* usages (Definitions) inside the schema-derived
 * reference-carrying fields (`itemOffered` on `offers` entries,
 * `isVariantOf`), detected from the match path. The form test examines
 * the object carrying the matched `@id` (parent of the match): an
 * inline declaration there is not a reference — it declares its `@id`
 * into the resolution candidate set instead (`collectDeclaredIds`, the
 * form-based machinery shared with PDP-W-020). For a reference-form entry,
 * a same-document `@id` (Definitions) must resolve by exact string
 * match; only a non-same-document full URL is a cross-Sheet reference,
 * exempt from internal resolution.
 *
 * A pricing block's `configurator` reference has no cross-Sheet
 * carve-out: whatever its form, it resolves only against the `@id` of
 * the data block's `pagefront:configurator`, by exact string match.
 */
const CONFIGURATOR_REFERENCE = /\['pagefront:configuratorPricing'\]\['configurator'\]\['@id'\]$/;
const REFERENCE_SEGMENT = /\['itemOffered'\]|\['isVariantOf'\]/;

export const pdpE001: Rule = {
  id: "PDP-E-001",
  title: "Broken @id reference",
  severity: "error",
  target: "$..['@id']",
  check: (match, ctx) => {
    const value = match.value;
    if (typeof value !== "string") return null;
    if (CONFIGURATOR_REFERENCE.test(match.path)) {
      return readConfigurator(ctx.sheet)?.id === value ? null : { values: { value } };
    }
    if (!REFERENCE_SEGMENT.test(match.path)) return null;
    const carrier = valueAtPath(ctx.sheet, match.path.replace(/\['@id'\]$/, ""));
    if (isInlineDeclaration(carrier)) return null; // declares, not references
    if (!isSameDocumentId(value, ctx.sheet)) return null; // cross-Sheet: URL shape is given
    const resolves = collectDeclaredIds(ctx.sheet.data).has(value);
    return resolves ? null : { values: { value } };
  },
  messageTemplate:
    "Reference `{value}` at `{path}` does not resolve to any entity in this Sheet.",
  remediation:
    "Either correct the reference to match an existing `@id`, or add the referenced entity to the Sheet. Same-document references (fragments, bare tokens, or full URLs on this Sheet's own base) must resolve within the Sheet, by exact string match. A pricing block's `configurator.@id` must equal the `@id` declared on the Sheet's `pagefront:configurator`. A full-URL `@id` on another document's base in `isVariantOf` or a `hasVariant` entry is a legitimate cross-Sheet reference (multi-Sheet variant family) and is validated for URL shape only — see PDP-W-021 for the traversal-hint recommendation that accompanies it.",
  introduced: "v0.6",
  specReference: "product.md#itemoffered-references",
};
