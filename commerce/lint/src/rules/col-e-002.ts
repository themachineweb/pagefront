import type { Rule } from "@pagefront/lint-core";
import { asRecord, COLLECTION_KINDS } from "./col-shared.js";

/**
 * COL-E-002 — Collection kind absent or outside the enum.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `pagefront:collectionKind` is the required, single-valued kind
 * discriminator; without it a consumer cannot tell whether it is
 * walking a tree or reading a list. The finding sits at the field when
 * it is present and at the data block when it is absent.
 */
const ENUM_TEXT = COLLECTION_KINDS.map((k) => `\`${k}\``).join(", ");

export const colE002: Rule = {
  id: "COL-E-002",
  title: "Collection kind absent or outside the enum",
  severity: "error",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null) return null;
    const kind = data["pagefront:collectionKind"];
    if (kind === undefined) return { values: { problem: "absent" } };
    if (typeof kind === "string" && (COLLECTION_KINDS as readonly string[]).includes(kind)) return null;
    const rendered = typeof kind === "string" ? kind : JSON.stringify(kind);
    return {
      path: `${match.path}['pagefront:collectionKind']`,
      values: { problem: `\`${rendered}\`, which is not one of ${ENUM_TEXT}` },
    };
  },
  messageTemplate: "`pagefront:collectionKind` at `{path}` is {problem}.",
  remediation:
    "Declare `pagefront:collectionKind` as `category` (a node of the storefront's navigation tree), `collection` (a set outside the tree) or `brand` (the products sold under one label). Additional values require a spec amendment.",
  introduced: "release 0.5.0",
  appliesFrom: "0.5.0",
  specReference: "collection.md#kind-discriminator-pagefrontcollectionkind",
};
