/**
 * Terminal rendering of the canonical Report — the `--format=text`
 * output of core/spec/linter.md's "Output format" section. Renderings
 * are derived views: everything here is computed from the Report alone,
 * so any consumer holding the JSON can reproduce the text exactly.
 */
import type { Report, Severity } from "./types.js";

export interface RenderTextOptions {
  /**
   * Emit ANSI color codes. Default false: plain deterministic text,
   * suitable for redirection and exact-match tests. Callers (the CLI)
   * decide TTY/NO_COLOR policy.
   */
  color?: boolean;
}

const ANSI: Record<Severity, string> = {
  error: "\x1b[31m",
  warning: "\x1b[33m",
  info: "\x1b[36m",
};
const ANSI_RESET = "\x1b[0m";

/** Longest severity word ("warning") — findings column-align on it. */
const SEVERITY_PAD = 7;

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * Render a Report as human-readable terminal text. Findings appear in
 * report order (the engine's path-then-rule sort) — the renderer does
 * not reorder them.
 */
export function renderText(
  report: Report,
  options: RenderTextOptions = {}
): string {
  const color = options.color ?? false;
  const lines: string[] = [];

  lines.push(report.sheet);
  lines.push(
    `linted ${report.checked_at} · linter ${report.linter_version}` +
      ` · release ${report.release ?? "none"} · sheet spec ${report.sheet_spec_version ?? "none"}` +
      ` · catalogue ${report.catalogue_version}`
  );
  lines.push("");

  for (const finding of report.findings) {
    const label = finding.severity.padEnd(SEVERITY_PAD);
    const severity = color
      ? `${ANSI[finding.severity]}${label}${ANSI_RESET}`
      : label;
    lines.push(`${severity}  ${finding.rule}  ${finding.path}`);
    lines.push(`  ${finding.message}`);
    lines.push(`  fix: ${finding.remediation}`);
    lines.push("");
  }

  const { errors, warnings, info, rules_fired } = report.summary;
  if (report.findings.length === 0) {
    lines.push("no findings");
  } else {
    lines.push(
      `${plural(errors, "error")} · ${plural(warnings, "warning")} · ${info} info`
    );
    lines.push(`rules fired: ${rules_fired.join(", ")}`);
  }

  return lines.join("\n") + "\n";
}
