# Commerce Collection Sheet

Status: normative spec. Ratified 2026-10-18 from the draft of 2026-10-13 and 2026-10-14.
Collection Sheet spec version: 0.1.0
Commerce release: 0.5.0
Schema.org version targeted: 30.0 (2026-03-19)

The Commerce Collection Sheet is the Pagefront Sheet that describes a listing page: a page whose content is a set of products. A category page, a curated collection page, a brand page on a multi-brand store and a filtered listing with a URL of its own are all listing pages. The Product Sheet describes one product; the Organization Sheet describes the entity behind the products; this sheet describes the sets the storefront arranges them in, and it is what lets a consumer browse a store the way a shopper does.

## One sheet type, three kinds

Every listing page is a set of products with a name and a URL. What differs is why the products are together:

- A **category** is a node in the storefront's navigation tree. Its members share a kind. It has a parent, except at the root, and it may have subcategories.
- A **collection** is a set outside the tree that the merchant assembles by hand: a licensed capsule, a lookbook, an edit. It may nest in another collection (a series inside a family) and otherwise stands alone. A set filled by a rule is not a collection in this sense and has no sheet (see "Listing pages without a Sheet").
- A **brand** collection is the set of products a multi-brand store sells under one label. Its membership criterion is the label, and it points at the `Brand` node it is keyed on.

One sheet type carries all three because the shape is the same: a `Collection` with members in `hasPart` and parents in `isPartOf`. The kind is declared explicitly in `pagefront:collectionKind`, so a consumer knows whether it is walking a tree or reading a list.

A category is a filter. The storefront's taxonomy and its facet pages (a neckline, a sleeve length, a fabric) are the same mechanism at different depths, and this spec does not tell them apart: **a listing with its own URL is a category** when it sits in the tree. A publisher is under no obligation to emit a Sheet for every such page; see "Listing pages without a Sheet".

## The envelope

Identical to every Pagefront Sheet. `canonical_url` is the listing page the sheet describes. `sheet_url` is optional and informational, as in the Pagefront Spec.

```json
{
  "$schema": "https://themachineweb.org/pagefront/spec/commerce/collection/v0.1.0.json",
  "release": "0.5.0",
  "schema_org_version": "30.0",
  "canonical_url": "https://merchant.com/collections/knitwear",
  "sheet_url": "https://merchant.com/pagefront/commerce/collection/knitwear.en.json",
  "generated_at": "2026-10-14T08:00:00Z",
  "expires_at": "2026-10-15T08:00:00Z",
  "data": { "...": "..." }
}
```

`release` and `$schema` follow the rules in "The envelope" in the Pagefront Spec ([`product.md`](product.md)); `$schema` names this sheet spec's version, `collection/v0.1.0.json`, and MUST name the version the release table bundles (linter rule COL-E-003).

Membership changes often. A category whose members are computed by a rule SHOULD carry an `expires_at` within a day; a category whose assignments are stable MAY sit further out. A consumer reading an expired sheet treats its `hasPart` as possibly stale and re-fetches before acting on it.

## Sheet URL and stability

As for every sheet: the page is the identity, the sheet lives where the page's `Link: rel="alternate"` says, and a consumer never parses the path (see Pagefront Discovery, [`../../core/spec/discovery.md`](../../core/spec/discovery.md)). The `pagefront:sheetUrl` hints that product sheets and other collection sheets carry toward this sheet stay correct for longer when the URL is stable, so a publisher that can keep it SHOULD.

## data — Schema.org JSON-LD

### Base type

The `data` block roots on Schema.org **`Collection`**. Schema.org has no type for a store category and no type for a merchandising collection; `Collection` is the closest, it is what the Pagefront Spec already uses for family and series membership (Pattern 3 under "Related products"), and its `hasPart` / `isPartOf` pair is the membership vocabulary consumers already read. `ProductGroup` is excluded: a `ProductGroup` is one product in several variants (see "ProductGroup variant completeness" in the Pagefront Spec), and reading a category as a `ProductGroup` would tell a consumer that forty unrelated garments are substitutable along `variesBy`. `OfferCatalog` is excluded as the base because it is an `ItemList`, which has no `isPartOf` and cannot sit in a tree; it is used on the Organization Sheet as the entry point instead (see "Entry point").

