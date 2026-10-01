import { isInlineDeclaration, type Rule } from "@pagefront/lint-core";

/**
 * PDP-W-024 — Legal entity organization lacks an address.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * "Empty or whitespace-only" per the Definitions section: absent,
 * empty string, whitespace-only string, empty array, or an object with
 * no members. The schema types `address` as a bare object, so `{}`
 * passes Layer 1 while declaring nothing — the memberless-object arm
 * is the reachable one here alongside absence. `{role}` is
 * schema-required on every entry.
 *
 * Reference-form organizations are exempt (v0.9): their address lives
 * on the referenced Commerce Organization Sheet, and this linter
 * validates one Sheet in isolation and cannot fetch that Sheet, so
 * warning about a missing address on an explicit pointer would be a
 * false positive. The exemption reuses the catalogue's shared form
 * distinction — `isInlineDeclaration` — rather than a second notion of
 * "stub": an organization carrying `@id` that is not an inline
 * declaration is a pure reference. An organization carrying `@id`
 * alongside substantive content (`name`, …) is an inline declaration
 * and still fires.
 */
export const pdpW024: Rule = {
  id: "PDP-W-024",
  title: "Legal entity organization lacks an address",
  severity: "warning",
  target: "$.data['pagefront:legalEntity'][*]",
  check: (match) => {
    const entry = match.value;
    if (typeof entry !== "object" || entry === null) return null;
    const e = entry as Record<string, unknown>;
    const organization =
      typeof e["organization"] === "object" && e["organization"] !== null
        ? (e["organization"] as Record<string, unknown>)
        : {};
    // Reference form (Definitions): `@id` with no members beyond
    // `@id`/`@type`. Out of scope for this rule — see the note above.
    if ("@id" in organization && !isInlineDeclaration(organization)) {
      return null;
    }
    const address = organization["address"];
    const missing =
      address === undefined ||
      address === null ||
      (typeof address === "string" && address.trim() === "") ||
      (Array.isArray(address) && address.length === 0) ||
      (typeof address === "object" &&
        !Array.isArray(address) &&
        Object.keys(address).length === 0);
    if (!missing) return null;
    return { values: { role: String(e["role"]) } };
  },
  messageTemplate:
    "`pagefront:legalEntity` entry with role `{role}` at `{path}` declares an organization without an `address`.",
  remediation:
    "Add the entity's postal address to the `organization`. If no address is available, the entry still identifies the organization but should not be relied on as a regulatory responsible-person declaration.",
  introduced: "v0.8",
  specReference: "product.md#legal-entities",
};
