/**
 * Shared helpers for the Commerce Collection Sheet rules
 * (COL-E-001 … COL-W-006). Kept local to the collection rules: the
 * member-entry walk and the kind enum are collection-catalogue
 * vocabulary, not engine machinery.
 */

/** The closed enum of `pagefront:collectionKind`, in vocabulary order. */
export const COLLECTION_KINDS = ["category", "collection", "brand"] as const;

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** A string value that is present and not empty or whitespace-only. */
export function nonBlank(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * The entries of a member array (`hasPart`, `isPartOf`,
 * `itemListElement`) with their normalized paths. A matched value that
 * is a single object is one entry at the match path; a non-object
 * entry is skipped, since the schema types entries as objects.
 */
export function memberEntries(
  value: unknown,
  path: string
): Array<{ entry: Record<string, unknown>; path: string }> {
  const raw: Array<{ entry: unknown; path: string }> = Array.isArray(value)
    ? value.map((entry, i) => ({ entry, path: `${path}[${i}]` }))
    : [{ entry: value, path }];
  const out: Array<{ entry: Record<string, unknown>; path: string }> = [];
  for (const { entry, path: p } of raw) {
    const record = asRecord(entry);
    if (record !== null) out.push({ entry: record, path: p });
  }
  return out;
}

/** The entry's `name` for a message, or the fixed fallback. */
export function entryName(entry: Record<string, unknown>): string {
  return typeof entry["name"] === "string" ? (entry["name"] as string) : "(unnamed)";
}

/** The field a match path ends in: `$['data']['hasPart']` → `hasPart`. */
export function matchedField(path: string): string {
  return /\['([^']+)'\]$/.exec(path)?.[1] ?? "";
}