### Required core fields

- `@context`: the array form `["https://schema.org", {"pagefront": "https://themachineweb.org/pagefront/vocabulary/"}]`. Every collection sheet uses `pagefront:collectionKind`, so the bare string is never sufficient here.
- `@type`: `"Collection"`
- `@id`: stable URL-shaped identifier for the set. It is the identity every reference to this set carries, and it is matched by exact string (see "Identity").
- `name`: the set's name as the page displays it, in `inLanguage`
- `inLanguage`: BCP 47 tag for the sheet's prose
- `url`: the listing page. Required: a collection sheet always describes a page, and the page-less parent `ProductGroup` of the Pagefront Spec is the one Sheet without a page in the commerce set.
- `pagefront:collectionKind`: one of `category`, `collection`, `brand` (see "Kind discriminator")
- `hasPart`: the set's direct members, as an array (see "Members"). The array MAY be empty.

### Recommended core fields

- `isPartOf`: the parent set or sets (see "Hierarchy")
- `description`: the page's editorial text, in `inLanguage`
- `image`: the page's banner or hero, as an `ImageObject`
- `brand`: on a `brand` collection, the `Brand` node the set is keyed on (see "Kind discriminator")
- `pagefront:availableLanguages`: the sibling sheets in other languages, as in the Pagefront Spec

## Kind discriminator: `pagefront:collectionKind`

Explicit, required, single-valued. The closed enum:

- `category`: a node of the storefront's navigation tree. A root category has no `isPartOf`; every other category has at least one, and each entry resolves to another `category` sheet on the same host.
- `collection`: a set outside the tree. It MAY carry `isPartOf` pointing at another `collection` sheet (a series inside a family). It MUST NOT point at a `category`: a collection is reached from the entry point or from its own page, and a tree does not contain it.
- `brand`: the products a store sells under one label. The sheet carries `brand`, a reference to the `Brand` node: `{"@type": "Brand", "@id": "…", "pagefront:sheetUrl": "…"}`, resolving under the brand edge of the Organization Sheet's linking contract. A `brand` collection has no `isPartOf`.

Additional values require a spec amendment. The linter warns on a `brand` kind without `brand` (COL-W-004) and on a `category` whose `isPartOf` resolves to a sheet of another kind (COL-W-005).

