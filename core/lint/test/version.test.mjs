import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { PACKAGE_VERSION } from "../dist/version.js";

const require = createRequire(import.meta.url);

test("generated version constant matches package.json", () => {
  assert.equal(
    PACKAGE_VERSION,
    require("../package.json").version,
    "version.ts has drifted from package.json — regenerate it with the version bump"
  );
});

test("library entry is free of Node built-ins (browser consumers bundle it)", async () => {
  // The CLI is Node-only by nature; the library graph reached from
  // index.js must not import node:* modules.
  const { readdir, readFile } = await import("node:fs/promises");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
  for (const file of await readdir(dist)) {
    if (!file.endsWith(".js")) continue;
    const source = await readFile(join(dist, file), "utf8");
    assert.ok(
      !/from\s+"node:|require\("node:/.test(source),
      `${file} imports a node: built-in — the library entry must stay browser-pure`
    );
  }
});
