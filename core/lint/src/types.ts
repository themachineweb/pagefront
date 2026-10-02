/**
 * @pagefront/lint-core — type contracts.
 *
 * These types are the executable form of the normative sections of
 * `core/spec/linter.md`:
 * "Rule structure", "Severity levels", "Output format", "Conformance".
 *
 * The report shapes (`Report`, `Finding`, `Summary`) mirror the canonical
 * JSON output byte-for-byte in field naming (snake_case where the spec
 * says so). Do not "improve" field names here — conformance is defined
 * against this shape.
 */

// ---------------------------------------------------------------------------
// Severity
// ---------------------------------------------------------------------------

/** The three normative severity levels. */
export type Severity = "error" | "warning" | "info";

// ---------------------------------------------------------------------------
// Report — the canonical JSON output (normative)
// ---------------------------------------------------------------------------

/** One rule firing against one matched element. */
export interface Finding {
  /** Stable rule ID, e.g. "PDP-W-012". */
  rule: string;
  severity: Severity;
  /** JSONPath of the matched element the rule fired on. */
  path: string;
  /**
   * Placeholder substitutions used to render `message`, exposed in
   * structured form so downstream tools don't parse the rendered text.
   * Values are the stringified forms substituted into the template.
   */
  values: Record<string, string>;
  /** Rendered message with placeholders filled. */
  message: string;
  /** Remediation hint from the rule definition. */
  remediation: string;
}

/** Aggregate counts. Info findings are excluded from blocking semantics. */
export interface Summary {
  errors: number;
  warnings: number;
  info: number;
  /** Deduplicated rule IDs that fired at least once. */
  rules_fired: string[];
}

/** The canonical linter report. */
export interface Report {
  /** Canonical URL of the Sheet that was linted. */
  sheet: string;
  /** ISO 8601 timestamp of the lint run. */
  checked_at: string;
  /** Version of the linter implementation (e.g. "0.1.0"). */
  linter_version: string;
  /**
   * The release the Sheet declares: its envelope `release`, or, for a
   * legacy sheet, its `format_version` value. `null` when the Sheet
   * declares neither.
   */
  release: string | null;
  /**
   * The sheet-spec version the Sheet's `$schema` names, parsed from the
   * URL's trailing `v<version>.json` segment (`0.9.0`, or `0.9` on the
   * legacy line). `null` when `$schema` is absent or names no version.
   */
  sheet_spec_version: string | null;
  /**
   * Version of the vertical's rule catalogue that produced the findings.
   * The engine sources it from `Catalogue.catalogueVersion`.
   */
  catalogue_version: string;
  findings: Finding[];
  summary: Summary;
}

// ---------------------------------------------------------------------------
// Sheet — the input
// ---------------------------------------------------------------------------

/**
 * A parsed Pagefront Sheet. The envelope fields are typed; the data block
 * is deliberately `unknown` — Layer 1 (JSON Schema) owns structural
 * validation, and rules navigate `data` via JSONPath, not via static types.
 */
