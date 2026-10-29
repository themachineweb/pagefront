# Design notes: Collection Sheet spec

Status: non-normative. These notes explain the Collection Sheet spec, [`collection.md`](collection.md), which governs; a note adds no requirement.
Design notes for the Collection Sheet spec 0.1.0, commerce release 0.5.0.

Each note opens with a link to the field or section it explains. The reference links a note from the field it explains; on the published page the notes render as footnotes under the spec. The decisions recorded for the ratification review are folded into the notes on the sections they concern.

## Why one spec carries three kinds

For "One sheet type, three kinds" in [`collection.md`](collection.md#one-sheet-type-three-kinds).

Every listing page is a set of products with a name and a URL. What differs is why the products are together. One sheet type carries all three because the shape is the same: a `Collection` with members in `hasPart` and parents in `isPartOf`. The kind is declared explicitly in `pagefront:collectionKind`, so a consumer knows whether it is walking a tree or reading a list.

One spec, three kinds, with `pagefront:collectionKind`, rather than a spec per kind: the shape is identical and the kinds differ in one rule each.

The sheet is what lets a consumer browse a store the way a shopper does.

## Why a listing with its own URL is a category

For "One sheet type, three kinds" in [`collection.md`](collection.md#one-sheet-type-three-kinds).

A category is a filter. The storefront's taxonomy and its facet pages (a neckline, a sleeve length, a fabric) are the same mechanism at different depths, and this spec does not tell them apart: a listing with its own URL is a category when it sits in the tree.

A listing with its own URL is a category, and un-sheeted listings are conformant: the first keeps the definition free of a taxonomy/facet distinction no producer can draw; the second keeps the obligation within what producers can see.

## Why `Collection` is the base type

For "Base type" in [`collection.md`](collection.md#base-type).

Schema.org has no type for a store category and no type for a merchandising collection; `Collection` is the closest, it is what the Pagefront Spec already uses for family and series membership (Pattern 3 under "Related products"), and its `hasPart` / `isPartOf` pair is the membership vocabulary consumers already read. `ProductGroup` is excluded: a `ProductGroup` is one product in several variants (see "ProductGroup variant completeness" in the Pagefront Spec), and reading a category as a `ProductGroup` would tell a consumer that forty unrelated garments are substitutable along `variesBy`. `OfferCatalog` is excluded as the base because it is an `ItemList`, which has no `isPartOf` and cannot sit in a tree; it is used on the Organization Sheet as the entry point instead (see "Entry point").

`Collection` as base, rather than `ProductGroup`, `OfferCatalog` or a minted type, was the decision recorded for the ratification review.

## Why `url` is required

For "Required core fields" in [`collection.md`](collection.md#required-core-fields).

A collection sheet always describes a page, and the page-less parent `ProductGroup` of the Pagefront Spec is the one Sheet without a page in the commerce set.

## Why brand is a collection kind

For "Kind discriminator" in [`collection.md`](collection.md#kind-discriminator-pagefrontcollectionkind).

Brand as a collection kind, pointing at the `Brand`: a Schema.org `Brand` is a label (an `Intangible` used for labeling products), and the set of products under a label is a `Collection`.

## What separates a category from a collection

For "Kind discriminator" in [`collection.md`](collection.md#kind-discriminator-pagefrontcollectionkind).

What separates a category from a collection is the tree. A publisher whose platform has a category model (Magento, Salesforce B2C, PrestaShop) maps that model to `category`. A publisher whose platform has one flat object (Shopify's collection) maps the ones placed in the storefront's menu hierarchy to `category`, with the menu as the tree, and the rest to `collection`. The mapping rules per platform are producer guidance (see "Producer guidance"); this spec only defines the two kinds.

## Why membership is direct

For "Members" in [`collection.md`](collection.md#members).

The direct-membership rule keeps every product in one place in the tree, keeps sheets small, and leaves transitive reads to the consumer, who walks down.

Two consequences follow, and both are intended. A product assigned to several nodes (a T-shirt in `crew-neck`, `cotton` and `long-sleeved`) appears in each of them and carries each in its `isPartOf`. A node whose assignments all live in its children has an empty `hasPart` array beyond the subcategory entries, and a node that holds nothing at all has an empty array; both are valid (COL-W-001 flags an empty array for review and is no failure).

Direct membership, rather than page-mirroring: one place per product in the tree, small sheets, computable from a model. A parent's sheet can differ from its page when the page rolls descendants up, and the spec says so.

## Why `hasPart` is exhaustive

For "Members" in [`collection.md`](collection.md#members).

Exhaustive `hasPart`: producers work from platform models, so pagination is no obstacle, and consumers read one rule for `hasVariant` and `hasPart` alike.

## Why entries stay thin

For "Members" in [`collection.md`](collection.md#members).

Each entry is a reference, kept thin so a large category stays small. No price, availability or image rides on the entry. A consumer that needs them fetches the member sheet. This is the opposite choice from `hasVariant`, whose entries carry render hints for a picker: a variant family has a handful of members and a category has thousands.

Thin entries: a category has thousands of members and a sheet has to stay around a megabyte.

## Why subcategories ride in `hasPart`

For "Members" in [`collection.md`](collection.md#members).

No separate term is minted for children; `hasPart` is Schema.org's own child relation for a `Collection`.

## Why a node may have several parents

For "Hierarchy" in [`collection.md`](collection.md#hierarchy).

Taxonomies place one node under two paths ("Gifts > Knitwear" and "Apparel > Knitwear"), and both are stated. Multiple parents allowed: real taxonomies have them.

## Why collections nest

For "Hierarchy" in [`collection.md`](collection.md#hierarchy).

A collection nests inside a collection when the catalog is organised as family → series → product; this is the hierarchy Pattern 3 of the Pagefront Spec describes inline on the product, and the collection sheet is where the series and the family now live as first-class sheets. Collections nest: Pattern 3's family → series hierarchy needs it.

The subtree read the reference describes is the general case: "Everything in Women" is the union of the direct members of every sheet in the subtree, deduplicated on `@id`, since a product in two nodes is met twice.

## Why the roots live on the organization sheet

For "Entry point" in [`collection.md`](collection.md#entry-point).

A consumer holding a product sheet or a listing page can enter the tree, and nothing else gave it the roots. The roots live on the Commerce Organization Sheet, in Schema.org's own `hasOfferCatalog`.

The field is the organization sheet's second admitted outbound edge, after `pagefront:authorizedResellers`. The freshness objection that kept enumeration off that sheet does not apply to it: roots are few and change rarely, and what changes daily (membership) lives in the collection sheets.

Roots on the organization sheet in `hasOfferCatalog`, for any commerce role: Schema.org-native, no term minted, and the roots are the stable part of a catalog.

## Why there is no catalog sheet

For "Entry point" in [`collection.md`](collection.md#entry-point).

A Sheet describes a page, a catalog has no page, and the enumeration a catalog sheet would have carried is `hasOfferCatalog` plus the tree below it. No catalog sheet: no page, and `hasOfferCatalog` plus the tree carry what it would have.

## Why members and parents share a host

For "Identity" in [`collection.md`](collection.md#identity).

The members of a storefront's listing are the storefront's own products, so the rule costs nothing and keeps the tree publisher-authoritative.

## Why `category` and `isPartOf` both stay on the product

For "The product side" in [`collection.md`](collection.md#the-product-side).

The existing `category` string on the Product Sheet ("Apparel > Knitwear > Sweaters") is unchanged: it is the human path, and `isPartOf` is the machine link. The two SHOULD agree where both are present, and the linter does not compare them.

## Why un-sheeted listings are conformant

For "Listing pages without a Sheet" in [`collection.md`](collection.md#listing-pages-without-a-sheet).

A storefront's facet pages number in the thousands and most platforms expose none of them to a producer. A listing page without a sheet declares no `alternate` link and is conformant. Un-sheeted listings are conformant because that keeps the obligation within what producers can see.

## Why a collection filled by a rule has no sheet

For "Listing pages without a Sheet" in [`collection.md`](collection.md#listing-pages-without-a-sheet).

No sheet for a collection filled by a rule: a rule-filled collection is a view of the catalogue; its products are reached through their own pages and the tree. The rule is read from the platform's model, never inferred. Categories are exempt, since the tree is built from them however they are filled.

## How this spec reached 0.1.0

For "Changelog" in [`collection.md`](collection.md#changelog).

Ratified 2026-10-18 from the draft of 2026-10-13 and 2026-10-14. The draft's linter rules were proposed in the document and defined in the catalogue at 0.17.0; the worked example, to be written against a real sheet before ratification, was still to come at ratification. The candidate is a Shopify storefront with a nested menu, so that the flat-collection mapping is exercised. The example uses a category or a manual collection; a collection filled by a rule has no sheet to show.

The changes made with the draft, each recorded under "Unreleased" in the document it touched at the time:

- **`collection.json`**: the editable schema head for Collection Sheet spec 0.1.0, `$id` `https://themachineweb.org/pagefront/spec/commerce/collection/v0.1.0.json`. Envelope as every sheet's (`$schema`, `release`, `schema_org_version`, `canonical_url`, `generated_at`, `data` required; `sheet_url`, `expires_at` optional; `format_version` not accepted). Data block: `@context` in the array form with the `pagefront` prefix, `@type` `Collection`, `@id`, `name`, `inLanguage`, `url`, `pagefront:collectionKind` and `hasPart` required; `isPartOf`, `brand`, `description`, `image`, `pagefront:availableLanguages` optional; one `memberEntry` definition (`@type`, `@id`, `url` required; `pagefront:sheetUrl`, `name`, `pagefront:collectionKind` optional). No schema is published until the release.
- **`organization.md`**: "Catalogue entry point (any role)" added under "Role-scoped content", stating `hasOfferCatalog` as "Entry point" above does; the linking contract names the two admitted outbound edges; "Catalog and carried-brand enumeration" leaves "What this spec does not address" (enumeration lives in `hasOfferCatalog` and the collection sheets); the sentence deferring domain association no longer promises a catalog sheet. **`organization.json`**: `hasOfferCatalog` added as an optional property with the member entry shape; the head keeps the unreleased 0.5.0 it already names.
- **`product.md`**: `isPartOf` recommended as an array of `Collection` member entries, one per set whose direct members include the product, with `category` unchanged and not compared; Pattern 3 points here and keeps the inline nesting valid for a publisher without collection sheets; "Sheets reached by reference" and the traversal-hint list name the collection references. **`product.json`** is unchanged: it already accepts `isPartOf` as an object or an array.
- **`vocabulary.md`**: `pagefront:collectionKind` minted, in the properties list and under "Enumerated values" as the Collection kinds enum; `pagefront:sheetUrl` extended to collection references; nothing else.
- **`releases.md`**: the Collection Sheet spec added to "Sheet spec versions" at 0.1.0, unreleased; the "every future sheet spec (category, collection, catalog)" parenthesis reduced to the collection spec; no catalog sheet is planned. No release is added; `releases.json` is unchanged.
- **`rules.md`** and **`commerce/lint`**: catalogue 0.17.0 adds the "Commerce Collection Sheet rules" section and the `COL-` catalogue (`collection-catalogue.ts`, one file per rule, fixtures per rule), ORG-W-007 with its fixture, the collection page type in the sheet-type dispatch (`$schema` path `/spec/commerce/collection/`, data-block fallback `Collection` with `pagefront:collectionKind`), and a Layer 1 report that the declared release bundles no Collection Sheet schema until a release does. The rules apply from release 0.5.0; the fixtures declare it and run against a test manifest (`commerce/lint/test/manifest/releases.json`) that adds the 0.5.0 row and resolves this spec's 0.1.0 to `collection.json`, so the release pull request adds the 0.5.0 row to `commerce/spec/releases.json` and to the release table in `releases.md`, and freezes the head as `commerce/schemas/collection/v0.1.0.json`, and changes nothing in the fixtures.

Release 0.5.0, on 2026-10-18, brought the rest: the release entry in `releases.md` and `releases.json` bundling Collection Sheet spec 0.1.0, the frozen copy of the schema under `commerce/schemas/collection/`, the `collectionKind` mapping in the vocabulary's JSON-LD context, and the site route for this document.
