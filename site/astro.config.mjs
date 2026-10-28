import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import GithubSlugger from 'github-slugger';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPEC_DOCS, SPEC_BASE } from './src/lib/spec-routes.mjs';
import { CASE_STUDIES, CASE_STUDIES_BASE } from './src/lib/case-study-routes.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const REPO = 'https://github.com/themachineweb/pagefront';
const SITE = 'https://themachineweb.org';
const routeBySource = Object.fromEntries(
  Object.values(SPEC_DOCS).map((d) => [d.source, `${SPEC_BASE}/${d.route}`])
);
// A document's design notes render on the document's own page, so a link
// to the notes file from another document lands there, at the note's id.
for (const d of Object.values(SPEC_DOCS)) {
  if (d.notes) routeBySource[d.notes.source] = `${SPEC_BASE}/${d.route}`;
}
// Repo-root documents rendered as site pages get routes too, so their
// mutual links (CONTRIBUTING.md -> GOVERNANCE.md) resolve on-site.
routeBySource['GOVERNANCE.md'] = '/pagefront/governance';
routeBySource['CONTRIBUTING.md'] = '/pagefront/contributing';
// Case studies link to each other and to their sheets; the writeups get
// routes, the sheets and the archive fall through to GitHub.
for (const c of Object.values(CASE_STUDIES)) routeBySource[c.source] = `${CASE_STUDIES_BASE}/${c.route}`;

/**
 * The spec documents are written for the repository, so their relative
 * links point at files. On the rendered pages those links must resolve:
 * a link to another published spec document becomes its /pagefront/spec
 * route; any other repository-relative link (case studies, archive, the
 * registry) becomes its GitHub URL. Absolute URLs and #fragments pass
 * through untouched. Scoped to the spec sources, the root documents and
 * the case studies; the manifesto is not rewritten.
 *
 * A link whose visible text is the path itself (`[\`../../CONTRIBUTING.md\`]
 * (../../CONTRIBUTING.md)`) reads as a repository path on a web page, so
 * its text becomes the absolute URL the link now points at, without the
 * fragment. Link text that names the document is left alone.
 */
function textOf(node) {
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(textOf).join('');
}

// Replaces the text of a link that holds one text node, possibly inside
// one wrapping element such as <code>, and leaves any other shape alone.
function setText(node, value) {
  let holder = node;
  while (holder.children && holder.children.length === 1 && holder.children[0].type === 'element') {
    holder = holder.children[0];
  }
  if (holder.children && holder.children.length === 1 && holder.children[0].type === 'text') {
    holder.children[0].value = value;
  }
}

function rewriteSpecRelativeLinks() {
  return (tree, file) => {
    const from = file && file.path;
    if (!from) return;
    const norm = from.split(path.sep).join('/');
    const isRootDoc = norm.endsWith('/GOVERNANCE.md') || norm.endsWith('/CONTRIBUTING.md');
    const isCaseStudy = norm.includes('/commerce/case-studies/');
    if (!norm.includes('/commerce/spec/') && !norm.includes('/core/spec/') && !isRootDoc && !isCaseStudy) return;
    const fromDir = path.dirname(from);
    const visit = (node) => {
      if (node.type === 'element' && node.tagName === 'a' && node.properties && node.properties.href) {
        const href = String(node.properties.href);
        if (!/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(href)) {
          const [target, frag] = href.split('#');
          const abs = path.resolve(fromDir, target);
          const rel = path.relative(repoRoot, abs).split(path.sep).join('/');
          const route = routeBySource[rel];
          const isDir = target.endsWith('/') || !/\.[a-z0-9]+$/i.test(target);
          const dest = route ?? `${REPO}/${isDir ? 'tree' : 'blob'}/main/${rel}`;
          node.properties.href = dest + (frag ? `#${frag}` : '');
          const text = textOf(node).trim();
          if (text === target || text === href) {
            setText(node, route ? `${SITE}${dest}` : dest);
          }
        }
      }
      for (const child of node.children ?? []) visit(child);
    };
    visit(tree);
  };
}

/**
 * Design notes as footnotes. A spec document `<name>.md` may have a sibling
 * `<name>-notes.md` of non-normative rationale, one H2 per note. Both files
 * render on the document's page: the notes under the spec, numbered in the
 * order of the notes file's H2s. In the spec, a link to `<name>-notes.md#<h2
 * slug>` is a footnote marker: it becomes a superscript number pointing at
 * the note's heading on the same page, and the first marker for a note
 * carries the id the note's back-link returns to. In the notes file, each
 * H2 gets its number and that back-link, and a link to `<name>.md#<id>`
 * becomes `#<id>`. Both renders number from the notes file alone, so they
 * agree. A marker whose target is not an H2 of the notes file fails the
 * build, as does a notes H2 whose id the two sluggers disagree on.
 *
 * Runs after rehypeHeadingIds, which gives the headings their ids and keeps
 * an id already set, and before the link rewriter, which leaves `#` hrefs
 * alone.
 */
const SPEC_FILE = /\/(commerce|core)\/spec\/([a-z-]+)\.md$/;

