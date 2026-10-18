import type { Rule } from "@pagefront/lint-core";

/**
 * COL-W-001 — Empty `hasPart`.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * An empty array is valid (a node whose assignments all live in its
 * children, or that holds nothing); the warning asks for review, since
 * an emission pipeline that lost the members produces the same shape.
 * An absent `hasPart` is Layer 1's concern.
 */
export const colW001: Rule = {
  id: "COL-W-001",
  title: "Empty hasPart",
  severity: "warning",
  target: "$.data.hasPart",
  check: (match) => (Array.isArray(match.value) && match.value.length === 0 ? {} : null),
  messageTemplate: "`hasPart` at `{path}` is empty: the set declares no direct members.",
  remediation:
    "Confirm the set has no direct members (its products all live in subcategories, or it holds nothing). If the storefront assigns products or subcategories to this node, list them.",
  introduced: "release 0.5.0",
  appliesFrom: "0.5.0",
  specReference: "collection.md#members",
};
