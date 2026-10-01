/**
 * Check factories producing CheckFns, so simple presence-style catalogue
 * rules stay one-liners. This realizes the spec's "declarative
 * expression" option for rule checks (see CheckFn in types.ts).
 */
import type { CheckFn, Sheet } from "./types.js";

/**
 * True when `value` is a full absolute URL per the catalogue's
 * Definitions section: an absolute-URI per RFC 3986, i.e.
 * scheme-qualified (`scheme:` followed by a hier-part). Fragments,
 * bare tokens, and relative paths are not.
 *
 * Shared by the reference rules (PDP-E-001, PDP-W-019, PDP-W-020, PDP-W-021).
 */
export function isFullAbsoluteUrl(value: unknown): boolean {
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value);
}

/**
 * True when `value` is a same-document `@id` per the catalogue's
 * Definitions section: (a) a bare fragment or token — any string that is
 * not a full absolute URL — or (b) a full absolute URL whose base (the
 * URL with any fragment removed) equals the Sheet's `canonical_url` or
 * the base of the data block's own top-level `@id`. Real producers
 * routinely mint full-URL `@id`s for in-Sheet entities by appending a
 * fragment to the canonical URL (`…#group`, `…#size-58`); these are
 * same-document, not cross-Sheet. A non-string is not an `@id` at all
 * and returns false — callers gate on their own presence/type checks.
 *
 * Shared by the reference rules (PDP-E-001, PDP-W-020, PDP-W-021), which use it to
 * separate internal references (must resolve, exact string match) from
 * genuinely cross-Sheet ones (exempt from resolution).
 */
export function isSameDocumentId(value: unknown, sheet: Sheet): boolean {
  if (typeof value !== "string") return false;
  if (!isFullAbsoluteUrl(value)) return true;
  const base = value.replace(/#.*$/, "");
  if (base === sheet.canonical_url) return true;
  const data = sheet.data;
  const dataId =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)["@id"]
      : undefined;
  return typeof dataId === "string" && base === dataId.replace(/#.*$/, "");
}

/**
 * The form classifier per the catalogue's Definitions section: an
 * *inline declaration* is an object carrying `@id` plus at least one
 * substantive property beyond `@id`/`@type`. Everything else that uses
 * an `@id` — a bare string, or an object whose only keys are `@id` or
 * `@id` and `@type` (a typed pointer is still a pointer) — is
 * *reference form*. An inline declaration declares its `@id` at the
 * position where it appears, regardless of that position being
 * reference-carrying.
 *
 * Shared by PDP-E-001, PDP-W-020, and PDP-W-021 to separate stubs (which reference
 * and can fire those rules) from inlined entities (which declare and
 * never do).
 */
export function isInlineDeclaration(node: unknown): boolean {
  if (typeof node !== "object" || node === null || Array.isArray(node)) {
    return false;
  }
  const obj = node as Record<string, unknown>;
  if (!("@id" in obj)) return false;
  return Object.keys(obj).some((k) => k !== "@id" && k !== "@type");
}

/**
 * The form-based resolution candidate set per the catalogue's amended
 * "resolves" term: every `@id` carried by an inline declaration,
 * collected from the whole tree — including at reference-carrying
 * positions. Reference-form entries never declare and are never
 * collected. This replaces the earlier position-based candidate
 * exclusion ("declared in a non-reference position").
 *
 * Shared resolution machinery for PDP-E-001 and PDP-W-020.
 */
export function collectDeclaredIds(root: unknown): Set<string> {
  const out = new Set<string>();
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    const obj = node as Record<string, unknown>;
    if (isInlineDeclaration(obj) && typeof obj["@id"] === "string") {
      out.add(obj["@id"]);
    }
    for (const value of Object.values(obj)) visit(value);
  };
  visit(root);
  return out;
}

/**
 * Resolve an RFC 9535 normalized path (the engine's `RuleMatch.path` /
 * `Finding.path` style — `$['data']['offers'][0]['itemOffered']`) to
 * the value it addresses in `root`, or undefined when any step is
 * missing. Lets a rule whose target matches a leaf (e.g. an `@id`)
 * examine the object carrying it: strip the trailing segment from the
 * match path and resolve the remainder.
 */
export function valueAtPath(root: unknown, path: string): unknown {
  let node: unknown = root;
  const segment = /\['((?:[^'\\]|\\.)*)'\]|\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = segment.exec(path)) !== null) {
    if (typeof node !== "object" || node === null) return undefined;
    if (m[1] !== undefined) {
      const key = m[1].replace(/\\(.)/g, "$1");
      node = Array.isArray(node)
        ? undefined
        : (node as Record<string, unknown>)[key];
    } else {
      node = Array.isArray(node) ? node[Number(m[2])] : undefined;
    }
  }
  return node;
}

/**
 * Fires when `field` on the matched value is missing, null, an empty
 * array, an empty string, or a whitespace-only string. A non-object
 * match also fires: the field is necessarily absent. Provides `{field}`
 * to the message template.
 *
 * Deliberately narrower than the catalogue Definitions term "empty or
 * whitespace-only": an object with no members does NOT fire. Absent-style
 * consumers of object-typed fields (e.g. PDP-W-003, `brand`) depend on that —
 * their spec check is exactly "absent", so implementing the term's object
 * arm here would make them fire on `{}` against spec.
 *
 * Consumers: the recommended-field presence rules PDP-W-001, PDP-W-002, PDP-W-003.
 * The present-but-empty rules (PDP-W-019, PDP-W-022, PDP-W-024, PDP-W-026, PDP-W-027) are
 * bespoke and do not use this helper.
 */
export function fieldAbsentOrEmpty(field: string): CheckFn {
  return (match) => {
    const container = match.value;
    const value =
      typeof container === "object" && container !== null
        ? (container as Record<string, unknown>)[field]
        : undefined;
    const absentOrEmpty =
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "string" && value.trim() === "");
    return absentOrEmpty ? { values: { field } } : null;
  };
}
