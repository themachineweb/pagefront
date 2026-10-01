#!/usr/bin/env node
/**
 * CLI entry point for `pagefront-lint-commerce` — the reference
 * implementation described in core/spec/linter.md ("Implementations").
 * Accepts a Sheet URL or local file path, runs Layer 1 (JSON Schema —
 * the bundled product schema) and then Layer 2 (the commerce rule
 * catalogue), and emits the canonical JSON report to stdout;
 * `--format=text` emits the terminal rendering instead. Only the
 * report ever goes to stdout — usage and Layer 1 diagnostics go to
 * stderr.
 *
 * Exit codes: 0 — lint ran, nothing blocking; 1 — Layer 1 failed, or
 * findings at or above --fail-on (default: error); 2 — operational
 * failure (bad usage, unreadable input, fetch failure, invalid JSON).
 */
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { parseArgs } from "node:util";
import { renderGithub, renderHtml, renderText } from "@pagefront/lint-core";
import { validateAndLint } from "./index.js";

const require = createRequire(import.meta.url);
const PACKAGE_VERSION: string = require("../package.json").version;

const USAGE = `usage: pagefront-lint-commerce <sheet-url-or-path> [options]

Lint a Pagefront commerce Sheet: Layer 1 (JSON Schema) validation,
then the Layer 2 rule catalogue. The canonical JSON report goes to
stdout.

options:
  --format <json|text|html|github>
                             output format (default: json); github emits
                             GitHub Actions annotations
  --fail-on <error|warning>  lowest severity that fails the exit code
                             (default: error)
  --checked-at <iso8601>     override the report's checked_at timestamp,
                             for reproducible output
  --version                  print the linter version
  --help                     print this usage
`;

/** Operational failure (exit 2): usage, IO, fetch, JSON parse. */
function fail(message: string): never {
  process.stderr.write(`pagefront-lint-commerce: ${message}\n`);
  process.exit(2);
}

async function loadSheetText(target: string): Promise<string> {
  if (/^https?:\/\//i.test(target)) {
    let response: Response;
    try {
      response = await fetch(target, {
        headers: { accept: "application/json" },
      });
    } catch (error) {
      fail(`fetch failed for ${target}: ${(error as Error).message}`);
    }
    if (!response.ok) {
      fail(`fetch failed for ${target}: HTTP ${response.status}`);
    }
    return response.text();
  }
  try {
    return await readFile(target, "utf8");
  } catch (error) {
    fail(`cannot read ${target}: ${(error as Error).message}`);
  }
}

const { values, positionals } = (() => {
  try {
    return parseArgs({
      allowPositionals: true,
      options: {
        format: { type: "string", default: "json" },
        "fail-on": { type: "string", default: "error" },
        "checked-at": { type: "string" },
        version: { type: "boolean", default: false },
        help: { type: "boolean", default: false },
      },
    });
  } catch (error) {
    fail(`${(error as Error).message}\n\n${USAGE}`);
  }
})();

if (values.help) {
  process.stdout.write(USAGE);
  process.exit(0);
}
if (values.version) {
  process.stdout.write(`${PACKAGE_VERSION}\n`);
  process.exit(0);
}
if (positionals.length !== 1) {
  fail(`expected exactly one Sheet URL or file path\n\n${USAGE}`);
}
const FORMATS = ["json", "text", "html", "github"];
if (!FORMATS.includes(values.format)) {
  fail(`--format must be one of ${FORMATS.join(", ")}, got "${values.format}"`);
}
if (values["fail-on"] !== "error" && values["fail-on"] !== "warning") {
  fail(`--fail-on must be error or warning, got "${values["fail-on"]}"`);
}
const checkedAt = values["checked-at"];
if (checkedAt !== undefined && Number.isNaN(Date.parse(checkedAt))) {
  fail(`--checked-at must be an ISO 8601 timestamp, got "${checkedAt}"`);
}

const target = positionals[0];
const text = await loadSheetText(target);

let parsed: unknown;
try {
  parsed = JSON.parse(text);
} catch (error) {
  fail(`${target} is not valid JSON: ${(error as Error).message}`);
}

// Layer 1 → Layer 2 — the library owns the sequencing; the CLI only
// maps the result union onto streams and exit codes.
const result = validateAndLint(parsed, { checkedAt });
if (result.layer === 1) {
  const errors = result.schemaErrors;
  process.stderr.write(
    `Layer 1 (JSON Schema) validation failed for ${target}: ` +
      `${errors.length} error${errors.length === 1 ? "" : "s"}\n`
  );
  for (const error of errors) {
    process.stderr.write(
      `  ${error.instancePath === "" ? "(root)" : error.instancePath}: ${error.message}\n`
    );
  }
  process.exit(1);
}

const report = result.report;

if (values.format === "json") {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else if (values.format === "html") {
  process.stdout.write(renderHtml(report));
} else if (values.format === "github") {
  process.stdout.write(renderGithub(report));
} else {
  const color =
    process.stdout.isTTY === true && process.env.NO_COLOR === undefined;
  process.stdout.write(renderText(report, { color }));
}

const blocking =
  report.summary.errors > 0 ||
  (values["fail-on"] === "warning" && report.summary.warnings > 0);
process.exit(blocking ? 1 : 0);
