import type { Rule } from "@pagefront/lint-core";
import { asRecord, commerceRoles, isPresent } from "./org-shared.js";

/**
 * ORG-W-006 — authorized resellers without brand_owner role.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Content-without-role, in the ORG-W-003/ORG-W-004 family.
 * `pagefront:authorizedResellers` is the brand exercising authority
 * over its own distribution, so organization.md admits it only where
 * `commerceRole` includes `brand_owner`; a reseller's own claim of
 * authorization carries no weight. Presence-only: no rule warns on the
 * field's absence — absence is no statement.
 */
export const orgW006: Rule = {
  id: "ORG-W-006",
  title: "Authorized resellers without brand_owner role",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null) return null;
    if (!isPresent(data, "pagefront:authorizedResellers")) return null;
    if (commerceRoles(data).includes("brand_owner")) return null;
    return {};
  },
  messageTemplate:
    "`pagefront:authorizedResellers` is present at `{path}`, but `pagefront:commerceRole` does not declare `brand_owner`.",
  remediation:
    "Declare `brand_owner` in `pagefront:commerceRole` if this is the brand's own sheet; otherwise remove the field — only the brand's sheet can state whom the brand authorizes.",
  introduced: "v0.9",
  specReference: "organization.md#authorized-resellers",
};
