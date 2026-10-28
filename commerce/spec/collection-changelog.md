# Changelog: Collection Sheet spec

The history of [`collection.md`](collection.md). Changes land under "Unreleased" and are versioned at the next release, when the heading becomes `### <version> — <date>`; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

### Unreleased

Changes land here and are versioned at the next release; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

- **Editorial: the changelog moves to this file.** `collection.md` keeps a one-line Changelog section that points here; the entries are unchanged.
- **Change (minor): collections filled by a rule have no sheet.** Producers MUST NOT emit one, determine rule-filled membership from the platform's model, and do not infer it. The `collection` kind covers sets assembled by hand. Categories are unaffected and keep their sheets however they are filled. See "One sheet type, three kinds", "Listing pages without a Sheet" and "Producer guidance"; the product side is in [`product.md`](product.md).

### 0.1.0 — 2026-10-18

Released in commerce release 0.5.0, the first release that bundles this sheet spec.

- **Editorial: resolution rule.** "Resolution" under "Identity" points at the traversal-hint rule in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md)), which now states the exact-string `@id` confirmation for every reference; this document keeps the host rule. "Discovery" points at the same document.
- **Clarification: blank hints.** An empty or whitespace-only `pagefront:sheetUrl` on a member entry is treated as absent ("Members"). Linter rule COL-W-002 reports it, and COL-E-005 skips a hint with no host.
- **New sheet type.** The Commerce Collection Sheet, 0.1.0: a `Collection`-rooted sheet for category, collection and brand listing pages, with direct exhaustive membership in `hasPart`, parents in `isPartOf`, the `pagefront:collectionKind` discriminator, and the tree's roots on the Organization Sheet in `hasOfferCatalog`. The catalog sheet type is withdrawn.