What separates a category from a collection is the tree. A publisher whose platform has a category model (Magento, Salesforce B2C, PrestaShop) maps that model to `category`. A publisher whose platform has one flat object (Shopify's collection) maps the ones placed in the storefront's menu hierarchy to `category`, with the menu as the tree, and the rest to `collection`. The mapping rules per platform are producer guidance (see "Producer guidance"); this spec only defines the two kinds.

## Members

`hasPart` lists the set's **direct** members: the products and sets the storefront assigns to this node itself. It does not include the members of its subcategories. A parent category whose page renders every product beneath it still lists only what is assigned to it directly, which is often nothing but its subcategories. The rule keeps every product in one place in the tree, keeps sheets small, and leaves transitive reads to the consumer, who walks down.

Two consequences follow, and both are intended. A product assigned to several nodes (a T-shirt in `crew-neck`, `cotton` and `long-sleeved`) appears in each of them and carries each in its `isPartOf`. A node whose assignments all live in its children has an empty `hasPart` array beyond the subcategory entries, and a node that holds nothing at all has an empty array; both are valid (COL-W-001 flags an empty array for review and is no failure).

`hasPart` is **exhaustive** at the moment of emission: a consumer reads it as the complete direct membership, as it reads `hasVariant` on a `ProductGroup`. A publisher that cannot enumerate a set's members does not emit a sheet for it.

**Order.** Array order is the storefront's default display order for the set, unfiltered and unsorted by the shopper. It is the merchandising order and it carries editorial intent. Filtered and re-sorted views of the page are not represented; see "Listing pages without a Sheet".

**Entry shape.** Each entry is a reference, kept thin so a large category stays small:

- `@type` *(required)*: `Product` (or a subtype), `ProductGroup`, or `Collection`.
- `@id` *(required)*: the member's identity, matching exactly the `@id` in the member's own sheet.
- `url` *(required)*: the member's page.
- `pagefront:sheetUrl` *(recommended)*: the member's sheet. A producer that emits both sheets knows this URL and SHOULD populate it. It is a traversal hint under "Traversal hints" in Pagefront Discovery: it MAY be stale, and when it is absent or does not resolve the consumer reaches the member sheet through `url` and the `alternate` link that page declares. An empty or whitespace-only `pagefront:sheetUrl` is treated as absent.
- `name` *(recommended)*: the member's display name, in `inLanguage`.
- On a `Collection` entry, `pagefront:collectionKind` *(recommended)*, so a consumer can tell a subcategory from a nested collection before fetching it.

No price, availability or image rides on the entry. A consumer that needs them fetches the member sheet. This is the opposite choice from `hasVariant`, whose entries carry render hints for a picker: a variant family has a handful of members and a category has thousands.

**Granularity.** One entry per tile the listing page renders. A variant family appears once: as its `ProductGroup` when a parent `ProductGroup` sheet exists, and otherwise as the variant `Product` whose page the tile links to. The choice of variant is the storefront's and carries no claim of being canonical.

**Subcategories** are `Collection` entries in the same array, in the position the page gives them. A consumer splits `hasPart` by `@type`: `Collection` entries are the next level down, and the rest are the products at this level. No separate term is minted for children; `hasPart` is Schema.org's own child relation for a `Collection`.

```json
{
  "@context": ["https://schema.org", {"pagefront": "https://themachineweb.org/pagefront/vocabulary/"}],
  "@type": "Collection",
  "@id": "https://merchant.com/collections/knitwear#collection",
  "name": "Knitwear",
  "inLanguage": "en",
  "url": "https://merchant.com/collections/knitwear",
  "pagefront:collectionKind": "category",
  "isPartOf": [
    {
      "@type": "Collection",
      "@id": "https://merchant.com/collections/women#collection",
      "url": "https://merchant.com/collections/women",
      "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/collection/women.en.json",
      "pagefront:collectionKind": "category"
    }
  ],
  "hasPart": [
    {
      "@type": "Collection",
      "@id": "https://merchant.com/collections/knitwear-cardigans#collection",
      "url": "https://merchant.com/collections/knitwear-cardigans",
      "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/collection/knitwear-cardigans.en.json",
      "name": "Cardigans",
      "pagefront:collectionKind": "category"
    },
    {
      "@type": "ProductGroup",
      "@id": "https://merchant.com/pagefront/commerce/product/aurora-jumper.en.json",
      "url": "https://merchant.com/products/aurora-jumper",
      "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/product/aurora-jumper.en.json",
      "name": "Aurora Jumper"
    },
    {
      "@type": "Product",
      "@id": "https://merchant.com/pagefront/commerce/product/harbor-vest.en.json",
      "url": "https://merchant.com/products/harbor-vest",
      "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/product/harbor-vest.en.json",
      "name": "Harbor Vest"
    }
  ]
}
```

The Knitwear category holds one subcategory and two products directly. The cardigans live in the Cardigans sheet and are absent here.

## Hierarchy

`isPartOf` is an array of parent references, each in the entry shape above. A node MAY have more than one parent: taxonomies place one node under two paths ("Gifts > Knitwear" and "Apparel > Knitwear"), and both are stated. A node with no `isPartOf` is a root, and a consumer walking up stops there.

Nesting is allowed for every kind that permits `isPartOf`. A category tree has whatever depth the storefront has. A collection nests inside a collection when the catalog is organised as family → series → product; this is the hierarchy Pattern 3 of the Pagefront Spec describes inline on the product, and the collection sheet is where the series and the family now live as first-class sheets.

A consumer reads the tree in two directions. Down: fetch a sheet, split `hasPart` by `@type`, fetch the `Collection` entries. Up: follow `isPartOf`, repeating to a root. Sideways: go up one level and read the parent's `hasPart`. "Everything in Women" is the union of the direct members of every sheet in the subtree, deduplicated on `@id`, since a product in two nodes is met twice.

## Entry point

A consumer holding a product sheet or a listing page can enter the tree, and nothing else gave it the roots. The roots live on the **Commerce Organization Sheet**, in Schema.org's own `hasOfferCatalog`:

```json
"hasOfferCatalog": {
  "@type": "OfferCatalog",
  "name": "Merchant catalogue",
  "itemListElement": [
    {
      "@type": "Collection",
      "@id": "https://merchant.com/collections/women#collection",
      "url": "https://merchant.com/collections/women",
      "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/collection/women.en.json",
      "name": "Women",
      "pagefront:collectionKind": "category"
    },
    {
      "@type": "Collection",
      "@id": "https://merchant.com/collections/new-in#collection",
      "url": "https://merchant.com/collections/new-in",
      "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/collection/new-in.en.json",
      "name": "New in",
      "pagefront:collectionKind": "collection"
    },
    {
      "@type": "Collection",
      "@id": "https://merchant.com/collections/meridian-gear#collection",
      "url": "https://merchant.com/collections/meridian-gear",
      "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/collection/meridian-gear.en.json",
      "name": "Meridian Gear",
      "pagefront:collectionKind": "brand"
    }
  ]
}
```

The rules:

- `itemListElement` holds `Collection` entries in the member entry shape, in display order. Every root category (a `category` sheet with no `isPartOf`) appears here, every top-level collection (a `collection` sheet with no `isPartOf`) SHOULD, and every `brand` collection SHOULD. A nested `OfferCatalog` is not permitted; the list is flat.
- Any `pagefront:commerceRole` may carry it. A manufacturer's range is organised in categories as a retailer's is.
- The referenced sheets are on the organization sheet's host, in the organization sheet's `inLanguage`. A root in another language is reached through `pagefront:availableLanguages` on the root sheet. Linter rule ORG-W-007 warns on an entry whose `pagefront:sheetUrl` is on another host.
- The field is the organization sheet's second admitted outbound edge, after `pagefront:authorizedResellers`. The freshness objection that kept enumeration off that sheet does not apply to it: roots are few and change rarely, and what changes daily (membership) lives in the collection sheets.

No separate catalog sheet exists and none is planned. A Sheet describes a page, a catalog has no page, and the enumeration a catalog sheet would have carried is `hasOfferCatalog` plus the tree below it.

## Identity

`@id` is the exact-string identity key, as everywhere in the format (see "Product identity and deduplication" in the Pagefront Spec). A producer MUST emit the identical `@id` string for a set in its own sheet, in every `isPartOf` and `hasPart` entry that references it, in `hasOfferCatalog`, and in every product sheet's `isPartOf`. A locale prefix, a trailing slash or a query string on one copy breaks the match.

**Host.** A collection sheet and the sheets it references in `isPartOf` and `hasPart` share a host, as a parent `ProductGroup` and its variants do. The members of a storefront's listing are the storefront's own products, so the rule costs nothing and keeps the tree publisher-authoritative. A consumer rejects an entry whose `pagefront:sheetUrl` is on another host and falls back to the entry's `url` (linter rule COL-E-005, which checks the `brand` reference of a brand collection against the brand's `@id` host, the brand edge of the linking contract).

