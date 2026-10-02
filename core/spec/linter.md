# Pagefront Linter — Design

Status: draft / design document, not yet a published normative artifact.
Design version: 0.2 (draft)

This document defines the **Pagefront linter**, the Layer 2 validation tool that checks Pagefront Sheets for well-formedness beyond what the JSON Schema (Layer 1) catches. It establishes the contract that any conforming linter implementation must meet: rule structure, severity levels, output format, and naming conventions. The rule catalogues themselves are maintained per vertical; the commerce rule catalogue is the [Pagefront Commerce Linter Rule Catalogue](../../commerce/spec/rules.md).

The linter is part of the Pagefront standard's normative tooling. Implementations may extend it with additional rules, but the Pagefront-blessed rule set defined in each vertical's rule catalogue is what determines whether a Sheet is well-formed under the standard.

## Why a linter exists

The JSON Schema answers one question: is this Sheet structurally valid? It passes or fails. A Sheet that conforms to the schema is a Sheet that no consumer can reject for structural reasons.

Conformance to the schema is a lower bar than quality. A Sheet can pass the schema and still be:

- Missing recommended fields a reasonable consumer would expect.
- Carrying values that pass the schema's type checks but are semantically wrong (percentages that don't sum to 100, references that point to entities that don't exist, timestamps in the past).
- Using deprecated patterns the standard accepts for backward compatibility but discourages.
- Optimized for one kind of consumer and unusable for another (a video without a caption is parseable but not accessible).

The schema can't catch these because they require cross-reference resolution, arithmetic, or semantic reasoning. The schema's job is to define what valid input looks like. The linter's job is to give publishers feedback, with a remediation for each finding, on the quality of valid input.

The three layers answer three questions:

| Layer | Tool | Question |
|---|---|---|
| 1 | JSON Schema | Is this Sheet structurally valid? |
| 2 | Linter | Is this valid Sheet well-formed? |
| 3 | Scoring rubric | How complete is this well-formed Sheet? |

The linter sits in the middle. Its output is the input to the scoring rubric.

## Design principles

**Rules are independent.** Each rule is a self-contained check. Adding a rule does not require touching others. Removing a rule does not affect others. This keeps the linter open to community contribution and version-to-version growth.

**Rules are named and addressable.** Every rule has a stable identifier (e.g., `PDP-W-012`). Publishers running the linter see rule IDs in their reports and can look up what each one means. Spec amendments can reference rule IDs as part of normative text. Identifier permanence is defined under "Rule namespaces".

**Rules describe what's wrong and how to fix it.** Every rule has a remediation hint as well as a diagnosis. A finding that says "missing accessibility metadata on video" without saying what to add is half-finished.

**Default severities reflect the standard's opinions.** The linter's default configuration is the standard's view of what matters. Publishers can adjust severities locally, and the defaults are what conformance is measured against.

**Linter output is structured first.** The canonical output is JSON. Renderings for terminals, HTML, GitHub Actions, and similar are derived from the structured output. This ensures every consumer of the linter (humans, CI, dashboards) has access to the same information without parsing prose.

**Linter rules are part of the standard.** Like the schema and the vocabulary, the rule catalogue is normative. Implementations claiming Pagefront conformance must implement the rules defined in the catalogue. Implementations may add their own rules with implementation-specific identifiers; those rules are not part of the standard.

## Rule structure

Each rule is defined by a small set of fields:

- **id**: Stable identifier, in the format `{prefix}-{type}-{number}`. `{prefix}` is the page-type namespace prefix (see "Rule namespaces"), a short uppercase token such as `PDP` for commerce product sheets or `ORG` for Commerce Organization Sheets. `{type}` is one of `E` (error), `W` (warning), `I` (info). `{number}` is zero-padded to three digits. Examples: `PDP-W-012`, `ORG-W-001`. Once assigned, a rule ID is permanent; deprecation does not free the number.
- **title**: Short human-readable name, 3–8 words.
- **description**: Longer prose explaining what the rule checks and why it matters. One to three paragraphs.
- **severity**: Default severity level: `error`, `warning`, or `info`. Some rules vary severity based on context (e.g., PDP-W-012 is `warning` for `overview`/`tutorial` videos and `info` for other roles); the rule definition documents the context dependency.
- **target**: JSONPath expression identifying what the rule applies to. The linter evaluates the target to find matching elements; the check function runs against each match. Example: `$.data.video[*]` for any video entry; `$.data.offers[*].availability` for the availability value on any offer. Target expressions use JSONPath as specified in [RFC 9535](https://www.rfc-editor.org/rfc/rfc9535), and implementations must evaluate targets per that RFC. A rule declares exactly one target expression; when a check must read other parts of the Sheet, those fields are accessed via the rule context and must be named explicitly in the rule's Check text. Multi-location targets are expressed as one RFC 9535 expression using multiple selectors where needed.
- **check**: The logic that determines whether the rule fires. May be a function (for complex semantic checks) or a declarative expression (for simple field-presence and value comparisons). The rule fires if the check returns true.
- **message_template**: The human-readable message produced when the rule fires, with placeholders for the matched path and any relevant values. Placeholders use `{name}` syntax.
- **remediation**: What the publisher should do to resolve the finding. One or two sentences.
- **introduced**: What the rule was added in: a release of its vertical (e.g., `release 0.3.0`), or a legacy format version for rules that predate releases (e.g., `v0.6`).
- **applies_from**: The first release of its vertical the rule applies to, as a semver (e.g., `0.4.0`). A linter skips the rule on a Sheet whose declared release is lower. See "Release gating" below.
- **applies_to_legacy**: Whether the rule also runs on Sheets of the legacy draft line (those carrying `format_version` and no `release`). A linter skips a rule without this flag on legacy Sheets.
- **spec_reference**: URL or path to the spec section that motivates the rule. Allows publishers to read the broader context.
- **deprecated_in**: Optional. The catalogue version in which this rule was deprecated, if applicable. Deprecated rules continue to fire (so existing reports remain interpretable) but documentation indicates they should not be relied upon for new work.
- **superseded_by**: Optional. The rule ID that replaces this one, if applicable.

### Release gating

A Sheet is judged only by the rules of the release it declares. A requirement that a later release introduces does not reach back to Sheets written against an earlier one: such a Sheet conformed when it was written and conforms still.

- A linter skips a rule when the Sheet's declared `release` is lower than the rule's `applies_from`, comparing the two as semvers.
- On a Sheet of the legacy draft line, a linter runs only the rules flagged `applies_to_legacy`.
- A Sheet whose release cannot be read as a semver, or that declares neither `release` nor `format_version`, cannot be gated and gets every rule.

The policy for a catalogue follows from it:

- An **error** rule added after a vertical's first release applies only from the release that introduces its requirement. The requirement is stated in that release's sheet spec, and the release notes list it.
- **Warning** and **info** rules may apply to every release, since they never change whether a Sheet conforms.

The same principle governs Layer 1: a Sheet is validated against the schema of the sheet-spec version its declared release bundles.

## Severity levels

Three levels, with explicit semantics:

**Error.** The Sheet has a problem the schema didn't catch but that consumers will encounter. Typically cross-reference failures, type-vs-value mismatches the schema can't express, or violations of constraints that depend on multiple fields. An error finding indicates the Sheet should be considered malformed; tooling treating linter errors as blocking is reasonable.

**Warning.** The Sheet is valid but suboptimal. The publisher should address the finding before declaring the Sheet production-ready, but consumers reading the Sheet today will mostly work. Warnings are the bulk of linter output.

**Information.** The finding is worth surfacing for awareness but does not require action. Examples: deprecated-but-still-accepted patterns, extension fields outside Pagefront's vocabulary, opportunities to use richer constructs the publisher hasn't adopted yet. Information findings are excluded from default summary counts.

The Pagefront standard's default severity assignments are the ones documented in each rule's definition. Implementations may expose configuration that lets publishers adjust severities locally; such configuration is non-normative and has no bearing on conformance.

## Output format

The canonical output is JSON. The shape:

```
{
  "sheet": "<canonical URL of the Sheet that was linted>",
  "checked_at": "<ISO 8601 timestamp>",
  "linter_version": "<version string of the linter implementation>",
  "release": "<the release the Sheet declares, or null>",
  "sheet_spec_version": "<the sheet-spec version the Sheet's $schema names, or null>",
  "catalogue_version": "<version of the rule catalogue applied>",
  "findings": [
    {
      "rule": "<rule ID>",
      "severity": "<error | warning | info>",
      "path": "<JSONPath of the matched element>",
      "values": { "<placeholder>": "<actual value>", ... },
      "message": "<rendered message with placeholders filled>",
      "remediation": "<remediation hint>"
    }
  ],
  "summary": {
    "errors": <count>,
    "warnings": <count>,
    "info": <count>,
    "rules_fired": ["<rule ID>", ...]
  }
}
```

`release` is the value the Sheet declares in its envelope: its `release` field, or, for a Sheet on the legacy draft line, its `format_version` value. It is `null` when the Sheet declares neither. `sheet_spec_version` is parsed from the Sheet's `$schema` URL, whose last segment is `v<version>.json`: a full semver on the release line (`0.9.0`), a two-part version on the legacy line (`0.9`). It is `null` when `$schema` is absent or names no version. The report states what the Sheet declares; whether the two agree is a rule's concern (in the commerce catalogue, PDP-E-002 and ORG-E-003). Until design version 0.2 the report carried a single `spec_version` field in their place.

The `values` object carries the placeholder substitutions used to render the message, exposed in structured form so downstream tools can use them without parsing the rendered text. The `rules_fired` array deduplicates rule IDs that fire multiple times in the same Sheet, so consumers can quickly see which rules need attention without scanning every finding. The `catalogue_version` field identifies which version of the vertical's rule catalogue produced the findings.

Renderings for terminals, HTML reports, GitHub Actions annotations, and similar are derived from this structured output. The structured form is what implementations must produce; renderings are non-normative.

## Implementations

The reference implementation is a CLI tool published as `@pagefront/lint-commerce` on npm. It is open source under the Apache 2.0 license. The CLI accepts either a URL (the Sheet is fetched) or a local file path (the Sheet is read from disk) and emits the JSON report to stdout. The CLI sequences the layers: the Sheet is first validated against the vertical's JSON Schema (Layer 1), and a Sheet that fails gets its schema errors on stderr and no report, so the rule catalogue only ever runs against schema-valid input. Optional flags control rendering: `--format=text` for human-readable terminal output, `--format=html` for a self-contained HTML report, `--format=github` for GitHub Actions workflow-command annotations (one per finding; severity maps error → `::error`, warning → `::warning`, info → `::notice`). `--checked-at` injects the report's `checked_at` timestamp, for reproducible reports. Exit codes support CI use:

- 0: lint ran with nothing blocking.
- 1: Layer 1 failure or error-severity findings. `--fail-on=warning` escalates warnings to blocking (the CLI's realization of open question 3).
- 2: operational failure (usage, unreadable input, fetch failure).

The CLI factors its rule logic into two packages: `@pagefront/lint-core`, the vertical-agnostic engine (rule runner, report emitter, renderers), and the commerce rule catalogue implementation in `@pagefront/lint-commerce` itself. Both packages are developed in the Pagefront monorepo (`core/lint/` and `commerce/lint/` respectively) at github.com/themachineweb/pagefront; the npm package names are the canonical identifiers, and the repository paths are informational. Other implementations are welcome and should produce structurally identical reports for the same input. The rule catalogue is the standard; the library is one implementation of it.

Hosted validators are per page type, at `https://themachineweb.org/pagefront/{vertical}/{type}/validate`. Each validates exactly one page type of one vertical, so the route says what the machinery covers. The commerce product validator (`/pagefront/commerce/product/validate`) is the first: a fully client-side page wrapping the library. The visitor's browser fetches the sheet, and the service holds no data and performs no crawling. Anyone can enter a Sheet URL or paste sheet JSON and see the report rendered in a browser. The hosted validators are a non-normative convenience for ad-hoc inspection.

A production pipeline with its own validation layer is expected to embed `@pagefront/lint-commerce` (or a conforming reimplementation of the catalogue); maintaining a parallel rule set is the outcome this design avoids.

## Conformance

A linter implementation is **conformant** if, for every input Sheet, it produces a report whose `findings` array contains exactly the rule firings the catalogue defines for that input. Specifically:

- Every rule in the catalogue that should fire for the input does fire.
- No rule from the catalogue fires when it should not.
- Implementations may add their own rules with implementation-specific identifiers (outside the identifier ranges reserved by the vertical's rule catalogue); these additional rules do not affect conformance.

Rules described as heuristic, where false positives against real-world content are acceptable, must still specify their exact detection pattern in the catalogue. Heuristic tolerance concerns accuracy against reality; conforming implementations must still produce identical findings.

The Pagefront standard does not certify implementations. Conformance is self-declared and verifiable by running the implementation against test Sheets with known expected outputs. A test suite for verifying conformance is part of the linter implementation work.

## Versioning

Four things are versioned, each by semver and each on its own:

- **A vertical's releases and sheet specs.** Each sheet spec has its own version, and a release bundles the sheet specs and the vocabulary. A Sheet declares its release in the envelope and names its sheet-spec version in `$schema`. The scheme for the commerce vertical is in [`../../commerce/spec/releases.md`](../../commerce/spec/releases.md).
- **A rule catalogue.** Each vertical's catalogue has its own semver, independent of the release and of the sheet specs. A catalogue version states which releases it supports, and an implementation applies it to Sheets declaring those releases. Adding a rule, or changing what a rule checks, is a minor; a correction to a rule's wording that changes no finding is a patch. When a new release needs new rules, they arrive in a catalogue version that adds the release to those it supports.
- **A linter implementation.** Its version (`linter_version` in the output) is its own semver and moves with the implementation's API and output.
- **This design document.** Its version moves when the rule structure or the report shape changes.

Existing rules may be deprecated when the underlying spec section changes; deprecated rules continue to fire but their `deprecated_in` field flags them as superseded. The deprecated rule's number is retired (see "Rule namespaces").

Implementations declare `linter_version`, `catalogue_version`, `release` and `sheet_spec_version` in their output, so a report says which implementation applied which catalogue to a Sheet of which release and sheet spec.

### Rule namespaces

Each vertical maintains its own rule catalogue, with rule identifiers disjoint from every other vertical's. Rule IDs are permanent: an assigned ID keeps its meaning across catalogue moves and reorganizations, and a retired number is never reassigned. Future verticals must adopt visibly distinct identifier prefixes so reports from different verticals can be aggregated without collision.

The disjointness convention extends one level down: within a vertical, rule identifiers are disjoint across page-type catalogues too, and every page-type catalogue carries a visibly distinct identifier prefix so reports from different page types of one vertical aggregate without collision. The commerce vertical has two: the product catalogue's `PDP-` prefix (`PDP-E-001`, `PDP-W-001`…, `PDP-I-001`) and the Commerce Organization Sheet catalogue's `ORG-` prefix (`ORG-E-001`…, `ORG-W-001`…); the implementation dispatches by sheet type so neither page type's rules run on the other's sheets (see the commerce catalogue). The product rules originally carried unprefixed `E-`/`W-`/`I-` IDs from the era when the product catalogue was the only one. They were renamed to `PDP-` in one pre-1.0, pre-publication move (commerce catalogue 0.4.0), taken while no published consumer depended on the old IDs. That rename is the single sanctioned exception to ID permanence; the unprefixed IDs are retired.

## Open design questions

Four of these decisions are deferred so that real implementation experience can inform them; the fifth is resolved and kept for the record.

1. **Cross-Sheet linting.** When a publisher publishes multiple Sheets (a multi-language pair, a brand sheet plus product sheets), some checks could compare Sheets to each other (do the language siblings agree on identifier? does the brand sheet referenced by each product actually exist?). The catalogue defines per-Sheet checks only. Cross-Sheet linting is a future addition.

2. **Suppression mechanisms.** Some findings are correct but the publisher knows they don't apply (a legacy field intentionally retained, a percentage that doesn't sum to 100 because it represents something else). Standard linters provide inline suppression comments. Pagefront Sheets are JSON, which doesn't accept comments, so the suppression mechanism would need to be outside the Sheet: a separate config, or an envelope field like `pagefront:suppressedRules`. This is to be designed once real cases surface.

3. **Severity escalation in CI contexts.** Some users will want to fail builds on any warning; others only on errors; others on specific rules. Implementations may expose configuration for this; the standard does not prescribe. The structured output should stay rich enough that any policy can be derived from it.

4. **Performance characteristics.** Large catalogs with thousands of sheets need the linter to be fast. The standard does not specify performance targets. Implementations should aim for sub-second linting on a single sheet of typical size; bulk linting tooling can wrap this with appropriate concurrency.

5. **Rule weighting for the scoring rubric.** Resolved: scoring is consumer-side. The standard publishes only a non-normative dimension taxonomy (`commerce/spec/scoring.md`) so completeness can be discussed comparably; it defines no weights, formulas, or official score. Validators, dashboards, registries, and agents apply their own rubrics over those dimensions, and the linter's structured report (stable rule IDs, severities, paths) is the intended machine-readable input to any such scorer. The relationship remains one-way (scorers consume linter output), and the linter does not produce scores.

## Status

Draft design document at v0.2. Defines the rule structure, severity levels, output format, and conformance contract. The rule catalogues implementing this structure live with their verticals; the commerce catalogue is the [Pagefront Commerce Linter Rule Catalogue](../../commerce/spec/rules.md).

Implementation status:

1. **Reference implementation.** Implemented: the vertical-agnostic engine (`@pagefront/lint-core`, in `core/lint/`), the commerce catalogue and CLI (`@pagefront/lint-commerce`, in `commerce/lint/`), and the terminal, HTML, and GitHub Actions renderers. TypeScript (Node.js), for ecosystem alignment with JSON Schema and JSONPath tooling. Both packages are published on npm.
2. **Test suite.** Implemented: the conformance fixture suite in `commerce/lint/test/fixtures/` covers every rule with at least one positive (rule fires) and one negative (rule does not fire) case, with byte-stable expected reports; `commerce/lint/test/cli-fixtures/` adds schema-valid sheets exercising the CLI's Layer 1 → Layer 2 sequencing.
3. **Hosted service.** Implemented for the commerce product page type: `https://themachineweb.org/pagefront/commerce/product/validate`, a client-side page wrapping the library (the visitor's browser fetches the sheet; no server code). Future page types take sibling routes under `/pagefront/{vertical}/{type}/validate`.

Catalogue-specific pending work (scoring rubric integration, case-study validation) is tracked in each vertical's rule catalogue.

## Changelog

### Unreleased

Changes land here and are versioned at the next release; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

- **Release gating.** The rule structure gains `applies_from` and `applies_to_legacy`, and a linter skips a rule on a Sheet whose declared release is lower than `applies_from`, or on a legacy Sheet unless the rule is flagged. Policy: an error rule added after a vertical's first release applies only from the release that introduces its requirement; warning and info rules may apply to every release. Layer 1 follows the same principle: the schema is the one the declared release bundles. Implemented in `@pagefront/lint-core` 0.3.0.

### 2026-10-01 — Versioning scheme replaced

Each sheet spec now has its own semver, and a release bundles the sheet specs and the vocabulary; a Sheet's envelope carries `release` in place of `format_version` (breaking, commerce release 0.3.0), and `$schema` names the sheet-spec version. A rule catalogue keeps its own semver and states the releases it supports; the "format version targeted" line is gone from this document and from the catalogues. The report carries `release` (the value the Sheet declares; for a legacy Sheet, its `format_version` value) and `sheet_spec_version` (parsed from `$schema`) in place of `spec_version`; `catalogue_version` and `linter_version` are unchanged. This document is design version 0.2.
