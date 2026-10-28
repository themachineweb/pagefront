# Changelog: Linter design

The history of [`linter.md`](linter.md). Changes land under "Unreleased" and are versioned at the next release, when the heading becomes `### <version> — <date>`; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

### Unreleased

_Nothing yet. Changes land here and are versioned at the next release; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)._

- **Editorial: the changelog moves to this file.** `linter.md` keeps a one-line Changelog section that points here; the entries are unchanged.
- **Hosted checker.** One page at `/pagefront/commerce/validate` replaces the product-only validator at `/pagefront/commerce/product/validate`. It covers every page type the pinned library bundles a schema for, reads the type from the document and never defaults to product, and given a page URL checks discovery, the hop to the sheet and the envelope's coherence with the page before the conformance report. The JSON endpoint keeps answering at its former paths.
- **Rule namespaces.** The commerce vertical's third page-type catalogue, the Commerce Collection Sheet catalogue with the `COL-` prefix, is named beside `PDP-` and `ORG-`. No change to the rule structure or the report shape.
### 2026-10-02 — Release gating

The rule structure gains `applies_from` and `applies_to_legacy`, and a linter skips a rule on a Sheet whose declared release is lower than `applies_from`, or on a legacy Sheet unless the rule is flagged. Policy: an error rule added after a vertical's first release applies only from the release that introduces its requirement; warning and info rules may apply to every release. Layer 1 follows the same principle: the schema is the one the declared release bundles. Implemented in `@pagefront/lint-core` 0.3.0. This document is design version 0.3.

### 2026-10-01 — Versioning scheme replaced

Each sheet spec now has its own semver, and a release bundles the sheet specs and the vocabulary; a Sheet's envelope carries `release` in place of `format_version` (breaking, commerce release 0.3.0), and `$schema` names the sheet-spec version. A rule catalogue keeps its own semver and states the releases it supports; the "format version targeted" line is gone from this document and from the catalogues. The report carries `release` (the value the Sheet declares; for a legacy Sheet, its `format_version` value) and `sheet_spec_version` (parsed from `$schema`) in place of `spec_version`; `catalogue_version` and `linter_version` are unchanged. This document is design version 0.2.
