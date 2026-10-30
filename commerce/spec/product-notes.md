# Design notes: Product Sheet spec

Status: non-normative. These notes explain the Product Sheet spec, [`product.md`](product.md), which governs; a note adds no requirement.
Design notes for the Product Sheet spec 0.11.0, commerce release 0.5.0.

Each note opens with a link to the field or section it explains. The reference links a note from the field it explains; on the published page the notes render as footnotes under the spec.

## When to extend Schema.org with `pagefront:` vocabulary

For "Design principles" in [`product.md`](product.md#design-principles).

Pagefront extends Schema.org with `pagefront:`-prefixed vocabulary only when one of three conditions holds:

1. **Schema.org gap.** Schema.org lacks vocabulary for the concept being modeled. Examples in v0.7: `pagefront:Configurator` (configurator economics), `pagefront:MadeToOrderTerms` (made-to-order production), `pagefront:Material` with composition properties (typed material breakdown with `percentage`, purity, provenance, weight).
2. **Schema.org under-specification.** Schema.org models the concept but without the closed-enum typing, mandatory structure, or precision agents need to dispatch on. Examples in v0.7: `pagefront:RelatedProduct` (Schema.org's typed relations are limited to four kinds; agents need more typed coverage), `pagefront:Document` (Schema.org has no typed-role enum for product documents like manuals, warranties, certificates), the image and video role enums (Schema.org has no opinion on image roles; Pagefront's closed enum lets consumers dispatch).
3. **Schema.org mismatch with Pagefront's contract.** Schema.org's model conflicts with how Pagefront wants the data shaped. Example in v0.7: `pagefront:PriceOnRequest` (Schema.org has no affordance for "the merchant intentionally publishes no price"; the extension addresses the gap directly).

When none of these triggers fire, Pagefront uses Schema.org-native vocabulary. Image-to-variant association uses Schema.org's `about`. Product Q&A uses Schema.org's `Question`/`Answer`. Pricing patterns use Schema.org's `PriceSpecification` and `AggregateOffer`. Product dimensions use Schema.org's `height`/`width`/`depth`/`weight` with `QuantitativeValue`. Untyped product relationships use Schema.org's `isRelatedTo` and `isSimilarTo`. Certifications use Schema.org's native `Certification` type and `hasCertification` field, with applicability `scope` carried as a `scope` PropertyValue convention; no type is minted for it. The schema permits these via the `additionalProperties: true` policy on Schema.org-typed blocks.

v0.7 documents five further recommended patterns on the same principle, each surfaced by real-merchant sheet production and each fully covered by Schema.org's existing vocabulary: product lifecycle (`releaseDate`, and Offer `availability: Discontinued` paired with a `replaced_by` relationship; see "Product lifecycle"); cross-merchant canonical references (`sameAs` as a deduplication hint alongside the `@id` identity key; see "Cross-merchant canonical reference via `sameAs`"); EU energy efficiency (`hasEnergyConsumptionDetails` with `EUEnergyEfficiencyEnumeration` categories; see "Energy efficiency"); age suitability (`audience` with `PeopleAudience` plus an `additionalProperty` convention for regulatory age warnings; see "Age suitability"); and family and series membership (nested `isPartOf`; see "Five patterns for product-to-product relationships"). None mints a `pagefront:` term, and none required a schema change. The property choices were verified against Schema.org's `domainIncludes` declarations: each pattern uses only properties whose domain covers `Product` (or `Thing`), so the Sheets stay clean Schema.org even under domain-aware validation.

The split is also a signal: `pagefront:`-prefixed fields mean "Pagefront-typed extension with closed-enum or structured shape"; Schema.org-native fields mean "upstream-validated vocabulary."

This principle has operated implicitly across v0.7's decisions; documenting it guards against drift. A contributor proposing a `pagefront:` extension should be able to name which of the three triggers fires; if none do, the answer is Schema.org-native.

## Why the schema validates the envelope and the extensions only

For "What the schema validates" in [`product.md`](product.md#what-the-schema-validates).

Schema.org is large, well-specified upstream, and evolving. Pagefront re-validating Schema.org content would mean duplicating Schema.org's own work, choosing which subset of Schema.org to constrain (every choice excludes valid Schema.org), and maintaining the duplication forever as Schema.org evolves. Pagefront's job is to define the envelope and its typed extensions; Schema.org's job is to define the content vocabulary; consumers compose the two.

Pagefront-recommended patterns built on Schema.org vocabulary (sale pricing via `PriceSpecification`, quantity-tier pricing via `eligibleQuantity`, video accessibility via `caption`/`transcript`, etc.) therefore require no schema changes when they are added or refined. The spec documents the patterns; the schema permits them; consumers interpret them. Schema changes are reserved for envelope fields and `pagefront:`-prefixed extension types.

## Why `release` has a generic name

For `release` in [`product.md`](product.md#the-envelope).

The name is generic because the envelope is shared across verticals; the vertical is identified by `$schema`.

## Why `sheet_url` is informational

For `sheet_url` in [`product.md`](product.md#the-envelope).

A consumer that holds a Sheet already knows where it fetched it from, and a consumer looking for one follows the page's declaration (see "Discovery", which points at Pagefront Discovery). `sheet_url` became optional on 2026-10-13; the envelope is otherwise unchanged from v0.5.

## Why completeness is not in the sheet

For the spec as a whole, [`product.md`](product.md).

A completeness score is a valuation, and valuations differ per consumer: a compliance agent weights legal entities heavily, a visual-shopping agent weights media. No single score would be right for both, so the sheet carries none. Scoring is consumer-side, over the shared dimension taxonomy in [`scoring.md`](scoring.md); the linter judges correctness only.

## Why a platform-served value is a merchant statement

For "Merchant statements" in [`product.md`](product.md#merchant-statements).

The reference had two kinds of source scattered through its entries, the page and "the platform's data", and a third kind it forbade field by field: a checkout address built from a URL pattern, a tax basis read off a domain, a market read off a currency. The section names the three once so that an entry can refer to them. The trigger was a platform turning a commerce protocol on for every shop it hosts unless the merchant turns it off: in 2026 Shopify began serving UCP from its eligible merchants' storefronts by default. A value served that way is one the merchant never composed, and the question was whether a producer may publish it as the merchant's.

It may, on three grounds. The value is served from the merchant's own domain, so it is the merchant's publication in the sense Pagefront already relies on for the page. It is read from the merchant's own store data, the same records the dashboard shows the merchant, so it states nothing the merchant has not entered somewhere. And the merchant can turn the protocol off, so leaving it on is an acceptance, in the way leaving a product feed on is. The merchant of record is the merchant. What distinguishes the third category is that the merchant stated nothing at all: a producer that expands a platform's cart-link pattern for a shop that has not enabled cart links is the author of that address, and a producer that reads a value from an aggregator is publishing the aggregator's statement under the merchant's name.

A platform-served statement covers what a transaction needs: a title, a price, which variants are in stock, a picture, an identifier, a checkout hand-off. What the product is made of, where, by whom and to what standard has no field there and stays in the merchant's authored content. The two sources therefore overlap on few fields, and where they do the reference keeps the rule it already had: `price` and `availability` are what the shopper is shown on the page, and a platform-served amount or stock signal only checks them (see "Why `price` is the displayed consumer price"). An agent channel may be quoted a price the page does not show, and a sheet states the page's.

Three questions stay open:

1. **Precedence on other fields.** Where an authored value and a platform-served value disagree on a field whose entry names no source, the producer leaves the field out and reports it. Whether an entry should name a precedence instead, field by field, waits for cases where the disagreement is common.
2. **A provenance annotation.** A sheet does not say which source each value came from. A consumer that wants to weigh an authored value over a platform-served one has no field to read, and nothing is minted for it until a consumer asks for it.
3. **Protocol hand-off addresses.** Whether a checkout address a commerce protocol hands over is a checkout link in the template's sense, with `quantity` as its one variable, is decided once such addresses are seen in practice; until then it qualifies as a source and the template rules apply unchanged.

## Why a product carries more than one GTIN

For "Multiple GTINs" in [`product.md`](product.md#multiple-gtins).

A product legitimately carries more than one GTIN when the same product ships under different barcodes: regional packaging variants (the EU box and the US box of one product), re-releases where a manufacturer reissues the product under a new barcode, or multipack-versus-single packaging of the same sellable unit. `gtin` and `gtin13` therefore accept a single string or an array of strings; each `gtin13` entry must be 13 digits, as before.

```json
{
  "@type": "Product",
  "name": "Meridian Headlamp 400",
  "url": "https://merchant.com/products/meridian-headlamp-400",
  "sku": "MER-HL400",
  "gtin13": ["4066544923187", "0194253715880"]
}
```

## Why a coded category rides beside the string

For "Machine-readable category" in [`product.md`](product.md#machine-readable-category).

`category` remains the human-readable hierarchical string. It now also accepts a Schema.org `CategoryCode` object identifying the category in a published taxonomy, or an array mixing the string and coded forms. Schema.org covers this natively, so no `pagefront:` term is minted.

Consumers dispatch on the `inCodeSet` URL to know how to interpret `codeValue`; a code without its code set is ambiguous.

The string serves rendering and simple consumers; the code serves comparison and aggregation across merchants:

```json
{
  "@type": "Product",
  "name": "Aurora Jacket — Onyx",
  "url": "https://merchant.com/products/aurora-jacket?variant=onyx",
  "category": [
    "Apparel > Outerwear > Jackets",
    {
      "@type": "CategoryCode",
      "codeValue": "5598",
      "inCodeSet": "https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt",
      "name": "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets"
    }
  ]
}
```

## Why `hasVariant` is read as complete

For "ProductGroup variant completeness" in [`product.md`](product.md#productgroup-variant-completeness).

The `hasVariant` array is intended to be exhaustive: consumers reading a ProductGroup Sheet expect it to reflect the complete variant family at the moment of emission. A partial ProductGroup Sheet does not apply here because consumers read `hasVariant` as complete.

## Why a rich variant family is several Sheets

For "Multi-Sheet variant families" in [`product.md`](product.md#multi-sheet-variant-families).

Inlining every variant into one ProductGroup Sheet works when variants are thin (a color and a price), but it collapses when each variant page is a rich product page in its own right.

The structure of N+1 Sheets gives bidirectional traversal. A variant Sheet reaches its parent via `isVariantOf`; the parent reaches its variants via `hasVariant`. An agent landing on a variant page reaches that variant's Sheet via `Link: rel="alternate"`, follows `isVariantOf` to the parent Sheet, and reads the parent's `hasVariant` to enumerate sibling variants. An agent landing on the family page reads the parent's `hasVariant` to reach each variant directly.

The `@id` of a `hasVariant` entry matches exactly the `@id` in the variant's own Sheet. The exact-string match is what lets a consumer recognize the parent's reference and the variant's self-description as the same product.

`sheet_url` on a `hasVariant` entry lets a consumer fetch the variant Sheet directly without first loading the variant page and reading its `alternate` link. The parent's `sheet_url` on `isVariantOf` makes traversal to the parent symmetric: a consumer on the variant Sheet can fetch the parent directly, without resolving it through the variant page.

A page-less parent has no page of its own, so the hint on its variants' `isVariantOf` is the only path to it.

The corresponding variant Product Sheet for the Onyx colorway, pointing back at the parent via `isVariantOf` and carrying its own media array:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://merchant.com/pagefront/commerce/product/aurora-jacket-onyx.en.json",
  "name": "Aurora Jacket — Onyx",
  "inLanguage": "en",
  "sku": "AURORA-ONYX",
  "url": "https://merchant.com/products/aurora-jacket?variant=onyx",
  "color": "Onyx",
  "isVariantOf": {
    "@type": "ProductGroup",
    "@id": "https://merchant.com/pagefront/commerce/product/aurora-jacket.en.json",
    "sheet_url": "https://merchant.com/pagefront/commerce/product/aurora-jacket.en.json"
  },
  "image": [
    {
      "@type": "ImageObject",
      "url": "https://merchant.com/images/aurora-jacket-onyx-hero.jpg",
      "additionalProperty": [
        {"@type": "PropertyValue", "name": "role", "value": "hero"}
      ]
    },
    {
      "@type": "ImageObject",
      "url": "https://merchant.com/images/aurora-jacket-onyx-packshot.jpg",
      "additionalProperty": [
        {"@type": "PropertyValue", "name": "role", "value": "packshot"}
      ]
    }
  ]
}
```

A **page-less parent** ProductGroup: a family whose variants each have their own page but that has no family landing page of its own. Its data block omits `url` and is reached by the `sheet_url` hint on its variants' `isVariantOf`. The `productGroupID` identifier requirement still holds; only `url` is dropped. Each variant entry still carries its own page `url`:

```json
{
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "@id": "https://merchant.com/pagefront/commerce/product/studio-pendant.en.json",
  "name": "Studio Pendant Lamp",
  "inLanguage": "en",
  "productGroupID": "STUDIO-PENDANT",
  "variesBy": ["https://schema.org/material"],
  "hasVariant": [
    {
      "@type": "Product",
      "@id": "https://merchant.com/pagefront/commerce/product/studio-pendant-brass.en.json",
      "url": "https://merchant.com/products/studio-pendant-brass",
      "sheet_url": "https://merchant.com/pagefront/commerce/product/studio-pendant-brass.en.json",
      "name": "Studio Pendant Lamp — Brass",
      "material": "Brass",
      "image": "https://merchant.com/images/studio-pendant-brass-packshot.jpg"
    },
    {
      "@type": "Product",
      "@id": "https://merchant.com/pagefront/commerce/product/studio-pendant-black.en.json",
      "url": "https://merchant.com/products/studio-pendant-black",
      "sheet_url": "https://merchant.com/pagefront/commerce/product/studio-pendant-black.en.json",
      "name": "Studio Pendant Lamp — Matte Black",
      "material": "Matte Black",
      "image": "https://merchant.com/images/studio-pendant-black-packshot.jpg"
    }
  ]
}
```

Each variant Sheet points back at this page-less parent as in the Onyx example above (`isVariantOf` carrying the parent's `@id` and `sheet_url`), so the parent is reachable even though it has no page.

## Why a variant declares its own `url`

For "Per-variant URLs" in [`product.md`](product.md#per-variant-urls).

The ProductGroup's top-level `url` is typically the merchant's primary listing page or the page from which variant discovery began. The per-variant `url` is what lets a consumer address a variant individually (an agent recommending one variant, link sharing).

Shared-URL variants are rare in practice. Same-page parameterized URLs are semantically equivalent to the parent product URL, so consumers treat them as the same canonical page with a different default state. Distinct-page variants (a watch family where each dial color is its own page) are typically modeled as separate Sheets.

## How ProductGroup `name` maps to Google Merchant Center `item_group_title`

For "ProductGroup `name` and Google Merchant Center `item_group_title`" in [`product.md`](product.md#productgroup-name-and-google-merchant-center-item_group_title).

For implementers transitioning from Google Merchant Center feed formats: the `name` field on a `ProductGroup` is the Pagefront equivalent of Google's `item_group_title` attribute. The two carry the same intent: a human-readable title for the variant family that is distinct from any individual variant's `name`. Pagefront expresses it via Schema.org's native `name` on the `ProductGroup`; no dedicated attribute is minted, because the semantic is already covered by Schema.org's existing vocabulary.

## Why examples use unregistered `propertyID` values

For "Variant dimensions" in [`product.md`](product.md#variant-dimensions).

Spec examples and worked illustrations of the unregistered path SHOULD use `propertyID` values with no plausible registration future, such as an idiosyncratic, single-merchant facet. A common cross-vertical term risks getting registered later, which would silently invalidate the example's premise. The choice of `earcup_fold_mechanism` as the illustration in "Feature groups" follows this guidance.

`variesBy` lists the axes so consumers can discover the variant axes without scanning variants. Registry units let raw values compare across sheets without conversion. A group that varies along both Schema.org-native and non-native axes, with the variant's values on each:

```json
{
  "@type": "ProductGroup",
  "productGroupID": "macbook-air-13",
  "variesBy": ["https://schema.org/color", "memory", "storage"],
  "hasVariant": [
    {
      "@type": "Product",
      "sku": "MBA13-MID-16-512",
      "color": "Midnight",
      "additionalProperty": [
        { "@type": "PropertyValue", "propertyID": "memory", "value": "16 GB" },
        { "@type": "PropertyValue", "propertyID": "storage", "value": "512 GB" }
      ]
    }
  ]
}
```

## Why the registry deprecates and never removes

For "Registry governance" in [`product.md`](product.md#registry-governance).

The Pagefront Property Registry's lifecycle is modeled on IANA's link-relation registry (see RFC 8288 §6.2.1, referenced in Pagefront Discovery): entries move through three states.

Entries are **never removed or renamed** once published: the same permanence guarantee the spec gives `pagefront:Document` and `pagefront:RelatedProduct` (see "Versioning and stability" in the Pagefront Vocabulary). A `propertyID` that appears in a sheet today resolves to the same definition in the registry regardless of later status changes; renaming would break every sheet that already emitted the old identifier, so deprecation without removal is the only transition the registry makes.

A consumer pinning an older registry snapshot (see "Consumers MAY ship a pinned snapshot" in "Variant dimensions") stays correct about every entry that existed at pin time.

**Registration path.** New entries are proposed from observed real-merchant use (facet analysis of produced sheets surfacing a `propertyID` that recurs across independent publishers) and submitted via the spec repository, the same venue that governs the rest of the Pagefront Spec. There is no separate registry-specific governance body; the registry is versioned and published alongside the spec it serves.

## Why the ProductGroup ceiling is three axes per Sheet

For "Configurator vs. ProductGroup guidance" in [`product.md`](product.md#configurator-vs-productgroup-guidance).

The 3-axis ceiling for `ProductGroup` reflects that real-world axes carry enough values that 4+ axis combinations are impractical to manage as discrete inventory SKUs: a 4-axis product where each axis has 3+ values already exceeds 80 combinations, past the point where `ProductGroup` enumeration scales cleanly. An exception applies only when the cartesian product is unusually small AND every combination ships from inventory as a discrete SKU; in practice the exception rarely applies, and producers facing borderline cases should default to configurator.

**Axis count is per-Sheet.** The axis counts refer to the variant axes expressed within a single Sheet, on one canonical URL. The total a logical product family carries across all its representations is not the measure. A family with more axes than one Sheet expresses is routinely factored across multiple Sheets by picking one axis as the page boundary. Picture a watch family with three axes (dial color, strap, and case back) where the merchant gives each dial color its own page. Each Sheet then expresses only strap and case back: two axes, well within the `ProductGroup` envelope. Cross-Sheet relationships (`isVariantOf` to a parent family Sheet, or `pagefront:relatedProduct` between siblings) carry the factored axis.

A producer with a 4+ axis family therefore has two valid options:

1. **Factor across Sheets**, keeping each at 3 or fewer axes (the factoring example below). Best for in-stock families with a discrete SKU per combination: it keeps each Sheet tractable and matches how customers navigate (shopping by dial, then choosing strap and case back within it).
2. **Express the full space in one Sheet** using `pagefront:configurator` (the configurator example below). Best for made-to-order or continuous-dimension products, where there is no per-combination inventory to enumerate.

Worked examples:

- **Made-to-order configurator.** A custom ring offered in 14 gold options × 5 sizes × 2 band styles: 140 configurations, made to order, none held in inventory. Made-to-order economics and combinatorial scale together force the configurator; even at 3 axes it is the only tractable representation.
- **Cross-Sheet factoring, `ProductGroup` per axis.** A watch family with three axes (dial color, strap, and case back) where the merchant gives each dial color its own page. Each Sheet then expresses only the remaining two axes (strap × case back) as a `ProductGroup` whose `hasVariant` enumerates the discrete in-stock SKUs; cross-Sheet relationships connect the dials. The same logical complexity, distributed across tractable Sheets each well inside the 3-axis ceiling.
- **Three-axis `ProductGroup` at the boundary.** A watch line of 3 case materials × 3 strap types × 3 case sizes = 27 combinations, each stocked as a discrete SKU. All axes discrete, all combinations in inventory, axis count at the ceiling: one `ProductGroup` with `hasVariant` enumerating all 27 entries, the upper end of the envelope, but unambiguously inside it.

Linter rules PDP-W-007 (single-variant ProductGroup), PDP-W-009 (empty `hasVariant`), and PDP-W-010 (configurator and `hasVariant` declaring the same dimension) implement guardrails around the configurator-or-ProductGroup decision. The 3-axis ceiling does not change those checks; it only adjusts which model is recommended for borderline-by-axis-count products.

## Why factored and configured axes are disjoint

For "Mixed cross-Sheet factoring" in [`product.md`](product.md#mixed-cross-sheet-factoring).

The factored axes and the configurator axes are two disjoint sets: no axis appears in both roles on any single Sheet, which keeps each Sheet clear of the PDP-W-010 conflict (configurator and `hasVariant`/`isVariantOf` declaring the same dimension).

For example, an engagement ring with four axes (shape, band style, carat, and metal) splits two-and-two. Shape and band style are factored into pages: each (shape × band) combination is its own page and Sheet, so they are the family axes, carried by a parent `ProductGroup` (`variesBy`: shape, band style) whose `hasVariant` enumerates the per-combination pages. Carat and metal are configured within each page, carried by a `pagefront:configurator` (`dimensions`: carat, metal) on each page's Product Sheet. No Sheet declares any axis as both a variant axis and a configurator dimension, so PDP-W-010 does not fire.

When a product's axes exceed what one mechanism handles cleanly, partition them into axes factored into pages (the variant relationship) and axes configured within a page (the configurator), keeping the two sets disjoint.

## Why the configurator carries no prices

For "Configurator pricing and price bands" in [`product.md`](product.md#configurator-pricing-and-price-bands).

A price list belongs to a market. It has a currency and a tax basis, which an offer already states, and a product sold in two markets can have two price lists that are not exchange-rate conversions of each other.

The pricing block's reference to its configurator is the only link between an offer and the option space it prices; two objects sitting on the same Product state no such link.

A pair in an exclusion or in an adjustment's `when` that resolves to nothing would exclude no configuration, or never apply, without any sign of it. This requirement is new in Product Sheet spec 0.10.0 (linter rule PDP-E-017, which applies from release 0.4.0).

Any price grid can be expressed with `adjustments`.

A merchant selling in several currencies publishes one Sheet per market, each at its own canonical URL, and each Sheet's offer carries that market's price list.

On a Sheet where some axes are factored into pages, the band spans only the page's configurator dimensions. For example, an engagement-ring page with shape and band fixed (factored) and carat × metal configured carries an `AggregateOffer` whose `lowPrice` is that page's floor and whose `highPrice` is that page's ceiling. The band spans only carat × metal; the whole family's price spread across shapes and bands is captured implicitly by the set of per-page bands.

## Why option values are identifiers

For "Configurator pricing and price bands" in [`product.md`](product.md#configurator-pricing-and-price-bands).

Option values are the keys that `modifiers` and `baseConfiguration` are compared against, literally, and two Sheets for the same product in different languages must share them: the French and the English Sheet of one desk both say `solid_oak`, and each describes it in its own language.

**Labels, notes and quoted statements.** An option's `description` is the label a buyer sees. A dimension's `note` is a factual statement for a machine: third person, no address to the reader, no call to action. The split follows what a field is for. Fields that carry a legal or safety statement (safety warnings, warranty, return terms) are quoted verbatim, because the merchant's published wording is the statement. Descriptive fields such as configurator notes are restated as facts.

## Worked example: the Harbour Desk price band

For "Configurator pricing and price bands" in [`product.md`](product.md#configurator-pricing-and-price-bands).

In the Harbour Desk example, the base configuration (120 × 60 cm, laminate, fixed frame) totals 349.00, which is `lowPrice` because no modifier is negative. A 160 × 80 cm oak veneer top on an electric frame totals 349.00 + 90 + 80 + 250 + 30 = 799.00, the adjustment included. The dearest configuration that can be ordered is 140 × 70 cm, solid oak, electric frame: 349.00 + 40 + 220 + 250 = 859.00, which is `highPrice`. The 160 × 80 cm solid oak top would total more, and it is excluded. Frame colour appears nowhere in the pricing block.

The same block on an `Offer`, unchanged, publishes the base price as the offer's `price`:

```json
{
  "@type": "Offer",
  "price": "349.00",
  "priceCurrency": "EUR",
  "areaServed": "DE",
  "priceSpecification": {
    "@type": "UnitPriceSpecification",
    "price": "349.00",
    "priceCurrency": "EUR",
    "valueAddedTaxIncluded": true
  },
  "pagefront:configuratorPricing": { ... }
}
```

## Why an age warning is a separate statement

For "Age suitability" in [`product.md`](product.md#age-suitability).

Regulatory age warnings are a different statement: a recommendation says "who this is for," and a warning says "who this must be kept from," as in the EU toy-safety warning "Not suitable for children under 36 months." The two coexist on the same product; a recommendation and a warning answer different questions, and neither substitutes for the other.

```json
{
  "@type": "Product",
  "name": "Meadow Wooden Train Set",
  "url": "https://merchant.com/products/meadow-wooden-train-set",
  "audience": {
    "@type": "PeopleAudience",
    "suggestedMinAge": 5
  },
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "age_warning",
      "value": "Not suitable for children under 36 months. Contains small parts — choking hazard."
    }
  ]
}
```

## Why every image declares `about`

For "Associating images with variants" in [`product.md`](product.md#associating-images-with-variants).

When a ProductGroup Sheet's `image` array contains images that depict specific variants (a packshot of one color, a lifestyle shot featuring one size, a swatch for one finish), the image SHOULD declare which variant(s) it depicts via Schema.org's `about` property. This mirrors the `itemOffered` pattern used to associate Offers with variants.

Declaring `about` on every image disambiguates family-level images (where the producer affirmatively states "this applies to the ProductGroup") from images where variant association is simply unknown or omitted in error. Treating omission as the convention for family-level images would leave the two indistinguishable. The pattern is also symmetric with `itemOffered` on Offers, where every Offer always declares its target; there is no convention of "Offer without itemOffered applies to the whole family."

The pattern is Schema.org-native: `about` is well-defined and widely supported, so Pagefront introduces no typed extension.

VideoObject supports the same pattern via the same `about` property. Variant-specific product videos (a tutorial featuring one configuration, a demonstration of one finish) can declare their variant association identically: a single `about` reference for one-variant videos, an array for multi-variant videos. Family-level videos in a ProductGroup Sheet should declare `about` pointing at the ProductGroup's `@id`, following the same every-video rule as images.

A per-variant packshot, with a single `about` reference to one variant:

```json
{
  "@type": "ImageObject",
  "url": "https://merchant.com/media/widget-midnight-packshot.jpg",
  "about": { "@id": "https://merchant.com/product/widget#color-midnight" },
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "role", "value": "packshot" }
  ]
}
```

A family-level image, a general product shot without variant emphasis, with `about` set to the ProductGroup's `@id`:

```json
{
  "@type": "ImageObject",
  "url": "https://merchant.com/media/widget-hero.jpg",
  "about": { "@id": "https://merchant.com/product/widget" },
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "role", "value": "hero" }
  ]
}
```

## Why media carries textual framing

For "Textual framing for media" in [`product.md`](product.md#textual-framing-for-media).

Producers SHOULD populate textual framing for images that benefit from publisher context: lifestyle imagery, infographics, comparative diagrams, swatches in context, any image where the publisher's intent isn't self-evident from the visual content alone. Producers MAY skip textual framing for packshots and other studio imagery where visual analysis can describe the content reliably.

Schema.org provides two fields for this purpose, used by convention: `caption`, short, display-quality text that accompanies the image, typically merchant-approved for human reading, used when the merchant already has caption text in their content management system; and `description`, longer or more semantic text that may not be displayed but provides machine-readable framing, used when the merchant has richer context than a caption would carry.

Both fields travel in the sheet; the distinction is purpose and provenance: `caption` is short, publisher-vetted text fit to display; `description` is longer, optional framing that need not be displayed.

Auto-generated text in either field is discouraged unless it adds semantic value beyond what visual analysis would derive. Producers using image-recognition tools should review and refine generated text before publishing.

A lifestyle image with a short, merchant-approved `caption`:

```json
{
  "@type": "ImageObject",
  "url": "https://merchant.com/media/widget-on-desk.jpg",
  "caption": "The Widget at home on a morning desk setup.",
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "role", "value": "lifestyle" }
  ]
}
```

An infographic where the merchant has richer context than a caption would carry, expressed via `description`:

```json
{
  "@type": "ImageObject",
  "url": "https://merchant.com/media/widget-materials-diagram.jpg",
  "description": "Cutaway diagram of the Widget's three-layer construction: an anodized aluminum shell, a machined steel core, and a friction-fit silicone gasket sealing the two. Callouts label each layer and indicate the gasket's service-replaceable seam.",
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "role", "value": "detail" }
  ]
}
```

This pattern applies to `VideoObject` identically. Videos benefit from textual framing even more than images, because video content unfolds over time and is harder for machine readers to summarize from visual analysis alone.

## What's not in `video`

For "Video roles" in [`product.md`](product.md#video-roles).

- **User-generated review videos** belong in `pagefront:userGeneratedMedia` (a future field, not in v0.6). The publisher isn't the author and the trust signal is fundamentally different from publisher-authored video.
- **Live streams and scheduled broadcasts** are out of scope. Schema.org's `BroadcastEvent` and `LiveBlogPosting` cover this case; Pagefront may revisit if real consumer use cases surface.
- **Promotional videos / advertisements** typically fall under `overview` or `lifestyle`. The spec doesn't define a distinct `commercial` role because the routing distinction doesn't help consumers.
- **`hero` is not a video role.** The image role `hero` exists to disambiguate within an image set where multiple images could be the primary one. Most products have one overview video; the disambiguation isn't needed. Publishers wanting to surface a primary video should use `overview`.

The `unboxing` role covers packaging-opening footage that is merchant- or partner-produced, as distinct from user-generated unboxing content. The `spin` role is conceptually closer to a rich image than a video but uses video format for delivery.

A full `VideoObject`, with hosting, preview, timing, framing and role:

```json
{
  "@type": "VideoObject",
  "contentUrl": "https://merchant.com/media/widget-overview.mp4",
  "embedUrl": "https://www.youtube.com/embed/abc123",
  "thumbnailUrl": "https://merchant.com/media/widget-overview-thumb.jpg",
  "duration": "PT1M12S",
  "uploadDate": "2026-03-15",
  "caption": "Widget overview and key features",
  "transcript": "In this video we show the Widget's three key features...",
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "role", "value": "overview" }
  ]
}
```

## Why one video keeps its previews in one object

For "Multiple thumbnails" in [`product.md`](product.md#multiple-thumbnails).

A `VideoObject` usually carries a single preview via `thumbnailUrl` (a URL string). When a single video is surfaced under more than one preview image that carry distinct meaning (different scenes, framings, or use-cases the merchant chose), use Schema.org's `thumbnail` property (an array of `ImageObject`) instead of `thumbnailUrl`, so each preview keeps its own context (`description`/`caption`).

The distinction is one of content; the number of previews does not decide it:

- **Interchangeable previews** (same scene, different crops or sizes, no distinct meaning) → `thumbnailUrl` with one URL. There's nothing to distinguish, so a single preview suffices.
- **Meaningful previews** (different scenes or use-cases) → `thumbnail` with an array of `ImageObject`, each carrying its own `description`/`caption`. The difference between previews is information to preserve.

This remains one `VideoObject`: one video, identified by its `contentUrl`/`embedUrl`. Multiple previews of one video stay in a single `VideoObject`; several `VideoObject`s for one video would misrepresent the page and create a dedup artifact (two `VideoObject`s sharing one `contentUrl` are the same video).

```json
{
  "@type": "VideoObject",
  "contentUrl": "https://merchant.com/media/trail-pack-demo.mp4",
  "embedUrl": "https://www.youtube.com/embed/def456",
  "thumbnail": [
    {
      "@type": "ImageObject",
      "url": "https://merchant.com/media/trail-pack-hiking-thumb.jpg",
      "description": "The pack worn on a mountain trail hike"
    },
    {
      "@type": "ImageObject",
      "url": "https://merchant.com/media/trail-pack-commute-thumb.jpg",
      "description": "The same pack used as a daily bike commuter bag"
    }
  ],
  "duration": "PT2M05S",
  "uploadDate": "2026-03-15"
}
```

Captions and transcripts serve consumers in audio-restricted contexts, consumers using accessibility tools, and consumers parsing the sheet without rendering the video.

## Why a question has one accepted answer

For "Product Q&A" in [`product.md`](product.md#product-qa).

The affordance uses Schema.org's native `Question` and `Answer` vocabulary with `acceptedAnswer` linking them; no `pagefront:` term is minted because Schema.org already covers the shape.

Questions and their answers are language-scoped to the sheet's `inLanguage`, like all other prose fields. A French-language sheet carries French-language Q&A; an English-language sheet carries English-language Q&A. Cross-language sibling sheets carry parallel Q&A in their respective languages.

v0.7 follows Schema.org's pattern of a single `acceptedAnswer` per question. Schema.org also defines a `suggestedAnswer` array for community-style Q&A; publishers MAY use it, but the typical Pagefront case (publisher-authored Q&A about their own product) is a single authoritative answer.

## Why feature groups are minted

For "Feature groups" in [`product.md`](product.md#feature-groups).

The extension trigger is **Schema.org under-specification**: Schema.org's `additionalProperty` carries name/value pairs, but as one flat list. It has no grouping (which section does a row belong to), no ordering (sections and rows render in a merchant-chosen order that carries editorial intent), and no split between the raw comparable value and the merchant's display formatting. Consumers comparing products need the raw values; consumers rendering a spec table need the structure.

The shape is composition over inheritance: only the grouping shell is minted, and the rows inside it stay Schema.org-native `PropertyValue` objects.

Feature groups carry *specifications*: facts with a name and a value. They do not replace `additionalProperty` in its existing structural roles (image/video role declarations, variant axis values, the `age_warning` convention), which continue unchanged. A producer migrating a flat spec list into groups moves the rows; a producer with no grouping on the page can keep emitting flat `additionalProperty`: feature groups are for pages that actually group. A worked example against real merchant content is the Whitebird sheet (v0.9, 2026-08-11). It shows a foil-board size family's spec table promoted from per-variant `additionalProperty` rows, with registry and producer-defined `propertyID`s and dual-unit display strings in `pagefront:presentationValue`.

The registry is a coordination artifact (convergence by producer opt-in); a registry-*enforced* cross-publisher comparison contract remains open, tracked as open design question #26.

The audio example draws `driver_size` and `active_noise_cancellation` from the Pagefront Property Registry (both `status: proposed`). `earcup_fold_mechanism` has no registry entry and is producer-defined: producers MAY mint IDs like it for facets too idiosyncratic to standardize, and consumers MUST treat them as opaque but usable, the same rule the registry gives any unregistered `propertyID` (see "Variant dimensions").

```json
"pagefront:featureGroup": [
  {
    "@type": "pagefront:FeatureGroup",
    "name": "Audio",
    "sortOrder": 1,
    "feature": [
      {
        "@type": "PropertyValue",
        "propertyID": "driver_size",
        "name": "Driver size",
        "value": 40,
        "unitCode": "MMT"
      },
      {
        "@type": "PropertyValue",
        "propertyID": "active_noise_cancellation",
        "name": "Active noise cancellation",
        "value": true
      },
      {
        "@type": "PropertyValue",
        "propertyID": "earcup_fold_mechanism",
        "name": "Earcup fold mechanism",
        "value": "Flat-folding hinge"
      }
    ]
  },
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
        "pagefront:presentationValue": "Up to 30 h (ANC on)",
        "description": "Measured at 50% volume with active noise cancellation enabled."
      }
    ]
  }
]
```

## Why `pagefront:presentationValue` exists

For `pagefront:presentationValue` in [`product.md`](product.md#feature-groups).

`pagefront:presentationValue` exists because `PropertyValue` has no field that can carry display formatting cleanly. Merchants render values like "Up to 30 h (ANC on)" where the comparable quantity is `30` `HUR`. The display string carries qualifiers and locale formatting that must not pollute `value` (a consumer comparing battery life needs `30`), and overloading `description` would conflate formatting with explanation. So the raw value goes in Schema.org's `value`, and the display string, when the merchant has one, goes in `pagefront:presentationValue`.

## Why product highlights are minted and ordered

For "Product highlights" in [`product.md`](product.md#product-highlights).

The extension trigger is a **Schema.org gap**: no Schema.org property carries an ordered, publisher-curated highlight list. `description` is continuous prose; `additionalProperty` is specification data; neither expresses "these three points, in this order, are what the merchant leads with." The ordering is part of the signal, so the term is marked `@container: @list` in the JSON-LD context to survive JSON-LD processing, which otherwise treats arrays as unordered sets.

Highlights are the merchant's editorial voice. Auto-generated bullets (summarized from the description, extracted by a pipeline, produced by a model) are excluded, consistent with the spec's stance on generated text in "Textual framing for media": a consumer can summarize the Sheet on its own terms; what it cannot derive is what the *merchant* chose to lead with. 3–10 entries are recommended. One entry is not a ranking, and past ten the list stops being "what matters most." The validator's linter (rule PDP-W-022) warns on empty or whitespace-only entries, which typically indicate an extraction failure.

```json
"pagefront:productHighlights": [
  "30-hour battery life with active noise cancellation",
  "Multipoint Bluetooth — paired to two devices at once",
  "Foldable aluminium frame at 220 g",
  "Replaceable ear cushions sold as spare parts"
]
```

## Why the document roles are cut where they are

For "Documents" in [`product.md`](product.md#documents).

`pagefront:document` surfaces typed product-related documents that Schema.org under-specifies on `Product`: manuals, spec sheets, compatibility lists, assembly instructions, care guides, warranty documents, certificates, environmental declarations, audit reports, lab tests, safety data sheets, installation guides, user guides, quick-start cards, brochures.

`compatibility` is distinct from `spec_sheet`: a spec sheet states the product's own properties, whereas a compatibility document answers whether it interoperates with something else. A compatibility document's *contents* are candidates for structured expression. Where the compatible products are identifiable, publishers SHOULD also emit `pagefront:relatedProduct` entries with `relationship: compatible_with`, so consumers can answer compatibility questions from structured data. The `compatibility` document role links the human-readable artifact; it does not replace the relationships themselves where those can be expressed.

`repairability_index` is cross-category and regulation-driven. Distinct from `certificate`, on the same rationale that separates `environmental_declaration`: a certificate is a conformity attestation, whereas this is a standardized regulatory disclosure. The document carries the score; a structured repairability *score* field (numeric value, scale, jurisdiction) is not modeled in v0.8 and is recorded as an open design question.

`recall_notice` links the artifact; it does not replace the structured notice. The division of labor is the same as `compatibility` versus `compatible_with` relationships.

`declaration_of_conformity` is distinct from `certificate`: a certificate is issued by a third party (a certification body attesting conformity), whereas a DoC is the manufacturer's own legal declaration.

Category-specific roles (e.g., `dental_imaging_protocol` for medical devices) are out of scope in v0.7; publishers needing category-specific framing SHOULD use the closest enum value and convey specifics in `name` and `description`.

```json
"pagefront:document": [
  {
    "@type": "pagefront:Document",
    "url": "https://merchant.com/docs/widget-manual.en.pdf",
    "role": "manual",
    "name": "Widget Owner's Manual",
    "inLanguage": "en",
    "description": "Full owner's manual covering setup, operation, and maintenance.",
    "encodingFormat": "application/pdf"
  },
  {
    "@type": "pagefront:Document",
    "url": "https://merchant.com/docs/widget-sds.pdf",
    "role": "safety_data_sheet",
    "name": "Widget Safety Data Sheet",
    "inLanguage": "en"
  }
]
```

## Why legal entities are role-typed

For "Legal entities" in [`product.md`](product.md#legal-entities).

The driver is regulation: the EU General Product Safety Regulation (GPSR) requires products sold into the EU to name a responsible economic operator established in the EU, and licensed goods routinely separate the brand owner from the licensee that actually manufactures and markets the product. Agents fielding "who is legally behind this product?" (for safety recalls, compliance checks, warranty claims) need the entities *and their roles*.

The extension trigger is **Schema.org under-specification**: Schema.org's `manufacturer` names one organization in one fixed role. It has no typing for the other roles regulation distinguishes (a licensee, an authorized representative, an importer), and consumers cannot dispatch on a role the vocabulary cannot express.

Schema.org's native `manufacturer` field remains valid and unchanged: a Sheet MAY carry both, and simple consumers keep reading `manufacturer` without knowing about roles. `pagefront:legalEntity` is for role-typed, compliance-grade declarations. Compliance declarations typically need the postal address. A worked example against real merchant content is the Whitebird sheet (v0.9, 2026-08-11). It shows a grounded `brand_owner` entry with postal address, with the ungroundable roles withheld.

A licensed product imported into the EU, with three role-typed entities in the fully-inline form (the licensee and the authorized representative are the entities that stay inline):

```json
"pagefront:legalEntity": [
  {
    "@type": "pagefront:LegalEntity",
    "role": "brand_owner",
    "organization": {
      "@type": "Organization",
      "name": "Meridian Gear AG",
      "url": "https://meridiangear.com"
    }
  },
  {
    "@type": "pagefront:LegalEntity",
    "role": "licensee",
    "organization": {
      "@type": "Organization",
      "name": "Nordlicht Manufacturing GmbH",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Industriestraße 14",
        "postalCode": "28199",
        "addressLocality": "Bremen",
        "addressCountry": "DE"
      }
    }
  },
  {
    "@type": "pagefront:LegalEntity",
    "role": "authorized_representative",
    "organization": {
      "@type": "Organization",
      "name": "EU Compliance Partners B.V.",
      "email": "gpsr@eucompliancepartners.example",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Keizersgracht 62",
        "postalCode": "1015 CS",
        "addressLocality": "Amsterdam",
        "addressCountry": "NL"
      }
    }
  }
]
```

## Why the reference form does not replace the inline form

For "Referencing a Commerce Organization Sheet" in [`product.md`](product.md#referencing-a-commerce-organization-sheet).

The reference form removes the drift-prone duplication of stable organization data across every product the brand sells. An `authorized_representative` or `importer` has nothing to reference, and GPSR Art. 19 wants the responsible entity resolvable at the listing itself; compliance-grade data stays on the product.

The reference form does not replace the inline form. `authorized_representative` and `importer` are per-product, per-market facts about third parties, and `manufacturer` ≠ `brand_owner` for licensed goods; the manufacturing licensee is named only at the product. The reference form needs no new machinery. A Schema.org `Organization` reduced to `@type` + `@id` is already a reference stub, and the linter's existing stub-vs-inline distinction (PDP-E-001 / PDP-W-020) applies unchanged. The v0.8 schema requires `organization.name`, so the stub form fails Layer 1 until the v0.9 schema makes `name` optional when `@id` is present; the SHOULD in the spec is contingent on that relaxation landing in the same cut. The linter exempts reference stubs from PDP-W-024, the no-postal-address warning, in the same cut, because the address lives on the referenced sheet and the warning would be a false positive on a pure pointer.

## Why safety warnings are verbatim and per language

For "Safety warnings" in [`product.md`](product.md#safety-warnings).

The extension trigger is a **Schema.org gap**: Schema.org has no product-safety-warning vocabulary.

The merchant's published wording is the compliance artifact, and a paraphrase is a new, unreviewed safety statement.

GPSR requires safety information in the language of the member state where the product is sold, and the per-language sibling sheets (`pagefront:availableLanguages`) are the mechanism that satisfies it. Conventions for `hazardCategory` stabilize through real-merchant use, as with the variant-dimension registry.

```json
"pagefront:safetyWarning": [
  {
    "@type": "pagefront:SafetyWarning",
    "text": "WARNING! Not suitable for children under 36 months. Contains small parts — choking hazard.",
    "pictogram": "https://merchant.com/images/warning-0-3.svg",
    "hazardCategory": "choking_hazard"
  },
  {
    "@type": "pagefront:SafetyWarning",
    "text": "Keep away from open flame. The stuffing is flammable.",
    "hazardCategory": "fire"
  }
]
```

## Why safety notices are a field of their own

For "Safety notices" in [`product.md`](product.md#safety-notices).

The extension trigger is a **Schema.org gap**: `availability: "https://schema.org/Discontinued"` means "no longer sold." It does not mean "dangerous — return it." Schema.org has no vocabulary for recalls, hazards, or remedies, and a consumer that reads a recalled product's Sheet as merely discontinued fails the buyer.

The field is absent on virtually all sheets; it is present only when the product is under a recall or a formal safety warning. The validator's linter (rule PDP-W-023) warns when a `recall` notice coexists with an `InStock` offer, usually a sign the merchant's page has not caught up with the recall. The `recall_notice` document role links the human-readable notice artifact; the structured `pagefront:safetyNotice` is what consumers act on, and the document does not replace it. This is the same division of labor as the `compatibility` role versus `compatible_with` relationships.

```json
"pagefront:safetyNotice": [
  {
    "@type": "pagefront:SafetyNotice",
    "noticeType": "recall",
    "hazard": "The power adapter's insulation can degrade, presenting an electric-shock hazard.",
    "remedy": "replacement",
    "description": "Stop using the adapter and request a free replacement. The lamp itself is unaffected.",
    "reference": "https://ec.europa.eu/safety-gate-alerts/screen/webReport/alertDetail/10012345",
    "datePublished": "2026-05-12",
    "url": "https://merchant.com/safety/studio-pendant-adapter-recall"
  }
]
```

## Why related products are typed

For "Related products" in [`product.md`](product.md#related-products).

Schema.org has loose relations (`isRelatedTo`, `isSimilarTo`, `isAccessoryOrSparePartFor`, `isConsumableFor`) but these are untyped beyond the four built-in relations and don't carry the typed-relationship semantics agents need for context-aware recommendations. Schema.org's `isAccessoryOrSparePartFor` fuses two distinct relationships into one untyped property. Pagefront separates them: `accessory` (an optional add-on that extends the product) and `spare_part` (a replacement for a component the product already has, ordered on wear or failure). Consumers act on the difference (an accessory is an upsell, a spare part is aftermarket support), so the distinction is typed; the consumer does not have to infer it from the target product's name.

`spare_part` is distinct from `required_part`: a required part is needed for the product to function at all, whereas a spare part replaces something the product already has. `recommended_with` is a complementary pairing curated by the publisher; the lens cap with the camera is typically better expressed as `accessory`. The "with" carries semantic weight: the relationship asserts that the related product *pairs* with the source product. This is narrower than the spec's earlier framing. Generic "You may also like" surfaces, where the publisher isn't asserting complementarity, do NOT belong here. `service` is distinct from `accessory`, which is a physical add-on; a `service` target is a service product the merchant sells against this product. Distinct also from warranty *documents*: a `pagefront:document` entry with `role: "warranty"` carries the terms of the warranty already included with the product, whereas a `service` relationship targets a separately purchasable service (an *extended* warranty is a `service`; the included warranty's terms are a document).

The "You may also like" pattern, common on small-shop product pages, is brand-internal browsing: the publisher is surfacing other items in their catalog without asserting any complementarity claim. This belongs in Schema.org's native `isRelatedTo` (without `description`, since the framing prose carries no semantic content beyond generic adjacency). The same applies at any catalog scale: when the publisher isn't asserting complementarity, the relationship is adjacency.

A `pagefront:relatedProduct` entry identifies its target in one of two forms: an `@id` reference to another Pagefront Sheet (for same-publisher products) or a Schema.org identifier such as `gtin13` (for cross-merchant references). Both appear here:

```json
"pagefront:relatedProduct": [
  {
    "@type": "pagefront:RelatedProduct",
    "relationship": "accessory",
    "@id": "https://merchant.com/pagefront/commerce/product/widget-strap-leather.en.json",
    "name": "Widget Leather Strap",
    "url": "https://merchant.com/product/widget-strap-leather",
    "image": "https://merchant.com/images/widget-strap-leather-packshot.jpg"
  },
  {
    "@type": "pagefront:RelatedProduct",
    "relationship": "compatible_with",
    "gtin13": "0194253715559",
    "name": "MacBook Pro 14\" (M3, 2023)",
    "url": "https://www.apple.com/shop/buy-mac/macbook-pro",
    "image": "https://www.apple.com/images/macbook-pro-14-hero.jpg"
  }
]
```

## Why `image` on a related product mirrors Schema.org's

For `image` on a related product in [`product.md`](product.md#related-products).

The Schema.org-native relationship fields are parallel: `isRelatedTo`, `isSimilarTo`, and `hasPart` reference a Schema.org `Product`, which carries its own `image` property (a URL or `ImageObject`) via the `additionalProperties: true` policy. The `image` field on `pagefront:relatedProduct` provides the same render-hint capability for typed relationships that the Schema.org `Product` reference already provides for untyped ones. Both are the same convention, an image via Schema.org's `image`, surfaced through different mechanisms because `pagefront:relatedProduct` is a closed Pagefront extension while the Schema.org relationship fields are open.

## Why typed relationships divide along operational and marketing lines

For "Operationally-tracked vs. marketing-curated relationships" in [`product.md`](product.md#operationally-tracked-vs-marketing-curated-relationships).

The typed relationships in the closed enum divide along a scale-dependent line in how publishers declare them.

Some are **operationally tracked** by publishers regardless of catalog size: `accessory`, `consumable`, `required_part`, `spare_part`, `replaces`, `replaced_by`, `bundle_component`, `compatible_with`, and `service`. These relationships reflect business operations (inventory, product hierarchy, parts management, lifecycle, service offerings) that publishers maintain because commerce requires them. A publisher with 10,000+ SKUs still knows which products are accessories of which, because it must manage that inventory.

Others are **marketing-declared**: `often_bought_with` and `recommended_with`. These work cleanly at small catalog scales where marketing teams hand-curate pairings. At larger scales, the same relationships are typically generated by recommendation engines (SearchSpring, Dynamic Yield, Algolia Recommend, Shopify recommendations) and displayed in publisher-controlled UIs but not individually declared by the publisher. Recommendation-engine output is publisher-surfaced without being publisher-declared.

For the marketing-shaped values specifically: `often_bought_with` is used when the publisher has explicitly identified a co-purchase pattern (sometimes surfaced as a merchandising rule, sometimes manually curated as "frequently bought together"); raw recommendation-engine output stays out even when the engine claims to compute co-purchase data, and goes to `isRelatedTo` unless the publisher has reviewed and endorsed specific pairings. `recommended_with` is used when the publisher has manually curated a pairing in their content management system (a marketing editor selecting "this product pairs with this one"); Storyblok's `linked_products` field with editor-populated values is a representative example. Recommendation-engine output stays out even when displayed in a "Recommended" UI section.

Rule-based generation is an intermediate case. When a publisher defines a rule that produces relationships (e.g., "show all watch straps for any watch product"), the rule itself is a publisher declaration, but each specific pairing is generated by the rule. Producers SHOULD treat these as `isRelatedTo`, since the publisher's declaration is at the rule level and no specific pairing was individually curated.

## Why a typed relationship needs a structured identifier

For "The structured-identifier requirement" in [`product.md`](product.md#the-structured-identifier-requirement).

The reason is the typed extension's contract: a typed relationship implies the consumer can act on the target (dereference it, fetch its Sheet, compare offers), and a name plus a link is too thin for that.

Schema.org's `isRelatedTo` carries no such requirement. A reference with only `name` and `url` is a valid Schema.org `Product` reference, permitted via the `additionalProperties: true` policy on Schema.org-typed blocks.

A typed relationship without a structured identifier is still untyped from the schema's perspective, because the consumer can't act on the typing without something to dereference. An algorithmic recommendation that happens to carry a SKU is still untyped from the operational perspective, because the publisher never declared the relationship type.

The schema rejects a `pagefront:relatedProduct` entry that carries no identifier key at all, but it checks only that an identifier is *present*, and an empty or non-URL-shaped identifier passes Layer 1. The validator's linter (rule PDP-W-019) closes that gap: it warns when a `pagefront:relatedProduct` entry carries a structured identifier that is present but empty, whitespace-only, or not dereferenceable, signalling that the reference should either gain a real identifier or move to `isRelatedTo`.

A publisher-curated pairing that carries only a name and URL (no `sku`, `gtin`, or `@id`) is emitted as `isRelatedTo`, because it does not meet `pagefront:relatedProduct`'s identifier requirement even though the publisher curated it:

```json
"isRelatedTo": [
  {
    "@type": "Product",
    "name": "Widget Cleaning Kit",
    "url": "https://merchant.com/product/widget-cleaning-kit"
  }
]
```

The same relationship, once a structured identifier is available (here a `sku`), can be emitted as a typed `pagefront:relatedProduct` entry:

```json
"pagefront:relatedProduct": [
  {
    "@type": "pagefront:RelatedProduct",
    "relationship": "consumable",
    "sku": "WID-CLEAN-01",
    "name": "Widget Cleaning Kit",
    "url": "https://merchant.com/product/widget-cleaning-kit"
  }
]
```

## How the five relationship patterns map a product page

For "Five patterns for product-to-product relationships" in [`product.md`](product.md#five-patterns-for-product-to-product-relationships).

Product-to-product relationships in Pagefront Sheets come in five recognizable patterns, each with a distinct Schema.org or Pagefront field. Producers should choose the field that matches the relationship's actual semantics.

**Pattern 1: `pagefront:relatedProduct` with a typed enum value.** For operationally-tracked relationships (`accessory`, `consumable`, `required_part`, `spare_part`, `replaces`, `replaced_by`, `bundle_component`, `compatible_with`, `service`), where the relationship type changes consumer behavior. Use when the merchant's operational data declares the typed relationship explicitly.

**Pattern 2: Schema.org `isSimilarTo`.** For products the publisher asserts are similar: same kind, same use case, same general category. Schema.org defines `isSimilarTo` as products "of approximately the same kind." Use when the merchant surfaces "similar styles" or "alternatives" (products that could substitute for the source product).

**Pattern 3: Schema.org `isPartOf` / `hasPart` for family or collection membership.** When the source product belongs to a named collection or family and the relationship being expressed is "siblings within that family," the right model is the family itself as a first-class entity. Use `isPartOf` to declare the source product's membership in the family; the family entity carries `hasPart` pointing at sibling members. These siblings belong to the same family. A plain "related" reference to the source product would lose that membership. The family entity can be modeled as a Schema.org `Collection` or `ProductGroup` with `name`, `url`, and `hasPart` entries. Where the publisher emits Commerce Collection Sheets ([`collection.md`](collection.md)), the family and the series are sheets of their own: the product's `isPartOf` entry references the set in the member entry shape and nests no `isPartOf` of its own, since the hierarchy lives in the sheets. The inline nesting stays valid for a publisher without collection sheets.

Pattern 3 also covers **named family and series hierarchies**: a brand whose catalog is organized as family → series → product, the way Apple's iPod family contained the Touch series. The hierarchy is expressed by nesting: the product declares `isPartOf` its series, and the series entity itself declares `isPartOf` the family. Two levels of `isPartOf` carry the full lineage; consumers walk up as far as the Sheet nests. Each level is a `Collection` (a curated grouping of distinct products) or a `ProductGroup` (when that level's members are variants of one product). The nesting depth is the producer's choice: a Sheet MAY declare only the immediate series when the family adds nothing consumers act on, and MAY nest further when the merchant's catalog has more levels. Sibling enumeration stays where it was: the series entity's `hasPart` lists the series' members, as in the single-level case.

**Pattern 4: Schema.org `isRelatedTo` with `description`.** For adjacency relationships where the publisher surfaces framing prose alongside the recommendation: descriptor text, headline framing, or carousel-level intent that carries semantic content beyond pure adjacency. Use Schema.org's `description` field on each `Product` reference to preserve the framing. Example: a "More in this color" carousel preserves the framing via `description` fields on each `Product` reference, distinguishing this color-extension recommendation from pure algorithmic adjacency.

**Pattern 5: Schema.org `isRelatedTo` without `description`.** For pure algorithmic adjacency: recommendation-engine output without semantic framing. The publisher displays these but doesn't frame them; the carousel heading is generic ("You may also like," "We think you'd like," "Customers also viewed"). Use `isRelatedTo` without `description`; the relationship is untyped adjacency.

Producers should map each carousel or recommendation surface to the matching pattern based on what the publisher actually communicates. A single product page often carries several at once: a "Similar Styles" carousel (→ `isSimilarTo`), a "More in this color" carousel (→ `isRelatedTo` with `description`), an "Explore the collection" carousel (→ `isPartOf`/`hasPart`), and a generic "You may also like" carousel (→ `isRelatedTo` without `description`).

The patterns coexist cleanly on a single `Product` when the merchant's page surfaces multiple relationship types:

```json
{
  "@type": "Product",
  "name": "Lounge Sleep Set",

  "pagefront:relatedProduct": [
    {
      "@type": "pagefront:RelatedProduct",
      "relationship": "recommended_with",
      "sku": "LSS-SLEEP-MASK-01",
      "name": "Lounge Sleep Mask",
      "url": "https://merchant.com/products/lounge-sleep-mask"
    }
  ],

  "isSimilarTo": [
    {
      "@type": "Product",
      "name": "Lounge Long Slip Dress",
      "url": "https://merchant.com/products/lounge-long-slip-dress"
    }
  ],

  "isPartOf": {
    "@type": "Collection",
    "name": "Lounge",
    "url": "https://merchant.com/collections/lounge",
    "hasPart": [
      {
        "@type": "Product",
        "name": "Lounge Long Sleeve",
        "url": "https://merchant.com/products/lounge-long-sleeve"
      },
      {
        "@type": "Product",
        "name": "Lounge Pant",
        "url": "https://merchant.com/products/lounge-pant"
      }
    ]
  },

  "isRelatedTo": [
    {
      "@type": "Product",
      "name": "Lounge Sleep Set — Onyx",
      "url": "https://merchant.com/products/lounge-sleep-set?color=onyx",
      "description": "More in this color — the Lounge Sleep Set in the Onyx colorway."
    },
    {
      "@type": "Product",
      "name": "Cotton Rib Tank",
      "url": "https://merchant.com/products/cotton-rib-tank"
    }
  ]
}
```

The two `isRelatedTo` entries above show Patterns 4 and 5 sharing one field: the first carries `description` (a framed "More in this color" recommendation, Pattern 4), the second does not (pure "We Think You'd Like" adjacency, Pattern 5). The presence or absence of `description` distinguishes the two patterns.

## Why a bundle is a relationship or a product

For "Bundles" in [`product.md`](product.md#bundles).

Bundles appear in two structurally different forms, and they use different vocabulary.

**Bundle as relationship.** Separately-sellable products bundled WITH a primary product. Picture a paddle board sold with a set of accessories (a wheelie backpack, a carbon paddle, a hand pump, a fin, a leash), each separately priced and separately sold, bundled with the board. From the board's perspective, each is a `bundle_component`: use `pagefront:relatedProduct` with `relationship: bundle_component` and a structured identifier (`sku`, `gtin`, `@id`) for each. Each component is a real product the merchant sells; the relationship declares it travels with the board.

**Bundle as product.** A bundle that is itself a sellable entity, with its own name, price, and product page, composed of named component products. Picture a "kayak conversion bundle" sold as a single purchasable unit at its own discounted price, a paddle board plus the parts that convert it to a kayak. That bundle is a product in its own right. It does not belong in the relationship fields. Model it with Schema.org's `ProductCollection` type, which Schema.org defines for this case (a set of products offered together, e.g. a camera plus a lens). Use `includesObject` pointing at `TypeAndQuantityNode` entries to list the component products and their quantities, and an `Offer` for the bundle's price.

`ProductCollection` is Schema.org-native, so no Pagefront extension is needed. It is newer and less widely supported than `Product`; a consumer that doesn't recognize it falls back to its supertype `Collection` and can still read the `includesObject` entries.

Reserve `bundle_component` for components that ship WITH the product being described. A separately-sold bundle that another product's Sheet links to is its own `ProductCollection`, in its own Sheet. It is referenced from elsewhere with `pagefront:relatedProduct`, typically `recommended_with` or `accessory`, since the referencing product functions without it; `bundle_component` does not apply because the bundle does not ship with the referencing product.

A "bundled with" component sometimes can't be resolved to a structured identifier: the page names and prices it but exposes no link or SKU, and the producer can't resolve it via catalog lookup, platform API, or sitemap. Because `pagefront:relatedProduct` requires an identifier, such a component can't be a `bundle_component`. Keep it in the Sheet, because the buyer still receives it. Use Schema.org's `hasPart`, which has no identifier requirement; a `hasPart` entry with only a `name` is valid (add price via `additionalProperty` or an embedded `Offer` if the page shows it). The resolution order for "included with" components is: (1) resolve to an identifier → `pagefront:relatedProduct` with `bundle_component`; (2) resolution fails → Schema.org `hasPart` with the name (and price if shown); (3) in either case the component stays in the Sheet.

## Why `price` is the displayed consumer price

For `price` in [`product.md`](product.md#offers).

`price` on a consumer Offer is the displayed consumer price for the offer's declared region: the unit amount a consumer in that region is shown and pays for the item itself, in `priceCurrency`, at the moment the sheet was generated. Where that region's consumer-protection law requires displayed prices to include value-added tax, `price` includes it. Where the prevailing convention displays prices before sales tax added at checkout, `price` excludes it. In both cases `price` excludes shipping, which is declared on `shippingDetails` or resolved from the seller sheet's `pagefront:fulfillmentTerms`.

EU price-indication law defines the price a trader must display to a consumer as the final unit price including VAT and all other taxes: Directive 98/6/EC, Article 2(a) ("selling price shall mean the final price for a unit of the product, or a given quantity of the product, including VAT and all other taxes"), as amended by Directive (EU) 2019/2161, consolidated text in force since 28 May 2022. The shipping exclusion follows Directive 2011/83/EU, Article 6(1)(e), under which freight, delivery and postal charges are disclosed as additional charges beside the total price. That article governs the checkout-time total price, and it is cited here for the shipping exclusion alone.

Taking `price` from the rendered page is a producer obligation: a linter can detect a missing tax-basis statement (PDP-W-028), and whether a stated basis is true lies beyond what any linter can check.

## Why returns and shipping default to the seller sheet

For "Return policy" in [`product.md`](product.md#return-policy).

The store-wide return policy is a property of the seller. It lives on the seller block of the seller's Commerce Organization Sheet as `hasMerchantReturnPolicy`, stated once, so it does not duplicate and drift across Product Sheets. A product carries terms only where it deviates: a final-sale item, or a made-to-order product, whose returns exceptions already live in `pagefront:madeToOrderTerms` and stay there.

This is the format's one semantic cross-sheet dependency: answering "can I return this product" may require the seller sheet when the product is silent. The read rides the existing `Offer.seller` edge and stays `@id`-keyed for identity; `pagefront:sheetUrl` on the seller reference says where the seller sheet is. It is scoped to return and shipping terms; it does NOT generalize to other fields.

Shipping follows the same default-plus-override pattern, via minted vocabulary: store-wide shipping terms live on the seller sheet as `pagefront:fulfillmentTerms`, an array of Schema.org-native `OfferShippingDetails` objects, and an Offer carries `shippingDetails` only when the product deviates from those terms (bulky items with their own shipping rates, made-to-order lead times). `pagefront:fulfillmentTerms` is minted in the vocabulary alongside the Commerce Organization Sheet for the same reason. v0.9 removed `hasMerchantReturnPolicy` and `shippingDetails` from the routine Offer shape; both remain valid as per-product overrides.

## Why a warranty goes where the guarantor is

For "Warranty" in [`product.md`](product.md#warranty).

Schema.org defines `warranty` on `Offer` (and `Demand`) only, and has no product-level warranty property. A warranty given by the seller is part of the offer. A warranty given by the manufacturer belongs to the product, follows it across every retailer, and is claimed against the manufacturer, so `pagefront:manufacturerWarranty` is minted on the Product, which is also where a manufacturer's own sheet, which may carry no Offer at all, states its warranty. The distinction matters to consumers because the claim path and the portability differ.

A retailer's sheet may carry both: the manufacturer's warranty on the Product and its own on the Offer. Where the warranty is the same across markets the entries are identical; where it differs by market, each Offer states its own. `WarrantyPromise` inherits `name` from `Thing`.

A manufacturer's lifetime warranty on the Product, on the manufacturer's own sheet:

```json
{
  "@context": [
    "https://schema.org",
    { "pagefront": "https://themachineweb.org/pagefront/vocabulary/" }
  ],
  "@type": "Product",
  "@id": "https://meridiangear.com/pagefront/commerce/product/headlamp-400.en.json",
  "name": "Meridian Headlamp 400",
  "inLanguage": "en",
  "sku": "MER-HL400",
  "url": "https://meridiangear.com/products/headlamp-400",
  "pagefront:manufacturerWarranty": {
    "@type": "WarrantyPromise",
    "name": "Lifetime Warranty",
    "description": "Meridian repairs or replaces any headlamp that fails because of a manufacturing defect, for as long as you own it."
  }
}
```

## Why delivery modes stay apart from shipping details

For "Delivery" in [`product.md`](product.md#delivery).

Pages describe how the customer receives an item as "delivery". Schema.org files delivery cost, destination and timing under `shippingDetails` and the mode under `availableDeliveryMethod`, whose `DeliveryMethod` enumeration has three members in Schema.org 30.1. Pagefront uses both names unchanged and keeps the facts apart.

## Why checkout is a one-variable template

For "Where to buy" in [`product.md`](product.md#where-to-buy).

A checkout template uses only the variables Pagefront defines, so that a consumer can fill every placeholder; the offer itself identifies the item, so a template does not take a product or variant identifier. Checkout depends on the market, hence the region requirement. The source rule mirrors the sheet-URL rule: a producer does not construct a checkout URL from a platform's URL pattern, for the same reason it does not construct sheet URLs. A sheet carrying more than one Offer gives each its `url` because offers for different markets are often bought on different pages.

Programmatic purchase, an endpoint a program calls to place an order, as described by Schema.org's `potentialAction` with a `BuyAction`, involves authentication, payment and order creation. It is a transaction protocol, and Pagefront describes offers, so Pagefront does not specify it. An Offer may carry it; consumers act on it under that protocol's terms, and this document says nothing about them. Where an item is not sold on the page at all, as on a manufacturer's own product page, there is no Offer and no checkout; directing shoppers to the retailers that sell it is not covered here.

Both properties are Schema.org's own, so "Where to buy" mints no `pagefront:` term and the Offer block admits them without a schema change; it was added in release 0.5.0, and its four linter rules (PDP-E-019, PDP-E-020, PDP-E-021, PDP-W-040) apply from that release.

## Why `itemOffered` may be omitted on a single Offer

For "itemOffered references" in [`product.md`](product.md#itemoffered-references).

For single-Offer sheets where the `itemOffered` is unambiguously the root product, Schema.org consumers infer it from the Offer's position on the Product; with several Offers the reference is what ties each to its variant.

```json
"offers": [
  {
    "@type": "Offer",
    "@id": "https://merchant.com/product/whitebird-mid-length#offer-58",
    "itemOffered": { "@id": "https://merchant.com/product/whitebird-mid-length#size-58" },
    "price": "1299.00",
    "priceCurrency": "EUR"
  }
]
```

## Why `@id` is matched as an exact string

For "Product identity and deduplication" in [`product.md`](product.md#product-identity-and-deduplication).

Consumers frequently encounter the same product referenced from multiple Sheets: a product's own Sheet, and references to it via `isRelatedTo`, `isSimilarTo`, `isPartOf`/`hasPart`, or `pagefront:relatedProduct` from other Sheets. To recognize these as the same product (deduplication), consumers rely on identity, and the identity key is `@id`. Per JSON-LD semantics, two references carrying the same `@id` denote the same product.

JSON-LD does not normalize `@id` values before comparison. Two `@id`s that differ as strings, such as by a locale prefix (`/en-fr/`), a trailing slash, a query parameter, or a `?variant=` suffix, do NOT match even when they are semantically equivalent, and dedup fails. A reference whose `@id` differs from the target product's own declared `@id` breaks deduplication even when both point at the same product.

When a producer cannot construct a consistent `@id` for a reference (typically because the referenced product's identity cannot be resolved from the referencing context), the reference carries a stable secondary identifier so consumers can deduplicate on identity even when `@id`s are absent or inconsistent; every listed GTIN identifies the product.

Producers are free to derive `@id` by any stable, deterministic rule (from the canonical URL, from a SKU, or otherwise); the spec does not prescribe the derivation. What the spec requires is consistency: the same product yields the same `@id` string across its own Sheet and all references to it. Producers deriving `@id` from a URL must normalize that URL consistently across both paths, or dedup will silently fail on normalization differences.

## Why `sameAs` is a hint

For "Cross-merchant canonical reference via `sameAs`" in [`product.md`](product.md#cross-merchant-canonical-reference-via-sameas).

A reseller's Sheet describes the reseller's own page for a product whose brand publishes a canonical page of its own. The reseller's Sheet carries Schema.org's `sameAs` pointing at the brand's canonical product page, so consumers can connect the reseller's listing to the manufacturer's authoritative presentation of the same product: for enrichment, for cross-merchant offer comparison, and for clustering listings of one product across sellers.

`sameAs` is a deduplication hint. `@id` is the identity key, matched as an exact string: consumers deduplicate on `@id` when present and consistent, fall back to secondary identifiers (`sku`, `gtin`, `gtin13`, `mpn`, `productID`) otherwise, and MAY use a shared `sameAs` target as an additional correlation signal when clustering cross-merchant listings.

```json
{
  "@type": "Product",
  "@id": "https://reseller.com/pagefront/commerce/product/meridian-headlamp-400.en.json",
  "name": "Meridian Headlamp 400",
  "sku": "MER-HL400",
  "gtin13": "4066544923187",
  "url": "https://reseller.com/products/meridian-headlamp-400",
  "sameAs": "https://meridiangear.com/products/headlamp-400"
}
```

## Why some merchants publish no price

For "Price-on-request offers" in [`product.md`](product.md#price-on-request-offers).

Some merchants intentionally publish no price. Authorized-retailer models (luxury watches, high-end jewelry), quote-based pricing (industrial equipment, bespoke commissions), and regional-reseller routing all share the same pattern: the merchant's product page is real, the product is real, and the price lives behind a contact channel. When a Sheet reflects such a product, the Offer declares `pagefront:priceOnRequest`. `priceCurrency` remains useful even without `price`: it signals what currency the eventual price will be quoted in.

The `method` values in full: `authorized_retailer`, the merchant routes buyers to a curated network of brand-authorized retailers (luxury watches, high-end audio); `dealer_network`, similar in structure to `authorized_retailer` but used for industrial and commercial products with regional dealer coverage; `quote_form`, the merchant provides a structured intake form that produces a quote (made-to-measure, custom configurations, B2B bulk); `email` and `phone`, the merchant directs buyers to an email address or a phone number for pricing; `unspecified`, the merchant has no structured inquiry channel, the product is on the page but the path to pricing is left to the buyer to discover.

The validator's linter (rule PDP-W-016) warns when an Offer has commercial structure (availability, itemCondition, or other Offer fields are present) but lacks both `price`/`priceSpecification` and `pagefront:priceOnRequest`. This catches extraction failures (cases where a price exists on the merchant's page but the pipeline didn't capture it) while letting intentional omissions through.

```json
{
  "@type": "Offer",
  "availability": "https://schema.org/InStock",
  "itemCondition": "https://schema.org/NewCondition",
  "priceCurrency": "EUR",
  "pagefront:priceOnRequest": {
    "@type": "pagefront:PriceOnRequest",
    "method": "authorized_retailer",
    "contactUrl": "https://merchant.com/store-locator",
    "note": "Available exclusively through authorized retailers."
  }
}
```

## Why pricing patterns mint no vocabulary

For "Common pricing patterns" in [`product.md`](product.md#common-pricing-patterns).

Real merchants express pricing in shapes beyond a single `price` + `priceCurrency` pair: regular-vs-sale prices, ranges across variants, quantity-tier discounts, and shipping declared alongside the price. Schema.org covers each natively, so Pagefront mints no typed extensions for them; the patterns are collected in the reference so producers can reach for them directly. Schema.org defines `priceType` on `UnitPriceSpecification`, which is what distinguishes the regular price from the sale price; the Offer's top-level `price` mirrors the `SalePrice` so simple consumers that read only `price` see the current selling price.

## Why a decimal string is recommended for fractional amounts

For "Amounts" in [`product.md`](product.md#amounts).

Both carriers are allowed because Schema.org accepts both for `price`.

A decimal string is recommended when amounts have fractional parts, because JSON numbers are floating point: `"19.99"` is exactly what it writes, and a consumer summing strings in decimal arithmetic gets exact totals. Whole amounts lose nothing as numbers.

Only modifiers and adjustment amounts are signed, since an option can cost less than the base option.

## Why both schema.org schemes are accepted

For `availability` in [`product.md`](product.md#offers).

Sheets in the wild carry `http://schema.org/` and `https://schema.org/` URIs; consumers treat them as semantically equivalent, and new sheets use the `https` form. "Upstream-equivalent forms" states the general rule.

