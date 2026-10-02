import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-006 — Certification missing scope.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Bespoke check: fires when the certification's `additionalProperty`
 * array has no entry with `name: "scope"`. `{name}` is the
 * certification's `name`, which the schema requires on every entry.
 */
export const pdpW006: Rule = {
  id: "PDP-W-006",
  title: "Certification missing scope",
  severity: "warning",
  target: "$.data.hasCertification[*]",
  check: (match) => {
    const cert = match.value;
    if (typeof cert !== "object" || cert === null) return null;
    const c = cert as Record<string, unknown>;
    const props = Array.isArray(c["additionalProperty"])
      ? (c["additionalProperty"] as unknown[])
      : [];
    const hasScope = props.some(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        (p as Record<string, unknown>)["name"] === "scope"
    );
    return hasScope ? null : { values: { name: String(c["name"]) } };
  },
  messageTemplate: "Certification `{name}` at `{path}` has no scope declared.",
  remediation:
    "Add a `PropertyValue` to `additionalProperty` with name `scope` and a value drawn from the conventional vocabulary (`yarn`, `fabric`, `finished_product`, `diamond`, `gemstone`, etc.).",
  introduced: "v0.6",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "vocabulary.md#certification-scope",
};
