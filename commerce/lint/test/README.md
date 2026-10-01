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
- Organization-sheet fixtures (`fixtures/org-w-*/`) are ordinary
  inputs: the runner calls the same `lintSheet`, whose sheet-type
  dispatch routes them to the organization catalogue instead of the
  product one.

## Regenerating expected reports

Expected reports are regenerated **deliberately, never auto-blessed**.
When the engine or a rule legitimately changes, regenerate the affected
`*.expected.json`, review the diff against the normative catalogue
(`commerce/spec/rules.md`) and output format (`core/spec/linter.md`),
and commit the regeneration with the change that motivated it. A failing
fixture is a conformance signal first and a stale fixture second.