**Resolution.** Following an entry is "Traversal hints" in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md#traversal-hints-normative)): the hint is `pagefront:sheetUrl`, the fetched sheet's data-block `@id` is confirmed against the entry's `@id` by exact string, and the fallback is the entry's `url` and the `alternate` link that page declares. Collection-specific is the host rule above: an entry whose hint is on another host is rejected before it is fetched.

## The product side

A Product Sheet declares the sets it belongs to in `isPartOf`, an array of `Collection` references in the member entry shape, one per set whose direct members include it:

```json
"isPartOf": [
  {
    "@type": "Collection",
    "@id": "https://merchant.com/collections/knitwear#collection",
    "url": "https://merchant.com/collections/knitwear",
    "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/collection/knitwear.en.json",
    "name": "Knitwear",
    "pagefront:collectionKind": "category"
  },
  {
    "@type": "Collection",
    "@id": "https://merchant.com/collections/new-in#collection",
    "url": "https://merchant.com/collections/new-in",
    "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/collection/new-in.en.json",
    "name": "New in",
    "pagefront:collectionKind": "collection"
  }
]
```

The existing `category` string on the Product Sheet ("Apparel > Knitwear > Sweaters") is unchanged: it is the human path, and `isPartOf` is the machine link. The two SHOULD agree where both are present, and the linter does not compare them.