export interface Sheet {
  $schema?: string;
  /**
   * The release the sheet is written against (e.g. "0.3.0"). Exactly one
   * of `release` and `format_version` is present: the JSON Schemas and
   * the vertical's rules enforce it, the type admits both shapes.
   */
  release?: string;
  /** Legacy draft line only (≤ 0.9): the format version, in place of `release`. */
  format_version?: string;
  schema_org_version?: string;
  canonical_url: string;
  sheet_url: string;
  generated_at: string;
  expires_at?: string;
  data: unknown;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Rule — the catalogue contract (normative structure, per-vertical content)
// ---------------------------------------------------------------------------

/** One element matched by a rule's `target` JSONPath. */
export interface RuleMatch {
  /** Concrete JSONPath of this match (placeholders resolved to indices). */
  path: string;
  /** The matched value. */
  value: unknown;
}

/**
 * Result of running a rule's check against one match.
 * `null` / `undefined` — the rule does not fire on this match.
 */
export interface CheckHit {
  /**
   * Placeholder values for the message template. The engine stringifies
   * and substitutes them, and carries them into `Finding.values`.
   * `{path}` is always available implicitly; only rule-specific
   * placeholders need declaring here.
   */
  values?: Record<string, string | number>;
  /**
   * Optional severity override for context-dependent rules (e.g. PDP-W-012:
   * `warning` for overview/tutorial videos, `info` otherwise). Omitted:
   * the rule's default severity applies.
   */
  severity?: Severity;
  /**
   * Optional concrete JSONPath overriding the match's path for this
   * finding — for rules whose conceptual target is finer-grained than a
   * single JSONPath expression can select (e.g. entries inside an
   * object-or-array field). Must use the engine's normalized path
   * style. Omitted: the match's path is used.
   */
  path?: string;
}

/** Context handed to every check: the whole sheet, for cross-reference rules. */
export interface RuleContext {
  sheet: Sheet;
  /** All matches for this rule's target, for checks that need siblings. */
  allMatches: readonly RuleMatch[];
  /**
   * The run's `checked_at` timestamp (ISO 8601) — the same value the
   * report carries. Rules that need "the time of linting" (e.g. expiry
   * checks) MUST use this rather than the wall clock, so that fixture
   * output stays deterministic under injected options.
   */
  checkedAt: string;
}

/**
 * A check is a function from one match (plus context) to fire/no-fire.
 * Simple presence/value rules and complex semantic rules use the same
 * signature — the spec's "declarative expression" option is realized as
 * helper factories producing CheckFns, not as a parallel rule kind.
 * A check may return an array of hits when one match yields several
 * findings (rules whose conceptual target is finer-grained than the
 * target expression — each hit then typically carries a `path`).
 */
export type CheckFn = (
  match: RuleMatch,
  ctx: RuleContext
) => CheckHit | readonly CheckHit[] | null | undefined;

/** A rule definition — one entry of a vertical's catalogue. */
export interface Rule {
  /** Stable ID: `{E|W|I}-{three digits}`, e.g. "PDP-E-001". Permanent. */
  id: string;
  /** Short human-readable name, 3–8 words. */
  title: string;
  /** Default severity; a CheckHit may override per-match. */
  severity: Severity;
  /** JSONPath selecting the elements this rule applies to. */
  target: string;
  check: CheckFn;
  /** Message with `{name}` placeholders. `{path}` is always available. */
  messageTemplate: string;
  remediation: string;
  /**
   * What the rule was added in: a release (e.g. "release 0.3.0"), or a
   * legacy format version for rules that predate releases (e.g. "v0.8").
   */
  introduced: string;
  /**
   * The first release the rule applies to, as a semver ("0.3.0"). The
   * engine skips the rule on a Sheet whose declared `release` is lower:
   * a Sheet is judged only by the rules of the release it declares. An
   * error rule added after a release applies from the release that
   * introduces its requirement; warning and info rules may apply from
   * the first release, since they never change conformance.
   */
  appliesFrom: string;
  /**
   * Whether the rule also runs on Sheets of the legacy draft line (those
   * carrying `format_version` and no `release`). Omitted or false: the
   * engine skips the rule on legacy Sheets.
   */
  appliesToLegacy?: boolean;
  /** Path/URL of the motivating spec section. */
  specReference: string;
  /** Deprecated rules continue to fire; this flags them. */
  deprecatedIn?: string;
  supersededBy?: string;
}

// ---------------------------------------------------------------------------
// Catalogue — what a vertical package hands the engine
// ---------------------------------------------------------------------------

export interface Catalogue {
  /** e.g. "commerce". */
  vertical: string;
  /** The releases this catalogue version supports, e.g. ["0.3.0"]. */
  releases: readonly string[];
  /**
   * The catalogue's own semver, independent of the releases and of the
   * sheet specs.
   */
  catalogueVersion: string;
  rules: readonly Rule[];
}

// ---------------------------------------------------------------------------
// Engine API
// ---------------------------------------------------------------------------

export interface LintOptions {
  /**
   * Value for `Report.checked_at`; defaults to now. Injectable so test
   * fixtures produce byte-stable expected reports.
   */
  checkedAt?: string;
  /** Value for `Report.linter_version`; defaults to the package version. */
  linterVersion?: string;
}

/**
 * The engine: evaluate every catalogue rule's target against the sheet,
 * run checks on each match, assemble the canonical report. Assumes the
 * sheet already passed Layer 1 (JSON Schema) validation — see the CLI
 * for the Layer 1 → Layer 2 sequencing.
 */
export type LintFn = (
  sheet: Sheet,
  catalogue: Catalogue,
  options?: LintOptions
) => Report;
