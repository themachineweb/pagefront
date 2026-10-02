import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// These tests drive the real CLI entry point (dist/cli.js) as a child
// process — the production path: argument parsing, Layer 1 → Layer 2
// sequencing, stream separation, and exit codes. Rule behavior itself
// is the conformance suite's concern; the CLI fixtures under
// cli-fixtures/ are Layer-1-valid sheets (unlike the deliberately
// minimal conformance fixtures) so they can cross Layer 1 for real.

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(pkgDir, "dist", "cli.js");
const FIXTURES = join(pkgDir, "test", "cli-fixtures");
const PACKAGE_VERSION = JSON.parse(
  readFileSync(join(pkgDir, "package.json"), "utf8")
).version;

const CHECKED_AT = "2026-01-01T00:00:00Z";

// Async on purpose: the URL-input test serves the sheet from an
// in-process HTTP server, so a synchronous spawn would deadlock (the
// blocked event loop could never accept the child's request).
function run(...args) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [CLI, ...args],
      { encoding: "utf8" },
      (error, stdout, stderr) => {
        resolve({ code: error === null ? 0 : error.code, stdout, stderr });
      }
    );
  });
}

function runOn(fixture, ...args) {
  return run(join(FIXTURES, fixture), "--checked-at", CHECKED_AT, ...args);
}

test("clean sheet: canonical report to stdout, exit 0", async () => {
  const { code, stdout, stderr } = await runOn("clean.json");
  assert.equal(code, 0);
  assert.equal(stderr, "");
  const report = JSON.parse(stdout);
  assert.deepEqual(report, {
    sheet: "https://merchant.example/products/aurora-lamp",
    checked_at: CHECKED_AT,
    linter_version: PACKAGE_VERSION,
    release: "0.4.0",
    sheet_spec_version: "0.10.0",
    catalogue_version: report.catalogue_version,
    findings: [],
    summary: { errors: 0, warnings: 0, info: 0, rules_fired: [] },
  });
  assert.match(report.catalogue_version, /^\d+\.\d+\.\d+$/);
});

test("warning findings: exit 0 by default, exit 1 under --fail-on warning", async () => {
  const defaulted = await runOn("warns.json");
  assert.equal(defaulted.code, 0);
  const report = JSON.parse(defaulted.stdout);
  assert.deepEqual(report.summary.rules_fired, ["PDP-W-001"]);
  assert.equal(report.summary.warnings, 1);

  const escalated = await runOn("warns.json", "--fail-on", "warning");
  assert.equal(escalated.code, 1);
  // Same report either way — --fail-on affects only the exit code.
  assert.deepEqual(JSON.parse(escalated.stdout), report);
});

test("error findings: exit 1", async () => {
  const { code, stdout } = await runOn("errors.json");
  assert.equal(code, 1);
  const report = JSON.parse(stdout);
  assert.equal(report.summary.errors, 1);
  assert.deepEqual(report.summary.rules_fired, ["PDP-E-001"]);
});

test("Layer 1 failure: diagnostics to stderr, empty stdout, exit 1", async () => {
  const { code, stdout, stderr } = await runOn("layer1-fails.json");
  assert.equal(code, 1);
  assert.equal(stdout, "");
  assert.match(stderr, /Layer 1 \(JSON Schema\) validation failed/);
  assert.match(stderr, /release/);
});

test("--format text renders the terminal view (no ANSI when not a TTY)", async () => {
  const { code, stdout } = await runOn("clean.json", "--format", "text");
  assert.equal(code, 0);
  assert.match(stdout, /^https:\/\/merchant\.example\/products\/aurora-lamp\n/);
  assert.match(stdout, /no findings\n$/);
  assert.ok(!stdout.includes("\x1b["));

  const warned = await runOn("warns.json", "--format", "text");
  assert.match(warned.stdout, /warning  PDP-W-001  /);
  assert.match(warned.stdout, /rules fired: PDP-W-001\n$/);
});

test("--format html renders a self-contained document", async () => {
  const { code, stdout } = await runOn("warns.json", "--format", "html");
  assert.equal(code, 0);
  assert.match(stdout, /^<!doctype html>\n/);
  assert.ok(stdout.includes("PDP-W-001"));
  assert.ok(stdout.includes("https://merchant.example/products/aurora-lamp"));
});

test("--format github emits workflow-command annotations", async () => {
  const warned = await runOn("warns.json", "--format", "github");
  assert.equal(warned.code, 0);
  assert.match(warned.stdout, /^::warning title=PDP-W-001 at \$\['data'\]::/);

  const errored = await runOn("errors.json", "--format", "github");
  assert.equal(errored.code, 1);
  assert.match(errored.stdout, /^::error title=PDP-E-001 at /);

  // Clean sheet: no annotations to emit.
  const clean = await runOn("clean.json", "--format", "github");
  assert.equal(clean.code, 0);
  assert.equal(clean.stdout, "");
});

test("URL input: sheet is fetched over HTTP", async () => {
  const body = readFileSync(join(FIXTURES, "clean.json"));
  const server = createServer((req, res) => {
    if (req.url === "/sheet.json") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(body);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const ok = await run(
      `http://127.0.0.1:${port}/sheet.json`,
      "--checked-at",
      CHECKED_AT
    );
    assert.equal(ok.code, 0);
    assert.equal(
      JSON.parse(ok.stdout).sheet,
      "https://merchant.example/products/aurora-lamp"
    );

    const missing = await run(`http://127.0.0.1:${port}/gone.json`);
    assert.equal(missing.code, 2);
    assert.match(missing.stderr, /HTTP 404/);
  } finally {
    server.close();
  }
});

test("operational failures exit 2", async () => {
  const unreadable = await run(join(FIXTURES, "no-such-sheet.json"));
  assert.equal(unreadable.code, 2);
  assert.match(unreadable.stderr, /cannot read/);

  const noTarget = await run();
  assert.equal(noTarget.code, 2);
  assert.match(noTarget.stderr, /exactly one Sheet URL or file path/);

  const badFormat = await runOn("clean.json", "--format", "yaml");
  assert.equal(badFormat.code, 2);
  assert.match(badFormat.stderr, /--format must be one of json, text, html, github/);

  const badFailOn = await runOn("clean.json", "--fail-on", "info");
  assert.equal(badFailOn.code, 2);
  assert.match(badFailOn.stderr, /--fail-on must be error or warning/);

  const badCheckedAt = await run(join(FIXTURES, "clean.json"), "--checked-at", "yesterday");
  assert.equal(badCheckedAt.code, 2);
  assert.match(badCheckedAt.stderr, /--checked-at must be an ISO 8601/);
});

test("--help and --version", async () => {
  const help = await run("--help");
  assert.equal(help.code, 0);
  assert.match(help.stdout, /^usage: pagefront-lint-commerce /);

  const version = await run("--version");
  assert.equal(version.code, 0);
  assert.equal(version.stdout, `${PACKAGE_VERSION}\n`);
});