The inline `Collection` nesting that Pattern 3 of the Pagefront Spec describes stays valid for a publisher without collection sheets. Where a collection sheet exists, the product's `isPartOf` entry references it and carries no nested `isPartOf` of its own: the hierarchy lives in the sheets.

## Listing pages without a Sheet

A listing page with a URL of its own is a category under this spec, and a publisher is under no obligation to emit a sheet for each one. A storefront's facet pages number in the thousands and most platforms expose none of them to a producer. A listing page without a sheet declares no `alternate` link and is conformant. Partial trees are conformant: a publisher that emits sheets for its taxonomy nodes and none for its facet pages has emitted a valid tree, and nothing in the emitted sheets claims otherwise.

Where a facet page does get a sheet, it is a `category` whose `isPartOf` is the listing it filters, and the direct-membership rule applies: products assigned to it leave the parent's `hasPart`.

A consumer that lands on a listing page without a sheet reads the page. The products on it are product pages with sheets, and each product sheet's `isPartOf` leads to the nearest sheeted set.

**Collections filled by a rule have no sheet.** A collection whose membership the merchant's platform computes from a rule (an automated collection, a dynamic campaign, a set defined by a condition on price, date, stock, sales or a product attribute) is not described by a Collection Sheet. A producer MUST NOT emit one for it. Its products are reached through their own pages and through the category tree.

A producer determines that a collection is filled by a rule from the platform's model, which states it. It does not infer it from the collection's name or from the products on its page. A collection whose platform states no rule is treated as assembled by hand.

This applies to the `collection` kind. A listing in the category tree is a `category` and keeps its sheet however its membership is filled.

## Discovery

As for every sheet, per Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md)): `Link: rel="alternate"; type="application/pagefront+json"` on the listing page's response, with the HTML `<link>` fallback, and the `profile` attribute naming this sheet spec's schema. A collection sheet is also reached by reference, through `pagefront:sheetUrl` on an `isPartOf` entry, a `hasPart` entry or a `hasOfferCatalog` entry, under the traversal-hint rule in that document.

## Producer guidance (non-normative)

Collection sheets are produced from the platform's catalog model, where the producer has access to it. The model states direct membership, position and the tree, which a crawl of the pages cannot recover. The mapping, per model:

- **A platform with a category tree and separate collections or campaigns** (Magento, Salesforce B2C, PrestaShop, commercetools): categories map to `category` with the model's parent links, products to the `hasPart` of each category they are assigned to in the model's position order, and promotional or campaign groupings assembled by hand to `collection`; groupings the model defines by a rule have no sheet.
- **A platform with one flat collection object** (Shopify): the online store's menu hierarchy is the tree. A collection reached through a nested menu item maps to `category`, with the parent menu item's collection as `isPartOf`; a menu item that is a link with no collection behind it has no page to describe, and its children attach to the nearest ancestor collection. A collection outside the menus, or in a flat featured menu, maps to `collection` when it is a manual collection; an automated collection outside the menus has no sheet. An automated collection reached through a nested menu item is a `category` like any other, with a short `expires_at`. A brand collection (a vendor collection) maps to `brand`.
- **Facet pages** exist in the storefront's routing and in no platform model. A producer that cannot see them emits none, which is conformant.

Direct membership from a model is a read. Where a platform states only page-level membership and rolls descendants into parents, the direct members of a node are the products on it minus the union of its descendants' products; a product assigned to both a parent and a child is then listed under the child only.

## Worked examples

To be written against a real sheet before ratification. The candidate is a Shopify storefront with a nested menu, so that the flat-collection mapping above is exercised. The example uses a category or a manual collection; a collection filled by a rule has no sheet to show.

## Linter rules (proposed)

Codes are reserved here and defined in [`rules.md`](rules.md), where catalogue 0.17.0 carries them.

