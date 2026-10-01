/**
 * HTML rendering of the canonical Report — the `--format=html` output
 * of core/spec/linter.md's "Output format" section. A single
 * self-contained document (inline styles, no external assets), so the
 * file can be archived as a CI artifact or opened locally as-is.
 * Everything is computed from the Report alone; output is
 * deterministic for a given report.
 */
import type { Report, Severity } from "./types.js";

const ACCENT: Record<Severity, string> = {
  error: "#b91c1c",
  warning: "#b45309",
  info: "#0369a1",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** Render a Report as a self-contained HTML document. */
export function renderHtml(report: Report): string {
  const sheet = escapeHtml(report.sheet);
  // Renderer-level input is untrusted: only linkify genuine http(s)
  // URLs so a hostile `sheet` value can't smuggle a javascript: href.
  const sheetLine = /^https?:\/\//i.test(report.sheet)
    ? `<a href="${sheet}">${sheet}</a>`
    : sheet;
  const { errors, warnings, info, rules_fired } = report.summary;

  const summary =
    report.findings.length === 0
      ? `<p class="clean">no findings</p>`
      : `<p class="counts">` +
        `<span class="count" style="color:${ACCENT.error}">${escapeHtml(plural(errors, "error"))}</span> · ` +
        `<span class="count" style="color:${ACCENT.warning}">${escapeHtml(plural(warnings, "warning"))}</span> · ` +
        `<span class="count" style="color:${ACCENT.info}">${info} info</span></p>\n` +
        `<p class="rules">rules fired: ${escapeHtml(rules_fired.join(", "))}</p>`;

  const findings = report.findings
    .map(
      (finding) => `<li class="finding" style="border-left-color:${ACCENT[finding.severity]}">
  <p class="head"><span class="severity" style="color:${ACCENT[finding.severity]}">${finding.severity}</span> <span class="rule">${escapeHtml(finding.rule)}</span> <code class="path">${escapeHtml(finding.path)}</code></p>
  <p class="message">${escapeHtml(finding.message)}</p>
  <p class="remediation">fix: ${escapeHtml(finding.remediation)}</p>
</li>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pagefront lint report — ${sheet}</title>
<style>
  body { margin: 2rem auto; max-width: 46rem; padding: 0 1rem; background: #ffffff; color: #1f2328;
         font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  header h1 { font-size: 1.25rem; margin: 0 0 .25rem; }
  header .meta { color: #59636e; font-size: .875rem; margin: 0; }
  a { color: inherit; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .875em;
         background: #f6f8fa; padding: .1em .3em; border-radius: 4px; overflow-wrap: anywhere; }
  .counts, .clean { font-weight: 600; margin: 1.5rem 0 .25rem; }
  .rules { color: #59636e; font-size: .875rem; margin: 0; }
  ol.findings { list-style: none; margin: 1.5rem 0; padding: 0; }
  .finding { border: 1px solid #d1d9e0; border-left: 4px solid; border-radius: 6px;
             padding: .75rem 1rem; margin: 0 0 1rem; }
  .finding p { margin: 0 0 .5rem; }
  .finding p:last-child { margin-bottom: 0; }
  .severity { font-weight: 700; }
  .rule { font-weight: 600; }
  .remediation { color: #59636e; }
</style>
</head>
<body>
<header>
<h1>Pagefront lint report</h1>
<p class="meta">${sheetLine}</p>
<p class="meta">linted ${escapeHtml(report.checked_at)} · linter ${escapeHtml(report.linter_version)} · release ${escapeHtml(report.release ?? "none")} · sheet spec ${escapeHtml(report.sheet_spec_version ?? "none")} · catalogue ${escapeHtml(report.catalogue_version)}</p>
</header>
${summary}
${report.findings.length === 0 ? "" : `<ol class="findings">\n${findings}\n</ol>\n`}</body>
</html>
`;
}
