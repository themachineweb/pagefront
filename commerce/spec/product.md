# Pagefront Product Sheet

Status: normative spec.
Product Sheet spec version: 0.11.0
Commerce release: 0.5.0
Schema.org version targeted: 30.0 (2026-03-19)

**Versioning.** This sheet spec has its own semver, 0.11.0, and is a member of commerce release 0.5.0. A sheet declares the release in its envelope (`release`) and names this spec version in `$schema`. Before 1.0 a breaking or an additive change bumps the minor and a fix or clarification bumps the patch; the release bumps with its members. The scheme, the release table and the legacy draft line (sheets carrying `format_version`) are in [`releases.md`](releases.md). The "v0.7", "v0.9" and similar version names throughout this document are legacy format versions, kept as history.

## Design principles

Pagefront defines the structure of the published Sheet; what's inside the Sheet is the publisher's authoritative statement. The Sheet is JSON-LD, served on the publisher's domain at the address the page declares, discoverable via `Link: rel="alternate"`. Schema.org is the data vocabulary; `pagefront:` extensions cover what Schema.org under-specifies for commerce. Consumers ignoring `pagefront:` extensions parse the Sheet as clean Schema.org JSON-LD. A `pagefront:` term is minted only where Schema.org has a gap, under-specifies the concept, or conflicts with Pagefront's contract; everywhere else the sheet uses Schema.org's own vocabulary. [why](product-notes.md#when-to-extend-schemaorg-with-pagefront-vocabulary) The sheet carries no completeness score; scoring is consumer-side ([`scoring.md`](scoring.md)). [why](product-notes.md#why-completeness-is-not-in-the-sheet)

### What the schema validates

The JSON Schema validates the envelope and `pagefront:`-prefixed extensions strictly. Schema.org-typed content within the data block is permitted by reference and validated upstream by Schema.org-aware consumers: the schema's `additionalProperties: true` policy on Schema.org-typed blocks lets any Schema.org property through. Patterns built on Schema.org vocabulary need no schema change; schema changes are reserved for envelope fields and `pagefront:` extension types. [why](product-notes.md#why-the-schema-validates-the-envelope-and-the-extensions-only)

### Upstream-equivalent forms

Where an upstream standard (Schema.org, RFC 5646 for BCP 47, ISO 3166) treats two or more forms as semantically equivalent, Pagefront accepts all of them: the schema enforces structural validity, and the linter recommends the canonical form. Producers SHOULD emit canonical forms. Consumers MUST treat forms as their upstream standard treats them: case-insensitive comparison for BCP 47 tags, scheme-insensitive comparison for Schema.org URIs.

- **Schema.org URIs**: `http://schema.org/InStock` and `https://schema.org/InStock` both validate; `https` is canonical. Check: PDP-W-013 (legacy `http` form).
- **BCP 47 tags**: `en-US` and `en-us` both validate; canonical is a lowercase language subtag and an uppercase region subtag. Check: PDP-W-017 (non-canonical case).

## The envelope

The envelope is project-defined. It wraps one data block and states which release and sheet spec the sheet is written against, which page it describes and when it was generated.

```json
{
  "$schema": "https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json",
  "release": "0.5.0",
  "schema_org_version": "30.0",
  "canonical_url": "https://merchant.com/product/widget-123",
  "generated_at": "2026-05-10T14:32:00Z",
  "expires_at": "2026-05-10T15:32:00Z",
  "data": { "@context": "https://schema.org", "@type": "Product", "name": "Widget 123" }
}
```

