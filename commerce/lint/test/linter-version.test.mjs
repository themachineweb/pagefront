/**
 * lintSheet's `linter_version` default must identify the invoking
 * implementation — this package — not the lint-core engine. The
 * conformance suite always injects `linterVersion`, so this default is
 * asserted here instead.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { lintSheet } from "../dist/index.js";

const require = createRequire(import.meta.url);
const PACKAGE_VERSION = require("../package.json").version;

test("generated version constant matches package.json (drift test)", async () => {
  const { PACKAGE_VERSION } = await import("../dist/version.js");
  assert.equal(
    PACKAGE_VERSION,
    require("../package.json").version,
    "version.ts has drifted from package.json — regenerate it with the version bump"
  );
});

test("library entry is free of Node built-ins (browser consumers bundle it)", async () => {
  // cli.js is the Node-only entry point and exempt; everything the
  // library index reaches must not import node:* modules.
  const { readdir, readFile } = await import("node:fs/promises");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
  for (const file of await readdir(dist)) {
    if (!file.endsWith(".js") || file === "cli.js") continue;
    const source = await readFile(join(dist, file), "utf8");
    assert.ok(
      !/from\s+"node:|require\("node:/.test(source),
      `${file} imports a node: built-in — the library entry must stay browser-pure`
    );
  }
});

test("lintSheet defaults linter_version to the lint-commerce package version", () => {
  const report = lintSheet({
    $schema: "https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json",
    release: "0.4.0",
    canonical_url: "https://merchant.example/products/aurora-lamp",
    sheet_url: "https://merchant.example/products/aurora-lamp.pagefront.json",
    generated_at: "2026-08-01T00:00:00Z",
    data: {},
  });
  assert.equal(report.linter_version, PACKAGE_VERSION);
});
