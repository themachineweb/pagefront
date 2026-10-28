/**
 * The published specification documents: which repository files are
 * rendered under /pagefront/spec, at what route, with what index metadata.
 * Keyed by content-collection entry id (repo-relative path minus `.md`).
 *
 * A document not listed here is not published, however complete it may be
 * in the repository. Plain .mjs so astro.config.mjs can import it too (the
 * relative-link rewriter needs the source→route map).
 */
import { CURRENT_RELEASE, currentSheetSpec } from './releases.mjs';

export const SPEC_BASE = '/pagefront/spec';

/** The line every versioned document's status ends with. */
const MATURITY = 'suitable for experimentation and feedback; the stability policy applies from release 1.0.0.';

export const SPEC_DOCS = {
  'commerce/spec/product': {
    route: 'commerce/product',
    source: 'commerce/spec/product.md',
    schemaType: 'product',
    title: 'Product sheet',
    status: 'normative',
    statusLine:
      `Normative. Product Sheet spec ${currentSheetSpec('product')}, in commerce release ${CURRENT_RELEASE}: ${MATURITY}`,
    blurb:
      'The product sheet: envelope, data block, identifiers, variants, offers, media, discovery.',
  },
  'commerce/spec/organization': {
    route: 'commerce/organization',
    source: 'commerce/spec/organization.md',
    schemaType: 'organization',
    title: 'Organization sheet',
    status: 'normative',
    statusLine:
      `Normative. Organization Sheet spec ${currentSheetSpec('organization')}, in commerce release ${CURRENT_RELEASE}: ${MATURITY}`,
    blurb:
      'The publisher’s own statement of who they are — the entity behind the products.',
  },
  'commerce/spec/collection': {
    route: 'commerce/collection',
    source: 'commerce/spec/collection.md',
    schemaType: 'collection',
    title: 'Collection sheet',
    status: 'normative',
    statusLine:
      `Normative. Collection Sheet spec ${currentSheetSpec('collection')}, in commerce release ${CURRENT_RELEASE}: ${MATURITY}`,
    blurb:
      'The listing page: categories, curated collections and brand collections, with their members, their parents and the catalogue entry point.',
  },
  'commerce/spec/vocabulary': {
    route: 'commerce/vocabulary',
    source: 'commerce/spec/vocabulary.md',
    title: 'Pagefront Vocabulary',
    status: 'normative',
    statusLine:
      `Normative. Vocabulary ${CURRENT_RELEASE}, the vocabulary of commerce release ${CURRENT_RELEASE}: ${MATURITY}`,
    blurb:
      'Every term Pagefront adds on top of Schema.org, what it means, and why Schema.org could not carry it.',
  },
  'commerce/spec/releases': {
    route: 'commerce/releases',
    source: 'commerce/spec/releases.md',
    title: 'Releases and versioning',
    status: 'normative',
    statusLine: `Normative. Current commerce release: ${CURRENT_RELEASE}.`,
    blurb:
      'How the commerce vertical is versioned: sheet-spec versions, releases, the release table and the legacy draft line.',
  },
  'commerce/spec/rules': {
    route: 'commerce/rules',
    source: 'commerce/spec/rules.md',
    title: 'Rule catalogue',
    status: 'normative',
    statusLine:
      'Normative for the commerce linter. The catalogue has its own semver and states the releases it supports.',
    blurb:
      'Every semantic check the linter applies, with stable rule IDs, severities and fixes.',
  },
  'commerce/spec/scoring': {
    route: 'commerce/scoring',
    source: 'commerce/spec/scoring.md',
    title: 'Completeness dimensions',
    status: 'non-normative',
    statusLine: 'Non-normative. Defines no conformance requirement.',
    blurb:
      'A shared vocabulary for discussing how complete a sheet is. Dimensions only — no weights, no score.',
  },
  'core/spec/discovery': {
    route: 'core/discovery',
    source: 'core/spec/discovery.md',
    title: 'Discovery',
    status: 'normative',
    statusLine: `Normative. Discovery spec 0.1.0; ${MATURITY}`,
    blurb:
      'How a consumer locates a sheet: the page-based carriers, the entry point for an origin, the traversal-hint rule and the filename convention. Every sheet type, every vertical.',
  },
  'core/spec/linter': {
    route: 'core/linter',
    source: 'core/spec/linter.md',
    title: 'Linter design',
    status: 'design',
    statusLine:
      'Design document — the vertical-agnostic contract the page-type catalogues implement.',
    blurb:
      'Rule structure, severity levels, report format, and the conformance contract. Vertical-agnostic.',
  },
  // Each document's changelog lives in a sibling file; routed so the
  // specs' links to them resolve on the site, kept off the index.
  ...changelogDocs([
    ['commerce/spec/product', 'Product sheet'],
    ['commerce/spec/organization', 'Organization sheet'],
    ['commerce/spec/collection', 'Collection sheet'],
    ['commerce/spec/vocabulary', 'Vocabulary'],
    ['commerce/spec/rules', 'Rule catalogue'],
    ['core/spec/discovery', 'Discovery'],
    ['core/spec/linter', 'Linter design'],
  ]),
};

function changelogDocs(pairs) {
  return Object.fromEntries(
    pairs.map(([id, title]) => [
      `${id}-changelog`,
      {
        route: `${id.replace('/spec/', '/')}-changelog`,
        source: `${id}-changelog.md`,
        title: `${title}: changelog`,
        status: 'non-normative',
        statusLine: `The history of the ${title.toLowerCase()} document, with its Unreleased entries.`,
        blurb: `Every change to the ${title.toLowerCase()} document, by version.`,
        unlisted: true,
      },
    ])
  );
}
