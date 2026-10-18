import type { Rule } from "@pagefront/lint-core";
import { asRecord } from "./col-shared.js";

/**
 * COL-W-004 — Brand reference and brand kind disagree.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * A `brand` collection is keyed on a `Brand` node and carries `brand`;
 * a `category` or `collection` is not. Either half missing is the
 * kind-without-content / content-without-kind pattern the organization
 * catalogue checks for roles (ORG-W-001 … ORG-W-004). The finding sits
 * at the data block either way.
 */
export const colW004: Rule = {
  id: "COL-W-004",
  title: "Brand reference and brand kind disagree",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null) return null;
    const kind = data["pagefront:collectionKind"];
    const brand = data["brand"];
    const hasBrand = brand !== undefined && brand !== null;
    if (kind === "brand" && !hasBrand) {
      return { values: { problem: "declares `pagefront:collectionKind` `brand` but carries no `brand`" } };
    }
    if (kind !== "brand" && hasBrand && typeof kind === "string") {
      return { values: { problem: `carries \`brand\` but declares \`pagefront:collectionKind\` \`${kind}\`` } };
    }
    return null;
  },
  messageTemplate: "Collection at `{path}` {problem}.",
  remediation:
    "On a brand collection, add `brand`, the reference to the `Brand` node the set is keyed on (`@type`, `@id` and `pagefront:sheetUrl`). On a category or a collection, remove `brand`, or declare the kind `brand` if the set is the products sold under one label.",
  introduced: "release 0.5.0",
  appliesFrom: "0.5.0",
  specReference: "collection.md#kind-discriminator-pagefrontcollectionkind",
};
