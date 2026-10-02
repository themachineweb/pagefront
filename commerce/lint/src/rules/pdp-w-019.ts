import { isFullAbsoluteUrl, type Rule } from "@pagefront/lint-core";

/**
 * PDP-W-019 — relatedProduct identifier present but unusable.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Fires when every present value among `sku`, `gtin`, `gtin13`, `mpn`
 * is empty or whitespace-only, and any present `@id` is empty,
 * whitespace-only, or not URL-shaped (a full absolute URL per the
 * Definitions section). An entry with no identifier key at all fails
 * Layer 1's `anyOf` and never reaches the linter; defensively, such an
 * entry does not fire here. `{name}` is the entry's `name`, or the
 * literal `(unnamed)` when absent — the schema does not require `name`.
 */
export const pdpW019: Rule = {
  id: "PDP-W-019",
  title: "relatedProduct identifier present but unusable",
  severity: "warning",
  target: "$.data['pagefront:relatedProduct'][*]",
  check: (match) => {
    const entry = match.value;
    if (typeof entry !== "object" || entry === null) return null;
    const e = entry as Record<string, unknown>;

    let anyPresent = false;
    let anyUsable = false;
    for (const key of ["sku", "gtin", "gtin13", "mpn"]) {
      if (e[key] === undefined) continue;
      anyPresent = true;
      if (typeof e[key] === "string" && (e[key] as string).trim() !== "") {
        anyUsable = true;
      }
    }
    if (e["@id"] !== undefined) {
      anyPresent = true;
      if (isFullAbsoluteUrl(e["@id"]) && (e["@id"] as string).trim() !== "") {
        anyUsable = true;
      }
    }
    if (!anyPresent || anyUsable) return null;
    const name = typeof e["name"] === "string" ? (e["name"] as string) : "(unnamed)";
    return { values: { name } };
  },
  messageTemplate:
    "`pagefront:relatedProduct` entry `{name}` at `{path}` carries an identifier field that is present but empty or non-dereferenceable, so it has no usable structured identifier.",
  remediation:
    "Supply a real, dereferenceable identifier — a URL-shaped `@id`, or a non-empty `sku`, `gtin`, `gtin13`, or `mpn`. If no structured identifier is available for this reference, it does not meet `pagefront:relatedProduct`'s requirement: move it to Schema.org's native `isRelatedTo` (which carries no identifier requirement) and drop the `relationship` typing.",
  introduced: "v0.7",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#the-structured-identifier-requirement",
};
