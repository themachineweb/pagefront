import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const manifesto = defineCollection({
  loader: glob({ pattern: 'manifesto.md', base: '..' }),
});

// The specification documents rendered under /pagefront/spec — the
// repository markdown is the canonical source; which entries are
// published (and where) is decided by src/lib/spec-routes.mjs.
const spec = defineCollection({
  loader: glob({ pattern: ['commerce/spec/*.md', 'core/spec/linter.md'], base: '..' }),
});

// The governance document, rendered at /pagefront/governance.
const governance = defineCollection({
  loader: glob({ pattern: 'GOVERNANCE.md', base: '..' }),
});

// The contributing guide, rendered at /pagefront/contributing.
const contributing = defineCollection({
  loader: glob({ pattern: 'CONTRIBUTING.md', base: '..' }),
});

// The case studies, rendered under /pagefront/commerce/case-studies; which
// ones are published (and where) is decided by src/lib/case-study-routes.mjs.
const caseStudies = defineCollection({
  loader: glob({ pattern: 'commerce/case-studies/*/case-study.md', base: '..' }),
});

// Site copy kept as markdown in the site itself (not a repository document):
// the publishing guide at /pagefront/publish and its sibling, the consuming
// guide at /pagefront/consume.
const publish = defineCollection({
  loader: glob({ pattern: 'publish.md', base: './src/content' }),
});
const consume = defineCollection({
  loader: glob({ pattern: 'consume.md', base: './src/content' }),
});

export const collections = { manifesto, spec, governance, contributing, caseStudies, publish, consume };
