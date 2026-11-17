import { asRecord, memberEntries, nonBlank } from "./col-shared.js";

/**
 * Shared helpers for the Commerce Review Sheet rules (REV-E-001 …
 * REV-W-013). Kept local to the review rules: the closed enums of the
 * four declarations and the policy, the subject types and the review
 * walk are review-catalogue vocabulary, not engine machinery. The
 * record, blank-string and entry-walk helpers are the collection
 * catalogue's, reused as they stand.
 */
export { asRecord, memberEntries, nonBlank };

/** The closed enum of `pagefront:reviewSubject`, in vocabulary order. */
export const REVIEW_SUBJECTS = ["product", "seller", "mixed", "unclassified"] as const;
/** The closed enum of `pagefront:reviewSource.kind`. */
export const SOURCE_KINDS = ["first_party", "third_party", "marketplace", "imported", "undisclosed"] as const;
/** The closed enum of `pagefront:purchaseVerification`. */
export const VERIFICATIONS = ["none", "order_matched", "post_purchase_invitation", "platform_verified", "undisclosed"] as const;
/** The closed enum of `pagefront:incentive`. */
export const INCENTIVES = ["none", "discount", "free_product", "sample_program", "undisclosed"] as const;
/** The closed enum of `pagefront:reviewPolicy.collection`. */
export const POLICY_COLLECTIONS = ["all", "moderated", "curated", "undisclosed"] as const;
/** The product-side and seller-side halves of the closed aspect list. */
export const PRODUCT_ASPECTS = ["quality", "fit", "durability", "value", "ease_of_use", "appearance", "as_described", "performance", "comfort", "taste"] as const;
export const SELLER_ASPECTS = ["delivery", "customer_service", "returns", "packaging", "payment", "communication"] as const;

/**
 * The `@type` values a subject may carry ("Required core fields" in
 * review.md): `Product`, its Schema.org subtypes as of version 30.0,
 * `ProductGroup`, and the organization types the sheet-type dispatch
 * recognises for a Commerce Organization Sheet.
 */
export const PRODUCT_TYPES = ["Product", "ProductGroup", "DietarySupplement", "Drug", "IndividualProduct", "ProductCollection", "ProductModel", "SomeProducts", "Vehicle"] as const;
export const ORGANIZATION_TYPES = ["Organization", "OnlineStore", "OnlineBusiness"] as const;
export const SUBJECT_TYPES: readonly string[] = [...PRODUCT_TYPES, ...ORGANIZATION_TYPES];

/** `\`a\`, \`b\`` for an enum in a message. */
export const enumText = (values: readonly string[]): string => values.map((v) => `\`${v}\``).join(", ");

/** The entries of `itemListElement` with their paths, from a matched data block. */
export function reviewEntries(data: Record<string, unknown>, dataPath: string) {
  return memberEntries(data["itemListElement"], `${dataPath}['itemListElement']`);
}

/** The review's `@id` for a message, or the fixed fallback. */
export function reviewId(entry: Record<string, unknown>): string {
  return nonBlank(entry["@id"]) ? entry["@id"] : "(no @id)";
}

/** The subject's `@type` as a string, or null. */
export function subjectType(data: Record<string, unknown>): string | null {
  const about = asRecord(data["about"]);
  const type = about?.["@type"];
  return typeof type === "string" ? type : null;
}

/** Whether the subject is an organization ("The Organization review sheet" in review.md). */
export function isOrganizationSubject(data: Record<string, unknown>): boolean {
  const type = subjectType(data);
  return type !== null && (ORGANIZATION_TYPES as readonly string[]).includes(type);
}

/** The data block a matched entry of `itemListElement` belongs to: the sheet's. */
export function sheetData(sheet: { data: unknown }): Record<string, unknown> | null {
  return asRecord(sheet.data);
}

/** A rating value as a number: a JSON number, or a decimal string; null otherwise. */
export function ratingNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim())) return Number(value);
  return null;
}
