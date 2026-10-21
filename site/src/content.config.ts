import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const manifesto = defineCollection({
  loader: glob({ pattern: 'manifesto.md', base: '..' }),
});

// The specification documents rendered under /pagefront/spec — the
// repository markdown is the canonical source; which entries are
// published (and where) is decided by src/lib/spec-routes.mjs.
const spec = defineCollection({
  loader: glob({ pattern: ['commerce/spec/*.md', 'core/spec/*.md'], base: '..' }),
});

// The prompts in commerce/prompts/: the built chat prompts are rendered at
// /pagefront/publish/write/<platform>, the one-product prompt at
// /pagefront/publish/assistant, each with a markdown twin; the code-route
// prompts are in the collection and have no page yet.
const prompts = defineCollection({
  loader: glob({ pattern: 'commerce/prompts/*.md', base: '..' }),
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
// The FAQ at /pagefront/faq, one question per H2.
const faq = defineCollection({
  loader: glob({ pattern: 'faq.md', base: './src/content' }),
});

export const collections = { manifesto, spec, prompts, governance, contributing, caseStudies, publish, consume, faq };