- **`$schema`** *(required)*: the URL of the JSON Schema for the sheet's own sheet-spec version, with the full semver in its last segment: `https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json` for Product Sheet spec 0.11.0. It identifies the vertical and the sheet type; the release has no schema of its own. The release and the sheet type resolve to exactly one sheet-spec version through the release table in [`releases.md`](releases.md) (machine-readable in [`releases.json`](releases.json)), and `$schema` MUST name that version: release 0.5.0 names `product/v0.11.0.json`, 0.4.0 names `product/v0.10.0.json`, 0.3.0 names `product/v0.9.0.json`. Check: PDP-E-002.
- **`release`** *(required)*: the commerce release the sheet is written against, as a full semver (`"0.5.0"`). A sheet is judged by the release it declares: validated against the schema of the sheet-spec version that release bundles, and by the rules that apply from that release; a requirement a later release introduces does not apply to it (whether `$schema` is required is itself such a requirement: spec 0.10.0's schema requires it, spec 0.9.0's does not). Checks: PDP-E-018 (a release the table does not list), PDP-E-016 (`format_version` beside `release`). [why](product-notes.md#why-release-has-a-generic-name)
- **`schema_org_version`** *(required)*: the Schema.org version the data block targets, as its number (`"30.0"`).
- **`canonical_url`** *(required)*: the canonical URL of the page this sheet describes. Source: the page's `<link rel="canonical">` where it declares one, otherwise the page's address as the platform's data states it (its permalink); either is a merchant statement ("Merchant statements").
- **`sheet_url`** *(optional)*: an address this Sheet is served from, as known to the publisher at generation time. Informational: the authoritative location is whatever the canonical page currently declares, and a publisher whose platform assigns or changes the address after generation MAY omit it. Sheets written before 2026-10-13 carry it, and nothing in them changes. [why](product-notes.md#why-sheet_url-is-informational)
- **`generated_at`** *(required)*: when the sheet was generated, an RFC 3339 date-time (the schema's `date-time` format).
- **`expires_at`** *(recommended)*: how long consumers should consider the sheet valid before re-fetching, an RFC 3339 date-time. Publishers SHOULD declare it when they have a meaningful expiry policy and MAY omit it otherwise. Sheets carrying multi-currency offers, region-scoped offers or scheduled promotions SHOULD use shorter windows. Check: PDP-W-008 (past, or trivially close to `generated_at`).
- **`data`** *(required)*: the Schema.org JSON-LD data block, the next section.

**The legacy draft line.** A sheet carrying `format_version` and no `release` belongs to the legacy draft line, format versions 0.9 and earlier: `format_version` stands in for `release`, `$schema` is optional, the sheet validates against the legacy schema, still served at `https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json`, and it gains nothing from later releases. See "The legacy draft line" in [`releases.md`](releases.md).

## data — Schema.org JSON-LD

The data block is a valid Schema.org `Product` (or `ProductGroup`, or a recognized subtype) document with optional project extensions under the `pagefront:` namespace.

### Merchant statements

Every value in the data block is a merchant statement: a claim about the product that the merchant makes, through one of two sources. [why](product-notes.md#why-a-platform-served-value-is-a-merchant-statement)

- **Authored**: the merchant composed the value or approved it as it stands: the text and the structured data of its own page, a value it entered in its platform's dashboard, a sheet it wrote in a publishing tool.
- **Platform-served**: the merchant's own storefront serves the value through a protocol or a feed its platform runs and the merchant has enabled or accepted, including one the platform turns on for every shop unless the merchant turns it off: a product feed, a commerce protocol's catalogue, checkout or stock endpoint, a checkout-link feature. The merchant composed no field of it; the platform states it for the merchant, from the merchant's store data, on the merchant's domain.

Both are merchant statements, and a field MAY take its value from either unless its entry names one. Wherever this document names "the platform's data" as a source, it means a platform-served statement. Where the two state different values for one field, the field's entry says which the field takes (`price` and `availability` take the rendered page); where the entry says nothing, the producer leaves the field out and reports the disagreement.

Nothing else is a merchant statement: a value inferred from a pattern, a URL convention or a platform's documentation; a value taken from a page the merchant's domain does not serve, from a third-party aggregator or from another merchant's site; a value the producer composed, computed or remembered. A producer MUST NOT publish such a value as a merchant statement; a field no merchant statement gives is left out.

### Required and recommended core fields

Required:

- **`@context`**: `"https://schema.org"` when the data block uses no `pagefront:` term. A data block that uses any `pagefront:` term MUST declare the prefix, in the array form `["https://schema.org", {"pagefront": "https://themachineweb.org/pagefront/vocabulary/"}]`; see [vocabulary.md, "How to use this vocabulary"](vocabulary.md#how-to-use-this-vocabulary). Under the bare string a `pagefront:` key is an opaque IRI with scheme `pagefront`, unresolved to the vocabulary and outside its `@container` declarations. Check: PDP-E-003.
- **`@type`**: `"Product"` (or `"ProductGroup"`, or a recognized subtype).
- **`@id`**: a stable URL-shaped identifier. It is the identity key, matched as an exact string (see "Product identity and deduplication").
- **`name`**: the product name as displayed to humans.
- **`inLanguage`**: a BCP 47 language tag (`fr`, `fr-CA`, `en-GB`); the language of all prose fields and language-scoped media in this sheet. Source: the language the page declares in `<html lang>`, confirmed by the page's text; where the two disagree, the language of the text, and the producer reports the disagreement.
- **`url`**: the canonical URL of the human page. Required for `Product` and subtypes, optional for `ProductGroup`: a parent `ProductGroup` Sheet with no backing family page omits `url` and is reached by the `sheet_url` hint on its variants' `isVariantOf` (see "Multi-Sheet variant families").
- **One identifier**, by `@type`: for `Product` and product subtypes, one of `sku`, `gtin13`, `gtin`, `mpn` or `productID`; for `ProductGroup`, `productGroupID`, and per-variant SKUs SHOULD also be declared on each entry in `hasVariant`. A GTIN of 13 digits goes in `gtin13`; one of 8, 12 or 14 digits in `gtin`. `productID` is an identifier the merchant publishes for the product; a platform's internal record number is never one. Source: the platform's data or the page's structured data, as stated, either source under "Merchant statements". The product *type* identification GPSR Art. 9(5) asks for is covered by `mpn`/`productID`. Batch and serial numbers identify individual units, so they are out of scope for a Sheet and MUST NOT be stuffed into `sku`.

Recommended:

- **`brand`**: a typed `Brand` or `Organization`. Source: the page or the platform's data, as the merchant states it ("Merchant statements"). Check: PDP-W-003 (absent).
- **`description`**: a prose description in `inLanguage`. Check: PDP-W-002 (absent).
- **`aggregateRating`**: Schema.org's `AggregateRating` (`ratingValue`, `bestRating`, `ratingCount` or `reviewCount`), where the page shows a rating for this product, as shown. The reviews themselves are not carried.
- **`category`**: the hierarchical category string ("Apparel > Knitwear > Sweaters"), optionally beside a coded form (see "Machine-readable category"). Source: the merchant's own path to the product as the page shows it, its breadcrumb, leaf last, without the home entry and the product itself; where the page shows no breadcrumb, the category the platform's data assigns ("Merchant statements").
- **`isPartOf`**: an array of `Collection` member entries, one per set whose direct members include the product, each in the member entry shape of the Commerce Collection Sheet (`@type`, `@id`, `url`, `pagefront:sheetUrl`, `name`, `pagefront:collectionKind`; see "The product side" in [`collection.md`](collection.md)). `category` is the human path and `isPartOf` the machine link; the two SHOULD agree where both are present, and the linter does not compare them. A collection filled by a rule has no sheet and is not listed (see "Listing pages without a Sheet" in [`collection.md`](collection.md)).
- **`image`**: an array of `ImageObject` (see "Image roles"). Source: the page's media or the platform's data, as the merchant lists them ("Merchant statements").
- **`video`**: an array of `VideoObject` (see "Video roles").
- **`offers`**: an array of `Offer` (see "Offers").
- **`isVariantOf`**: the `ProductGroup`, when the product belongs to a variant family.
- **`pagefront:availableLanguages`**: an array of `{lang, url}` objects pointing at language siblings, when the publisher publishes in multiple languages (see "Internationalization").
- **`question`**: an array of Schema.org `Question` entries with `acceptedAnswer` (see "Product Q&A").
- **`pagefront:document`**: an array of typed product documents (see "Documents").
- **`pagefront:relatedProduct`**: an array of typed product relationships (see "Related products").

#### Multiple GTINs

- **`gtin`**, **`gtin13`**: a single string or an array of strings; each `gtin13` entry is 13 digits. Every listed GTIN identifies the product, and consumers MUST treat a match on any listed GTIN as identifying it; the array carries alternates for one product. Variants with different GTINs are different `hasVariant` entries, each with its own `gtin`. For deduplication, a match on any listed GTIN is a valid secondary-identifier fallback (see "Product identity and deduplication"). An array satisfies the identifier requirement as a single value does. [why](product-notes.md#why-a-product-carries-more-than-one-gtin)

#### Machine-readable category

- **`category`**: the human-readable hierarchical string (`"Apparel > Knitwear > Sweaters"`), a Schema.org `CategoryCode` object identifying the category in a published taxonomy, or an array mixing the string and coded forms. Producers that know a taxonomy code SHOULD emit both the string and at least one coded entry. A `CategoryCode` entry carries: [why](product-notes.md#why-a-coded-category-rides-beside-the-string)
  - `codeValue` *(required)*: the code in the taxonomy (`"212"` in the Google product taxonomy).
  - `inCodeSet` *(recommended)*: the URL identifying the taxonomy the code belongs to, the taxonomy's canonical URL (`https://www.google.com/basepages/producttype/taxonomy.en-US.txt` for the Google product taxonomy, the UNSPSC codeset URL for UNSPSC).
  - `name` *(recommended)*: the category's human-readable name in that taxonomy.

#### ProductGroup variant completeness

- **`hasVariant`** on a ProductGroup Sheet SHOULD list every variant in the family; consumers read it as complete at the moment of emission. When variants live on different pages and the production pipeline can discover them all, the Sheet includes each. When some variants cannot be discovered, producers emit per-variant Product Sheets without a wrapping ProductGroup; a partial ProductGroup Sheet is never emitted. [why](product-notes.md#why-hasvariant-is-read-as-complete)

#### Multi-Sheet variant families

When variants have their own pages carrying substantial per-variant content (their own media gallery, description and offers), producers SHOULD model the family as N+1 Sheets: one parent ProductGroup Sheet at the family's canonical URL, whose `hasVariant` enumerates every variant and links each to its own Sheet, and one Product Sheet per variant, each carrying `isVariantOf` pointing at the parent's `@id`. [why](product-notes.md#why-a-rich-variant-family-is-several-sheets)

- **A page-less parent**: a family whose variants are the only human-facing pages and that has no family landing page. The parent omits the data-block `url` and is reached by reference only, through the `sheet_url` hint on its variants' `isVariantOf`. The `productGroupID` requirement still holds; each variant entry still carries its own page `url`. A publisher that moves a page-less parent re-emits the variant Sheets that point at it, since that hint is the only path to it.
- **Traversal hints**: `sheet_url` on a `hasVariant` entry and on `isVariantOf`, `pagefront:sheetUrl` on an organization reference and on a collection reference (an `isPartOf`, `hasPart` or `hasOfferCatalog` entry), and the `url` of a `pagefront:availableLanguages` entry are traversal hints under "Traversal hints" in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md#traversal-hints-normative)): each MAY be stale, and a consumer reaches the target through its page and the Sheet that page declares.
- **A parent `hasVariant` entry** carries:
  - `@id` *(required)*: exactly the `@id` in the variant's own Sheet (see "Product identity and deduplication" for the `@id` contract).
  - `url` *(required)*: the variant's page.
  - `sheet_url` *(recommended)*: the URL of the variant's Sheet. A producer emitting both the parent and the variant Sheets knows it and SHOULD populate it. A traversal hint: it MAY be stale, and when absent or unresolved the consumer reaches the variant Sheet via `url` and the page's `alternate` link.
  - `name`, the axis value (`color`), `price` and an `image` render hint *(optional)*: together enough to render a family picker without fetching every variant Sheet.
- **`isVariantOf`** on a variant Sheet: the parent's `@id`, and SHOULD carry the parent's `sheet_url`, a traversal hint: it MAY be stale, and when the parent has a page the consumer falls back to that page and the Sheet it declares.

A parent with one of its variant entries, and the variant Sheet's `isVariantOf`:

```json
{
  "@type": "ProductGroup",
  "@id": "https://merchant.com/pagefront/commerce/product/aurora-jacket.en.json",
  "productGroupID": "AURORA-JACKET",
  "url": "https://merchant.com/products/aurora-jacket",
  "variesBy": ["https://schema.org/color"],
  "hasVariant": [
    {
      "@type": "Product",
      "@id": "https://merchant.com/pagefront/commerce/product/aurora-jacket-onyx.en.json",
      "url": "https://merchant.com/products/aurora-jacket?variant=onyx",
      "sheet_url": "https://merchant.com/pagefront/commerce/product/aurora-jacket-onyx.en.json",
      "name": "Aurora Jacket, Onyx",
      "color": "Onyx",
      "image": "https://merchant.com/images/aurora-jacket-onyx-packshot.jpg"
    }
  ]
}
```

```json
"isVariantOf": {
  "@type": "ProductGroup",
  "@id": "https://merchant.com/pagefront/commerce/product/aurora-jacket.en.json",
  "sheet_url": "https://merchant.com/pagefront/commerce/product/aurora-jacket.en.json"
}
```

#### Per-variant URLs

- **`url`** on a `hasVariant` entry *(MAY)*: the variant's own page, or the page state that pre-selects the variant. The ProductGroup's top-level `url` remains the canonical URL of the product family, and the variant's `@id` remains its identifier. When the parent has no family page (see "Multi-Sheet variant families"), its top-level `url` is absent and each variant still declares its own page `url`. Three cases: [why](product-notes.md#why-a-variant-declares-its-own-url)
  - **Shared-URL variants**: variants share the parent product's URL and are distinguished only by `@id`. The per-variant `url` MAY be omitted.
  - **Same-page parameterized variants**: variants share the page, each with a distinct addressable URL through platform-specific query parameters (`?variant={id}` on Shopify). Per-variant `url` SHOULD be populated. Consumers SHOULD treat these URLs as the same canonical page with a different default state.
  - **Distinct-page variants**: each variant has its own page on its own URL. Per-variant `url` is essential.
- Checks: PDP-W-014 (no per-variant `url` where variants are distinctly addressable), PDP-W-018 (`url` on some variants and not others).

#### ProductGroup `name` and Google Merchant Center `item_group_title`

- **`name`** on a `ProductGroup`: the human-readable title of the variant family, distinct from any variant's `name`; Schema.org's native `name`, the equivalent of Google Merchant Center's `item_group_title`. [why](product-notes.md#how-productgroup-name-maps-to-google-merchant-center-item_group_title)

#### Variant dimensions

ProductGroup Sheets SHOULD declare the axes along which their variants differ, and each variant in `hasVariant` declares its value on every axis.

- **`variesBy`** on the `ProductGroup`: the axes, one entry each. A Schema.org-native axis (`color`, `size`, `material`) is referenced by its full Schema.org URI (`https://schema.org/color`, `https://schema.org/size`, `https://schema.org/material`). A registry entry or a producer-defined axis is referenced by its bare `propertyID` string (`storage` and `width` are registry entries; `packaging_ribbon_color` is a producer-defined axis with no registry entry). Consumers distinguish the two forms by the presence of a URI scheme; a group varying along both kinds has mixed entries: `["https://schema.org/color", "storage"]`.
- **A variant's value on a Schema.org-native axis**: the Schema.org property, `color`, `size` or `material`, directly on the `hasVariant` entry. Preferred whenever Schema.org models the axis.
- **A variant's value on any other axis**: an `additionalProperty` entry whose `propertyID` matches the bare-string axis in `variesBy` and whose `value` is the variant's value. `name` is the display label and may be localized; `propertyID` is the language-neutral coordination key.
- **`propertyID`**: drawn from the Pagefront Property Registry, a machine-readable, versioned registry at `https://themachineweb.org/pagefront/commerce/registry/properties.json`, when a matching entry exists. Producers SHOULD use the registry's identifiers and emit values in the entry's recommended unit (`recommendedUnitCode`, or `unitLabel` when no UN/CEFACT code exists). A `propertyID` outside the registry is valid: consumers MUST treat it as an opaque but usable identifier and MUST NOT reject a sheet over it. Consumers MAY ship a pinned snapshot of the registry; fetching it at runtime is not required. [why](product-notes.md#why-examples-use-unregistered-propertyid-values)
- **A registry entry** carries `id` (the `propertyID` value), `definition`, `valueType` (`string`, `number` or `boolean`), `recommendedUnitCode` (a UN/CEFACT unit code, or `null` with a `unitLabel` carrying the conventional symbol, `"MP"` for megapixels), `repeatable` (present and `true` for axes that take several values per product, `input_type`, `port`), `verticals` (the product categories the entry is used in) and `status` (see "Registry governance").

#### Registry governance

- **`status`**: `proposed` (a candidate identifier, observed in real-merchant use but not yet broadly converged on), `stable` (enough independent-producer adoption that the spec recommends it without reservation) or `deprecated` (superseded by a preferred alternative, still resolvable and valid; sheets that already emit it remain conformant).
- **Permanence**: entries are never removed or renamed once published. A `propertyID` in a sheet today resolves to the same definition whatever its later status. [why](product-notes.md#why-the-registry-deprecates-and-never-removes)
- **`registry_version`**: additive only. A new version may add entries or advance existing ones along `proposed` → `stable` → `deprecated`; it removes or redefines none.
- **Registration**: new entries are proposed from observed real-merchant use and submitted via the spec repository.

#### Configurator vs. ProductGroup guidance

A configurable product is expressed with `pagefront:configurator` (a parametric option space) or with `ProductGroup` + `hasVariant` + `offers` (each combination a discrete SKU). The choice is normative, and using both for the same dimension is an authoring error (PDP-W-010). [why](product-notes.md#why-the-productgroup-ceiling-is-three-axes-per-sheet)

- **Use `pagefront:configurator`** when any of these holds: listing every combination as a separate `Offer` is not how the merchant manages inventory or surfaces options (combinatorial impracticality); at least one dimension is continuous (engraving text, custom dimensions, a monogram, a date inscription); the product is produced on demand from configured inputs (made-to-order economics, typically with `pagefront:madeToOrderTerms`); or the Sheet carries four or more variant axes, where products SHOULD use the configurator. The only exception to the axis rule: the cartesian product is unusually small and every combination ships from inventory as a discrete SKU; borderline cases default to the configurator.
- **Use `ProductGroup` + `hasVariant` + `offers`** when all of these hold: three or fewer axes, all axes discrete, each combination a discrete SKU shipping from inventory.
- **Axis count is per Sheet**: the axes expressed within one Sheet, on one canonical URL, and never the total a logical family carries across its representations. A family with more axes than one Sheet expresses is factored across Sheets by picking one axis as the page boundary; cross-Sheet relationships (`isVariantOf` to a parent family Sheet, or `pagefront:relatedProduct` between siblings) carry the factored axis. A family with four or more axes is therefore either factored across Sheets, each at three or fewer axes, or expressed in one Sheet with `pagefront:configurator`.
- Checks: PDP-W-007 (single-variant ProductGroup), PDP-W-009 (empty `hasVariant`), PDP-W-010 (configurator and `hasVariant` declaring the same dimension).

##### Mixed cross-Sheet factoring

A product's axes can split across both mechanisms at once: some axes factored into pages, the rest configured within each page. The two sets are disjoint; an axis is either factored or configured, never both on one Sheet. [why](product-notes.md#why-factored-and-configured-axes-are-disjoint)

- **Factored axes** (the page-boundary axes): a parent `ProductGroup` Sheet whose `hasVariant` enumerates the per-page variants, each page carrying `isVariantOf` to the parent; `variesBy` on the parent lists the factored axes.
- **Configurator axes** (the within-page axes): `pagefront:configurator` on each page's Product Sheet.

##### Configurator pricing and price bands

A configurator carries no prices. `pagefront:configurator` describes the option space: its dimensions, their options, and the combinations that cannot be ordered together (`exclusions`). The prices live in an offer, in `pagefront:configuratorPricing`, permitted on an `Offer` and on an `AggregateOffer`, whose value is a `pagefront:ConfiguratorPricing` object (field definitions in [`vocabulary.md`](vocabulary.md)). [why](product-notes.md#why-the-configurator-carries-no-prices)

- **`configurator`**: MUST be a reference `{ "@id": … }` to a `pagefront:Configurator` declared in the same Sheet, which MUST declare an `@id`, a same-document identifier such as the Sheet's `@id` with `#configurator` appended. Check: PDP-E-001 (the reference resolves).
- **`baseConfiguration`**: exactly one option for every priced dimension, a configuration a buyer can order. A dimension declaring `affectsPrice: false`, a free-text dimension and an unpriced continuous dimension have no key here.
- **`basePrice`**: what the buyer pays for exactly the base configuration. On a product assembled from several priced parts (a frame and a top, a setting and a stone), the price of one part MUST NOT be published as `basePrice`.
- **`modifiers`**: keyed by dimension name, then by option value; the amount each option adds to or subtracts from `basePrice`. An option that changes nothing carries `0` (`"0"` in a Sheet whose amounts are strings), and the option named in `baseConfiguration` MUST carry zero. A missing modifier states nothing, and consumers MUST NOT read it as zero; a block in which any priced option has no modifier MUST declare `pricing: "partial"`. A free-text dimension (`inputType: "text"`, with `maxLength` MAY stating the characters accepted) left at the default `affectsPrice: true` MUST have a single modifier under its name, keyed `"*"`, applying to any non-empty input; free engraving is `affectsPrice: false` with no modifier.
- **`affectsPrice: false`** on a dimension: it never changes the price (size, free personalisation, delivery slot) and has no entry in `modifiers` and no key in `baseConfiguration`. A dimension is priced unless it declares this.
- **A priced dimension enumerates its options.** A `select` dimension with no `options` (a continuous measure, a sizing system) is either `affectsPrice: false`, or left out of `baseConfiguration` and `modifiers` with the block declaring `pricing: "partial"`.
- **`adjustments`**: what is not additive. Each entry has a `when` (a partial configuration) and a `priceModifier`, and applies to every configuration that matches every pair in its `when`. Producers MUST verify that the prices are additive before omitting `adjustments`.
- **`exclusions`** on the configurator: a configuration that matches every pair of an entry cannot be ordered, and its total is undefined.
- **References resolve.** Every pair in an exclusion and in an adjustment's `when` MUST name a dimension the configurator declares; where that dimension lists `options`, the value MUST be the `value` of one of them, compared by JSON value equality, type included, with no conversion (`1` and `"1"` differ; `1` and `1.0` are the same number). A dimension that lists no options takes any value. Check: PDP-E-017 (from release 0.4.0).
- **`pricing`**: `"partial"` when the block does not state the whole price list. Consumers MUST NOT compute totals from a partial block.
- **Currency, tax basis and carrier**: every amount is in the enclosing offer's `priceCurrency`, under that offer's `valueAddedTaxIncluded` statement (see "Tax inclusion"); the block carries no currency of its own. `basePrice`, every modifier and every `priceModifier` use the Sheet's amount carrier, all numbers or all decimal strings (see "Amounts").
- **The total** of a configuration is `basePrice`, plus the modifier of each selected option, plus the `"*"` modifier of each priced free-text dimension given a non-empty input, plus the `priceModifier` of every adjustment that applies. Consumers MUST NOT compute a total for an excluded configuration.
- **Option `value`**: a stable identifier for the option; the human label goes in `description`. SHOULD be lowercase with no spaces, stable across languages and editions of the same product (`yellow_gold`, `three_quarter_pave`, `0.5`). A numeric option is the number as a string with no unit (`"0.5"`, never `"0.5ct"`); the unit belongs in the dimension's `note`. In a dimension that declares a `system`, the value is the size as that system writes it, without the system's name (PDP-W-036, PDP-W-037). Values are matched by their string form, with no case folding and no trimming: a string is its own key; a number or boolean is keyed by its JSON serialization (`0.5`, `1`, `true`); the same comparison applies in `baseConfiguration`, in `when` and in `exclusions`. [why](product-notes.md#why-option-values-are-identifiers)
- **Option `description`**: the label a buyer sees.
- **Dimension `note`**: a factual statement for a machine, third person, no address to the reader, no call to action; descriptive page copy is restated as a fact ("A free ring sizer can be ordered before the size is confirmed" where the page says "Not sure about your size? Just select the ring sizer."). Fields carrying a legal or safety statement (safety warnings, warranty, return terms) are quoted verbatim. Check: PDP-W-038 (a note that reads as page copy).
- **`options`** hold the values a product can be ordered in. Services offered around the order (a sizing kit, a sample, a consultation) MUST NOT appear in `options`; they belong in the dimension's `note` or in `pagefront:madeToOrderTerms.aftermarketServices`.
- **The offer's own price fields agree with the block**: an `Offer` MUST have `price` equal to `basePrice` (PDP-E-010); an `AggregateOffer` MUST have `lowPrice` and `highPrice` equal to the totals of the cheapest and the dearest non-excluded configurations computed from the block (PDP-E-011), and with `pricing: "partial"` the bounds are the ones the page states. The `AggregateOffer` takes no `itemOffered`; nested in the Product's `offers`, position binds it. A configurator is priced by at most one offer per Sheet (PDP-E-012). An offer with a price beside a configurator and no pricing block is not linked to it (PDP-W-034).
- **What the producer can state decides the shape**: the full grid known, the block with every modifier, on an `Offer` (`price` is the base price) or an `AggregateOffer` (the computed band); part of the grid known (the page resolves a price only after selection, or shows one slice), the block with `pricing: "partial"`, the base configuration and its total, and the known modifiers, on an `Offer` at the base price, since an `AggregateOffer` requires both bounds; only the option space known, the configurator alone. A configurator-only Sheet is valid; a half-populated `AggregateOffer` (a `lowPrice` with no `highPrice`) is invalid.
- **Scope of the band**: the Sheet's own configurator dimensions. On a Sheet with factored axes (see "Mixed cross-Sheet factoring"), the factored axes are fixed for that page, and the pricing block and its `AggregateOffer` range only over the page's configurator dimensions.
- Checks: PDP-E-007 to PDP-E-012 and PDP-W-032 to PDP-W-035 (the pricing block against the configurator it names), PDP-E-013, PDP-W-036, PDP-W-037 and PDP-W-038 (the configurator's dimensions, option values and notes).

A desk with three priced dimensions (top size, top material, frame), one unpriced dimension (frame colour), one exclusion (the largest top is not made in solid oak) and one adjustment (oak veneer costs 30 more on the largest top than the two modifiers add up to): [why](product-notes.md#worked-example-the-harbour-desk-price-band)

```json
{
  "@context": [
    "https://schema.org",
    { "pagefront": "https://themachineweb.org/pagefront/vocabulary/" }
  ],
  "@type": "Product",
  "@id": "https://merchant.com/pagefront/commerce/product/harbour-desk.en.json",
  "name": "Harbour Desk",
  "inLanguage": "en",
  "sku": "HARBOUR-DESK",
  "url": "https://merchant.com/products/harbour-desk",
  "pagefront:configurator": {
    "@type": "pagefront:Configurator",
    "@id": "https://merchant.com/pagefront/commerce/product/harbour-desk.en.json#configurator",
    "dimensions": [
      {
        "name": "top_size",
        "options": [
          { "value": "120x60", "description": "120 × 60 cm" },
          { "value": "140x70", "description": "140 × 70 cm" },
          { "value": "160x80", "description": "160 × 80 cm" }
        ]
      },
      {
        "name": "top_material",
        "options": [
          { "value": "laminate" },
          { "value": "oak_veneer", "description": "oak veneer" },
          { "value": "solid_oak", "description": "solid oak" }
        ]
      },
      {
        "name": "frame",
        "options": [
          { "value": "fixed" },
          { "value": "electric" }
        ]
      },
      {
        "name": "frame_colour",
        "affectsPrice": false,
        "options": [
          { "value": "black" },
          { "value": "white" }
        ]
      }
    ],
    "exclusions": [
      { "top_size": "160x80", "top_material": "solid_oak" }
    ]
  },
  "offers": [
    {
      "@type": "AggregateOffer",
      "lowPrice": 349.00,
      "highPrice": 859.00,
      "priceCurrency": "EUR",
      "areaServed": "DE",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "priceCurrency": "EUR",
        "valueAddedTaxIncluded": true
      },
      "pagefront:configuratorPricing": {
        "@type": "pagefront:ConfiguratorPricing",
        "configurator": {
          "@id": "https://merchant.com/pagefront/commerce/product/harbour-desk.en.json#configurator"
        },
        "baseConfiguration": {
          "top_size": "120x60",
          "top_material": "laminate",
          "frame": "fixed"
        },
        "basePrice": 349.00,
        "modifiers": {
          "top_size": {
            "120x60": 0,
            "140x70": 40,
            "160x80": 90
          },
          "top_material": {
            "laminate": 0,
            "oak_veneer": 80,
            "solid_oak": 220
          },
          "frame": {
            "fixed": 0,
            "electric": 250
          }
        },
        "adjustments": [
          {
            "when": { "top_size": "160x80", "top_material": "oak_veneer" },
            "priceModifier": 30
          }
        ]
      }
    }
  ]
}
```

#### Product dimensions

- **`height`**, **`width`**, **`depth`**, **`weight`** on the Product: Schema.org's native properties, each a `QuantitativeValue` with a numeric `value` and a UN/CEFACT `unitCode`. Recommended codes: `CMT`, `MMT`, `INH` for lengths; `GRM`, `KGM`, `LBR`, `ONZ` for weight. The unit is the producer's choice, appropriate to the category (centimetres for soft goods and apparel, millimetres for jewelry and watches, grams for jewelry and small items, kilograms for larger objects); consumers read the `unitCode` and convert as needed. They describe the product itself, as the merchant states them. A shipping weight or a parcel size in the platform's data describes the package and is never written as the product's `weight` or dimensions; packaging and shipping-container dimensions belong on the Offer's `shippingDetails`, where relevant. Omitted where dimensions are not meaningful (digital products, services); the spec does not require them.
  - `description` *(optional)* on the `QuantitativeValue`: clarifying nuance (`"Weight in size L"` when weight varies by variant, `"Total gold weight (excludes gemstones)"` when weight is partial).
- **Per-variant dimensions**: where dimensions vary by variant, each `hasVariant` entry MAY declare its own; the `ProductGroup`-level dimensions are then omitted or set to the primary variant's.
- **Per-material weight**: `pagefront:Material` entries inside `pagefront:materialComposition` carry an optional `weightGrams` for weight distributed across materials. The Product-level `weight` is the total; `weightGrams` is per component; both can coexist.

#### Age suitability

- **`audience`**: a `PeopleAudience` with `suggestedMinAge` and/or `suggestedMaxAge`, numbers, in years; products carrying an age recommendation (toys, games, children's equipment) SHOULD declare it. An open-ended recommendation ("5 and up") declares only `suggestedMinAge`. `suggestedGender` MAY be added where the merchant themselves declares a gendered audience; producers SHOULD NOT infer one.
- **`age_warning`**: a regulatory age warning ("Not suitable for children under 36 months"), carried as an `additionalProperty` entry, a `PropertyValue` with `name: "age_warning"` and the warning text as `value`, in the sheet's `inLanguage`. A recommendation and a warning coexist on the same product, and neither substitutes for the other. [why](product-notes.md#why-an-age-warning-is-a-separate-statement)

### Image roles

An `ImageObject` in `image` declares its role through `additionalProperty`, as one `PropertyValue` per role with `name: "role"`. The enumeration is closed; additional values require a spec amendment, and a publisher needing a role outside it uses an unprefixed `PropertyValue` that consumers may ignore. An image may carry more than one role (a packshot that also serves as the hero); consumers treat roles as filter inputs. Check: PDP-W-001 (no `image` on the sheet).

- **`hero`**: the primary image, typically lifestyle or evocative.
- **`packshot`**: the product on a neutral background, an isolation shot.
- **`lifestyle`**: the product in use or in context.
- **`detail`**: a close-up of construction, fabric, finish or a distinguishing feature.
- **`flatlay`**: a top-down product layout, common in apparel.
- **`swatch`**: a color or material sample.
- **`size_chart`**: a measurement diagram, typically apparel.
- **`context`**: an environmental or scale-reference shot.

### Associating images with variants

- **`about`** on an `ImageObject` of a ProductGroup Sheet: which variant or variants the image depicts, as Schema.org's `about`. Producers SHOULD declare it on every image of a ProductGroup Sheet. A variant-specific image (a packshot of one color, a swatch for one finish) points at the depicted variant's `@id`: one reference for an image of one variant, an array of references for an image that applies to several (a comparison shot, a color-swatch chart). A family-level image (a family overview, packaging, the product without variant emphasis) points at the ProductGroup's `@id`. A `VideoObject` declares its variant association the same way, under the same every-video rule. [why](product-notes.md#why-every-image-declares-about)

```json
{
  "@type": "ImageObject",
  "url": "https://merchant.com/media/widget-color-chart.jpg",
  "about": [
    { "@id": "https://merchant.com/product/widget#color-midnight" },
    { "@id": "https://merchant.com/product/widget#color-silver" }
  ],
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "role", "value": "swatch" }
  ]
}
```

### Textual framing for media

Producers SHOULD populate textual framing for images whose intent is not evident from the visual content alone (lifestyle imagery, infographics, comparative diagrams, swatches in context), and MAY skip it for packshots and other studio imagery. The same two fields apply to a `VideoObject`. Auto-generated text in either field is discouraged unless it adds semantic value beyond what visual analysis would derive; generated text is reviewed and refined before publishing. [why](product-notes.md#why-media-carries-textual-framing)

- **`caption`**: short, display-quality text that accompanies the image, merchant-approved for human reading. Source: the merchant's caption text, where the content management system has one. An image's alt text is accessibility text and is never written as `caption`.
- **`description`**: longer or more semantic text that frames the image for machine readers and need not be displayed. Source: richer merchant context than a caption would carry. When both fields are present they carry different content; identical or near-identical `caption` and `description` add noise.

### Video roles

A `VideoObject` in `video` declares its role through `additionalProperty`, as for images. The enumeration is closed; additional values require a spec amendment. A video may carry more than one role (an `overview` that also serves as `lifestyle`); consumers treat roles as filter inputs. User-generated videos, live streams and advertisements get no role of their own, and `hero` is an image role only. [why](product-notes.md#whats-not-in-video)

- **`overview`**: the primary product video, typically short (30 to 90 seconds), showing the product itself. The video equivalent of a hero image.
- **`tutorial`**: how-to-use, how-to-install, how-to-assemble or how-to-care-for content, typically longer (2 to 10 minutes), instructional in voice.
- **`lifestyle`**: atmospheric, product-in-context footage, often without narration.
- **`construction`**: manufacturing footage, behind the scenes, how it is made. Encouraged for publishers whose differentiation includes production transparency; the same provenance value as `pagefront:manufacturingChain`.
- **`demonstration`**: the product in functional use (an instrument played, a tool operating, an audio sample), for products where motion or sound is part of the value.
- **`comparison`**: an A/B with another product or an alternative configuration.
- **`unboxing`**: packaging-opening footage produced by the merchant or a partner.
- **`spin`**: a 360° product rotation, typically generated from photogrammetry, delivered in a video format.

A `VideoObject` carries `contentUrl` or `embedUrl` ("Video hosting"), `thumbnailUrl` or `thumbnail` ("Multiple thumbnails"), `duration`, `uploadDate`, and `caption` or `transcript` ("Accessibility").

#### Video hosting: contentUrl, embedUrl, or both

- **`contentUrl`**: the raw video file URL. **`embedUrl`**: a player URL, such as a YouTube or Vimeo embed. Publishers MAY declare either or both; the spec does not prescribe hosting. When both are present, consumers SHOULD prefer `contentUrl` for direct playback and `embedUrl` for browser-rendered contexts where the embed provides player controls, analytics and rights management.

#### Multiple thumbnails

- **`thumbnailUrl`**: one preview image URL. For interchangeable previews (the same scene in different crops or sizes, no distinct meaning), one URL here.
- **`thumbnail`**: an array of `ImageObject`, in place of `thumbnailUrl`, when the video is surfaced under several previews that carry distinct meaning (different scenes, framings or use-cases the merchant chose), each with its own `description` or `caption`. The content decides, never the number of previews.

Several previews of one video stay in one `VideoObject`, identified by its `contentUrl` or `embedUrl`; two `VideoObject`s sharing one `contentUrl` are the same video. [why](product-notes.md#why-one-video-keeps-its-previews-in-one-object)

#### Accessibility

- **`caption`**: a short summary, typically one to three sentences. **`transcript`**: the full spoken or signed content. Publishers SHOULD include one or both on every `VideoObject`; neither is required. Check: PDP-W-012 (absent on an `overview` or `tutorial` video).

#### Video and internationalization

Video is language-scoped: a sheet's `video` array carries videos in the sheet's `inLanguage` and does not mix languages; cross-language navigation is through `pagefront:availableLanguages` (see "Internationalization"). A language-agnostic video (silent construction footage, an instrument demonstration without spoken content) MAY appear in several language sheets; its `caption` and `transcript`, if present, SHOULD match each sheet's `inLanguage`.

### Product Q&A

- **`question`** on the `Product` or `ProductGroup`: FAQ-style content scoped to the product, as an array of Schema.org `Question` entries. MAY be carried. Source: a set of questions and answers the page shows for this product, a FAQ section or a `FAQPage` in its structured data, one entry per pair, the question and the answer as the page writes them, in the page's order; questions about the shop as a whole are left out, and a pair the producer would have to compose is never written. Each entry: `@type: Question`, `name` carrying the question, and `acceptedAnswer` of `@type: Answer` whose `text` carries the answer prose. One `acceptedAnswer` per question; publishers MAY add Schema.org's `suggestedAnswer` array. Questions and answers are in the sheet's `inLanguage`, and cross-language sibling sheets carry parallel Q&A in their own languages. Check: PDP-W-027 (empty `acceptedAnswer.text`). [why](product-notes.md#why-a-question-has-one-accepted-answer)

### Feature groups

- **`pagefront:featureGroup`**: grouped, ordered technical specifications, the "Specifications" table a product page renders as named sections, each an ordered list of name/value rows. MAY be carried. An array of `pagefront:FeatureGroup`; only the grouping shell is minted, and the rows are Schema.org `PropertyValue` objects. Feature groups carry specifications, facts with a name and a value, for pages that group them; a page with a flat spec list keeps emitting flat `additionalProperty`, and `additionalProperty` keeps its structural roles (image and video roles, variant axis values, the `age_warning` convention). [why](product-notes.md#why-feature-groups-are-minted)
  - `@type: pagefront:FeatureGroup` *(required)*.
  - `name` *(required)*: the group's display name, in the sheet's `inLanguage`.
  - `sortOrder` *(optional)*: the group's integer position among its siblings, lowest first; absent, array order is the display order.
  - `feature[]` *(required)*: the rows, each a `PropertyValue`:
    - `name` *(required)*: the row's display label.
    - `value` *(required)*: the raw comparable value: a number where the quantity is numeric, with `unitCode` carrying the UN/CEFACT unit; a string or boolean otherwise. The field consumers compare across products.
    - `propertyID` *(optional)*: a stable identifier for the measure, drawn from the Pagefront Property Registry when a matching entry exists (the registry covers feature measures such as `cpu_cores`, `display_resolution`, `battery_life` as well as variant dimensions; see "Variant dimensions" and "Registry governance"), otherwise producer-defined. Producers MAY mint identifiers for facets too idiosyncratic to standardize, and consumers MUST treat them as opaque but usable. [why](product-notes.md#why-examples-use-unregistered-propertyid-values)
    - `unitCode` *(optional)*: the UN/CEFACT unit code of a numeric value. Check: PDP-W-025 (a unit embedded in a string value instead of `unitCode`).
    - `description` *(optional)*: clarifying nuance, as on `QuantitativeValue` in "Product dimensions".
    - `pagefront:presentationValue` *(optional)*: the merchant's display-formatted rendering when it differs from the raw value ("Up to 30 h (ANC on)" where `value` is `30` `HUR`). Omitted when the raw value renders acceptably; most rows need only `value` and `unitCode`. [why](product-notes.md#why-pagefrontpresentationvalue-exists)

```json
"pagefront:featureGroup": [
  {
    "@type": "pagefront:FeatureGroup",
    "name": "Battery",
    "sortOrder": 2,
    "feature": [
      {
        "@type": "PropertyValue",
        "propertyID": "battery_life",
        "name": "Battery life",
        "value": 30,
        "unitCode": "HUR",
        "pagefront:presentationValue": "Up to 30 h (ANC on)"
      }
    ]
  }
]
```

### Product highlights

- **`pagefront:productHighlights`**: the merchant's own ranked statement of what matters about the product, as rendered in the page's highlight bullets. MAY be carried. An ordered array of short strings, each one selling point in the sheet's `inLanguage`, a phrase or a sentence; the order is part of the value (the term is `@container: @list` in the JSON-LD context). Publisher-authored only: bullets summarized from the description, extracted by a pipeline or produced by a model are excluded. 3 to 10 entries are recommended. Check: PDP-W-022 (empty or whitespace-only entry). [why](product-notes.md#why-product-highlights-are-minted-and-ordered)

### Documents

- **`pagefront:document`**: typed product documents, as an array of `pagefront:Document`. MAY be carried. Where a `compatibility` document's compatible products are identifiable, publishers SHOULD also emit `pagefront:relatedProduct` entries with `relationship: compatible_with`; the document links the artifact and does not replace the relationships. Check: PDP-W-026 (a `safety_data_sheet` without `inLanguage`).
  - `@type: pagefront:Document` *(required)*.
  - `url` *(required)*: the direct URL of the document, typically a PDF.
  - `role` *(required)*: one of the closed enumeration below; additional values require a spec amendment. A category-specific need (`dental_imaging_protocol` for a medical device) takes the closest value, with the specifics in `name` and `description`.
  - `name` *(recommended)*: the document's title.
  - `inLanguage` *(recommended)*: a BCP 47 tag. MAY differ from the sheet's `inLanguage` when the document is multilingual or published in another language, as safety data sheets and certification PDFs often are.
  - `description` *(optional)*: what the document contains.
  - `encodingFormat` *(optional)*: the MIME type; `application/pdf` when omitted.

Roles: [why](product-notes.md#why-the-document-roles-are-cut-where-they-are)

- **`manual`**: the full product manual. **`user_guide`**: a shorter, task-oriented user-facing guide. **`quick_start`**: a quick-start or getting-started card.
- **`assembly`**: assembly instructions. **`installation_guide`**: installation instructions distinct from assembly. **`care_guide`**: care and maintenance instructions.
- **`spec_sheet`**: the product's own technical specifications. **`compatibility`**: the products, systems or standards the product works with.
- **`warranty`**: the warranty terms document (a stated warranty is `warranty` on the Offer or `pagefront:manufacturerWarranty`; see "Warranty").
- **`certificate`**: a certification document issued by a third party (authenticity, compliance). **`declaration_of_conformity`**: the manufacturer's self-issued EU Declaration of Conformity underlying CE marking. **`environmental_declaration`**: a standardized environmental product declaration (a Type III EPD, a PEP ecopassport). **`repairability_index`**: a regulation-driven repairability score document (the French *indice de réparabilité* label, the EU labels); the document carries the score, and a structured score field is not modeled. [notes](product-notes.md#new-design-questions-surfaced-in-v08)
- **`audit_report`**: a third-party audit report. **`lab_test`**: laboratory test results. **`safety_data_sheet`**: an SDS, typically for chemical or hazardous-material products.
- **`recall_notice`**: the human-readable recall or safety-notice artifact. Where a corrective measure applies, publishers SHOULD also emit the structured `pagefront:safetyNotice` (see "Safety notices"); the document does not replace it.
- **`brochure`**: a marketing or sales brochure, a promotional overview, never an authoritative technical source.

### Energy efficiency

- **`hasEnergyConsumptionDetails`** on the `Product`: the efficiency class of a product regulated under the EU energy-labelling framework (Regulation (EU) 2017/1369: major appliances, light sources, electronic displays and similar), as Schema.org's `EnergyConsumptionDetails`; no `pagefront:` term is minted. SHOULD be present whenever the class is known, whether or not the label graphic is published.
  - `hasEnergyEfficiencyCategory`: a canonical `EUEnergyEfficiencyEnumeration` URI: `https://schema.org/EUEnergyEfficiencyCategoryA` through `EUEnergyEfficiencyCategoryG` for the rescaled label, or `EUEnergyEfficiencyCategoryA1Plus` (A+), `EUEnergyEfficiencyCategoryA2Plus` (A++), `EUEnergyEfficiencyCategoryA3Plus` (A+++) for categories still labelled under the older scale.
  - `energyEfficiencyScaleMax`, `energyEfficiencyScaleMin` *(optional)*: the most and least efficient classes on the label, when it runs on a sub-scale, so consumers can position the class within the label it appears on.
- **The label graphic** (the colored-arrow artwork) is an artifact: MAY ride in `image` like any product image, or as a `pagefront:document` with `role: "certificate"` when the merchant publishes it as a download.

For the legal entities behind a regulated product (the GPSR responsible person, the importer of record), see "Legal entities".

### Legal entities

- **`pagefront:legalEntity`**: the legal entities behind a product and their roles: the responsible economic operator the EU General Product Safety Regulation (GPSR) requires for products sold into the EU, the licensee of licensed goods, the importer. MAY be carried, as an array of `pagefront:LegalEntity`. Schema.org's `manufacturer` stays valid beside it; when both are present and an entry has `role: "manufacturer"`, the two SHOULD name the same organization. [why](product-notes.md#why-legal-entities-are-role-typed)
  - `@type: pagefront:LegalEntity` *(required)*.
  - `role` *(required)*: `brand_owner` (the entity owning the brand the product is sold under), `licensee` (manufacturing or marketing the product under license from the brand owner), `authorized_representative` (formally appointed to act for the manufacturer in a jurisdiction; the GPSR responsible person), `importer` (placing the product on the market it was imported into), `manufacturer` (the entity that manufactured the product).
  - `organization` *(required)*: a Schema.org `Organization` with `name` required and `address` (a `PostalAddress`), `url` and `email` optional. Producers SHOULD populate the address when the page or its legal notices carry one. When the organization has its own Commerce Organization Sheet, the entry SHOULD use the reference form instead ("Referencing a Commerce Organization Sheet"). Check: PDP-W-024 (no postal address on an inline entry).

#### Referencing a Commerce Organization Sheet

- **`organization` as a reference stub**: when the entity has its own Commerce Organization Sheet ([`organization.md`](organization.md)), typically the `brand_owner` and sometimes the `manufacturer`, the Product Sheet SHOULD express it as `@type`, `@id` and `pagefront:sheetUrl`, with no inline name and address. The `@id` resolves as for `Product.brand` and `Offer.seller`, by exact-string match ("Product identity and deduplication"); `pagefront:sheetUrl` is a traversal hint that MAY be stale ("Traversal hints" in Pagefront Discovery), followed under the linking contract in [`organization.md`](organization.md#linking-contract-identity-only). A `brand_owner` or `manufacturer` stub SHOULD resolve to a sheet declaring the matching `pagefront:commerceRole`. The stub-versus-inline distinction (PDP-E-001 / PDP-W-020) applies to it unchanged, and it is exempt from PDP-W-024. [why](product-notes.md#why-the-reference-form-does-not-replace-the-inline-form)
- **`organization` inline**, with `name` and `address`: a third party with no sheet, or an entity that varies by product or market; an `authorized_representative` or `importer` is the typical case.

```json
{
  "@type": "pagefront:LegalEntity",
  "role": "brand_owner",
  "organization": {
    "@type": "Organization",
    "@id": "https://merchant.com/#org",
    "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/organization/merchant.en.json"
  }
}
```

### Safety warnings

- **`pagefront:safetyWarning`**: the product's safety warnings, the ones GPSR (Reg. 2023/988) Art. 19 requires distance-selling listings to display and their equivalents elsewhere. MAY be carried, as an array of `pagefront:SafetyWarning`. The `age_warning` `additionalProperty` convention ("Age suitability") stays valid for the age case; this field is the general, typed form. Producers SHOULD emit each warning verbatim as the page shows it. Warnings are in the sheet's `inLanguage`; a producer publishing into several EU markets publishes the warning in each language sheet. [why](product-notes.md#why-safety-warnings-are-verbatim-and-per-language)
  - `@type: pagefront:SafetyWarning` *(required)*.
  - `text` *(required)*: the warning, as written.
  - `pictogram` *(optional)*: the URL of the pictogram shown with the warning.
  - `hazardCategory` *(optional)*: the hazard class, an open vocabulary: `choking_hazard`, `suffocation`, `fire`, `electrical`, `chemical`, `entanglement` are common values. Consumers SHOULD treat unknown values as opaque categories without rejecting them.

### Safety notices

- **`pagefront:safetyNotice`**: a corrective measure the product is subject to, a recall or a formal safety warning under GPSR Arts. 35 to 37 or an equivalent regime. Present only on such a product, as an array of `pagefront:SafetyNotice`; a recalled product is a different fact from a discontinued one. A `recall` notice overrides commercial signals: consumers SHOULD NOT recommend the product for purchase while it is present and SHOULD surface the notice and its remedy to a user who owns or is considering the product. The `recall_notice` document role links the human-readable artifact ("Documents"); the structured notice is what consumers act on. Check: PDP-W-023 (a `recall` notice beside an `InStock` offer). [why](product-notes.md#why-safety-notices-are-a-field-of-their-own)
  - `@type: pagefront:SafetyNotice` *(required)*.
  - `noticeType` *(required)*: `recall` (owners should stop using the product and pursue the remedy) or `warning` (a formal safety warning short of a recall: a usage restriction, a corrective instruction).
  - `hazard` *(optional)*: the hazard, as text.
  - `remedy` *(optional)*: `repair`, `replacement` or `refund`, the set GPSR Art. 37 obliges the recalling operator to offer.
  - `description` *(optional)*: detail on the remedy or the instructions to follow.
  - `reference` *(optional)*: the URL of the official alert (the EU Safety Gate entry).
  - `datePublished` *(optional)*: the ISO 8601 date the notice was published.
  - `url` *(optional)*: the publisher's own notice page.

### Related products

- **`pagefront:relatedProduct`**: typed relationships between products, in a closed enumeration a consumer acts on. MAY be carried, as an array of `pagefront:RelatedProduct`. Schema.org's `isRelatedTo`, `isSimilarTo`, `isAccessoryOrSparePartFor` and `isConsumableFor` stay valid for the untyped cases; "Five patterns for product-to-product relationships" says which field a page's surface maps to. Weighted relationships (a co-purchase percentage) are not modeled. [why](product-notes.md#why-related-products-are-typed) [notes](product-notes.md#new-design-questions-surfaced-in-v07) A product the page shows as related, recommended or recently viewed is at most the target of a relationship and is never written as this product.
  - `@type: pagefront:RelatedProduct` *(required)*.
  - `relationship` *(required)*: one of the values below; additional values require a spec amendment.
  - A target identifier *(required)*: `@id` of the target's own Pagefront Sheet (preferred for same-publisher products), or a Schema.org identifier on the target, `sku`, `gtin`, `gtin13` or `mpn` (cross-merchant or unpublished targets). See "The structured-identifier requirement".
  - `name` *(recommended)*: the related product's name. `url` *(recommended)*: its canonical page.
  - `image` *(optional)*: one image URL for rendering the reference without dereferencing, the target's hero or packshot. A render convenience that may be stale; consumers needing current or role-specific imagery dereference the target Sheet through `@id` or `url`. A Schema.org `Product` reference in `isRelatedTo`, `isSimilarTo` or `hasPart` carries the same hint through its own `image`. [why](product-notes.md#why-image-on-a-related-product-mirrors-schemaorgs)

Relationship values:

- **`accessory`**: an optional add-on (a lens cap for a camera, a strap for a watch).
- **`consumable`**: a consumable required for ongoing use (ink for a printer, a filter for a coffee machine).
- **`required_part`**: a part required for the product to function at all (a battery sold separately).
- **`spare_part`**: a replacement for a component the product already has, ordered when the original wears out or fails.
- **`often_bought_with`**: frequently purchased together, a co-purchase pattern the publisher has identified.
- **`recommended_with`**: a complementary pairing curated by the publisher, products intended to go together (the strap with the watch, the top with the pants, the necklace with the earrings). A generic "You may also like" surface, where the publisher asserts no complementarity, is `isRelatedTo` without `description` (Pattern 5).
- **`replaces`**: the current product replaces the named older product. **`replaced_by`**: the named newer product supersedes it.
- **`bundle_component`**: ships with the product being described, as part of a published bundle ("Bundles").
- **`compatible_with`**: compatible with the named product (a sleeve sized for a specific laptop model).
- **`service`**: a purchasable service the merchant sells against this product: installation, an extended warranty, a maintenance plan. The terms of a warranty included with the product are a `pagefront:document` with `role: "warranty"`.

#### Operationally-tracked vs. marketing-curated relationships

`accessory`, `consumable`, `required_part`, `spare_part`, `replaces`, `replaced_by`, `bundle_component`, `compatible_with` and `service` are operationally tracked: business operations the publisher maintains whatever its catalog size. `often_bought_with` and `recommended_with` are marketing-declared. [why](product-notes.md#why-typed-relationships-divide-along-operational-and-marketing-lines)

- Producers SHOULD use a typed value for a relationship the publisher has declared itself: operational data, or a hand-curated marketing pairing.
- Producers SHOULD NOT coerce recommendation-engine output into a typed value, even when the engine claims co-purchase data or the page shows it under a "Recommended" heading; it goes to `isRelatedTo` (Pattern 5) unless the publisher has reviewed and endorsed specific pairings.
- A rule the publisher defines ("show all watch straps for any watch") is a declaration at the rule level only: producers SHOULD treat each pairing the rule generates as `isRelatedTo`, since no specific pairing was individually curated.
- `often_bought_with` takes a co-purchase pattern the publisher has explicitly identified, as a merchandising rule or a manual "frequently bought together" curation. `recommended_with` takes a pairing an editor curated in the content management system.
- A rule the publisher defined ("show all watch straps for any watch") declares the rule, and the pairings it generates are `isRelatedTo`, since no specific pairing was curated.

#### The structured-identifier requirement

Each `pagefront:relatedProduct` entry carries at least one structured identifier: `@id` (URL-shaped), `sku`, `gtin`, `gtin13` or `mpn`. The JSON Schema enforces this with `anyOf`; a reference with only `name` and `url` does not validate as a `pagefront:relatedProduct` entry and is emitted as Schema.org `isRelatedTo`, which has no identifier requirement, even when the publisher curated it. A producer uses `pagefront:relatedProduct` only when the relationship is publisher-typed and the source data carries a structured identifier; if either fails, the reference belongs in `isRelatedTo`. Check: PDP-W-019 (an identifier that is present but empty, whitespace-only or not dereferenceable). [why](product-notes.md#why-a-typed-relationship-needs-a-structured-identifier)

#### Five patterns for product-to-product relationships

A product page's relationship surfaces map to five fields, by what the publisher communicates; several coexist on one `Product`. [why](product-notes.md#how-the-five-relationship-patterns-map-a-product-page)

1. **`pagefront:relatedProduct` with a typed value**: an operationally tracked relationship the merchant's data declares explicitly, where the type changes consumer behavior.
2. **`isSimilarTo`**: products the publisher asserts are of the same kind, use case or category: "similar styles", "alternatives", substitutes for the product.
3. **`isPartOf` and `hasPart`**: membership in a named family or collection, the family being an entity of its own, a `Collection` (a curated grouping of distinct products) or a `ProductGroup` (when the members are variants of one product) with `name`, `url` and `hasPart` listing the siblings. A family-to-series-to-product hierarchy nests `isPartOf` as deep as the catalog goes; a Sheet MAY declare only the immediate series and MAY nest further. Where the publisher emits Commerce Collection Sheets ([`collection.md`](collection.md)), the product's `isPartOf` entry references the set in the member entry shape and nests no `isPartOf` of its own; the inline nesting stays valid without collection sheets.
4. **`isRelatedTo` with `description`**: an adjacency the publisher frames with prose that carries meaning ("More in this color"); the `description` on each `Product` reference preserves the framing.
5. **`isRelatedTo` without `description`**: pure adjacency, recommendation-engine output under a generic heading ("You may also like", "Customers also viewed").

#### Bundles

- **Bundle as relationship**: separately sold products bundled with the product being described. Each is a `pagefront:relatedProduct` with `relationship: bundle_component` and a structured identifier. `bundle_component` is reserved for components that ship with the described product; a separately sold bundle another Sheet links to is referenced as `recommended_with` or `accessory`. [why](product-notes.md#why-a-bundle-is-a-relationship-or-a-product)
- **Bundle as product**: a bundle that is itself a sellable entity, with its own name, price and page. It is a Schema.org `ProductCollection` in its own Sheet, with `includesObject` listing `TypeAndQuantityNode` entries (`amountOfThisGood`, `typeOfGood`) for the components and an `Offer` for the bundle's price. It does not go in the relationship fields.
- **A component without an identifier**: a bundled component the page names and prices but exposes no link or SKU for, and that the producer cannot resolve through a catalog lookup, platform API or sitemap, cannot be a `bundle_component`. It stays in the Sheet as a Schema.org `hasPart` entry with its `name`, and its price through `additionalProperty` or an embedded `Offer` when the page shows one.

```json
{
  "@type": "ProductCollection",
  "name": "Kayak Conversion Bundle",
  "includesObject": [
    {
      "@type": "TypeAndQuantityNode",
      "amountOfThisGood": 1,
      "typeOfGood": { "@type": "Product", "name": "Paddle Board", "url": "https://merchant.com/products/paddle-board" }
    }
  ],
  "offers": [ { "@type": "Offer", "price": "845.00", "priceCurrency": "USD" } ]
}
```

### Offers

An Offer in `offers`: what a shopper in one market is offered. One Offer per variant on a ProductGroup, each naming its variant; one Offer on a Product. Every value is what the merchant states, on its page or through its platform ("Merchant statements"), and each entry below says which source the field takes where it matters: `price` and `availability` are read from the page. A value the merchant does not state is left out. An offer without a price is a price-on-request offer ("Price-on-request offers") or an unavailable one ("Unavailable offers without a price" under "Tax inclusion").

- **`url`**: the page on which this offer is bought ("Where to buy").
- **`price`**: the displayed consumer price for the offer's declared region: the unit amount a consumer there is shown and pays for the item itself, in `priceCurrency`, at `generated_at`. Includes value-added tax where the region's law requires displayed prices to include it; excludes sales tax where prices are displayed before tax added at checkout; always excludes shipping (`shippingDetails`, or the seller sheet's `pagefront:fulfillmentTerms`). Source: the price rendered on the product page, under "Source of the price" in "Tax inclusion"; a producer MUST NOT publish an amount the consumer is never shown. A JSON number or a decimal string, one carrier per sheet ("Amounts"). The tax basis is stated only where the merchant states it ("Tax inclusion"). A former price, a range and quantity tiers: "Common pricing patterns". Checks: PDP-W-028 (no basis stated), PDP-W-029 (no region declared). [why](product-notes.md#why-price-is-the-displayed-consumer-price)
- **`priceCurrency`**: the ISO 4217 code of `price`. Source: the code the page states for the price, or the platform's data where the page shows a symbol alone, since a symbol names no currency ("Merchant statements"). Check: PDP-W-004 (price without currency).
- **`availability`**: a Schema.org URI: `InStock`, `OutOfStock`, `SoldOut`, `Discontinued`, `PreOrder`, `BackOrder`, `MadeToOrder`, `LimitedAvailability`, `InStoreOnly`. Source: as the page shows it; the merchant's structured data and a platform-served stock signal check it and are never its source ("Merchant statements"). `https://schema.org/` is canonical; the `http://` form is accepted and consumers SHOULD treat the two as equivalent. Check: PDP-W-013 (legacy `http` form). [why](product-notes.md#why-both-schemaorg-schemes-are-accepted)
- **`itemCondition`**: a Schema.org URI such as `NewCondition` or `UsedCondition`, in either scheme form. Source: the page.
- **`seller`**: the organization selling: `@id`, `name`, `url`, and `pagefront:sheetUrl` to its Commerce Organization Sheet on this sheet's host, under the linking contract in [`organization.md`](organization.md#linking-contract-identity-only). Returns and shipping the Offer does not state are read from that sheet ("Return policy").
- **`areaServed` or `eligibleRegion`**: the market the price is for. Source: only where the merchant states it ("Merchant statements"): text on the page, its terms of sale, its structured data, or a store setting its platform exposes; never inferred from the URL, the domain, the currency, the market or the seller's country. A statement that the shop ships everywhere names destinations and no market for the price: `areaServed` is left out. Required before a checkout template. Check: PDP-W-029.
- **`acceptedPaymentMethod`**: as the page states.

The subsections below define the rest: `hasMerchantReturnPolicy` and `shippingDetails` ("Return policy"), `warranty`, `availableDeliveryMethod` and `availableAtOrFrom` ("Delivery"), `checkoutPageURLTemplate` ("Where to buy"), `itemOffered`, `pagefront:priceOnRequest`, and `priceSpecification` for the tax basis, a former price and quantity tiers ("Common pricing patterns").

#### Return policy

Store-wide return and shipping terms live on the seller's Commerce Organization Sheet ([`organization.md`](organization.md)), stated once: `hasMerchantReturnPolicy` on its seller block, and `pagefront:fulfillmentTerms`, an array of `OfferShippingDetails`. [why](product-notes.md#why-returns-and-shipping-default-to-the-seller-sheet)

- **`hasMerchantReturnPolicy`** on the Offer: a `MerchantReturnPolicy`, as the page states it, only when the product deviates from the store default (a final-sale item). A made-to-order product's returns exceptions live in `pagefront:madeToOrderTerms` and stay there.
- **`shippingDetails`** on the Offer: an `OfferShippingDetails` ("Shipping cost declared alongside price"), only when the product deviates from the seller's `pagefront:fulfillmentTerms` (its own shipping rates, its own lead time).

**Reading the terms.** A consumer reads the Offer's own terms if present. Otherwise it follows `Offer.seller` to the seller sheet, located by `pagefront:sheetUrl` and resolved per the linking contract in [`organization.md`](organization.md#linking-contract-identity-only), on the product sheet's own host, and uses its store-wide terms. Terms are inherited only from that sheet. When it cannot be resolved (no `pagefront:sheetUrl`, a failed host check, an `@id` or role mismatch), the terms are unknown, and a consumer draws no conclusion from the product's silence. The read covers return and shipping terms only; it does NOT generalize to other fields.

A warranty is a separate matter from returns: see "Warranty".

#### Warranty

A warranty the page **states** ("2-year warranty") is a `WarrantyPromise`. A warranty **document** (the terms as a file) is a `pagefront:document` entry with `role: "warranty"` ("Documents"). A page may carry both.

- **`warranty`** on the Offer: a warranty given by the seller, as Schema.org's `warranty`. Also where a warranty statement goes when the page does not say who gives it.
- **`pagefront:manufacturerWarranty`** on the Product: a warranty the page attributes to the manufacturer, only when the page names the manufacturer as the guarantor. A retailer's sheet may carry both. [why](product-notes.md#why-a-warranty-goes-where-the-guarantor-is)
- **Shape**, a `WarrantyPromise`:
  - `durationOfWarranty`: a `QuantitativeValue` with `value` and a UN/CEFACT `unitCode` (`ANN` years, `MON` months, `DAY` days), when a finite length is stated. A lifetime warranty omits it and carries the statement in `description`; never encode "lifetime" as a large number.
  - `description`: the statement as written on the page.
  - `name` *(optional)*: a short label ("Lifetime Warranty").
  - `warrantyScope` *(optional)*: Schema.org's scope of the promise, where the page states one.
- **Several region-scoped Offers**: each carries its own `warranty`, identical where the warranty is the same across markets.
- **Commercial warranty only**: the promise as the page states it. Producers MUST NOT synthesize a warranty from a statutory minimum (a legal conformity guarantee) when the page states none.
- **Paid extended warranties** ("add 3-year protection for €49") are a distinct product with its own price: a `service` relationship ("Related products"), never `warranty`.

Check: PDP-W-030 (a `warranty` or `pagefront:manufacturerWarranty` with neither `durationOfWarranty` nor `description`).

#### Trust strips

A strip of commitments on the page ("2-year warranty · 30-day returns · free delivery") is split, never stored as one string: the warranty to `warranty` or `pagefront:manufacturerWarranty` ("Warranty"); returns to `hasMerchantReturnPolicy` or the seller default ("Return policy"); delivery cost, destination and timing to `shippingDetails` or the seller's `pagefront:fulfillmentTerms`; delivery modes to `availableDeliveryMethod` ("Delivery"). A fact none of these can hold stays in the product's prose.

#### Delivery

- **`shippingDetails`**: delivery cost, destination and timing, as Schema.org's `OfferShippingDetails` (`shippingDestination`, `shippingRate`, `deliveryTime` with handling and transit time); only where the product deviates from the seller's terms ("Return policy").
- **`availableDeliveryMethod`**: the delivery modes the page states, as `DeliveryMethod` URIs: `https://schema.org/ParcelService`, `https://schema.org/OnSitePickup` (click-and-collect, in-store pickup), `https://schema.org/LockerDelivery`. Modes are never approximated in `shippingDetails`.
- **`availableAtOrFrom`**: a pickup location, as a `Place`. [why](product-notes.md#why-delivery-modes-stay-apart-from-shipping-details)

#### Where to buy

- **`url`**: the page on which the shopper buys this offer: the product page, or the variant's page for a variant offer ("Per-variant URLs"). An absolute URL. Absent, the offer is bought on the data block's `url`. A sheet with more than one Offer SHOULD give each its `url`. Checks: PDP-E-021 (not absolute), PDP-W-040 (absent on a sheet with several Offers).
- **`checkoutPageURLTemplate`** *(optional)*: an RFC 6570 URL template that takes the shopper to the merchant's checkout for this offer; cart, payment and order confirmation happen on the merchant's site. Its only variable is `quantity`, a positive integer; a template with no variable checks out one unit. Expanded with `quantity` set to 1, it MUST yield an absolute `https` URL. Source: only where the merchant states it ("Merchant statements"): its own structured data on the page; a checkout-link feature it has enabled on its platform; a checkout address its storefront serves through a platform protocol the merchant has enabled or accepted, including one the platform turns on by default. A producer MUST NOT construct one from a platform's URL pattern, from a pattern seen on other merchants' sites or in a platform's documentation, or from any pattern the merchant has not stated through one of these sources. Region: each region-scoped Offer carries the template for its own market; an Offer without `areaServed` or `eligibleRegion` MUST NOT carry one. Checks: PDP-E-019 (invalid RFC 6570, an undefined variable, or no absolute `https` expansion), PDP-E-020 (no region), PDP-E-022 (on an unavailable offer). [why](product-notes.md#why-checkout-is-a-one-variable-template)

```json
"checkoutPageURLTemplate": "https://merchant.com/cart/4521:{quantity}"
```

**Consumers.** A checkout template is a hand-off to the shopper and following it can create a cart. Consumers MUST NOT follow it to complete a purchase without the shopper's confirmation, and MUST fill `quantity` with the quantity the shopper chose. Programmatic purchase (Schema.org's `potentialAction` with a `BuyAction`) is a transaction protocol Pagefront does not specify; an Offer may carry it under that protocol's terms. A page that sells nothing has no Offer and no checkout.

#### itemOffered references

- **`itemOffered`**: on a sheet with several Offers (a `ProductGroup` with variants in `hasVariant`), each Offer SHOULD reference its variant as `{ "@id": "..." }`, resolving to a `hasVariant` entry or to the root product `@id`. MAY be omitted on a single-Offer sheet whose item is the root product. Check: PDP-E-001 (broken `@id` reference). [why](product-notes.md#why-itemoffered-may-be-omitted-on-a-single-offer)

#### Product identity and deduplication

- **`@id` is the identity key.** Two references carrying the same `@id` denote the same product; consumers deduplicate on `@id`.
- **Matching is exact-string.** `@id` values are compared without normalization: a locale prefix, a trailing slash, a query parameter or a `?variant=` suffix makes two strings different `@id`s. Producers MUST emit the identical `@id` string for a product everywhere it appears, in its own Sheet and in every reference to it from other Sheets. The derivation rule is the producer's (from the canonical URL, from a SKU, or otherwise), as long as it is stable and deterministic and the same product always yields the same string. [why](product-notes.md#why-id-is-matched-as-an-exact-string)
- **Secondary-identifier fallback.** A reference whose `@id` cannot be made consistent SHOULD carry a stable secondary identifier (`sku`, `gtin`, `gtin13`, `mpn` or `productID`). Consumers SHOULD deduplicate on `@id` when present and consistent, and fall back to these identifiers otherwise; with an array of GTINs ("Multiple GTINs"), a match on any listed GTIN is a valid match.

##### Cross-merchant canonical reference via `sameAs`

- **`sameAs`** on a reseller's Sheet: the brand's canonical page for the same product. SHOULD be carried where the brand publishes one. A deduplication hint only: consumers MAY use a shared `sameAs` target as an additional correlation signal when clustering cross-merchant listings; a shared target does not merge two products whose identifiers differ, and a missing or divergent `sameAs` does not break an `@id` or identifier match. [why](product-notes.md#why-sameas-is-a-hint)

#### Price-on-request offers

- **`pagefront:priceOnRequest`** on the Offer: SHOULD be declared when the merchant intentionally publishes no price. The Offer is then exempt from the otherwise-required `price` or `priceSpecification`; every other Offer field applies, and `priceCurrency` stays useful as the currency the eventual price will be quoted in. A `pagefront:PriceOnRequest` object: [why](product-notes.md#why-some-merchants-publish-no-price)
  - `method` *(required)*: `authorized_retailer` (the merchant routes buyers to brand-authorized retailers), `dealer_network` (regional dealer coverage, industrial and commercial products), `quote_form` (a structured intake form that produces a quote), `email`, `phone` (the merchant directs buyers to an address or a number for pricing), `unspecified` (no structured inquiry channel). Additional values require a spec amendment.
  - `contactUrl`, `contactEmail`, `contactPhone` *(optional)*: the channel the method names: `contactUrl` for `authorized_retailer`, `dealer_network` and `quote_form`, `contactEmail` for `email`, `contactPhone` for `phone`.
  - `note` *(optional)*: free-text guidance shown to consumers.

Checks: PDP-W-015 (a method other than `unspecified` with no contact channel), PDP-W-016 (an Offer with `availability` and `priceCurrency` but neither a price nor `pagefront:priceOnRequest`; silent on an unavailable offer without a price).

Made-to-order products: `pagefront:madeToOrderTerms`. Configurable products: `pagefront:configurator`, with the prices on the offer in `pagefront:configuratorPricing` ("Configurator pricing and price bands"). Site-level promotions: `pagefront:promotions` on each Offer.

#### Common pricing patterns

Sale prices, ranges, quantity tiers and shipping beside the price use Schema.org's own vocabulary; Pagefront mints nothing for them. [why](product-notes.md#why-pricing-patterns-mint-no-vocabulary)

##### Amounts

- **An amount** is a JSON number (`2299`, `2299.5`) or a decimal string (`"2299.00"`: a dot as decimal point, no thousands separator, no currency symbol). The currency is always stated beside it, in `priceCurrency` or `currency`. A decimal string is recommended when amounts have fractional parts; whole amounts lose nothing as numbers. [why](product-notes.md#why-a-decimal-string-is-recommended-for-fractional-amounts)
- **One carrier per Sheet**, across every amount: `price` on an Offer and on a `priceSpecification` entry, `lowPrice` and `highPrice` on an `AggregateOffer`, the `value` of every `MonetaryAmount` (shipping rates, order-value thresholds), `price` render hints on `hasVariant` entries, `discountAmount` on a promotion, and `basePrice`, every modifier and every adjustment's `priceModifier` in a `pagefront:configuratorPricing` block. Check: PDP-E-015 (numbers and strings mixed).
- **Sign.** Prices are zero or positive: an Offer's `price`, the bounds of an `AggregateOffer`, a `basePrice`, a variant's price hint and a `discountAmount` take no leading minus. Only modifiers and adjustment amounts are signed.
- **Comparison** is numeric whatever the carrier: `349`, `349.0` and `"349.00"` are the same amount.

##### Sale pricing (regular price plus current discounted price)

- **`priceSpecification`** on the Offer, two `UnitPriceSpecification` entries distinguished by `priceType`: `https://schema.org/ListPrice` for the regular price and `https://schema.org/SalePrice` for the current price. The Offer's `price` SHOULD mirror the `SalePrice`.

```json
"price": "149.00",
"priceSpecification": [
  { "@type": "UnitPriceSpecification", "priceType": "https://schema.org/ListPrice", "price": "199.00", "priceCurrency": "EUR" },
  { "@type": "UnitPriceSpecification", "priceType": "https://schema.org/SalePrice", "price": "149.00", "priceCurrency": "EUR" }
]
```

##### Tax inclusion

- **`valueAddedTaxIncluded`**: whether `price` includes value-added tax, on a `UnitPriceSpecification` entry in `priceSpecification`. Producers SHOULD state it. An Offer with `priceSpecification` entries sets the flag on each; an Offer with only `price` adds one entry mirroring it (`price`, `priceCurrency`, the flag). A plain `PriceSpecification` entry may carry it; an `AggregateOffer` carries it on an entry with no `price` to mirror. `false` is the statement for a trade or B2B sheet quoting net prices, and for regions whose displayed prices exclude sales tax. The flag is a statement about `price`: consumers do not compute tax from it or derive one amount from the other. Absent, consumers read `price` as the displayed consumer price without knowing whether tax is included. Checks: PDP-W-028 (absent), PDP-E-004 (a mirroring entry's `price` disagrees with the Offer's `price`; the Offer's `price` is authoritative). [why](product-notes.md#why-the-tax-basis-belongs-to-the-offer-and-its-region) [why](product-notes.md#why-unitpricespecification-carries-the-flag)

**Source of the price.** `price` is the price rendered on the merchant's product page, the amount the shopper pays for the item as presented. When a sale is shown, `price` is the sale price and the crossed-out price is the regular price ("Sale pricing"). `price` is the full price of the item: an instalment, a per-unit amount, a "from" amount and the range a variant family shows before a variant is chosen are never published as `price`. Where the price appears only after scripts run, the producer renders the page as a browser does; without the rendered price it publishes no offer. The merchant's structured data and a platform-served amount, from a feed, an API or a commerce protocol, are merchant statements ("Merchant statements") and never source `price`; they only check it. Where a structured-data price for the same offer differs from the rendered price, the producer does not publish the offer and SHOULD surface the discrepancy to the merchant or route the offer to review; a rendered price is published only when it agrees with the structured-data price, or when the page carries none.

**Source of the VAT basis.** `valueAddedTaxIncluded` is set only when the merchant states the basis: text on the page, next to the price or applying to the page's prices ("TTC", "incl. VAT"); a statement in the merchant's terms of sale covering the prices on its product pages; the VAT flag in the merchant's own structured data; or the store's tax-display setting, where the platform exposes it; each a merchant statement ("Merchant statements"). Producers MUST NOT infer the basis from the URL, the domain, the currency, the market or the seller's country. When the merchant does not state it, the price is published without the flag. A rendered price is the price for the market the page was served for, and a region is declared only where the merchant states it, under the same rule.

**When a price cannot be published.** A sheet without an offer is a valid state. An unstated VAT basis never withholds the offer; it is published without the flag. [why](product-notes.md#why-a-sheet-may-carry-no-offer)

**Unavailable offers without a price.** An offer the page shows as unavailable with no price is published without one: `availability` is `https://schema.org/OutOfStock`, `https://schema.org/SoldOut` or `https://schema.org/Discontinued`, and `price`, `priceCurrency` and `priceSpecification` are absent; a consumer reads it as not purchasable now, at no stated price. Where the page shows a price for an unavailable offer, the offer carries it. Availability comes from the page, as the price does; structured data checks it and never sources it, and a price the page shows is never dropped because structured data says the item is unavailable. Only these three values allow a priceless offer; `PreOrder`, `BackOrder`, `MadeToOrder`, `LimitedAvailability`, `InStoreOnly` and `InStock` describe an item that can be bought, and need a price. The offer keeps `url`, `itemOffered` and `areaServed` (SHOULD still be declared, since availability is per market) and MUST NOT carry `checkoutPageURLTemplate` (PDP-E-022). PDP-W-016 is silent on it.

**Prices that cannot state a basis.** `hasVariant[].price` render hints carry no region and no `priceSpecification`, so they cannot state a tax basis; they are display hints, and consumers MUST NOT use them for computation or for quoting a price, and MUST resolve the region-matched `Offer` for an authoritative amount. A `pagefront:configurator` carries no prices; the amounts in a `pagefront:configuratorPricing` block sit inside an offer and take their currency, region and tax basis from it. An `AggregateOffer` is an offer and carries its own `areaServed` and `priceSpecification`.

Sheets carrying region-scoped offers SHOULD use shorter `expires_at` windows, as for multi-currency offers and scheduled promotions, since a VAT-inclusive price depends on a rate that can change.

##### Price ranges (product available across a range of prices)

- **`AggregateOffer`** at the Offer position, with `lowPrice`, `highPrice` and `priceCurrency`: a product available across a span of prices (a `ProductGroup` listing whose variant prices are not broken out, or size- or material-based pricing tiers).

##### Quantity-tier pricing (different prices at different quantity breakpoints)

- **`priceSpecification`** on the Offer, one `PriceSpecification` entry per tier, each with its `price`, `priceCurrency` and an `eligibleQuantity`: a `QuantitativeValue` with `minValue` and, for all but the open-ended last tier, `maxValue`.

##### Shipping cost declared alongside price

- **`shippingDetails`** on the Offer: an `OfferShippingDetails` with `shippingRate` (a `MonetaryAmount`) and `deliveryTime` (a `ShippingDeliveryTime`). Shipping is independent from `price`; consumers sum the two for the total. The per-offer form is the deviation override; the store-wide default lives on the seller sheet ("Return policy").

```json
"shippingDetails": {
  "@type": "OfferShippingDetails",
  "shippingRate": { "@type": "MonetaryAmount", "value": "9.50", "currency": "EUR" },
  "deliveryTime": {
    "@type": "ShippingDeliveryTime",
    "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" },
    "transitTime": { "@type": "QuantitativeValue", "minValue": 3, "maxValue": 5, "unitCode": "DAY" }
  }
}
```

#### Product lifecycle

Schema.org and the relationship enum carry the lifecycle; Pagefront mints nothing for it. [why](product-notes.md#why-a-discontinued-product-keeps-its-sheet)

- **`releaseDate`** on the Product: when the product reached, or will reach, the market. A future `releaseDate` pairs with Offer `availability: "https://schema.org/PreOrder"`.
- **End of life**: the Offer's `availability` is `https://schema.org/Discontinued`, and the Sheet stays published. The offer carries a price only if the page shows one ("Unavailable offers without a price").
- **Succession**: a discontinued product's Sheet SHOULD pair `Discontinued` with a `pagefront:relatedProduct` entry of `relationship: "replaced_by"` pointing at the successor; the successor's Sheet carries the inverse `replaces` entry.

### Project extensions (pagefront: namespace)

The full set; the vocabulary document defines each term's fields.

- `pagefront:sizeChart`: structured size charts for apparel.
- `pagefront:materialComposition`: decomposed materials with optional purity, provenance, weight.
- `pagefront:manufacturingChain`: multi-stage manufacturing provenance.
- `pagefront:construction`: construction notes (composite, knitwear, jewelry).
- `pagefront:configurator`: combinatorial product configuration spaces (the option space; it carries no prices).
- `pagefront:configuratorPricing`: on an `Offer` or `AggregateOffer`, the price list for the configurator the offer names ("Configurator pricing and price bands").
- `pagefront:madeToOrderTerms`: economics for made-to-order products.
- `pagefront:gemstone`: typed gemstone descriptions with grading.
- `pagefront:promotions`: site-level promotional codes scoped to product, category or site_wide.
- `pagefront:availableLanguages`: cross-language navigation hints.
- `pagefront:priceOnRequest`: the declaration that no price is published ("Price-on-request offers").
- `pagefront:document`: typed product documents ("Documents").
- `pagefront:relatedProduct`: typed relationships between products ("Related products").
- `pagefront:sizeRecommendation`: fit guidance relative to the labeled size ("Size guidance").
- `pagefront:featureGroup`: grouped, ordered technical specifications ("Feature groups").
- `pagefront:productHighlights`: ordered, publisher-authored selling-point strings ("Product highlights").
- `pagefront:legalEntity`: role-typed legal entities behind the product ("Legal entities").
- `pagefront:safetyWarning`: typed, language-scoped product safety warnings ("Safety warnings").
- `pagefront:safetyNotice`: structured recall and safety notices with hazard and remedy ("Safety notices").
- `pagefront:manufacturerWarranty`: a warranty given by the manufacturer, on the Product as a `WarrantyPromise` ("Warranty").

### Materials: `material` and `pagefront:materialComposition`

- **`material`** (Schema.org): a flat string summarizing what the product is made of (`"leather"`, `"904L stainless steel"`, `"Goyardine Canvas & Chevroches Calfskin"`).
- **`pagefront:materialComposition`**: an array of `pagefront:Material` objects, each with the material name and optional `percentage`, purity (free text or numeric), provenance (`virgin`, `recycled`, `fair_mined`, `lab_grown`, `reclaimed`, `deadstock`) and weight in grams. Producers SHOULD populate both fields when the data supports both; `material: "Harmonie leather"` beside `materialComposition: [{"material": "Harmonie leather"}]` is valid. A multi-material product without percentages lists one entry per named material; a textile lists percentages; a mixed case carries percentages on some entries only. Check: PDP-W-005 (percentages present and not summing to about 100). [why](product-notes.md#why-material-and-pagefrontmaterialcomposition-complement-each-other)
- **`pagefront:fabricComposition`**: an alias of `materialComposition`, same value shape, restricted by convention to textile cases where the page distinguishes fabric from overall composition (linings, trims, padding).

### Size guidance: `pagefront:sizeChart` and `pagefront:sizeRecommendation`

- **`pagefront:sizeChart`**, and Schema.org's `SizeSpecification` / `hasMeasurement`: measurements, size codes and body or garment measurements.
- **`pagefront:sizeRecommendation`**: fit relative to the labeled size, one object: [why](product-notes.md#why-fit-advice-is-a-field-of-its-own)
  - `fitProfile` *(optional)*: `runs_small`, `true_to_size`, `runs_large`.
  - `sizeAdjustment` *(optional)*: the recommended offset from the customer's usual size: `direction` (`up`, `down`), `magnitude` (a number, `0.5`), `sizeSystem` (a Schema.org `SizeSystemEnumeration` value, `WearableSizeSystemEU`). When the Sheet carries a sizing dimension in `pagefront:configurator`, `sizeSystem` MUST be that dimension's system (`WearableSizeSystemUK` for `system: "UK"`). Advice the merchant states in another system stays as the merchant's wording in `description`, with `sizeAdjustment` omitted. Checks: PDP-E-014 (system mismatch), PDP-W-039 (advice carried as prose only).
  - `description` *(optional)*: the merchant's product-specific reasoning, as written.
  - `appliesTo` *(optional)*: the `@id` or axis identifier of the variant the guidance applies to.

```json
"pagefront:sizeRecommendation": {
  "@type": "pagefront:SizeRecommendation",
  "fitProfile": "runs_large",
  "sizeAdjustment": { "@type": "pagefront:SizeAdjustment", "direction": "down", "magnitude": 0.5, "sizeSystem": "WearableSizeSystemEU" },
  "description": "The wavy band sits differently from a standard ring, so we recommend going half a size down from your usual."
}
```

## Internationalization

A Sheet is language-scoped: one `inLanguage` per sheet, and every prose field, the `video` array ("Video and internationalization") and the Q&A in that language. Each language variant of a resource is its own sheet, declared by its own page; the discovery link carries no language attribute. Several currencies are several `Offer` entries with `areaServed`.

- **`pagefront:availableLanguages`**: a publisher with more than one language variant SHOULD list the siblings, one `{lang, url}` entry per sibling (see the vocabulary). Each entry is a traversal hint under "Traversal hints" in Pagefront Discovery: it MAY be stale, and a consumer reaches a sibling through the sibling's own page when the entry does not resolve.

## Sheet filename convention

The recommended filename shape, `{id}.{lang}.json`, is "Filename convention" in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md#filename-convention)). It is a convenience for publishers and never a discovery mechanism: a Sheet is located by the declaration its page carries.

## Discovery

Discovery is specified in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md)): the discovery principle, the page-based carriers (`Link: rel="alternate"; type="application/pagefront+json"` and the HTML `<link>` element), the entry point, the traversal-hint rule and the filename convention. Product-specific traversal hints, all under that rule: `sheet_url` on `hasVariant` entries and `isVariantOf`; `pagefront:sheetUrl` on organization references (`Offer.seller`, `Product.brand`, a reference-form `pagefront:legalEntity`; the linking contract in [`organization.md`](organization.md#linking-contract-identity-only)) and on `isPartOf` entries ([`collection.md`](collection.md)); the `url` of `pagefront:availableLanguages` entries.

## Planned breaking changes

Breaking changes follow semver: each of the changes below would make a conforming sheet non-conforming, and ships in a future minor of this spec under the 0.x rules, with the release bumping accordingly ([`releases.md`](releases.md)). None ships in Product Sheet spec 0.10.0. Planned as of 2026-10-02:

- **`@context` must declare the `pagefront` prefix wherever a `pagefront:` term is used.** Stated as prose in "Required and recommended core fields" and enforced by the linter (PDP-E-003, ORG-E-001); the JSON Schemas still accept the bare `"https://schema.org"` string beside `pagefront:` terms. A future schema version adds the constraint: when any data-block property name begins with `pagefront:`, `@context` is an array containing an object mapping `pagefront` to `https://themachineweb.org/pagefront/vocabulary/`. The top-level form does not see terms nested inside other objects, such as `pagefront:priceOnRequest` in an offer; the linter rules do.

## Status

Normative spec: Product Sheet spec 0.11.0, a member of commerce release 0.5.0. The versioning scheme is in [`releases.md`](releases.md): the spec has its own semver, breaking changes follow it, and the envelope carries `release` in place of `format_version`. The legacy format versions this spec grew through, and the pending work carried from them, are in the design notes. [notes](product-notes.md#the-legacy-format-versions-this-spec-grew-through)

The open design questions are in the design notes too: those carried forward [notes](product-notes.md#open-design-questions-carried-forward) and those surfaced in v0.4 [notes](product-notes.md#open-design-questions-surfaced-in-v04), v0.5 [notes](product-notes.md#open-design-questions-surfaced-in-v05), v0.6 [notes](product-notes.md#new-design-questions-surfaced-in-v06), v0.7 [notes](product-notes.md#new-design-questions-surfaced-in-v07) and v0.8 [notes](product-notes.md#new-design-questions-surfaced-in-v08), with what v0.8 deliberately does not address [notes](product-notes.md#what-v08-deliberately-does-not-address), and those the merchant-statement sources raise [notes](product-notes.md#why-a-platform-served-value-is-a-merchant-statement).

## Changelog

The changelog, with its Unreleased entries, is [`product-changelog.md`](product-changelog.md).
