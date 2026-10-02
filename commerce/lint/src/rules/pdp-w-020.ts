import {
  collectDeclaredIds,
  isInlineDeclaration,
  isSameDocumentId,
  type CheckHit,
  type Rule,
} from "@pagefront/lint-core";

/**
 * PDP-W-020 — Relationship reference lacks any identifying field.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * The target selects the five relationship-field values (one match per
 * present field); per the catalogue, the object-or-array shape variance
 * is handled here in the check — a single object is treated as a
 * one-entry list — and each entry yields its own finding via a path
 * override. The resolution arm (condition b) applies to reference-form
 * entries only (Definitions): an inline declaration declares what it
 * names, so it satisfies its own resolvability and joins the candidate
 * set for other references. Candidates come from the shared form-based
 * machinery (`collectDeclaredIds`, also serving PDP-E-001) — inline
 * declarations anywhere, including at reference-carrying positions;
 * reference-form entries never declare. A same-document `@id` must
 * resolve by exact string match; only a non-same-document full URL is
 * exempt (external/cross-Sheet target). When both conditions hold,
 * condition (a) wins, per the catalogue's `{problem}` definition.
 * `{name}` is the entry's `name`, or `(unnamed)` when absent.
 */
const IDENTIFYING_FIELDS = ["@id", "url", "name", "sku", "gtin", "gtin13", "mpn"];

const PROBLEM_A =
  "has no identifying field (`@id`, `url`, `name`, `sku`, `gtin`, `gtin13`, `mpn`)";

export const pdpW020: Rule = {
  id: "PDP-W-020",
  title: "Relationship reference lacks any identifying field",
  severity: "warning",
  target: "$.data['isSimilarTo','isRelatedTo','isPartOf','hasPart','pagefront:relatedProduct']",
  check: (match, ctx) => {
    const field = /\['([^']+)'\]$/.exec(match.path)?.[1] ?? "";
    const entries: Array<{ entry: unknown; path: string }> = Array.isArray(match.value)
      ? match.value.map((entry, i) => ({ entry, path: `${match.path}[${i}]` }))
      : [{ entry: match.value, path: match.path }];

    const declaredIds = collectDeclaredIds(ctx.sheet.data);

    const hits: CheckHit[] = [];
    for (const { entry, path } of entries) {
      if (typeof entry !== "object" || entry === null) continue;
      const e = entry as Record<string, unknown>;

      const anyIdentifying = IDENTIFYING_FIELDS.some(
        (f) => typeof e[f] === "string" && (e[f] as string).trim() !== ""
      );

      let problem: string | null = null;
      if (!anyIdentifying) {
        problem = PROBLEM_A; // condition (a); wins when (b) also holds
      } else if (
        !isInlineDeclaration(e) &&
        typeof e["@id"] === "string" &&
        isSameDocumentId(e["@id"], ctx.sheet)
      ) {
        const id = e["@id"];
        if (!declaredIds.has(id)) {
          problem = `declares internal \`@id\` \`${id}\` that does not resolve to any declared \`@id\` in this Sheet`;
        }
      }
      if (problem === null) continue;

      const name = typeof e["name"] === "string" ? (e["name"] as string) : "(unnamed)";
      hits.push({ path, values: { name, field, problem } });
    }
    return hits;
  },
  messageTemplate: "Relationship reference `{name}` at `{path}` in `{field}` {problem}.",
  remediation:
    "Add at least one identifying field — `@id`, `url`, `name`, `sku`, `gtin`, `gtin13`, or `mpn` — so the reference is dereferenceable, displayable, or matchable. If the `@id` was meant to name an entity in this Sheet, correct it to match a declared `@id` or add that entity; if it was meant to point at another product, use the target's full URL.",
  introduced: "v0.7",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#five-patterns-for-product-to-product-relationships",
};
