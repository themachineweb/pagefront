/**
 * The design notes rendered as footnotes on the product spec page
 * (renderDesignNotes in astro.config.mjs), checked on the built page:
 * every footnote marker points at a note on the page and carries that
 * note's number, the notes are numbered 1..n in order, and every note
 * with a marker has a back-link to it. Skipped when the site is not built.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const page = fileURLToPath(new URL("../dist/pagefront/spec/commerce/product.html", import.meta.url));

test("product page: footnote markers and numbered design notes agree", { skip: !existsSync(page) && "run npm run build first" }, () => {
  const html = readFileSync(page, "utf8");

  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const markers = [...html.matchAll(/<a\s+href="#([^"]+)"\s+class="fn-ref"[^>]*><sup>(\d+)<\/sup><\/a>/g)].map((m) => ({
    slug: m[1],
    n: Number(m[2]),
  }));
  assert.ok(markers.length > 20, `expected footnote markers, found ${markers.length}`);

  const notes = [...html.matchAll(/<h2 id="([^"]+)"><span class="fn-num">(\d+)<\/span>/g)].map((m) => ({
    slug: m[1],
    n: Number(m[2]),
  }));
  assert.ok(notes.length > 20, `expected numbered notes, found ${notes.length}`);
  assert.deepEqual(notes.map((x) => x.n), notes.map((_, i) => i + 1), "notes are numbered 1..n in order");

  const numberOf = new Map(notes.map((x) => [x.slug, x.n]));
  for (const m of markers) {
    assert.ok(ids.has(m.slug), `marker target #${m.slug} is an id on the page`);
    assert.equal(m.n, numberOf.get(m.slug), `marker for #${m.slug} carries the note's number`);
  }

  const referenced = new Set(markers.map((m) => m.slug));
  for (const slug of referenced) {
    assert.ok(ids.has(`fnref-${slug}`), `first marker for #${slug} carries the back-link target`);
    assert.ok(html.includes(`href="#fnref-${slug}"`), `note #${slug} links back to its marker`);
  }
  // The "On this page" box ends with the notes section.
  assert.ok(html.includes('href="#design-notes"'), "the table of contents links the design notes");
});
