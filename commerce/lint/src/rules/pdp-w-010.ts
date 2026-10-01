import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-010 — Configurator and isVariantOf both populated for same dimension.
 * Transcribed from commerce/spec/rules.md (normative), with two
 * reductions:
 *
 * - The catalogue's target is `$.data`, but its message is per colliding
 *   dimension (`{dimension}`, `{configurator_path}`, `{variant_path}`),
 *   and a check yields at most one finding per match. The target here is
 *   each configurator dimension, so every colliding dimension produces
 *   its own finding — the per-dimension reading the message implies.
 * - "A property declared on a variant" is a direct property of the
 *   variant entry, or an `additionalProperty` entry whose `propertyID`
 *   matches the dimension — or, when the entry carries no `propertyID`,
 *   whose `name` matches (lenient fallback for content predating the
 *   convention; `propertyID` is the language-neutral coordination key,
 *   `name` the possibly-localized display label). An entry whose
 *   `propertyID` names a *different* dimension never falls back to
 *   `name`.
 *
 * `{variant_path}` is the first matching variant entry's normalized
 * path, built in the engine's path style.
 */
export const pdpW010: Rule = {
  id: "PDP-W-010",
  title: "Configurator and isVariantOf both populated for same dimension",
  severity: "warning",
  target: "$.data['pagefront:configurator'].dimensions[*]",
  check: (match, ctx) => {
    const dim = match.value;
    if (typeof dim !== "object" || dim === null) return null;
    const name = (dim as Record<string, unknown>)["name"];
    if (typeof name !== "string") return null;

    const data =
      typeof ctx.sheet.data === "object" && ctx.sheet.data !== null
        ? (ctx.sheet.data as Record<string, unknown>)
        : {};
    let variants: unknown;
    let variantBase: string;
    if (data["@type"] === "ProductGroup") {
      variants = data["hasVariant"];
      variantBase = "$['data']['hasVariant']";
    } else {
      const parent = data["isVariantOf"];
      variants =
        typeof parent === "object" && parent !== null
          ? (parent as Record<string, unknown>)["hasVariant"]
          : undefined;
      variantBase = "$['data']['isVariantOf']['hasVariant']";
    }
    if (!Array.isArray(variants) || variants.length === 0) return null;

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      if (typeof variant !== "object" || variant === null) continue;
      const v = variant as Record<string, unknown>;
      const direct = v[name] !== undefined;
      const viaProps =
        Array.isArray(v["additionalProperty"]) &&
        (v["additionalProperty"] as unknown[]).some((p) => {
          if (typeof p !== "object" || p === null) return false;
          const prop = p as Record<string, unknown>;
          return prop["propertyID"] !== undefined
            ? prop["propertyID"] === name
            : prop["name"] === name;
        });
      if (direct || viaProps) {
        return {
          values: {
            dimension: name,
            configurator_path: match.path,
            variant_path: `${variantBase}[${i}]`,
          },
        };
      }
    }
    return null;
  },
  messageTemplate:
    "Dimension `{dimension}` is declared in both `pagefront:configurator` at `{configurator_path}` and as a variant property at `{variant_path}`.",
  remediation:
    "Choose one representation. Use the configurator for combinatorial spaces, made-to-order products, or continuous dimensions. Use `ProductGroup` + `hasVariant` for discrete SKU families that ship from inventory.",
  introduced: "v0.6",
  specReference: "product.md#configurator-vs-productgroup-guidance",
};
