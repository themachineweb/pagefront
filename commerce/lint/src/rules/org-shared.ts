/**
 * Shared helpers for the Commerce Organization Sheet rules
 * (ORG-W-001 … ORG-W-006). Kept local to the org rules: the notions
 * here — the role array, the seller-block field set, the catalogue's
 * "empty or whitespace-only" emptiness — are organization-catalogue
 * vocabulary, not engine machinery.
 */

/** The Definitions section's "empty or whitespace-only". */
export function isEmptyOrWhitespace(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value as object).length === 0)
  );
}

/** A field is "present" when it exists and is not empty per Definitions. */
export function isPresent(data: Record<string, unknown>, field: string): boolean {
  return field in data && !isEmptyOrWhitespace(data[field]);
}

/** The declared commerce roles, as strings; [] when absent or malformed. */
export function commerceRoles(data: Record<string, unknown>): string[] {
  const roles = data["pagefront:commerceRole"];
  if (!Array.isArray(roles)) return [];
  return roles.filter((r): r is string => typeof r === "string");
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * The seller-block fields whose presence implies the `seller` role
 * (ORG-W-004) — deliberately excluding `location`, which a
 * manufacturer legitimately carries. ORG-W-002's role-without-content
 * check reads these plus `location`.
 */
export const SELLER_CONTENT_FIELDS = [
  "hasMerchantReturnPolicy",
  "pagefront:fulfillmentTerms",
  "paymentAccepted",
] as const;
