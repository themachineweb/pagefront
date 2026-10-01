import type { Rule } from "@pagefront/lint-core";
import {
  asRecord,
  commerceRoles,
  isPresent,
  SELLER_CONTENT_FIELDS,
} from "./org-shared.js";

/**
 * ORG-W-002 — seller declared without seller content.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * A `seller` role promises the store-wide terms an agent needs before
 * it reaches a specific offer; a sheet declaring the role with none of
 * them present is a promise with no content. `location` counts here
 * (a physical store is seller content) even though ORG-W-004's inverse
 * deliberately excludes it.
 */
export const orgW002: Rule = {
  id: "ORG-W-002",
  title: "seller declared without seller content",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null) return null;
    if (!commerceRoles(data).includes("seller")) return null;
    const sellerFields = [...SELLER_CONTENT_FIELDS, "location"];
    if (sellerFields.some((field) => isPresent(data, field))) return null;
    return {};
  },
  messageTemplate:
    "`pagefront:commerceRole` at `{path}` declares `seller`, but none of `hasMerchantReturnPolicy`, `pagefront:fulfillmentTerms`, `paymentAccepted`, or `location` is present.",
  remediation:
    "Add the store-wide terms the seller role promises: the return policy, fulfillment terms, payment methods, or physical locations.",
  introduced: "v0.9",
  specReference: "organization.md#seller-block-seller",
};
