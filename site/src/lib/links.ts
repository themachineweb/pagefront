/**
 * Pagefront section destinations, shared by the section landing
 * (/pagefront) and the pages that carry its masthead (Check).
 *
 * Every destination is on this domain now; the repository link is the
 * one outbound pointer.
 */
export const REPO = 'https://github.com/themachineweb/pagefront';

export const LINKS = {
  // Live on this domain today.
  landing: '/pagefront',
  validator: '/pagefront/commerce/validate',

  spec: '/pagefront/spec',
  publish: '/pagefront/publish',
  consume: '/pagefront/consume',

  governance: '/pagefront/governance',
  contributing: '/pagefront/contributing',

  caseStudies: '/pagefront/commerce/case-studies',
  faq: '/pagefront/faq',

  repo: REPO,
} as const;

/** The Pagefront section nav; `current` marks the page rendering it. */
export const pagefrontNav = (current?: 'spec' | 'validator' | 'caseStudies' | 'faq') => [
  { label: 'Spec', href: LINKS.spec, current: current === 'spec' },
  { label: 'Check', href: LINKS.validator, current: current === 'validator' },
  { label: 'Case studies', href: LINKS.caseStudies, current: current === 'caseStudies' },
  { label: 'FAQ', href: LINKS.faq, current: current === 'faq' },
];
