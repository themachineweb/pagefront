import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asObject, own, pricedConfiguratorId, pricingBlock, seg } from "./configurator-pricing.js";

/**
 * PDP-E-017 — Configurator reference does not resolve.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * An exclusion (`pagefront:configurator.exclusions[]`) and an
 * adjustment's `when` (`pagefront:configuratorPricing.adjustments[].when`)
 * are partial configurations: each pair names a dimension and one of its
 * options. A pair fires when the configurator declares no dimension of
 * that name, or when the dimension lists `options` and none has that
 * `value`. Values are compared by JSON value equality, type included,
 * with no coercion: `1` is not `"1"`, and `1` and `1.0` are the same
 * number. A dimension that declares no `options` (continuous,
 * system-defined, free text) has nothing to check the value against.
 * One finding per unresolved pair, at the pair.
 *
 * Type hint: when the pair matches no option but a declared option has
 * the same text once both are converted to strings, the finding says so
 * and carries the two types and the declared value in `values`. It
 * stays an error; nothing is coerced.
 */
type Scalar = string | number | boolean;

function isScalar(value: unknown): value is Scalar {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

/** The declared option that equals `value` after string conversion, if any. */
function sameTextOption(value: unknown, declared: unknown[]): Scalar | undefined {
  if (!isScalar(value)) return undefined;
  return declared.find((v): v is Scalar => isScalar(v) && String(v) === String(value));
}

interface DeclaredDimension {
  /** The option values as written; null when the dimension lists none. */
  values: unknown[] | null;
}

function declaredDimensions(configurator: Record<string, unknown>): Map<string, DeclaredDimension> {
  const out = new Map<string, DeclaredDimension>();
  const dimensions = configurator["dimensions"];
  if (!Array.isArray(dimensions)) return out;
  for (const entry of dimensions) {
    const d = asObject(entry);
    if (d === null || typeof d["name"] !== "string" || out.has(d["name"])) continue;
    const options = d["options"];
    out.set(d["name"], {
      values:
        Array.isArray(options) && options.length > 0
          ? options.map((option) => own(asObject(option), "value"))
          : null,
    });
  }
  return out;
}

function unresolved(
  pairs: unknown,
  path: string,
  dimensions: Map<string, DeclaredDimension>
): CheckHit[] {
  const hits: CheckHit[] = [];
  for (const [dimension, value] of Object.entries(asObject(pairs) ?? {})) {
    const option = JSON.stringify(value);
    const declared = dimensions.get(dimension);
    const at = `${path}${seg(dimension)}`;
    if (declared === undefined) {
      const problem = `the configurator declares no dimension \`${dimension}\``;
      hits.push({ path: at, values: { dimension, option, problem } });
    } else if (declared.values !== null && !declared.values.some((v) => v === value)) {
      const near = sameTextOption(value, declared.values);
      if (near === undefined) {
        const problem = `\`${dimension}\` lists no option \`${option}\``;
        hits.push({ path: at, values: { dimension, option, problem } });
      } else {
        const declaredOption = JSON.stringify(near);
        const referenceType = typeof value;
        const declaredType = typeof near;
        const problem = `it references \`${option}\` (${referenceType}); dimension \`${dimension}\` declares \`${declaredOption}\` (${declaredType})`;
        hits.push({
          path: at,
          values: {
            dimension,
            option,
            problem,
            reference_type: referenceType,
            declared_option: declaredOption,
            declared_type: declaredType,
          },
        });
      }
    }
  }
  return hits;
}

export const pdpE017: Rule = {
  id: "PDP-E-017",
  title: "Configurator reference does not resolve",
  severity: "error",
  target: "$.data",
  check: (match) => {
    const data = asObject(match.value);
    const configurator = asObject(own(data, "pagefront:configurator"));
    if (data === null || configurator === null) return null;
    const dimensions = declaredDimensions(configurator);
    const hits: CheckHit[] = [];

    const exclusions = configurator["exclusions"];
    if (Array.isArray(exclusions)) {
      exclusions.forEach((entry, index) => {
        hits.push(
          ...unresolved(entry, `${match.path}['pagefront:configurator']['exclusions'][${index}]`, dimensions)
        );
      });
    }

    // An adjustment's `when` refers to the configurator its pricing block
    // names. A block naming another `@id` is PDP-E-001's finding, and its
    // references are not resolved against this configurator.
    const offers = own(data, "offers");
    if (Array.isArray(offers)) {
      offers.forEach((offer, offerIndex) => {
        const block = pricingBlock(offer);
        if (block === null || !Array.isArray(block["adjustments"])) return;
        if (pricedConfiguratorId(block) !== configurator["@id"]) return;
        block["adjustments"].forEach((adjustment, index) => {
          hits.push(
            ...unresolved(
              asObject(adjustment)?.["when"],
              `${match.path}['offers'][${offerIndex}]['pagefront:configuratorPricing']['adjustments'][${index}]['when']`,
              dimensions
            )
          );
        });
      });
    }
    return hits.length > 0 ? hits : null;
  },
  messageTemplate:
    "Configuration reference at `{path}` (dimension `{dimension}`, option `{option}`) does not resolve: {problem}.",
  remediation:
    "Name a dimension the configurator declares, and write the option exactly as its `value` is written in that dimension's `options`, including its JSON type. Remove an exclusion or adjustment that refers to an option the product no longer offers.",
  introduced: "release 0.4.0",
  // The requirement is introduced by release 0.4.0 (Product Sheet spec 0.10.0).
  appliesFrom: "0.4.0",
  specReference: "product.md#configurator-pricing-and-price-bands",
};
