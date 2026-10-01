#!/usr/bin/env node
/**
 * Guard for the frozen schema store, commerce/schemas/.
 *
 * Published JSON Schemas are append-only: a file under commerce/schemas/
 * is served verbatim at a public URL for as long as the site exists, so
 * once it is on the base branch it is never modified, renamed or deleted.
 * Adding files is how a release publishes a schema.
 *
 * Checks, all of which must pass:
 *
 *   1. No file under commerce/schemas/ that exists on the base ref is
 *      modified or deleted (a rename is a deletion plus an addition).
 *   2. Every file in the store is referenced by commerce/spec/releases.json:
 *      it is the schema of a sheet-spec version some release bundles, or
 *      one of the legacy draft line's schemas the manifest lists.
 *   3. Every schema releases.json references is in the store.
 *   4. Every file's `$id` is the URL it is published at.
 *
 * Usage: node scripts/check-frozen-schemas.mjs [base-ref]
 * The base ref defaults to $BASE_REF, then origin/main. The comparison is
 * between the merge base and the working tree, so it sees uncommitted
 * changes too, which is what makes it usable before committing.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const STORE = "commerce/schemas";
const base = process.argv[2] ?? process.env.BASE_REF ?? "origin/main";
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

const problems = [];

// 1. Nothing that exists on the base is modified or deleted.
let mergeBase;
try {
  mergeBase = git("merge-base", base, "HEAD");
} catch {
  console.error(`check-frozen-schemas: cannot find a merge base with ${base}; fetch it first`);
  process.exit(2);
}
const diff = git("diff", "--no-renames", "--name-status", mergeBase, "--", STORE);
for (const line of diff.split("\n").filter(Boolean)) {
  const [status, file] = line.split("\t");
  if (status !== "A") {
    problems.push(`${file}: ${status === "D" ? "deleted" : "modified"}; published schemas are frozen (add a new version instead)`);
  }
}

// 2–4. The store and the release manifest agree.
const manifest = JSON.parse(readFileSync(join(root, "commerce/spec/releases.json"), "utf8"));
const urlFor = (sheet, version) =>
  manifest.schema_url_template.replace("{sheet}", sheet).replace("{version}", version);
const referenced = new Map(); // store-relative path → published URL
for (const release of manifest.releases) {
  for (const [sheet, version] of Object.entries(release.sheets)) {
    referenced.set(`${sheet}/v${version}.json`, urlFor(sheet, version));
  }
}
for (const [sheet, url] of Object.entries(manifest.legacy.schemas)) {
  referenced.set(`${sheet}/${url.replace(/^.*\//, "")}`, url);
}

const present = new Set();
const storeDir = join(root, STORE);
for (const type of existsSync(storeDir) ? readdirSync(storeDir, { withFileTypes: true }) : []) {
  if (!type.isDirectory()) continue;
  for (const file of readdirSync(join(storeDir, type.name))) {
    const rel = `${type.name}/${file}`;
    present.add(rel);
    if (!referenced.has(rel)) {
      problems.push(`${STORE}/${rel}: not referenced by commerce/spec/releases.json`);
      continue;
    }
    const id = JSON.parse(readFileSync(join(storeDir, rel), "utf8")).$id;
    if (id !== referenced.get(rel)) {
      problems.push(`${STORE}/${rel}: $id is ${id}, expected ${referenced.get(rel)}`);
    }
  }
}
for (const rel of referenced.keys()) {
  if (!present.has(rel)) problems.push(`${STORE}/${rel}: referenced by commerce/spec/releases.json but missing from the store`);
}

if (problems.length > 0) {
  console.error("Frozen schema check failed:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`Frozen schema check passed: ${present.size} schemas, none modified or deleted since ${base}.`);
