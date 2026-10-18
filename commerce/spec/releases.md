# Pagefront Commerce Releases

Status: normative.
Current commerce release: 0.4.0 (2026-10-02)
Machine-readable manifest: [`releases.json`](releases.json)

This document states how the commerce vertical is versioned, lists every commerce release with the member versions it bundles, and carries the release notes. The sheet specs, the vocabulary, the rule catalogue and the linter design each point here for the scheme and keep their own changelogs for their content.

## The scheme

**Each sheet spec has its own semver.** The Product Sheet spec ([`product.md`](product.md)), the Organization Sheet spec ([`organization.md`](organization.md)) and the Collection Sheet spec ([`collection.md`](collection.md)) carry a version of their own and evolve independently. No catalog sheet is planned: the catalogue entry point is `hasOfferCatalog` on the Organization Sheet. Standard semver applies, including before 1.0: in 0.x, a breaking change bumps the minor, an additive change bumps the minor, and a fix or clarification bumps the patch. The minor of the Product Sheet spec after 0.9.0 is 0.10.0.

**A commerce release is a named, versioned bundle of member versions.** Its members are each sheet spec and the vocabulary. The release's bump follows its members: major if any member bumps major, else minor if any member bumps minor, else patch. A new sheet type joining the release is a minor bump. 1.0.0 is a release like any other: it is reached by the same rule and carries no completeness requirement on the set of sheet types.

**The vocabulary has no version of its own.** It carries the release version: the vocabulary of release 0.5.0 is vocabulary 0.5.0.

**The rule catalogue and the linter implementations version separately.** The rule catalogue ([`rules.md`](rules.md)) has its own semver, independent of the release and of the sheet specs, and states which releases it supports. Each linter implementation has its own semver again. See "Versioning" in the linter design ([`../../core/spec/linter.md`](../../core/spec/linter.md)).

**Breaking changes follow semver.** A change that makes a conforming sheet non-conforming ships in a new minor of its sheet spec before 1.0.0, and in a new major from 1.0.0; the release that bundles it bumps accordingly. Each sheet spec lists the breaking changes it plans under "Planned breaking changes."

**Stability from release 1.0.0.** From release 1.0.0 a term never changes meaning, and a removal is deprecated first, stays valid for at least twelve months and is announced before it happens. The policy is in "Versioning and stability" in [`vocabulary.md`](vocabulary.md).

## What a sheet carries

A sheet's envelope carries two version statements:

- `release`: the commerce release the sheet is written against, a full semver (`"release": "0.5.0"`). The field name is generic because the envelope is shared across verticals; the vertical is identified by `$schema`.
- `$schema`: the URL of the JSON Schema for the sheet's own sheet-spec version, with the full semver in its last segment. It is required on every sheet carrying `release`:
  - `https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json`
  - `https://themachineweb.org/pagefront/spec/commerce/organization/v0.5.0.json`
  - `https://themachineweb.org/pagefront/spec/commerce/collection/v0.1.0.json`

A release and a sheet type resolve to exactly one sheet-spec version, through the release table below. `$schema` MUST name that version: a Product Sheet declaring release 0.5.0 points `$schema` at `product/v0.11.0.json`, one declaring release 0.4.0 at `product/v0.10.0.json`, and one declaring release 0.3.0 at `product/v0.9.0.json`. The linter checks it (PDP-E-002 for Product Sheets, ORG-E-003 for Organization Sheets).

```json
{
  "$schema": "https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json",
  "release": "0.5.0",
  "schema_org_version": "30.0",
  "canonical_url": "https://merchant.com/product/widget-123",
  "sheet_url": "https://merchant.com/api/sheets/widget-123.json",
  "generated_at": "2026-10-18T14:32:00Z",
  "data": { "...": "..." }
}
```

A sheet carrying both `format_version` and `release` is invalid.

A sheet is judged by the release it declares. It is validated against the schema of the sheet-spec version that release bundles for its type, and by the linter rules that apply from that release. A requirement that a later release introduces does not reach back: a sheet that conformed to release 0.3.0 conforms to it still. A `release` this table does not list resolves to nothing and is an error (PDP-E-018, ORG-E-004).

## Release table

