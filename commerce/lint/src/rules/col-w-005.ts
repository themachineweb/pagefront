import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, entryName, memberEntries } from "./col-shared.js";

/**
 * COL-W-005 — Parent of another kind.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * A category's parents are categories (the tree), and a collection
 * never sits in the tree: its parent, when it has one, is a collection.
 * The rule reads the kind the `isPartOf` entry declares and is quiet on
 * an entry that declares none, since it never fetches the parent sheet.
 * One finding per offending entry, at the entry's path.
 */
export const colW005: Rule = {
  id: "COL-W-005",
  title: "Parent of another kind",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null) return null;
    const kind = data["pagefront:collectionKind"];
    if (kind !== "category" && kind !== "collection") return null;
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(data["isPartOf"], `${match.path}['isPartOf']`)) {
      const parentKind = entry["pagefront:collectionKind"];
      if (typeof parentKind !== "string") continue;
      const offends = kind === "category" ? parentKind !== "category" : parentKind === "category";
      if (!offends) continue;
      hits.push({ path, values: { kind, name: entryName(entry), parentKind } });
    }
    return hits;
  },
  messageTemplate:
    "This `{kind}` sheet names parent `{name}` at `{path}`, whose entry declares kind `{parentKind}`.",
  remediation:
    "A category's `isPartOf` entries are categories: the tree is made of categories only. A collection nests in a collection and never in a category. Correct the parent's declared kind, or move the set to the kind its parent implies.",
  introduced: "release 0.5.0",
  appliesFrom: "0.5.0",
  specReference: "collection.md#kind-discriminator-pagefrontcollectionkind",
};