- **COL-E-001** a `hasPart` or `isPartOf` entry without `@id`.
- **COL-E-002** `pagefront:collectionKind` absent or outside the enum.
- **COL-E-003** `$schema` does not name the sheet-spec version the declared release bundles (same logic as ORG-E-003).
- **COL-E-004** a release the release manifest does not list (same logic as ORG-E-004).
- **COL-E-005** a `pagefront:sheetUrl` on a `hasPart`, `isPartOf` or `brand` entry whose host differs from the host the edge requires: the canonical host for members and parents, the brand's `@id` host for the brand reference. The same check on a `hasOfferCatalog` entry is ORG-W-007, on the organization sheet.
- **COL-W-001** `hasPart` is empty (review; no failure).
- **COL-W-002** a `hasPart` entry with no `pagefront:sheetUrl`.
- **COL-W-003** reserved and awaiting implementation: a root category absent from the organization sheet's `hasOfferCatalog` needs both sheets and is out of scope for a single-sheet linter.
- **COL-W-004** kind `brand` without `brand`, or `brand` present on another kind.
- **COL-W-005** a `category` whose `isPartOf` entry declares a kind other than `category`, or a `collection` whose `isPartOf` entry declares `category`.
- **COL-W-006** the same `@id` twice in `hasPart`.

The rules are defined, with their fixtures, under "Commerce Collection Sheet rules" in [`rules.md`](rules.md) (catalogue 0.17.0); the two lists are kept identical.

The exclusion of collections filled by a rule ("Listing pages without a Sheet") is a producer obligation with no linter check: a sheet cannot show how its source collection was filled.

## Companion changes

The changes made with this draft, each recorded under "Unreleased" in the document it touches:

- **`collection.json`**: the editable schema head for Collection Sheet spec 0.1.0, `$id` `https://themachineweb.org/pagefront/spec/commerce/collection/v0.1.0.json`. Envelope as every sheet's (`$schema`, `release`, `schema_org_version`, `canonical_url`, `generated_at`, `data` required; `sheet_url`, `expires_at` optional; `format_version` not accepted). Data block: `@context` in the array form with the `pagefront` prefix, `@type` `Collection`, `@id`, `name`, `inLanguage`, `url`, `pagefront:collectionKind` and `hasPart` required; `isPartOf`, `brand`, `description`, `image`, `pagefront:availableLanguages` optional; one `memberEntry` definition (`@type`, `@id`, `url` required; `pagefront:sheetUrl`, `name`, `pagefront:collectionKind` optional). No schema is published until the release.
- **`organization.md`**: "Catalogue entry point (any role)" added under "Role-scoped content", stating `hasOfferCatalog` as "Entry point" above does; the linking contract names the two admitted outbound edges; "Catalog and carried-brand enumeration" leaves "What this spec does not address" (enumeration lives in `hasOfferCatalog` and the collection sheets); the sentence deferring domain association no longer promises a catalog sheet. **`organization.json`**: `hasOfferCatalog` added as an optional property with the member entry shape; the head keeps the unreleased 0.5.0 it already names.
- **`product.md`**: `isPartOf` recommended as an array of `Collection` member entries, one per set whose direct members include the product, with `category` unchanged and not compared; Pattern 3 points here and keeps the inline nesting valid for a publisher without collection sheets; "Sheets reached by reference" and the traversal-hint list name the collection references. **`product.json`** is unchanged: it already accepts `isPartOf` as an object or an array.
- **`vocabulary.md`**: `pagefront:collectionKind` minted, in the properties list and under "Enumerated values" as the Collection kinds enum; `pagefront:sheetUrl` extended to collection references; nothing else.
- **`releases.md`**: the Collection Sheet spec added to "Sheet spec versions" at 0.1.0, unreleased; the "every future sheet spec (category, collection, catalog)" parenthesis reduced to the collection spec; no catalog sheet is planned. No release is added; `releases.json` is unchanged.
- **`rules.md`** and **`commerce/lint`**: catalogue 0.17.0 adds the "Commerce Collection Sheet rules" section and the `COL-` catalogue (`collection-catalogue.ts`, one file per rule, fixtures per rule), ORG-W-007 with its fixture, the collection page type in the sheet-type dispatch (`$schema` path `/spec/commerce/collection/`, data-block fallback `Collection` with `pagefront:collectionKind`), and a Layer 1 report that the declared release bundles no Collection Sheet schema until a release does. The rules apply from release 0.5.0; the fixtures declare it and run against a test manifest (`commerce/lint/test/manifest/releases.json`) that adds the 0.5.0 row and resolves this spec's 0.1.0 to `collection.json`, so the release pull request adds the 0.5.0 row to `commerce/spec/releases.json` and to the release table in `releases.md`, and freezes the head as `commerce/schemas/collection/v0.1.0.json`, and changes nothing in the fixtures.

