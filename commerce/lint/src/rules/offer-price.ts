/**
 * Shared helpers for the offer-price rules (PDP-E-004, PDP-W-028,
 * PDP-W-029). The schema admits `priceSpecification` as one object or
 * an array of objects; the rules treat an object as a single entry.
 */

export interface PriceSpecificationEntry {
  entry: Record<string, unknown>;
  /** Concrete JSONPath of the entry, in the engine's normalized style. */
  path: string;
}

/**
 * Every object entry of an offer's `priceSpecification`, with the path
 * each would carry in a finding. A bare object yields one entry at the
 * field's own path; an array yields one per object element.
 */
export function priceSpecificationEntries(
  offer: Record<string, unknown>,
  offerPath: string
): PriceSpecificationEntry[] {
  const spec = offer["priceSpecification"];
  const fieldPath = `${offerPath}['priceSpecification']`;
  if (Array.isArray(spec)) {
    const out: PriceSpecificationEntry[] = [];
    spec.forEach((item, index) => {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        out.push({ entry: item as Record<string, unknown>, path: `${fieldPath}[${index}]` });
      }
    });
    return out;
  }
  if (typeof spec === "object" && spec !== null) {
    return [{ entry: spec as Record<string, unknown>, path: fieldPath }];
  }
  return [];
}

/**
 * True when the offer states a price at all: a `price` field, or a
 * `priceSpecification` with at least one member. Offers declaring
 * `pagefront:priceOnRequest` are outside the pricing rules entirely.
 */
export function statesPrice(offer: Record<string, unknown>): boolean {
  if (offer["pagefront:priceOnRequest"] !== undefined) return false;
  if (offer["price"] !== undefined) return true;
  const spec = offer["priceSpecification"];
  if (Array.isArray(spec)) return spec.length > 0;
  if (typeof spec === "object" && spec !== null) return Object.keys(spec).length > 0;
  return false;
}

/**
 * A numeric reading of a Schema.org price value: a number, or a string
 * holding a plain decimal. Anything else (empty, localized, with a
 * currency symbol) is not comparable and yields undefined.
 */
export function numericPrice(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && /^\s*-?\d+(\.\d+)?\s*$/.test(value)) {
    return Number(value);
  }
  return undefined;
}
