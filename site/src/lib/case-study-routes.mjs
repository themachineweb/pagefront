/**
 * The published case studies: which repository writeups are rendered
 * under /pagefront/commerce/case-studies, at what route, with what index
 * metadata. Keyed by content-collection entry id (repo-relative path minus
 * `.md`). A case not listed here is not published. Plain .mjs so
 * astro.config.mjs can import it (the relative-link rewriter needs the
 * source→route map). Descriptions are hardcoded here, not read from the
 * markdown; keep them in step when a writeup changes meaning. `sheets`
 * names the JSON files in the case folder that the site serves alongside
 * the writeup, each with a Check link. `unlinked`
 * keeps a case on the index without a link, greyed: the page still
 * renders at its route, the index just does not point at it.
 */
export const CASE_STUDIES_BASE = '/pagefront/commerce/case-studies';

export const CASE_STUDIES = {
  'commerce/case-studies/nitto/case-study': {
    route: 'nitto',
    source: 'commerce/case-studies/nitto/case-study.md',
    folder: 'commerce/case-studies/nitto',
    title: 'Nitto Knitwear',
    sector: 'Apparel',
    blurb:
      'A five-size merino turtleneck in eight colours on Shopify. Stock per size, fit, provenance, delivery date and 150 stockists, all from data already on the site.',
    sheets: [
      { file: 'pull-col-roule-youri-orange.fr.json', label: 'Product sheet — Pull col roulé Youri, orange', kind: 'product' },
      { file: 'nitto-knitwear.fr.json', label: 'Organization sheet — Nitto Knitwear', kind: 'organization' },
    ],
    description:
      'Pagefront case study: Nitto Knitwear’s Youri turtleneck as a product sheet and an organization sheet — what the page says today, what the sheet adds, and what publishing would take.',
  },
  'commerce/case-studies/blackbird/case-study': {
    route: 'blackbird',
    source: 'commerce/case-studies/blackbird/case-study.md',
    folder: 'commerce/case-studies/blackbird',
    title: 'AFS Blackbird V3',
    sector: 'Sports equipment',
    blurb:
      'A ten-size foil board. Per-size price and stock the page only loads by script, a spec table with units, and 95 dealers on the seller sheet.',
    sheets: [
      { file: 'blackbird-v3.en.json', label: 'Product sheet — Blackbird V3', kind: 'product' },
      { file: 'afs.en.json', label: 'Organization sheet — Foil And Co (AFS)', kind: 'organization' },
    ],
    description:
      'Pagefront case study: the AFS Blackbird V3 as a ten-size product sheet and Foil And Co’s organization sheet — what the page says today, what the sheet adds, and what publishing would take.',
  },
  'commerce/case-studies/kimai/case-study': {
    route: '_kimai',
    unlinked: true,
    source: 'commerce/case-studies/kimai/case-study.md',
    folder: 'commerce/case-studies/kimai',
    title: 'Kimaï',
    sector: 'Jewellery, made to order',
    blurb:
      'A configurable engagement ring. The full price list across carat, band style and metal, fit advice and made-to-order terms in one sheet; two boutiques and three shipping regimes on the seller’s.',
    sheets: [
      { file: 'jackie-pear.en-GB.json', label: 'Product sheet — Jackie Pear Ring', kind: 'product' },
      { file: 'kimai.en-GB.json', label: 'Organization sheet — Kimaï', kind: 'organization' },
    ],
    description:
      'Pagefront case study: Kimaï’s Jackie Pear Ring as a configurator sheet and an organization sheet — what the page says today, what the sheet adds, and what the merchant would decide.',
  },
};