Still to come, with ratification and the release: the worked example below, the release entry in `releases.md` and `releases.json` bundling Collection Sheet spec 0.1.0, the frozen copy of the schema under `commerce/schemas/collection/`, the `collectionKind` mapping in the vocabulary's JSON-LD context, and the site route for this document.

## Decisions and their grounds

Recorded for the ratification review.

- **One spec, three kinds**, with `pagefront:collectionKind`, rather than a spec per kind: the shape is identical and the kinds differ in one rule each.
- **`Collection` as base**, rather than `ProductGroup`, `OfferCatalog` or a minted type: see "Base type".
- **Direct membership**, rather than page-mirroring: one place per product in the tree, small sheets, computable from a model. A parent's sheet can differ from its page when the page rolls descendants up, and the spec says so.
- **Exhaustive `hasPart`**: producers work from platform models, so pagination is no obstacle, and consumers read one rule for `hasVariant` and `hasPart` alike.
- **Thin entries**: a category has thousands of members and a sheet has to stay around a megabyte.
- **Subcategories in `hasPart`**: Schema.org's own child relation; no term minted.
- **Multiple parents allowed**: real taxonomies have them.
- **Collections nest**: Pattern 3's family → series hierarchy needs it.
- **Roots on the organization sheet in `hasOfferCatalog`**, for any commerce role: Schema.org-native, no term minted, and the roots are the stable part of a catalog.
- **No catalog sheet**: no page, and `hasOfferCatalog` plus the tree carry what it would have.
- **Brand as a collection kind**, pointing at the `Brand`: a Schema.org `Brand` is a label (an `Intangible` used for labeling products), and the set of products under a label is a `Collection`.
- **A listing with its own URL is a category, and un-sheeted listings are conformant**: the first keeps the definition free of a taxonomy/facet distinction no producer can draw; the second keeps the obligation within what producers can see.
- **No sheet for a collection filled by a rule**: a rule-filled collection is a view of the catalogue; its products are reached through their own pages and the tree. The rule is read from the platform's model, never inferred. Categories are exempt, since the tree is built from them however they are filled.

## References

- Collection schema, spec version 0.1.0 (to be published with the release): `https://themachineweb.org/pagefront/spec/commerce/collection/v0.1.0.json`
- Pagefront Spec (Product Sheet): [`product.md`](product.md)
- Commerce Organization Sheet: [`organization.md`](organization.md)
- Pagefront Vocabulary: [`vocabulary.md`](vocabulary.md)
- Commerce releases: [`releases.md`](releases.md)
- Schema.org `Collection`: `https://schema.org/Collection`; `OfferCatalog`: `https://schema.org/OfferCatalog`; `Brand`: `https://schema.org/Brand`

## Changelog

### Unreleased

Changes land here and are versioned at the next release; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

- **Change (minor): collections filled by a rule have no sheet.** Producers MUST NOT emit one, determine rule-filled membership from the platform's model, and do not infer it. The `collection` kind covers sets assembled by hand. Categories are unaffected and keep their sheets however they are filled. See "One sheet type, three kinds", "Listing pages without a Sheet" and "Producer guidance"; the product side is in [`product.md`](product.md).

### 0.1.0 — 2026-10-18

Released in commerce release 0.5.0, the first release that bundles this sheet spec.

- **Editorial: resolution rule.** "Resolution" under "Identity" points at the traversal-hint rule in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md)), which now states the exact-string `@id` confirmation for every reference; this document keeps the host rule. "Discovery" points at the same document.
- **Clarification: blank hints.** An empty or whitespace-only `pagefront:sheetUrl` on a member entry is treated as absent ("Members"). Linter rule COL-W-002 reports it, and COL-E-005 skips a hint with no host.
- **New sheet type.** The Commerce Collection Sheet, 0.1.0: a `Collection`-rooted sheet for category, collection and brand listing pages, with direct exhaustive membership in `hasPart`, parents in `isPartOf`, the `pagefront:collectionKind` discriminator, and the tree's roots on the Organization Sheet in `hasOfferCatalog`. The catalog sheet type is withdrawn.
