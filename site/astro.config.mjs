import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
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
    rehypePlugins: [rewriteSpecRelativeLinks],
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
