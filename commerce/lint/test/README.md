# Conformance fixture suite

This is the conformance test suite the spec's Status section refers to
(`core/spec/linter.md`, pending-work item 2): input sheets with known
expected outputs, covering every implemented rule with at least one
positive and one negative case. Independent linter implementations verify
conformance by producing structurally identical reports for these inputs.

## Conventions

- One directory per rule ID: `fixtures/<rule-id>/` (lowercase, e.g.
  `fixtures/pdp-w-001/`).
- Each directory holds two input/expected pairs:
  - `fires.json` — a minimal, schema-plausible sheet on which the rule
    fires; `fires.expected.json` — the complete expected `Report`.
  - `clean.json` — the same sheet with the triggering condition resolved;
    `clean.expected.json` — the complete expected `Report` (zero
    findings).
- Rules with more than one distinct firing behavior (severity overrides,
  multi-condition checks) carry one firing fixture per behavior, named
  `fires-<variant>.json` (e.g. `fires-past.json` / `fires-close.json`),
  each with its own `.expected.json`. The runner discovers every input
  file that isn't an expected report.
- Expected reports are byte-stable via fixed lint options:
  `checkedAt: "2026-01-01T00:00:00Z"`, `linterVersion: "0.0.0-test"`.
- Fixture sheets use fictional merchant domains (`merchant.example`).
- The runner (`conformance.test.mjs`) discovers rule directories by
  scanning `fixtures/` — adding a rule's fixtures requires no
  registration.
- Organization-sheet fixtures (`fixtures/org-*/`) and collection-sheet
  fixtures (`fixtures/col-*/`) are ordinary inputs: the runner calls the
  same `lintSheet`, whose sheet-type dispatch routes them to the
  organization or the collection catalogue instead of the product one.
- The collection fixtures (`fixtures/col-*/`), ORG-W-007's and the "Where
  to buy" rules' (PDP-E-019, PDP-E-020, PDP-E-021, PDP-W-040) declare
  release 0.5.0. They were written before that release landed and ran
  against the test manifest, `manifest/releases.json`, installed through
  `dist/test-hooks.js` (`installTestManifest` / `clearTestManifest`) for
  those directories only. Since release 0.5.0 landed on 2026-10-18 the test
  manifest equals the bundled `commerce/spec/releases.json`; the hook and
  the manifest stay so that fixtures for the next unreleased release can
  declare it ahead of time, and `collection.test.mjs` keeps validating the
  collection fixtures at Layer 1 against the editable head
  `commerce/spec/collection.json`, which equals the frozen
  `commerce/schemas/collection/v0.1.0.json`. Production never reads the
  hook: it keeps the bundled manifest and the compiled validators.
- The "Where to buy" fixtures are validated at Layer 1 against
  the editable product head `commerce/spec/product.json` (spec 0.11.0) by
  `where-to-buy.test.mjs`, through the same hook. Their
  `clean-earlier-release` fixtures declare release 0.4.0 and run against the
  bundled manifest: the rule under test is silent there, and PDP-E-020's
  carries the PDP-W-029 warning its region-less offer earns on every
  release.
- A blank (empty or whitespace-only) `pagefront:sheetUrl` on a member
  entry is treated as absent: COL-W-002 reports it, and COL-E-005 skips a
  hint with no host (`fixtures/col-w-002/fires-whitespace.json`).

## Regenerating expected reports

Expected reports are regenerated **deliberately, never auto-blessed**.
When the engine or a rule legitimately changes, regenerate the affected
`*.expected.json`, review the diff against the normative catalogue
(`commerce/spec/rules.md`) and output format (`core/spec/linter.md`),
and commit the regeneration with the change that motivated it. A failing
fixture is a conformance signal first and a stale fixture second.