function headingSlugs(notesPath) {
  const slugger = new GithubSlugger();
  const notes = [];
  let inFence = false;
  for (const line of fs.readFileSync(notesPath, 'utf8').split('\n')) {
    if (line.startsWith('```')) inFence = !inFence;
    if (inFence) continue;
    const m = /^## (.+?)\s*$/.exec(line);
    if (!m) continue;
    // Heading text as rehype sees it: markdown code and emphasis marks gone.
    const text = m[1].replace(/[`*]/g, '');
    notes.push({ slug: slugger.slug(text), text });
  }
  return notes;
}

function companion(file) {
  const norm = file.split(path.sep).join('/');
  const m = SPEC_FILE.exec(norm);
  if (!m) return null;
  if (m[2].endsWith('-notes')) {
    const specPath = file.replace(/-notes\.md$/, '.md');
    return { mode: 'notes', specPath, notesPath: file };
  }
  const notesPath = file.replace(/\.md$/, '-notes.md');
  if (!fs.existsSync(notesPath)) return null;
  return { mode: 'spec', specPath: file, notesPath };
}

function renderDesignNotes() {
  return (tree, file) => {
    const from = file && file.path;
    if (!from) return;
    const c = companion(from);
    if (!c) return;
    const notes = headingSlugs(c.notesPath);
    const numberOf = new Map(notes.map((n, i) => [n.slug, i + 1]));
    const fromDir = path.dirname(from);
    const resolvesTo = (href, target) => {
      const [file] = href.split('#');
      return path.resolve(fromDir, file) === target;
    };
    const links = [];
    const headings = [];
    const visit = (node) => {
      if (node.type === 'element') {
        if (node.tagName === 'a' && node.properties && node.properties.href) links.push(node);
        if (node.tagName === 'h2') headings.push(node);
      }
      for (const child of node.children ?? []) visit(child);
    };
    visit(tree);

    if (c.mode === 'spec') {
      const seen = new Set();
      for (const node of links) {
        const href = String(node.properties.href);
        if (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(href) || !resolvesTo(href, c.notesPath)) continue;
        const slug = href.split('#')[1];
        const n = slug && numberOf.get(slug);
        if (!n) {
          throw new Error(
            `${path.relative(repoRoot, from)}: footnote marker "${href}" names no H2 of ${path.basename(c.notesPath)}`
          );
        }
        node.properties.href = `#${slug}`;
        node.properties.className = ['fn-ref'];
        node.properties.title = `Design note ${n}: ${notes[n - 1].text}`;
        if (!seen.has(slug)) {
          seen.add(slug);
          node.properties.id = `fnref-${slug}`;
        }
        node.children = [{ type: 'element', tagName: 'sup', properties: {}, children: [{ type: 'text', value: String(n) }] }];
      }
      return;
    }

    // Notes mode: number the H2s and link each back to its first marker.
    const spec = fs.readFileSync(c.specPath, 'utf8');
    const notesName = path.basename(c.notesPath);
    for (const node of headings) {
      const id = node.properties && node.properties.id;
      const n = numberOf.get(id);
      if (!n) {
        throw new Error(
          `${path.relative(repoRoot, from)}: H2 id "${id}" is not among the slugs this plugin computed (${[...numberOf.keys()].join(', ')})`
        );
      }
      node.children = [
        { type: 'element', tagName: 'span', properties: { className: ['fn-num'] }, children: [{ type: 'text', value: `${n}` }] },
        { type: 'text', value: ' ' },
        ...node.children,
      ];
      if (spec.includes(`(${notesName}#${id})`)) {
        node.children.push({ type: 'text', value: ' ' }, {
          type: 'element',
          tagName: 'a',
          properties: { className: ['fn-back'], href: `#fnref-${id}`, ariaLabel: 'Back to the spec' },
          children: [{ type: 'text', value: '↩' }],
        });
      }
    }
    for (const node of links) {
      const href = String(node.properties.href);
      if (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(href) || !resolvesTo(href, c.specPath)) continue;
      const frag = href.split('#')[1];
      if (frag) node.properties.href = `#${frag}`;
    }
  };
}

// Cases the index lists without a link stay out of the sitemap too; their
// pages still build at their routes.
const UNLISTED = new Set(
  Object.values(CASE_STUDIES).filter((c) => c.unlinked).map((c) => `${CASE_STUDIES_BASE}/${c.route}`)
);

export default defineConfig({
  site: 'https://themachineweb.org',
  integrations: [
    sitemap({
      filter: (page) => !UNLISTED.has(new URL(page).pathname),
    }),
  ],
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  markdown: {
    shikiConfig: {
      // The site is light paper; the default dark code theme would sit
      // as black slabs in the spec documents.
      theme: 'github-light',
    },
    rehypePlugins: [rehypeHeadingIds, renderDesignNotes, rewriteSpecRelativeLinks],
  },
  vite: {
    resolve: {
      // json-p3 (lint-core's JSONPath engine) publishes a `browser` field
      // pointing at its IIFE bundle, which has no named exports, and no
      // `exports` map; Vite 8 honours that field for the client build and
      // the validator page fails to bundle. Pin the ESM build instead.
      // Upstream: https://github.com/jg-rp/json-p3/issues/45
      alias: { 'json-p3': 'json-p3/dist/json-p3.esm.js' },
    },
  },
});
