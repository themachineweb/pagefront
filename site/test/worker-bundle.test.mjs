/**
 * The Worker bundle, as wrangler would deploy it. Two traps have bitten
 * here and are guarded for: the JSONPath engine's `browser` field (an
 * IIFE with no named exports, aliased away in wrangler.jsonc), and the
 * generated Layer 1 validators' CommonJS helpers, which must resolve
 * under esbuild's interop as well as Node's.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");

test("worker bundle: ESM JSONPath engine, no IIFE, validators present", () => {
  const outdir = mkdtempSync(join(tmpdir(), "pagefront-worker-"));
  execFileSync("npx", ["wrangler", "deploy", "--dry-run", "--outdir", outdir], {
    cwd: site,
    stdio: "pipe",
    env: { ...process.env, CI: "1" },
  });
  const entry = readdirSync(outdir).find((f) => f.endsWith(".js"));
  assert.ok(entry, "wrangler produced no bundle");
  const bundle = readFileSync(join(outdir, entry), "utf8");
  assert.ok(!bundle.includes("json-p3.iife"), "the bundle carries json-p3's IIFE build; check the alias in wrangler.jsonc");
  assert.ok(bundle.includes("json-p3.esm"), "the bundle should carry json-p3's ESM build");
  assert.ok(bundle.includes("ajv/dist/runtime/ucs2length.js"), "the generated Layer 1 validators' runtime helper is missing from the bundle");
  assert.ok(!bundle.includes("ajv/dist/compile/"), "the bundle carries Ajv's compiler; Layer 1 should be precompiled");
  assert.ok(!/new Function\(/.test(bundle), "the bundle generates code at runtime, which Workers refuse");
});
