import type { Rule } from "@pagefront/lint-core";
import { asRecord, commerceRoles, isPresent } from "./org-shared.js";

/**
 * ORG-W-003 — Brand node without brand_owner role.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * organization.md: "content SHOULD NOT appear without its role
 * declared." A `brand` node on a sheet not claiming `brand_owner`
 * either means the role declaration is incomplete or the node belongs
 * on the brand's own sheet.
 */
export const orgW003: Rule = {
  id: "ORG-W-003",
  title: "Brand node without brand_owner role",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null) return null;
    if (!isPresent(data, "brand")) return null;
    if (commerceRoles(data).includes("brand_owner")) return null;
    return {};
  },
  messageTemplate:
    "A `brand` node is present at `{path}`, but `pagefront:commerceRole` does not declare `brand_owner`.",
  remediation:
    "Declare `brand_owner` in `pagefront:commerceRole`, or remove the `brand` node if this sheet is not the brand's sheet.",
  introduced: "v0.9",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "organization.md#role-discriminator--pagefrontcommercerole",
};
