import type { Rule } from "@pagefront/lint-core";
import { asRecord, commerceRoles, isPresent } from "./org-shared.js";

/**
 * ORG-W-001 — brand_owner declared without a brand node.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * organization.md: "Each declared role SHOULD have its corresponding
 * content present — a brand_owner SHOULD carry a Brand node." The
 * Brand.@id is the identity Product Sheets resolve via Product.brand,
 * so a brand_owner sheet without one is undereferenceable from the
 * product side.
 */
export const orgW001: Rule = {
  id: "ORG-W-001",
  title: "brand_owner declared without a brand node",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null) return null;
    if (!commerceRoles(data).includes("brand_owner")) return null;
    if (isPresent(data, "brand")) return null;
    return {};
  },
  messageTemplate:
    "`pagefront:commerceRole` at `{path}` declares `brand_owner`, but the sheet carries no `brand` node.",
  remediation:
    "Add the `Brand` node with `@id` and `name` — the `Brand.@id` is the identity Product Sheets resolve via `Product.brand`.",
  introduced: "v0.9",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "organization.md#role-discriminator--pagefrontcommercerole",
};
