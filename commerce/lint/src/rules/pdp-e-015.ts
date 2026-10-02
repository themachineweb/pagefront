import type { Rule } from "@pagefront/lint-core";
import { asObject, seg } from "./configurator-pricing.js";

/**
 * PDP-E-015 — Amounts mix numbers and strings.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Walks `data` in document order over the catalogue's closed list of
 * amount fields and fires once per Sheet when at least one amount is a
 * JSON number and at least one is a string. `numberPath` and
 * `stringPath` are the first amount of each carrier.
 */
const OFFER_FIELDS = ["price", "lowPrice", "highPrice"];
const SPECIFICATION_FIELDS = ["price", "minPrice", "maxPrice"];
const MONETARY_FIELDS = ["value", "minValue", "maxValue"];

/** What the enclosing key makes of the entries below it. */
type Role = "offer" | "specification" | "variant" | "promotion" | "pricing" | "modifiers" | "adjustment" | undefined;

const ROLE_OF_KEY: Record<string, Role> = {
  offers: "offer",
  priceSpecification: "specification",
  hasVariant: "variant",
  "pagefront:promotions": "promotion",
  "pagefront:configuratorPricing": "pricing",
};

interface Carriers {
  numberPath?: string;
  stringPath?: string;
}

function record(found: Carriers, value: unknown, path: string): void {
  if (typeof value === "number") found.numberPath ??= path;
  else if (typeof value === "string") found.stringPath ??= path;
}

function amountFields(node: Record<string, unknown>, role: Role): string[] {
  const fields: string[] = [];
  if (role === "offer") fields.push(...OFFER_FIELDS);
  if (role === "specification") fields.push(...SPECIFICATION_FIELDS);
  if (role === "variant") fields.push("price");
  if (role === "promotion") fields.push("discountAmount");
  if (role === "pricing") fields.push("basePrice");
  if (role === "adjustment") fields.push("priceModifier");
  if (node["@type"] === "MonetaryAmount") fields.push(...MONETARY_FIELDS);
  return fields;
}

function walk(node: unknown, path: string, role: Role, found: Carriers): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => walk(item, `${path}[${index}]`, role, found));
    return;
  }
  const obj = asObject(node);
  if (obj === null) return;
  const fields = amountFields(obj, role);
  for (const [key, value] of Object.entries(obj)) {
    const childPath = `${path}${seg(key)}`;
    if (fields.includes(key)) {
      record(found, value, childPath);
      continue;
    }
    if (role === "modifiers") {
      // one entry per dimension; every value under it is an amount
      for (const [option, amount] of Object.entries(asObject(value) ?? {})) {
        record(found, amount, `${childPath}${seg(option)}`);
      }
      continue;
    }
    let childRole = ROLE_OF_KEY[key];
    if (role === "pricing" && key === "modifiers") childRole = "modifiers";
    if (role === "pricing" && key === "adjustments") childRole = "adjustment";
    walk(value, childPath, childRole, found);
  }
}

export const pdpE015: Rule = {
  id: "PDP-E-015",
  title: "Amounts mix numbers and strings",
  severity: "error",
  target: "$.data",
  check: (match) => {
    const found: Carriers = {};
    walk(match.value, match.path, undefined, found);
    if (found.numberPath === undefined || found.stringPath === undefined) return null;
    return { values: { numberPath: found.numberPath, stringPath: found.stringPath } };
  },
  messageTemplate: "Amounts mix numbers and strings; use one carrier throughout the Sheet.",
  remediation:
    "Carry every amount the same way. Decimal strings are recommended when amounts have fractional parts.",
  introduced: "v0.9 (2026-10-01 revision)",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#amounts",
};