| Release | Date | Product Sheet spec | Organization Sheet spec | Collection Sheet spec | Vocabulary |
|---|---|---|---|---|---|
| 0.5.0 | 2026-10-18 | 0.11.0 | 0.5.0 | 0.1.0 | 0.5.0 |
| 0.4.0 | 2026-10-02 | 0.10.0 | 0.4.0 | none | 0.4.0 |
| 0.3.0 | 2026-10-01 | 0.9.0 | 0.3.0 | none | 0.3.0 |

The same table, for machines, is [`releases.json`](releases.json). The linter reads it to resolve a sheet's `release` and type to the sheet-spec version its `$schema` must name.

## Sheet spec versions

**Product Sheet spec.**

| Version | Date | What it is |
|---|---|---|
| 0.9.0 | 2026-10-01 | The Product Sheet spec as it stood at legacy format version 0.9 on 2026-10-01, with the envelope carrying `release` in place of `format_version`. |
| 0.10.0 | 2026-10-02 | `$schema` required on sheets carrying `release`. Released in commerce release 0.4.0. |
| 0.11.0 | 2026-10-18 | `sheet_url` optional; `isPartOf` collection references; "Where to buy" (`Offer.url`, `checkoutPageURLTemplate`); the discovery link is `rel="alternate"` with the media type `application/pagefront+json`, and Discovery moves to the format-level document; price and VAT basis are read from the page and never inferred. Released in commerce release 0.5.0. |

**Organization Sheet spec.** The spec was ratified on 2026-08-14 and revised twice before releases existed. Each of those three steps counts as a minor, which places the spec at 0.3.0. Versions 0.1.0 and 0.2.0 were never carried on the wire: sheets of that period carried `format_version: "0.9"` and belong to the legacy draft line.

| Version | Date | What it is |
|---|---|---|
| 0.1.0 | 2026-08-14 | First ratified text. |
| 0.2.0 | 2026-08-31 | `pagefront:authorizedResellers` added. |
| 0.3.0 | 2026-09-30 | `pagefront:sheetUrl` on organization references added. Released on 2026-10-01 in commerce release 0.3.0, with the envelope carrying `release` in place of `format_version`. |
| 0.4.0 | 2026-10-02 | `$schema` required on sheets carrying `release`. Released in commerce release 0.4.0. |
| 0.5.0 | 2026-10-18 | `hasOfferCatalog` admitted as the catalogue entry point; `sheet_url` optional; the sheet is the root an origin's entry point reaches, including by DNS delegation. Released in commerce release 0.5.0. |

**Collection Sheet spec.** Ratified 2026-10-18, [`collection.md`](collection.md); it joined the release line with commerce release 0.5.0 and has no legacy draft line.

| Version | Date | What it is |
|---|---|---|
| 0.1.0 | 2026-10-18 | First text: a `Collection`-rooted sheet for category, collection and brand listing pages, with direct exhaustive membership in `hasPart`, parents in `isPartOf`, the `pagefront:collectionKind` discriminator and the tree's roots on the Organization Sheet in `hasOfferCatalog`. The editable head is [`collection.json`](collection.json); no schema is published until the release. |

## Format documents

Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md)) is format-level: it governs how a consumer locates a Sheet of any type in any vertical, and how a consumer holding only an origin reaches that origin's Sheets. It is not a member of the commerce release and carries its own semver. It is listed here so that one page shows what a release relies on; a release's notes name the Discovery version in force.

| Version | Date | What it is |
|---|---|---|
| 0.1.0 | 2026-10-18 | First text: the discovery principle, the page-based carriers, the traversal-hint rule and the filename convention, moved from the Product Sheet spec, and the entry point (`/.well-known/pagefront`, the `Pagefront:` line in `/robots.txt`). |

## The legacy draft line

Sheets carrying `format_version` belong to the legacy draft line, format versions 0.9 and earlier. Their rules:

- The legacy schema URLs stay served, unchanged: `https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json` and `https://themachineweb.org/pagefront/spec/commerce/organization/v0.9.json`. Their files are in the frozen schema store, [`../schemas/product/v0.9.json`](../schemas/product/v0.9.json) and [`../schemas/organization/v0.9.json`](../schemas/organization/v0.9.json).
- The linter keeps validating legacy sheets against those schemas, and reports their `format_version` value as the release they declare.
- The legacy line receives no further versions. A publisher moves a sheet to the release line by replacing `format_version` with `release` and pointing `$schema` at the sheet-spec version that release bundles.

