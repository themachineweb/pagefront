/**
 * GitHub Actions rendering of the canonical Report — the
 * `--format=github` output of core/spec/linter.md's "Output format"
 * section: one workflow-command annotation line per finding, so a CI
 * step that prints this output gets findings surfaced as annotations
 * on the run.
 *
 * Severity maps onto the three annotation commands: error → `::error`,
 * warning → `::warning`, info → `::notice`. Escaping follows the
 * `@actions/core` toolkit (escapeData/escapeProperty in
 * packages/core/src/command.ts): `%` `\r` `\n` percent-encoded in
 * messages, additionally `:` and `,` in property values — the rules
 * the runner actually decodes by, though its docs don't state them.
 */
import type { Report, Severity } from "./types.js";

const COMMAND: Record<Severity, string> = {
  error: "error",
  warning: "warning",
  info: "notice",
};

function escapeData(value: string): string {
  return value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

function escapeProperty(value: string): string {
  return escapeData(value).replace(/:/g, "%3A").replace(/,/g, "%2C");
}

/**
 * Render a Report as GitHub Actions workflow-command annotations, one
 * line per finding in report order. A report with no findings renders
 * to the empty string — no annotations to emit.
 */
export function renderGithub(report: Report): string {
  return report.findings
    .map((finding) => {
      const command = COMMAND[finding.severity];
      const title = escapeProperty(`${finding.rule} at ${finding.path}`);
      const message = escapeData(
        `${finding.message} Fix: ${finding.remediation}`
      );
      return `::${command} title=${title}::${message}\n`;
    })
    .join("");
}
