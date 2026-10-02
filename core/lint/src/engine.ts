/**
 * The lint-core engine: evaluates each catalogue rule's JSONPath target
 * against a Sheet, runs the rule's check on every match, and assembles
 * the canonical Report. The Report shape is normative — see the "Output
 * format" section of core/spec/linter.md and the Report type in types.ts.
 */
import { query } from "json-p3";
import { PACKAGE_VERSION } from "./version.js";
import type {
  Catalogue,
  Finding,
  LintOptions,
  Report,
  Rule,
  RuleContext,
  RuleMatch,
  Sheet,
} from "./types.js";

/**
 * Message templates use `{name}` placeholders where `name` is an
 * identifier ([A-Za-z0-9_]+); braces not matching that shape are literal
 * text. Every matched placeholder MUST have a value: a template/values
 * mismatch throws rather than rendering silently, so fixtures catch it.
 */
const PLACEHOLDER = /\{([A-Za-z0-9_]+)\}/g;

function renderTemplate(
  ruleId: string,
  template: string,
  values: Record<string, string>
): string {
  return template.replace(PLACEHOLDER, (_, name: string) => {
    const substitution = values[name];
    if (substitution === undefined) {
      throw new Error(
        `lint-core: rule ${ruleId} message template references {${name}} but the check provided no such value`
      );
    }
    return substitution;
  });
}

/** A full semver as three numbers, or null when the text is not one. */
function semver(text: unknown): [number, number, number] | null {
  if (typeof text !== "string") return null;
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(text);
  return m === null ? null : [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * Release gating: a Sheet is judged only by the rules of the release it
 * declares. A rule is skipped when the Sheet's `release` is lower than
 * the rule's `appliesFrom`, and on a legacy Sheet (`format_version`, no
 * `release`) unless the rule is flagged `appliesToLegacy`. A Sheet whose
 * release cannot be read as a semver, or that declares neither field,
 * cannot be gated and gets every rule.
 */
function ruleApplies(rule: Rule, sheet: Sheet): boolean {
  if (sheet.release === undefined && sheet.format_version !== undefined) {
    return rule.appliesToLegacy === true;
  }
  const declared = semver(sheet.release);
  const from = semver(rule.appliesFrom);
  if (declared === null || from === null) return true;
  for (let i = 0; i < 3; i++) {
    if (declared[i] !== from[i]) return declared[i] > from[i];
  }
  return true;
}

/** The release a sheet declares: `release`, else a legacy `format_version`. */
function declaredRelease(sheet: Sheet): string | null {
  if (typeof sheet.release === "string") return sheet.release;
  if (typeof sheet.format_version === "string") return sheet.format_version;
  return null;
}

/**
 * The version segment of a `$schema` URL: the trailing `v<version>.json`,
 * a full semver on the release line (`v0.9.0.json`) and a two-part
 * version on the legacy line (`v0.9.json`).
 */
const SCHEMA_VERSION = /v(\d+(?:\.\d+)*)\.json$/;

function sheetSpecVersion(sheet: Sheet): string | null {
  if (typeof sheet.$schema !== "string") return null;
  return SCHEMA_VERSION.exec(sheet.$schema)?.[1] ?? null;
}

/**
 * Path serialization contract: `Finding.path` (and `RuleMatch.path`) uses
 * RFC 9535 *normalized paths* as produced by json-p3 — bracket notation
 * with single-quoted name selectors and unquoted array indices, e.g.
 * `$['data']['offers'][0]['availability']`. Independent implementations
 * must serialize paths in this same style to produce conformant reports.
 */
export function lint(
  sheet: Sheet,
  catalogue: Catalogue,
  options: LintOptions = {}
): Report {
  const findings: Finding[] = [];
  const checkedAt = options.checkedAt ?? new Date().toISOString();

  for (const rule of catalogue.rules) {
    if (!ruleApplies(rule, sheet)) continue;
    const nodes = query(rule.target, sheet as Parameters<typeof query>[1]);
    const allMatches: RuleMatch[] = nodes.nodes.map((node) => ({
      path: node.path,
      value: node.value as unknown,
    }));
    const ctx: RuleContext = { sheet, allMatches, checkedAt };

    for (const match of allMatches) {
      const result = rule.check(match, ctx);
      if (result === null || result === undefined) continue;
      const hits = Array.isArray(result) ? result : [result];

      for (const hit of hits) {
        const ruleValues: Record<string, string> = {};
        for (const [name, v] of Object.entries(hit.values ?? {})) {
          ruleValues[name] = String(v);
        }

        // A hit may override the match's path when the rule's conceptual
        // target is finer-grained than the target expression selects.
        const findingPath = hit.path ?? match.path;

        // `{path}` is implicitly available to every template, but
        // `Finding.values` carries only the rule-specific values: the path
        // already appears in `Finding.path`, and duplicating it in every
        // finding would be noise downstream tools have to special-case.
        const message = renderTemplate(rule.id, rule.messageTemplate, {
          ...ruleValues,
          path: findingPath,
        });

        findings.push({
          rule: rule.id,
          severity: hit.severity ?? rule.severity,
          path: findingPath,
          values: ruleValues,
          message,
          remediation: rule.remediation,
        });
      }
    }
  }

  // Determinism guarantee: findings sort by path (lexicographic code-unit
  // order — no locale dependence), then by rule ID. Given the same sheet,
  // catalogue, and options, output is byte-stable, enabling exact-match
  // test fixtures.
  findings.sort((a, b) =>
    a.path < b.path
      ? -1
      : a.path > b.path
        ? 1
        : a.rule < b.rule
          ? -1
          : a.rule > b.rule
            ? 1
            : 0
  );

  const rulesFired: string[] = [];
  const seen = new Set<string>();
  let errors = 0;
  let warnings = 0;
  let info = 0;
  for (const finding of findings) {
    if (finding.severity === "error") errors++;
    else if (finding.severity === "warning") warnings++;
    else info++;
    if (!seen.has(finding.rule)) {
      seen.add(finding.rule);
      rulesFired.push(finding.rule);
    }
  }

  return {
    sheet: sheet.canonical_url,
    checked_at: checkedAt,
    linter_version: options.linterVersion ?? PACKAGE_VERSION,
    release: declaredRelease(sheet),
    sheet_spec_version: sheetSpecVersion(sheet),
    catalogue_version: catalogue.catalogueVersion,
    findings,
    summary: { errors, warnings, info, rules_fired: rulesFired },
  };
}