The "added in v0.7", "new in v0.9" and similar annotations throughout the sheet specs and the vocabulary name legacy format versions. They are kept as history. Annotations written from now on name the release ("added in release 0.3.0").

## Release notes

### 0.5.0 — 2026-10-18

It bundles Product Sheet spec 0.11.0, Organization Sheet spec 0.5.0, Collection Sheet spec 0.1.0 and vocabulary 0.5.0. A minor: a new sheet type joins, and every change to the existing members is additive or a relaxation. A sheet valid at 0.4.0 stays valid at 0.5.0.

- **The Commerce Collection Sheet joins the release line** (Collection Sheet spec 0.1.0, ratified 2026-10-18): a `Collection`-rooted sheet for category, collection and brand listing pages, with direct exhaustive membership in `hasPart`, parents in `isPartOf`, the `pagefront:collectionKind` discriminator, and the tree's roots on the Organization Sheet in `hasOfferCatalog`. It has no legacy draft line.
- **Schemas.** `product/v0.11.0.json`, `organization/v0.5.0.json` and `collection/v0.1.0.json` are published. The 0.4.0 and 0.3.0 schemas stay published, unchanged: a sheet declaring an earlier release keeps validating against them.
- **`sheet_url` is optional** (Product Sheet spec 0.11.0, Organization Sheet spec 0.5.0). It is an address the sheet is served from as known at generation time, and it is informational: the page's `alternate` declaration locates a sheet.
- **Where to buy** (Product Sheet spec 0.11.0). `Offer.url` is the page where the offer is bought; `checkoutPageURLTemplate` (Schema.org) may carry a merchant-stated direct-to-checkout link, with `quantity` as the only template variable, one link per region-scoped offer, none on an offer without a region, and an expansion that is an absolute `https` URL. Consumers do not complete a purchase without the shopper's confirmation. Programmatic purchase is out of scope.
- **Collection references** (Product Sheet spec 0.11.0). `isPartOf` is a recommended core field: the collections whose direct members include the product, in the member entry shape of the Collection Sheet spec.
- **Catalogue entry point** (Organization Sheet spec 0.5.0). `hasOfferCatalog` is admitted for any commerce role: one flat `OfferCatalog` whose entries are the storefront's root collections, on the sheet's own host. The Commerce Organization Sheet is the root Sheet an origin's entry point reaches, and a root reached by DNS delegation is authoritative for the domain that published the record.
- **Discovery.** The discovery link is `rel="alternate"` with the media type `application/pagefront+json`; `hreflang` is removed from it and `pagefront:availableLanguages` is the language-variant mechanism. The page-based carriers, the traversal-hint rule and the filename convention move to the format-level document Pagefront Discovery 0.1.0, dated the same day, which also defines the page-less entry point. No sheet changes shape.
- **Price and VAT basis are read, never inferred** (Product Sheet spec 0.11.0). `price` is the price the page renders; `valueAddedTaxIncluded` comes only from a merchant statement.
- **Vocabulary 0.5.0.** `pagefront:collectionKind` is added; nothing is renamed or removed.
- **Moving a sheet from 0.4.0.** Set `release` to `"0.5.0"` and point `$schema` at the new sheet-spec version. Nothing else changes; `sheet_url` may now be omitted.
- **Linter.** Rule catalogue 0.17.0 supports releases 0.5.0, 0.4.0 and 0.3.0 and the legacy line. Rules new with 0.5.0 apply from it only: the `COL-` catalogue for Collection Sheets; ORG-W-007 (a catalogue entry on another host); PDP-E-019, PDP-E-020 and PDP-E-021 (the checkout template and the offer `url`) and PDP-W-040 (an offer without `url` among several). Sheets declaring 0.4.0 or 0.3.0 are judged as before. The catalogue ships in the next `@pagefront/lint-commerce` release.

### 0.4.0 — 2026-10-02

