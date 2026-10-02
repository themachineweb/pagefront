import type { Rule } from "@pagefront/lint-core";
import { DATA_BLOCK_PROPERTIES } from "../generated/schema-properties.js";

/**
 * PDP-I-001 — Property outside Pagefront's modeled set.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The modeled set is the JSON Schema's dataBlock property inventory
 * of the latest released Product Sheet schema (generated at build
 * time, see scripts/bundle-schemas.mjs). The
 * target `$.data.*` selects top-level data properties by design; any
 * property outside the inventory fires, including unmodeled
 * `pagefront:`-prefixed ones.
 */
const MODELED = new Set(DATA_BLOCK_PROPERTIES);

export const pdpI001: Rule = {
  id: "PDP-I-001",
  title: "Property outside Pagefront's modeled set",
  severity: "info",
  target: "$.data.*",
  check: (match) => {
    const property = /\['([^']+)'\]$/.exec(match.path)?.[1];
    if (property === undefined || MODELED.has(property)) return null;
    return { values: { property } };
  },
  messageTemplate:
    "Property `{property}` at `{path}` is valid Schema.org but is not explicitly modeled by Pagefront.",
  remediation:
    "No action required. This finding is informational. If you find yourself using a Schema.org property frequently and would value formal Pagefront modeling for it, consider opening a spec proposal.",
  introduced: "v0.6",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#data--schemaorg-json-ld",
};