## Why the tax basis belongs to the offer and its region

For "Tax inclusion" in [`product.md`](product.md#tax-inclusion).

The tax basis of a price is a property of the (offer, region) pair. Whether tax is included is jurisdictional: EU and UK displayed prices include VAT, while US prices conventionally exclude sales tax added at checkout. The amount is jurisdictional too: under destination-based VAT the same product carries different gross prices across member states. A sheet's several region-scoped Offers may therefore each carry a different basis, and neither the sheet nor the seller has a single basis of its own.

Directive 98/6/EC governs products offered by traders to consumers; net pricing on a trade sheet falls outside its scope.

When the flag is absent, consumers read `price` as the displayed consumer price per the rule above and cannot tell whether tax was included. When the merchant does not state the basis, the missing flag records that the basis was not stated.

## Why `UnitPriceSpecification` carries the flag

For "Tax inclusion" in [`product.md`](product.md#tax-inclusion).

`UnitPriceSpecification` is the recommended type for the entry, including an entry that carries only `valueAddedTaxIncluded`, as on an `AggregateOffer`, where there is no single `price` to mirror. Two reasons. It is the type the sale-pricing pattern already uses with `priceType`. And it is the type consumers of Schema.org offer markup document for `priceSpecification` entries: Google's merchant listing documentation names `UnitPriceSpecification` and no other price specification type, so the flag sits on the entry type those consumers already parse. An entry of this type needs no unit to carry the flag. `valueAddedTaxIncluded` is defined on its parent `PriceSpecification`, so an existing plain `PriceSpecification` entry carries the flag as well.

```json
{
  "@type": "Offer",
  "price": "2299.00",
  "priceCurrency": "EUR",
  "areaServed": "FR",
  "priceSpecification": [
    {
      "@type": "UnitPriceSpecification",
      "price": "2299.00",
      "priceCurrency": "EUR",
      "valueAddedTaxIncluded": true
    }
  ]
}
```

## Why a sheet may carry no offer

For "When a price cannot be published" under "Tax inclusion" in [`product.md`](product.md#tax-inclusion).

A sheet without an offer is a valid state. It is preferable to an offer whose price is not the rendered price, or whose rendered price disagrees with the merchant's structured data: the first is honestly incomplete, the second may be silently wrong. An unstated VAT basis is not a reason to withhold the offer; it is published without the flag.

An unavailable offer without a price keeps its `url` because that is the page where a shopper can ask to be notified. The checkout rule on such an offer (PDP-E-022) applies from the release that ships this change. `AggregateOffer` is an offer type and carries its own `areaServed` and `priceSpecification` like any other offer; the amounts in a `pagefront:configuratorPricing` block take their currency, region and tax basis from the offer they sit in, so they are as authoritative as that offer's `price`. A VAT-inclusive price depends on a rate that can change, which is why region-scoped offers call for shorter `expires_at` windows, consistent with the existing guidance for multi-currency offers and scheduled promotions.

## Why a discontinued product keeps its sheet

For "Product lifecycle" in [`product.md`](product.md#product-lifecycle).

Agents routinely need to answer "is this product current?": on the market, not yet released, or discontinued and superseded. Schema.org and the existing relationship enum cover each lifecycle signal, so Pagefront mints no vocabulary. `releaseDate` is Schema.org-native on `Product`, and a future `releaseDate` pairs naturally with Offer `availability: "https://schema.org/PreOrder"`.

The Sheet of a discontinued product stays published: the page usually outlives the product, and the Sheet is how agents learn that the product is discontinued, as distinct from out of stock. Pairing the `Discontinued` availability with a `replaced_by` relationship lets a consumer landing on the old product route the buyer forward.

A discontinued product referencing its successor:

```json
{
  "@context": [
    "https://schema.org",
    { "pagefront": "https://themachineweb.org/pagefront/vocabulary/" }
  ],
  "@type": "Product",
  "@id": "https://merchant.com/pagefront/commerce/product/trail-camera-2.en.json",
  "name": "Trail Camera 2",
  "inLanguage": "en",
  "sku": "TRAILCAM-2",
  "url": "https://merchant.com/products/trail-camera-2",
  "releaseDate": "2022-03-01",
  "offers": [
    {
      "@type": "Offer",
      "price": "249.00",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/Discontinued",
      "itemCondition": "https://schema.org/NewCondition"
    }
  ],
  "pagefront:relatedProduct": [
    {
      "@type": "pagefront:RelatedProduct",
      "relationship": "replaced_by",
      "@id": "https://merchant.com/pagefront/commerce/product/trail-camera-3.en.json",
      "name": "Trail Camera 3",
      "url": "https://merchant.com/products/trail-camera-3"
    }
  ]
}
```

## Why `material` and `pagefront:materialComposition` complement each other

For "Materials" in [`product.md`](product.md#materials-material-and-pagefrontmaterialcomposition).

`material` is quick to scan, useful for simple consumers that don't want structure. `pagefront:materialComposition` is useful for sophisticated consumers doing comparison, filtering, sustainability analysis, or authentication.

The two fields complement each other. Producers should populate both when the data supports both. A Sheet declaring `material: "Harmonie leather"` and `pagefront:materialComposition: [{"material": "Harmonie leather"}]` is valid and useful: the flat string answers simple queries, the structured entry leaves room for the decomposition to grow when more data is available.

For multi-material products without percentages (common in luxury goods where named materials matter more than proportions), both fields work: `material: "Goyardine Canvas & Chevroches Calfskin"` plus `materialComposition` with two entries, each declaring just the material name. The `percentage` field is optional; the PDP-W-005 linter rule only fires when percentages are present and don't sum to ~100. For textile and apparel products where percentages are meaningful, the structured entries carry percentages. Mixed cases (a leather bag with a percentage-relevant lining) can declare some entries with percentages and others without.

## Why fit advice is a field of its own

For "Size guidance" in [`product.md`](product.md#size-guidance-pagefrontsizechart-and-pagefrontsizerecommendation).

`pagefront:sizeChart` (and Schema.org's `SizeSpecification` / `hasMeasurement`) carry measurements: size codes and body/garment measurements. They answer "what are the dimensions of each size." `pagefront:sizeRecommendation` carries fit relative to the labeled size: whether the product runs small/true/large, and any recommended adjustment from the customer's usual size. It answers "how does this fit compared to its label," which Schema.org's size vocabulary does not express.

If the merchant states the advice in another size system than the configurator's, the Sheet keeps the merchant's wording in `description` and omits `sizeAdjustment`: converting between size systems is an inference, and a Sheet does not carry inferences.

The structured fields are what a consumer acts on: an agent that knows the customer's usual size can apply a `down` / `0.5` / `EU` adjustment automatically, reducing fit-driven returns. The `description` carries the reasoning the structured fields can't ("the wavy band sits differently, so we recommend half a size down"). Measurements stay in `pagefront:sizeChart` / Schema.org; only fit-relative-to-size advice goes here.

## Open design questions carried forward

For the spec as a whole, [`product.md`](product.md).

1. Extension namespace sub-paths within `pagefront:` (per-type URIs) remain to be defined as the spec stabilizes.
2. ~~Multiple offers' `itemOffered` redundancy.~~ **Resolved in v0.6.** `@id` reference pattern is now the normative recommendation.
3. ~~Completeness scoring weights.~~ **Resolved: scoring is consumer-side (see [`scoring.md`](scoring.md)).** The standard keeps a non-normative dimension taxonomy only; weights, formulas, and calibration are consumer rubric concerns, versioned independently of the format.
4. Schema.org version pinning cadence. Project needs documented update cadence (review with each Schema.org major release).

## Open design questions surfaced in v0.4

For the spec as a whole, [`product.md`](product.md).

5. ~~**Configurator pricing formula.**~~ Resolved 2026-10-01: `priceFormula` is removed, and `pagefront:configuratorPricing` defines the total as the base price plus option modifiers plus adjustments. See "Configurator pricing and price bands."
6. **Image role multiplicity.** Should the order of roles encode preference (first role is primary), or should roles be unordered? Still open. Video roles inherit the same ambiguity.
7. ~~**`pagefront:configurator` vs `isVariantOf`.**~~ Resolved in v0.5.
8. **Certification scope vocabulary.** `scope` values are currently free-text. Open question: closed enum, or free-text with conventions per category?
9. **AftermarketService taxonomy.** Common services (`free_resizing`, `lifetime_warranty`, `repair_credit`) but no defined vocabulary. Spec should document conventions without closing the set.
10. ~~**Sheet URL stability.**~~ Resolved in v0.5.

## Open design questions surfaced in v0.5

For the spec as a whole, [`product.md`](product.md).

11. **Index files and catalog enumeration.** Should publishers expose `/pagefront/commerce/product/index.{lang}.json` for crawlers? Still deferred in v0.7 pending real consumer use cases; revisit in a future version.
12. **Fallback resolution semantics.** v0.5 recommends BCP 47 language-family fallback (`fr-CA` → `fr`). Open question: what should consumers do when no language preference matches at all?
13. **Region-scoped certifications.** EU certifications (CE, OEKO-TEX) and US certifications (UL, FCC) have different shapes. v0.6 stays category-agnostic; typed certification extensions deferred.
14. **Translation consistency.** Spec doesn't enforce that French and English variants say semantically the same thing. Whether to add `pagefront:translatedFrom` is open.
15. **Currency-conversion freshness signaling.** Per-Offer `priceLastVerified` field is finer-grained than envelope `expires_at` but more complex. Open.

## New design questions surfaced in v0.6

For the spec as a whole, [`product.md`](product.md).

16. **Video role overlap with image roles.** Both `image` and `video` arrays carry `lifestyle` and `context`-shaped roles. Consumers querying "show me lifestyle content" need to look in two places. Acceptable trade for clarity; revisit if it causes consumer pain.
17. **`spin` belongs in `image` or `video`?** A 360° rotation is technically video but functionally a rich image. v0.6 places it in `video` because the delivery format is typically `.mp4` or HLS. Publishers using interactive 360° viewers (JS-based, with no video delivery) may need a future image-side `spin` role.
18. **User-generated media as a separate field.** Reviews on most merchant sites include user-submitted videos and photos. Pagefront v0.6 omits these from `video` and `image` because the trust signal differs. A future `pagefront:userGeneratedMedia` field is worth designing but requires real case studies first.
19. **Video transcripts and the size budget.** Full transcripts of tutorial videos can run to several thousand words. At catalog scale (a merchant with 5,000 SKUs, each with 2-3 videos), transcript content could dominate sheet size. Whether to allow `transcript` to be an external URL (`transcriptUrl`) rather than inline content is worth considering. Schema.org has both patterns.
20. **Tracking known deviations across versions.** Real-merchant validation keeps surfacing narrow spec defects (the AFS `productGroupID` issue in v0.5, the Schema.org HTTP/HTTPS scheme issue in v0.6) that no amount of upfront design would have caught. This is a process note: worth maintaining a forward-running "known deviations" record alongside the spec so future implementers and validators don't rediscover the same edge cases. Where this record lives (changelog, separate doc, validator rules with case-study back-references) is open.
21. **Cross-page variant discovery.** The spec recommends ProductGroup Sheets be complete and acknowledges per-variant URLs, but it does not specify how producers should discover variant relationships when the merchant's site exposes them only heuristically. This is a production-pipeline concern, but the linter rules that warn on suspected incompleteness depend on pipeline knowledge the Sheet itself cannot carry. Future versions may address whether per-Sheet metadata about variant discovery completeness is warranted.

## New design questions surfaced in v0.7

For "Related products" and "Documents" in [`product.md`](product.md#related-products).

22. **Category-specific document roles.** The `pagefront:document` `role` enum is category-agnostic in v0.7. Real publishers may need category-specific roles (`dental_imaging_protocol` for medical devices, `nutrition_panel` for food, `installation_drawing` for industrial fittings) that don't map cleanly onto the closed set. v0.7 directs publishers to use the closest enum value and convey specifics in `name` and `description`. Whether to extend the closed enum, open it for category prefixes, or formalize a category-specific role registry is an open question; revisit when real publisher demand makes the trade-off concrete.
23. **Relationship strength or weighting on `pagefront:relatedProduct`.** `often_bought_with` and `recommended_with` are qualitative in v0.7. A future version may add a `strength` or `weight` field (percentage of co-purchase, publisher-asserted prominence). v0.7 stays qualitative because weighted relationships invite a category of merchant self-asserted commercial signals that Pagefront has kept out of the vocabulary; see also "merchant-asserted popularity ranking" in the non-goals section.
24. **Multiple accepted answers for Q&A.** Schema.org's `Question` allows a single `acceptedAnswer` plus a `suggestedAnswer` array. v0.7 follows Schema.org's pattern (single accepted answer) because publisher-authored Q&A about one's own product is typically authoritative. Whether Pagefront should surface `suggestedAnswer` as a recommended pattern (for community-contributed answers the publisher has curated but not endorsed as authoritative) is open; revisit if real implementer feedback surfaces use cases.
25. **`encodingFormat` default semantics.** `pagefront:document.encodingFormat` defaults to `application/pdf` when omitted. The vast majority of product documents are PDFs, but the default arguably hides a producer choice that consumers may want to make explicit. Whether to require `encodingFormat` rather than defaulting it is open.

## New design questions surfaced in v0.8

For "Documents" and "Variant dimensions" in [`product.md`](product.md#documents).

26. ~~**Shared cross-publisher feature/measure registry.**~~ **Resolved in v0.8.** The Pagefront Property Registry (see "Variant dimensions" and "Registry governance") publishes governed, versioned `propertyID` identifiers with canonical `recommendedUnitCode`/`unitLabel`, covering `pagefront:featureGroup` rows as well as variant dimensions; its `proposed` → `stable` → `deprecated` lifecycle and additive-only versioning answer the "who governs it, how it versions" half of the original question. The registry does not *enforce*: it is a coordination artifact producers opt into, so `propertyID` values outside it remain valid opaque identifiers and comparison across merchants rests on convergence. Category-specific sub-registries remain unaddressed; revisit if a category's vocabulary outgrows the flat registry.
27. **Structured repairability score.** v0.8 links the repairability *document* (`pagefront:document` `role: "repairability_index"`) but does not model the score itself. A structured field (numeric value, scale, jurisdiction/scheme) would be the repairability analogue of `hasEnergyConsumptionDetails` for energy class. Schemes are still multiplying (the French index, the EU labels in progress) and their scales differ; premature to close a shape around them. Revisit when the regulatory landscape settles or consumer demand surfaces.
28. **Canonical domain for all Pagefront IRIs.** Resolved: all identifiers, machine and human, live on `themachineweb.org`, with machine paths mirroring the repository's vertical-first architecture: schemas at `https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json` (since release 0.3.0 the last segment carries the sheet-spec semver, `v0.9.0.json`, and the `v0.9.json` URL is the legacy schema), the vocabulary namespace at `https://themachineweb.org/pagefront/vocabulary/`, and the Property Registry at `https://themachineweb.org/pagefront/commerce/registry/properties.json`.

## What v0.8 deliberately does *not* address

For the spec as a whole, [`product.md`](product.md).

These are deferred to later versions when concrete consumer needs justify the complexity:

- **Provenance and confidence metadata.** Removed in v0.4 entirely.
- **Cryptographic signing of sheets.** Out of scope. The sheet's authority comes from being served on the publisher's domain.
- **Cross-sheet dependencies.** Each sheet is self-contained. (v0.9 carves out the one accepted exception: product-else-seller resolution of return and shipping terms along the `Offer.seller` edge; see "Return policy.")
- **Per-variant inventory and pricing structures finer-grained than `Offer`.**
- **Index files for catalog enumeration.** Tracked as open question #11.
- **Bundle products.** The bundle-as-product case (a bundle that is itself a sellable entity with its own name, price, and composition) is now addressed via Schema.org's `ProductCollection` (with `includesObject` and `TypeAndQuantityNode`), documented in the Related products section; it is no longer deferred. What remains out of scope is a Pagefront-native bundle-product type: Pagefront does not introduce one because Schema.org's `ProductCollection` covers the case. A future Pagefront extension would only be justified if `ProductCollection` proves inadequate against real merchant bundles.
- **Live streams and scheduled broadcasts.** Out of scope for video.
- **User-generated review videos and photos.** Tracked as open question #18.
- **Audio-only media** (podcasts, audio descriptions of products). Schema.org has `AudioObject`. v0.8 stays focused on image, video, and documents; audio added if real use cases surface.
- **Merchant-asserted popularity ranking.** Google Merchant Center's `popularity_rank` attribute and equivalent self-asserted percentile signals are out of scope. Pagefront represents the publisher's authoritative statement about *what a product is*; a product's commercial ranking among other products in the same catalog is outside that statement. For verifiable rating signals, use Schema.org's `aggregateRating`. For external recognition, use Schema.org's `award`. Self-asserted popularity rankings (where the merchant ranks their own catalog and asks consumers and agents to trust the ranking) are a marketing-surface decision, a different class of signal from a fact about the product. Pagefront leaves that surface to the publisher's page and does not add it to the vocabulary.
- **Weighted product relationships.** `pagefront:relatedProduct` is qualitative; co-purchase percentages and similar weights are tracked as open question #23 and not in v0.8.
- **Structured repairability score.** v0.8 links the repairability document (`role: "repairability_index"`) but does not model the score itself; tracked as open question #27.
- **A fully contractual shared feature/measure registry.** The Pagefront Property Registry is no longer deferred; see resolved open question #26 and "Variant dimensions," "Registry governance," and "Feature groups." What remains out of scope is *enforcement*: sheets validate whether or not their `propertyID` values are registered.

## The legacy format versions this spec grew through

For "Status" in [`product.md`](product.md#status).

The 2026-10-01 revisions move configurator pricing from `pagefront:configurator` into the offer; sheets that carried prices inside the configurator need re-emission. The 2026-09-02 revision removes the recommended Sheet URL convention and states the follow-the-link discovery rule as a standalone normative requirement; no conformance requirement changes, no sheet becomes invalid, and none needs to move.

v0.9 was an additive release on top of v0.8, with no breaking changes to the data model. v0.8 Sheets remain structurally valid under v0.9 once their `format_version` envelope field is updated from `"0.8"` to `"0.9"`. Three changes land together, keeping the Product Sheet consistent with the new Commerce Organization Sheet ([`organization.md`](organization.md)): the `commerce/` segment in the Sheet URL convention, return and shipping policy as seller-sheet defaults with per-product overrides, and reference-capable `pagefront:legalEntity`. The `pagefront:commerceRole` and `pagefront:fulfillmentTerms` terms, the `organization` certification scope value, and the v0.9 schema updates are tracked with the Commerce Organization Sheet's own landing.

v0.8 was an additive release on top of v0.7, with no breaking changes. v0.7 Sheets remain structurally valid under v0.8 once their `format_version` envelope field is updated from `"0.7"` to `"0.8"`; the new affordances (`pagefront:featureGroup`, `pagefront:productHighlights`, `pagefront:legalEntity`, `pagefront:safetyWarning`, `pagefront:safetyNotice`, array-valued GTINs, coded `category`, the `repairability_index`/`recall_notice`/`declaration_of_conformity` roles, the `service` relationship) are optional additions.

The v0.8 changes were each surfaced by real-merchant sheet production: grouped spec tables, multi-GTIN products, taxonomy-coded categories, highlight bullets, repairability disclosures, GPSR entity blocks, safety warnings and recall notices, and attached-service upsells all appear on real product pages that v0.7 could not express or could express only lossily.

Pending work carried from v0.8:

1. **Worked examples**: resolved for `pagefront:featureGroup` and `pagefront:legalEntity` by the Whitebird v0.9 re-emission (2026-08-11; see the citations in "Feature groups" and "Legal entities"). The same artifact carries `pagefront:productHighlights`, with one caveat queued for editor review: the merchant page renders no explicit highlight bullets, so the entries are distilled from merchant-derived prose, in tension with the publisher-authored-only guardrail (see the case study's writeup).
2. **Linter rules**: landed. The legal-entity-address warning and the feature-value-unit warning are now defined as PDP-W-024 and PDP-W-025 in `rules.md`, joining PDP-W-022 (empty highlight entries).
3. **Scoring rubric update**: withdrawn as spec pending work; rubric evolution is consumer-side (see [`scoring.md`](scoring.md)). Folding feature-group and legal-entity presence into a completeness signal for regulated categories belongs to implementers' rubric backlogs.

Pending work carried from v0.7: worked case-study examples for `question` and `pagefront:document`, **still pending, and now exhausted against the current corpus**: none of the three case-study pages carries product-scoped Q&A or public document links (Whitebird and Kimaï have neither; Nitto has only a site-wide FAQ page and no PDFs). Resolving these two examples needs a fourth case study chosen for those features (a merchant with on-page product Q&A and downloadable manuals/SDS; electronics or appliances are natural donors), or an editor decision to illustrate them synthetically. (The document/Q&A completeness-rubric update formerly noted here is consumer-side per [`scoring.md`](scoring.md).) The `pagefront:relatedProduct` worked example is resolved by the Kimaï v0.9 re-emission (`../case-studies/kimai/jackie-pear.en-GB.json`, 2026-08-11): the merchant's "matching wedding bands" carousel as eight `recommended_with` entries, in the sharpened complementary-pairing meaning as distinct from a generic "you may also like" surface. (The v0.7 linter warnings, SDS documents without `inLanguage` and empty `acceptedAnswer.text`, are now defined as PDP-W-026 and PDP-W-027 in `rules.md`.)
