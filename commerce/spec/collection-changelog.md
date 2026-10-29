# Changelog: Collection Sheet spec

The history of [`collection.md`](collection.md). Changes land under "Unreleased" and are versioned at the next release, when the heading becomes `### <version> — <date>`; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

### Unreleased

Changes land here and are versioned at the next release; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

- **Editorial: the changelog moves to this file.** `collection.md` keeps a one-line Changelog section that points here; the entries are unchanged.
- **Editorial: the document becomes a field reference; its rationale moves to design notes.** Every section is restyled into one entry per field, with its meaning, shape, source and linter check, and the reasoning behind the fields moves verbatim to [`collection-notes.md`](collection-notes.md), non-normative, one note per heading, each linked from the field it explains with a `why` link; the site renders the notes as footnotes under the spec. "Decisions and their grounds" is folded into the notes on the sections it concerns; "Companion changes", the ratification clause of the status line and the "Worked examples" placeholder move to a history note; "Linter rules (proposed)" becomes "Linter rules", since the catalogue has defined them since 0.17.0. Every requirement, every rule ID and every anchor the rule catalogue, the linter and the vocabulary link are kept. No rule, field, shape or source changes; no schema change. The notes carry this document's version line and log their changes here.
- **Change (minor): collections filled by a rule have no sheet.** Producers MUST NOT emit one, determine rule-filled membership from the platform's model, and do not infer it. The `collection` kind covers sets assembled by hand. Categories are unaffected and keep their sheets however they are filled. See "One sheet type, three kinds", "Listing pages without a Sheet" and "Producer guidance"; the product side is in [`product.md`](product.md).

### 0.1.0 — 2026-10-18

Released in commerce release 0.5.0, the first release that bundles this sheet spec.

- **Editorial: resolution rule.** "Resolution" under "Identity" points at the traversal-hint rule in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md)), which now states the exact-string `@id` confirmation for every reference; this document keeps the host rule. "Discovery" points at the same document.
- **Clarification: blank hints.** An empty or whitespace-only `pagefront:sheetUrl` on a member entry is treated as absent ("Members"). Linter rule COL-W-002 reports it, and COL-E-005 skips a hint with no host.
- **New sheet type.** The Commerce Collection Sheet, 0.1.0: a `Collection`-rooted sheet for category, collection and brand listing pages, with direct exhaustive membership in `hasPart`, parents in `isPartOf`, the `pagefront:collectionKind` discriminator, and the tree's roots on the Organization Sheet in `hasOfferCatalog`. The catalog sheet type is withdrawn.
