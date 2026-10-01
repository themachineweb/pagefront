/**
 * Shared by PDP-E-003 and ORG-E-001: does the data block declare the
 * `pagefront` prefix, and which `pagefront:` term does it use first?
 * A term is a property name or an `@type` value beginning with
 * `pagefront:`, anywhere in the block; the walk is depth-first in
 * document order, so the named term is the first one a reader meets.
 */
export const VOCABULARY_IRI = "https://themachineweb.org/pagefront/vocabulary/";

export const declaresPagefrontPrefix = (context: unknown): boolean =>
  Array.isArray(context) &&
  context.some(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      !Array.isArray(entry) &&
      (entry as Record<string, unknown>)["pagefront"] === VOCABULARY_IRI
  );

export const firstPagefrontTerm = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstPagefrontTerm(item);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (typeof value !== "object" || value === null) return undefined;
  for (const [key, child] of Object.entries(value)) {
    if (key.startsWith("pagefront:")) return key;
    if (key === "@type" && typeof child === "string" && child.startsWith("pagefront:")) return child;
    const found = firstPagefrontTerm(child);
    if (found !== undefined) return found;
  }
  return undefined;
};

/** The check both rules share: null when the prefix is declared or no term is used. */
export const missingPrefixTerm = (data: unknown): { values: { term: string } } | null => {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  if (declaresPagefrontPrefix((data as Record<string, unknown>)["@context"])) return null;
  const term = firstPagefrontTerm(data);
  return term === undefined ? null : { values: { term } };
};
