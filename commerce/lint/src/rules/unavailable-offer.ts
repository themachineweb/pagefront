/**
 * Shared helper for the rules that read an Offer's availability as
 * "cannot be bought now" (product.md, "Unavailable offers without a
 * price"): OutOfStock, SoldOut and Discontinued, in the http or https
 * form the schema accepts. The other availability values describe an
 * item that can still be bought.
 */
const UNAVAILABLE = /^https?:\/\/schema\.org\/(OutOfStock|SoldOut|Discontinued)$/;

/** True when the offer's `availability` is one of the three unavailable values. */
export function isUnavailable(offer: Record<string, unknown>): boolean {
  const availability = offer["availability"];
  return typeof availability === "string" && UNAVAILABLE.test(availability);
}