It bundles Product Sheet spec 0.10.0, Organization Sheet spec 0.4.0 and vocabulary 0.4.0.

- **`$schema` is required on sheets carrying `release`.** Breaking, which before 1.0 is a minor of each sheet spec and of the release. `$schema` identifies the vertical and the sheet type, and the declared release is checked against it, so a release-line sheet that omits it no longer validates. It stays optional on the legacy draft line.
- **Schemas.** `product/v0.10.0.json` and `organization/v0.4.0.json` are published. The 0.3.0 schemas (`product/v0.9.0.json`, `organization/v0.3.0.json`) stay published, unchanged: a sheet declaring release 0.3.0 keeps validating against them.
- **Moving a sheet from 0.3.0.** Set `release` to `"0.4.0"` and point `$schema` at the new sheet-spec version. Nothing else changes in a sheet that already declared `$schema`.
- **Vocabulary.** No term changes; it takes the release version.
- **Configurator references must resolve** (Product Sheet spec 0.10.0). Breaking: every pair in an exclusion and in an adjustment's `when` names a dimension the configurator declares and, where the dimension lists options, one of its option values, written exactly.
- **Sheets declaring release 0.3.0 are unaffected.** Neither requirement applies to them: they are validated against the 0.3.0 schemas, and rules introduced with 0.4.0 do not run on them.
- **Linter.** Rule catalogue 0.16.0 supports releases 0.4.0 and 0.3.0 and the legacy line. Layer 1 resolves the schema from the declared release, and rules are gated by release ("Applies from"). PDP-E-002 and ORG-E-003 compare a present `$schema` with the schema the release bundles and are quiet when it is absent. PDP-E-017 is new and applies from release 0.4.0: an unresolved reference in a configurator exclusion or adjustment. PDP-E-018 and ORG-E-004 are new: a `release` the manifest does not list.

### 0.3.0 — 2026-10-01

The first commerce release. It bundles Product Sheet spec 0.9.0, Organization Sheet spec 0.3.0 and vocabulary 0.3.0.

- **`release` replaces `format_version` in the envelope.** Breaking. A sheet declares the commerce release it is written against, as a full semver. `format_version` is not accepted on the release line, and a sheet carrying both fields is invalid.
- **`$schema` names the sheet-spec version.** The schema URLs keep their paths and take the full semver: `product/v0.9.0.json` and `organization/v0.3.0.json`. The release and the sheet type resolve to that version through the release table, and `$schema` must match it.
- **The legacy draft line stays valid.** Sheets carrying `format_version` keep validating against the legacy schemas, which stay served at their existing URLs. See "The legacy draft line."
- **Content.** The two sheet specs and the vocabulary are otherwise as they stood on 2026-10-01; their own changelogs carry the detail.
- **Linter.** Rule catalogue 0.15.0 supports release 0.3.0 and the legacy line. PDP-E-002 becomes "Release / schema mismatch" and keeps its legacy behaviour on legacy sheets; ORG-E-003 is its counterpart for Organization Sheets; PDP-E-016 and ORG-E-002 flag a sheet carrying both fields. The linter report carries `release` and `sheet_spec_version` in place of `spec_version`.

## Repository and release management

Normative for this repository:

- `main` holds one living copy of each spec: always the next release in progress. There are no version folders for spec prose.
- Git tags mark releases: `commerce-v<release>` on `main`. The spec as it stood at a release is the repository at that tag. Sheet specs are not tagged; a release tag pins them through [`releases.json`](releases.json).
- Published JSON Schemas are the only per-version copies. They live in [`../schemas/`](../schemas/) as `<type>/v<version>.json`, frozen and append-only, and are served verbatim, so every schema URL ever published stays resolvable. [`product.json`](product.json) and [`organization.json`](organization.json) in this folder are the editable heads: each `$id` names the version the head will next be released as, and until a change lands the head equals the latest published file.
- [`../archive/`](../archive/) is frozen: the record of drafts before release 0.3.0. Nothing new goes there.
- Each spec document's changelog opens with an "Unreleased" section, where changes land. A document's version line changes only at release time, so a header never shows an unreleased version.

The steps to cut a release, the tag names and the branch rules are in "Releasing" and "Branches" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).
