import type { Rule } from "@pagefront/lint-core";
import {
  asRecord,
  commerceRoles,
  isPresent,
  SELLER_CONTENT_FIELDS,
} from "./org-shared.js";

/**
 * ORG-W-004 — seller content without seller role.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The inverse of ORG-W-002. `location` is deliberately not in this
 * rule's trigger set: a manufacturer legitimately declares its
 * facilities without being a seller. Store-wide commercial terms —
 * return policy, fulfillment terms, payment methods — are what imply
 * the role.
 */
export const orgW004: Rule = {
  id: "ORG-W-004",
  title: "Seller content without seller role",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null) return null;
    if (commerceRoles(data).includes("seller")) return null;
    const present = SELLER_CONTENT_FIELDS.filter((field) =>
      isPresent(data, field)
    );
    if (present.length === 0) return null;
    return { values: { fields: present.join("`, `") } };
  },
  messageTemplate:
    "Seller content (`{fields}`) is present at `{path}`, but `pagefront:commerceRole` does not declare `seller`.",
  remediation:
    "Declare `seller` in `pagefront:commerceRole`, or move the store-wide terms to the seller's own sheet.",
  introduced: "v0.9",
  specReference: "organization.md#seller-block-seller",
};
