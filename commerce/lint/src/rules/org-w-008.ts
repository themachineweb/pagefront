import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, commerceRoles } from "./org-shared.js";

/**
 * ORG-W-008 — Checkout hosts without seller role, or not a bare host.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `pagefront:checkoutHosts` lists the hosts outside the canonical host
 * on which the seller's offers are bought or checked out
 * (organization.md, "Seller block"); it is admitted only where
 * `commerceRole` includes `seller`, and each entry is a bare host name.
 * One finding on the field when the role is absent, and one per entry
 * that is not a bare host: a value that is not a string, is empty or
 * whitespace-only, or carries a scheme, a path or a port. The entries
 * are read as written; the rule compares them with nothing.
 */
export const orgW008: Rule = {
  id: "ORG-W-008",
  title: "Checkout hosts without seller role, or not a bare host",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null || !Object.prototype.hasOwnProperty.call(data, "pagefront:checkoutHosts")) return null;
    const field = `${match.path}['pagefront:checkoutHosts']`;
    const hits: CheckHit[] = [];
    if (!commerceRoles(data).includes("seller")) {
      hits.push({ path: field, values: { problem: "the sheet does not declare the `seller` role" } });
    }
    const hosts = data["pagefront:checkoutHosts"];
    if (Array.isArray(hosts)) {
      hosts.forEach((entry, i) => {
        const problem = notBareHost(entry);
        if (problem !== null) hits.push({ path: `${field}[${i}]`, values: { problem } });
      });
    }
    return hits.length > 0 ? hits : null;
  },
  messageTemplate: "`pagefront:checkoutHosts` at `{path}`: {problem}.",
  remediation:
    "List bare host names only (`checkout.merchant.example`), and only on the seller's own sheet, one whose `pagefront:commerceRole` includes `seller`; otherwise remove the field.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "organization.md#seller-block-seller",
};

/** Why `entry` is not a bare host, or `null` when it is one. */
function notBareHost(entry: unknown): string | null {
  if (typeof entry !== "string") return `entry ${JSON.stringify(entry)} is not a string`;
  if (entry.trim() === "") return "an entry is empty or whitespace-only";
  const shown = `entry \`${entry}\``;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(entry)) return `${shown} carries a scheme`;
  if (entry.includes("/")) return `${shown} carries a path`;
  if (entry.includes(":")) return `${shown} carries a port`;
  return null;
}
