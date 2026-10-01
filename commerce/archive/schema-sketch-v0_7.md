# Product Page Schema — v0.7 Sketch

Status: draft / sketch, not yet a spec.
Format version: 0.7
Schema.org version targeted: 30.0 (2026-03-19)

## Changelog from v0.6

_All v0.7 changes are additive and backward-compatible: a v0.6 Sheet stays valid once its `format_version` is updated to `0.7`. Entries are documentation-only unless tagged **(schema)**._

- **Explicit triggers for `pagefront:` vocabulary.** Documents when Pagefront mints `pagefront:`-prefixed vocabulary — a Schema.org gap, under-specification, or mismatch with Pagefront's contract — versus deferring to Schema.org-native fields; the principle had been operating implicitly. See "When to extend Schema.org with `pagefront:` vocabulary."
- **Product Q&A.** Sheets MAY carry a `question` array on `Product`/`ProductGroup`, using Schema.org's native `Question` and `Answer` linked via `acceptedAnswer`. No `pagefront:` term is minted; Q&A prose is language-scoped to the sheet's `inLanguage`.
- **`pagefront:document[]` for typed product documents.** A new typed extension for manuals, spec sheets, assembly instructions, care guides, warranties, certificates, environmental declarations, audit reports, lab tests, safety data sheets, and similar. Each entry carries a closed `role` enum and a per-document `inLanguage` that MAY differ from the sheet's. The `pagefront:Document` role enum gains `environmental_declaration` — a standardized environmental product declaration (Type III EPD / PEP ecopassport), a cross-category regulation-driven document distinct from `certificate` — and `brochure` — a marketing/sales overview document, low-authority as a data source but one human-facing consumers explicitly retrieve. It also gains `compatibility` — a document listing products, systems, or standards the product works with, distinct from `spec_sheet` and complementary to `pagefront:relatedProduct` `compatible_with` relationships.
- **`pagefront:relatedProduct[]` for typed product relationships.** A new field with a closed `relationship` enum, targeting another product by `@id` reference (another Pagefront Sheet) or by a Schema.org identifier (`sku`, `gtin`, `gtin13`, `mpn`) for cross-merchant references. Schema.org's loose relations (`isRelatedTo`/`isSimilarTo`/`isAccessoryOrSparePartFor`/`isConsumableFor`) cover only four kinds and lack the typed semantics agents need. The `pagefront:RelatedProduct` relationship enum gains `spare_part` — a replacement for an existing component, ordered on wear or failure; distinct from `required_part` (a component needed for the product to function).
- **Variant dimension guidance.** How to express variant axes on `ProductGroup`: Schema.org-native properties where they exist (`color`, `size`, `material`), otherwise `additionalProperty` with a `propertyID` from a suggested-but-open registry (`width`, `capacity`, `finish`, `memory`, `storage`, `display_size`, `power`, `voltage`).
- **ProductGroup `name` ↔ Google `item_group_title`.** Notes the equivalence for implementers transitioning from Google Merchant Center feeds; Pagefront uses Schema.org's native `name` rather than minting an attribute.
- **Stable IRIs reaffirmed.** `pagefront:Document` and `pagefront:RelatedProduct` are permanent within this major version — never renamed or removed.
- **Common pricing patterns.** Documents sale pricing, price ranges, quantity-tier pricing, and shipping-alongside-price as recommended Schema.org-native patterns.
- **Product dimensions.** Documents `height`/`width`/`depth`/`weight` with `QuantitativeValue` and UN/CEFACT unit codes (`CMT`/`MMT`/`INH` for length; `GRM`/`KGM`/`LBR`/`ONZ` for weight).
- **Image- and video-to-variant association.** Documents the Schema.org-native `about` pattern for tying variant-specific images and videos to their `hasVariant` entries, mirroring `itemOffered` for Offers.
- **Textual framing for media.** Documents `caption` (short, publisher-vetted) and `description` (longer, machine-readable) on `ImageObject`/`VideoObject`; both are already permitted by the `additionalProperties: true` policy.
- **Relationship-modeling guidance.** `recommended_with` is sharpened to mean complementary pairing — generic "You may also like" surfaces go to Schema.org's native `isRelatedTo`. Five patterns are matched to fields by semantics (`pagefront:relatedProduct` typed enum; `isSimilarTo`; `isPartOf`/`hasPart`; `isRelatedTo` with or without `description`), operationally-tracked enum values are distinguished from marketing-curated ones (with algorithmic recommendation output going to `isRelatedTo`), and a structured-identifier requirement separates `pagefront:relatedProduct` (needs one of `@id`/`sku`/`gtin`/`gtin13`/`mpn`, enforced by the schema's `anyOf`) from `isRelatedTo` (a `name` and `url` suffice).
- **Bundles.** Distinguishes a bundle expressed as a relationship (`pagefront:relatedProduct` with `bundle_component`, for separately-sellable products that travel WITH a primary product) from a bundle that is itself a sellable product (Schema.org `ProductCollection` with `includesObject` and `TypeAndQuantityNode`). The previously-deferred bundle-product case is now addressed via Schema.org-native vocabulary.
- **Linter rules W-019, W-020, and W-021.** W-019 warns when a `pagefront:relatedProduct` identifier passes the schema's presence-only `anyOf` but is empty or non-dereferenceable. W-020 warns when any relationship entry (`isSimilarTo`, `isRelatedTo`, `isPartOf`, `hasPart`, `pagefront:relatedProduct`) lacks any identifying field, and extends the broken-`@id` check (E-001) to these fields. W-021 warns when a cross-Sheet variant link (a `hasVariant` entry or an `isVariantOf` with a full-URL `@id`) omits the recommended `sheet_url` traversal hint; E-001 is correspondingly extended to treat full-URL `@id`s in `isVariantOf`/`hasVariant` as legitimate cross-Sheet references. See `linter.md`.
- **(schema) `priceSpecification` accepts arrays.** Fixes a bug where `priceSpecification` was a single object only, contradicting the array form shown in "Common pricing patterns." The Offer field now accepts an object or an array of objects. Backward-compatible.
- **(schema) `shippingDetails` accepts a single object.** Parallel fix: `shippingDetails` was array-only, contradicting the single-object example in the shipping pattern. The Offer field now accepts either form. Backward-compatible.
- **Configurator vs. ProductGroup guidance restored and tightened.** The v0.5 normative guidance — referenced by the changelog, the version matrix, and linter rules W-007/W-009/W-010, but missing from the body between v0.5 and v0.7 — is restored, with a fourth trigger: products with 4 or more variant axes SHOULD use `pagefront:configurator`. The 3-axis `ProductGroup` ceiling is clarified as a per-Sheet limit, not per-product-family: a 4+ axis family can factor across Sheets or express the full space in one Sheet via configurator. Worked examples cover both, plus a three-axis, 27-combination watch line at the `ProductGroup` boundary.
- **(schema) `offers` accepts `AggregateOffer`.** Fixes a bug where `offers[]` constrained every entry to `@type: "Offer"`, rejecting the `AggregateOffer` shape (`lowPrice`/`highPrice`/`priceCurrency`) used in the price-range pattern. Now accepts `Offer` or `AggregateOffer` via separate `$defs`, with pricing-presence validation still applied to both. Backward-compatible.
- **Prose clarifications reconciling with the schema.** `@context` is now listed as a required `data` field (already required by the schema and JSON-LD); `expires_at` is described as recommended rather than required (matching the schema); and `pagefront:availableLanguages` is described as an array of `{lang, url}` objects, not URL strings (matching the schema shape). No schema changes.
- **`@id` deduplication contract documented.** Documents how consumers recognize the same product across its own Sheet and references to it (`isRelatedTo`, `isSimilarTo`, `isPartOf`/`hasPart`, `pagefront:relatedProduct`): `@id` is the exact-string identity key, JSON-LD does not normalize it before comparison, and producers MUST emit the identical `@id` string for a product across its own Sheet and every reference to it — a locale prefix, trailing slash, or query/`?variant=` suffix breaks dedup. When a consistent `@id` cannot be constructed, references SHOULD carry a stable secondary identifier (`sku`/`gtin`/`gtin13`/`mpn`/`productID`) as a dedup fallback. See "Product identity and deduplication." No schema changes.
- **Multi-Sheet variant family pattern documented.** Documents how a variant family whose variants carry substantial per-variant content (own media, description, offers) is modeled as N+1 Sheets — one parent `ProductGroup` Sheet plus one Product Sheet per variant, linked by `isVariantOf` to the parent. Parent `hasVariant` entries carry `@id` and `url` (required) and `sheet_url` (recommended) so consumers can fetch a variant's Sheet without first loading its page. See "Multi-Sheet variant families." The `@id`, `url`, and `sheet_url` traversal fields on `hasVariant` entries are typed by the schema's `variantEntry` item definition (see the `(schema)` entry below).
- **(schema) `hasVariant` entries are now typed.** Previously `hasVariant` was `{"type": "array"}` with no item schema, so the render-hint and traversal fields the spec describes on each entry — `@id`, `url`, `sheet_url`, `name`, the Schema.org-native axis values (`color`/`size`/`material`), `price`, and the `image` render-hint — were enforced only by convention, not by the schema. A `variantEntry` item definition now types them (plus the `sku`/`gtin`/`gtin13`/`mpn`/`productID` identifiers), requiring only `@type` and, following the Schema.org-block convention, permitting additional properties. Backward-compatible: every existing variant entry across the case studies and spec examples validates unchanged; the definition types fields when present rather than adding new requirements.
- **(schema) Data-block `url` is now conditional on `@type`.** `url` is required for `Product` and its subtypes but optional for `ProductGroup`, so a page-less parent `ProductGroup` Sheet — a variant-family parent with no backing human page, located only by `sheet_url` — is valid. Previously `url` was unconditionally required on every data block. Backward-compatible: existing Sheets all carry `url`.
- **Multiple video thumbnails documented.** Documents `thumbnailUrl` for interchangeable previews (same scene, different crops or sizes — the consumer picks any) versus Schema.org's `thumbnail` (an `ImageObject` array) for previews carrying distinct context (different scenes or use-cases, each with its own `description`/`caption`). One video remains one `VideoObject` regardless of preview count; multiple previews of one video are never multiple `VideoObject`s. See "Multiple thumbnails." No schema changes (`thumbnail` and `thumbnailUrl` are Schema.org-native on `VideoObject`, permitted via `additionalProperties: true`).
- **Mixed cross-Sheet factoring and configurator price bands documented.** A product's axes can partition into page-factored axes (expressed through the variant relationship — a parent `ProductGroup` whose `hasVariant` enumerates the per-page variants, each page carrying `isVariantOf`) and within-page axes (expressed through `pagefront:configurator`), the two sets disjoint so no single Sheet declares any axis in both roles — W-010-safe. When a configurator's per-combination pricing isn't fully extractable, pair it with an `AggregateOffer` on the same Sheet's `offers`, scoped to that Sheet's configurator axes: the configurator carries the option space, the `AggregateOffer` carries the price band (`lowPrice`/`highPrice`/`priceCurrency`, no `itemOffered`). See "Mixed cross-Sheet factoring" and "Configurator pricing and price bands." No schema changes (`pagefront:configurator` and the `aggregateOffer` `$def` already exist; `offers` already accepts `AggregateOffer`).
- **`pagefront:sizeRecommendation` (with `pagefront:SizeAdjustment`) added.** Typed fit guidance relative to labeled size: a `fitProfile` enum (`runs_small`/`true_to_size`/`runs_large`), a recommended size offset (`pagefront:SizeAdjustment` — `direction`, `magnitude`, optional `sizeSystem`), and prose rationale. Fills the fit-advisory gap in Schema.org's size vocabulary; measurements and size charts continue to use Schema.org `SizeSpecification`/`hasMeasurement`.
- **Product lifecycle documented.** `releaseDate` (Schema.org-native on `Product`) for market availability; end-of-life via Offer `availability: "https://schema.org/Discontinued"` paired with a `pagefront:relatedProduct` `replaced_by` entry pointing at the successor, whose own Sheet carries the inverse `replaces`. Lets agents answer "is this product current?" with Schema.org-native vocabulary plus the existing relationship enum. See "Product lifecycle." No schema changes.
- **Cross-merchant canonical reference via `sameAs` documented.** A reseller's Sheet SHOULD carry Schema.org's `sameAs` pointing at the brand's own canonical product page. `sameAs` is a deduplication hint, not an identity key — `@id` remains the exact-string identity key per "Product identity and deduplication." See "Cross-merchant canonical reference via `sameAs`." No schema changes.
- **EU energy efficiency documented.** `hasEnergyConsumptionDetails` with an `EnergyConsumptionDetails` object whose `hasEnergyEfficiencyCategory` is drawn from `EUEnergyEfficiencyEnumeration`, with scale bounds via `energyEfficiencyScaleMin`/`energyEfficiencyScaleMax`; the label graphic itself rides as an image or a `pagefront:document` entry with `role: "certificate"`. Regulation-driven and fully Schema.org-native. See "Energy efficiency." No schema changes.
- **Age suitability documented.** Age recommendations via `audience` carrying a `PeopleAudience` with `suggestedMinAge`/`suggestedMaxAge` (in years; `suggestedGender` MAY be added where the merchant declares it); regulatory age warnings ("Not suitable for children under 36 months") as an `additionalProperty` convention with `name: "age_warning"`. See "Age suitability." No schema changes.
- **Family/series membership example.** Pattern 3 of the relationship patterns (`isPartOf` → `Collection`/`ProductGroup`) is extended with a named brand → family → series hierarchy expressed by two levels of `isPartOf` nesting; no new vocabulary. See "Five patterns for product-to-product relationships." No schema changes.
- **JSON-LD context fix: `pagefront:sizeChart` and `pagefront:priceOnRequest` term mappings corrected.** Both carried a stray `"@type": "@id"` in the vocabulary's JSON-LD context, which directs a JSON-LD processor to treat the value as an IRI reference. Both values are in fact inline embedded objects (`pagefront:SizeChart`, `pagefront:PriceOnRequest`) — never IRIs, and the schema forbids a string value for either — so the mapping is corrected to a plain `@id` alias, matching `gemstone`/`construction`/`configurator` and the newly-added `sizeRecommendation`. Backward-compatible: no Sheet, fixture, or schema relied on IRI resolution.

## Changelog from v0.5

- **`inLanguage` case relaxation.** Earlier drafts and some implementations enforced canonical BCP 47 case via regex on `inLanguage`. v0.6 makes the standard's position explicit: case-insensitive per RFC 5646. The validator's linter (rule W-017) warns when non-canonical case is used. Real-world merchants (Amazon, others) commonly emit non-canonical case; the implicit constraint over-constrained valid input.
- **`pagefront:priceOnRequest` for Offers without published price.** Offers MAY now declare `pagefront:priceOnRequest` to explicitly signal that no price is published — for authorized-retailer models, quote-based pricing, or regional-reseller routing. This relaxes the v0.5 constraint that every Offer carry `price` or `priceSpecification`: an Offer carrying `pagefront:priceOnRequest` is exempt. The validator's linter (rule W-016) warns when an Offer has commercial structure but lacks both a price and a `pagefront:priceOnRequest` declaration, catching extraction failures while letting intentional omissions through. Detailed below under "Price-on-request offers."
- **Video support added.** Pagefront Sheets may now carry a top-level `video` array of `VideoObject` entries, sibling to `image`. A closed enumeration of video roles is defined (`overview`, `tutorial`, `lifestyle`, `construction`, `demonstration`, `comparison`, `unboxing`, `spin`). Both self-hosted (`contentUrl`) and embedded (`embedUrl`) videos are supported. Detailed below under "Video roles."
- **Accessibility recommendation for video.** Publishers SHOULD include `caption` or `transcript` on every `VideoObject`. This is a recommendation, not a requirement; the validator's linter (W-012) warns when accessibility metadata is absent, particularly on `overview` and `tutorial` roles where consumer comprehension matters most.
- **`itemOffered` `@id` reference pattern is now recommended.** In multi-Offer sheets (typically `ProductGroup` with `hasVariant`), each `Offer` SHOULD reference its target variant via `itemOffered: { "@id": "..." }` rather than duplicating the variant's identifiers inline. Resolves open question #2; the AFS Whitebird v0.5 revision demonstrated the pattern works.
- **Video is language-scoped.** Following the v0.5 internationalization model, the `video` array's contents are language-specific to the sheet's `inLanguage`. A French-language sheet carries French-language videos; an English-language sheet carries English-language videos. The same underlying video file MAY appear in multiple language sheets when its content is language-agnostic (instrumental demonstration, silent construction footage, etc.).
- **HTTP and HTTPS Schema.org URIs are both accepted.** Sheets carrying `http://schema.org/InStock` or `http://schema.org/NewCondition` are valid under v0.6, matching how every major Schema.org consumer (Google Rich Results, schema.org's own validator) treats the two scheme variants as semantically equivalent. The validator's linter (rule W-013) warns publishers still emitting HTTP URIs and recommends migrating to HTTPS as the canonical form. This relaxes the v0.5 regex, which over-constrained valid input.
- **ProductGroup variant completeness recommendation.** ProductGroup Sheets SHOULD declare all variants in the family; `hasVariant` is intended to be exhaustive at the moment of emission. When some variants cannot be discovered, producers should emit per-variant Product Sheets without a wrapping ProductGroup rather than a partial ProductGroup Sheet. Detailed below under "Required and recommended core fields."
- **Per-variant `url` field on `hasVariant` entries.** Each entry in `hasVariant` MAY declare a `url` carrying addressability information for the variant. Per-variant `url` SHOULD be populated when each variant has a meaningfully distinct addressable URL — whether via platform-specific query parameters on a shared page (e.g., `?variant={id}`) or its own distinct page — and MAY be omitted only when variants share the exact same URL with no parameter-based differentiation. The variant's `@id` remains the primary identifier; `url` is supplementary metadata. The ProductGroup's top-level `url` remains the canonical URL of the product family.

## Changelog from v0.4.1

- **Vocabulary settled.** The published Sheet is named the **Pagefront Sheet**. The collective layer of all Sheets published across the web is the **Machine Web**. The specification document is the **Pagefront Spec**.
- **Envelope field rename: `artifact_url` → `sheet_url`.** Breaking wire-format change in v0.5.
- **Internationalization model defined.** Pagefront Sheets are language-scoped: one `inLanguage` per sheet, multi-currency handled inline via multiple `Offer` entries with `areaServed`.
- **Sheet URL convention promoted from recommendation to normative pattern.** `/pagefront/{type}/{id}.{lang}.json`.
- **Conditional identifier requirement** based on `@type`.
- **Configurator vs. ProductGroup guidance is now normative.**

## Changelog from v0.4

- **Completeness block removed from the envelope.** Computed by the validator, not embedded in the sheet.

## Changelog from v0.3

- **Provenance metadata removed from the envelope.** Audit lives in the producing pipeline, not in the published sheet.

## Design principles

Unchanged from v0.6. Pagefront defines the structure of the published Sheet; what's inside the Sheet is the publisher's authoritative statement. The Sheet is JSON-LD, served at a stable URL on the publisher's domain, discoverable via `Link: rel="describedby"`. Schema.org is the data vocabulary; `pagefront:` extensions cover what Schema.org under-specifies for commerce. The format prioritizes Schema.org compatibility — consumers ignoring `pagefront:` extensions parse the Sheet as clean Schema.org JSON-LD.

### What the schema validates

The JSON Schema validates the envelope and `pagefront:`-prefixed extensions strictly. Schema.org-typed content within the data block is permitted by reference and validated upstream by Schema.org-aware consumers, not by Pagefront. Producers extend the Sheet with Schema.org properties Pagefront doesn't explicitly model; the schema's `additionalProperties: true` policy on Schema.org-typed blocks lets these through without constraint.

This division of labor is deliberate. Schema.org is large, well-specified upstream, and evolving. Pagefront re-validating Schema.org content would mean duplicating Schema.org's own work, choosing which subset of Schema.org to constrain (every choice excludes valid Schema.org), and maintaining the duplication forever as Schema.org evolves. Pagefront's job is to define the envelope and its typed extensions; Schema.org's job is to define the content vocabulary; consumers compose the two.

The practical consequence: Pagefront-recommended patterns built on Schema.org vocabulary (sale pricing via `PriceSpecification`, quantity-tier pricing via `eligibleQuantity`, video accessibility via `caption`/`transcript`, etc.) require no schema changes when they are added or refined. The spec documents the patterns; the schema permits them; consumers interpret them. Schema changes are reserved for envelope fields and `pagefront:`-prefixed extension types.

### When to extend Schema.org with `pagefront:` vocabulary

Pagefront extends Schema.org with `pagefront:`-prefixed vocabulary only when one of three conditions holds:

1. **Schema.org gap.** Schema.org genuinely lacks vocabulary for the concept being modeled. Examples in v0.7: `pagefront:Configurator` (configurator economics), `pagefront:MadeToOrderTerms` (made-to-order production), `pagefront:Material` with composition properties (typed material breakdown with `percentage`, purity, provenance, weight).
2. **Schema.org under-specification.** Schema.org models the concept but without the closed-enum typing, mandatory structure, or precision agents need to dispatch on. Examples in v0.7: `pagefront:RelatedProduct` (Schema.org's typed relations are limited to four kinds; agents need more typed coverage), `pagefront:Document` (Schema.org has no typed-role enum for product documents like manuals, warranties, certificates), the image and video role enums (Schema.org has no opinion on image roles; Pagefront's closed enum lets consumers dispatch).
3. **Schema.org mismatch with Pagefront's contract.** Schema.org's model conflicts with how Pagefront wants the data shaped. Example in v0.7: `pagefront:PriceOnRequest` (Schema.org has no affordance for "the merchant intentionally publishes no price"; the extension addresses the gap directly).

When none of these triggers fire, Pagefront uses Schema.org-native vocabulary. Image-to-variant association uses Schema.org's `about`. Product Q&A uses Schema.org's `Question`/`Answer`. Pricing patterns use Schema.org's `PriceSpecification` and `AggregateOffer`. Product dimensions use Schema.org's `height`/`width`/`depth`/`weight` with `QuantitativeValue`. Untyped product relationships use Schema.org's `isRelatedTo` and `isSimilarTo`. Certifications use Schema.org's native `Certification` type and `hasCertification` field, with applicability `scope` carried as a `scope` PropertyValue convention rather than a minted type. The schema permits these via the `additionalProperties: true` policy on Schema.org-typed blocks.

v0.7 documents five further recommended patterns on the same principle, each surfaced by real-merchant sheet production and each fully covered by Schema.org's existing vocabulary: product lifecycle (`releaseDate`, and Offer `availability: Discontinued` paired with a `replaced_by` relationship — see "Product lifecycle"); cross-merchant canonical references (`sameAs` as a deduplication hint alongside the `@id` identity key — see "Cross-merchant canonical reference via `sameAs`"); EU energy efficiency (`hasEnergyConsumptionDetails` with `EUEnergyEfficiencyEnumeration` categories — see "Energy efficiency"); age suitability (`audience` with `PeopleAudience` plus an `additionalProperty` convention for regulatory age warnings — see "Age suitability"); and family and series membership (nested `isPartOf` — see "Five patterns for product-to-product relationships"). None mints a `pagefront:` term, and none required a schema change. The property choices were verified against Schema.org's `domainIncludes` declarations: each pattern uses only properties whose domain covers `Product` (or `Thing`), so the Sheets stay clean Schema.org even under domain-aware validation.

The split is also a signal: `pagefront:`-prefixed fields mean "Pagefront-typed extension with closed-enum or structured shape"; Schema.org-native fields mean "upstream-validated vocabulary." Consumers learn the distinction and apply it.

This principle has operated implicitly across v0.7's decisions; documenting it guards against drift. A contributor proposing a `pagefront:` extension should be able to name which of the three triggers fires — if none do, the answer is Schema.org-native.

### Upstream-equivalent forms

Where an upstream standard (Schema.org, RFC 5646 for BCP 47, ISO 3166, etc.) treats two or more forms as semantically equivalent, Pagefront accepts all of them. The standard recommends a canonical form via linter warning but does not reject the non-canonical forms as invalid. Producers SHOULD emit canonical forms; consumers MUST treat forms as their upstream standard treats them — case-insensitive comparison for BCP 47 tags, scheme-insensitive comparison for Schema.org URIs, and so on.

Two concrete examples:

- **Schema.org URIs.** `http://schema.org/InStock` and `https://schema.org/InStock` both validate. Schema.org treats the scheme variants as semantically equivalent; the validator's linter (rule W-013) warns on the legacy HTTP form and recommends migrating to HTTPS as the canonical form.
- **BCP 47 tags.** `en-US` and `en-us` both validate. RFC 5646 declares language tags case-insensitive; the validator's linter (rule W-017) warns when the case differs from the conventional canonical form (lowercase language subtag, uppercase region subtag).

This principle is what distinguishes structural validity from canonical preference. The schema enforces structural validity. The linter expresses canonical preference. The two layers work together to accept real-world inputs without losing the standard's opinions on cleanliness.

## The envelope

Unchanged from v0.5.

```json
{
  "$schema": "https://themachineweb.org/pagefront/commerce/schemas/product/v0.7.json",
  "format_version": "0.7",
  "schema_org_version": "30.0",
  "canonical_url": "https://merchant.com/product/widget-123",
  "sheet_url": "https://merchant.com/pagefront/product/widget-123.json",
  "generated_at": "2026-05-10T14:32:00Z",
  "expires_at": "2026-05-10T15:32:00Z",
  "data": {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Widget 123"
  }
}
```

Envelope fields are project-defined. `format_version`, `schema_org_version`, `canonical_url`, `sheet_url`, `generated_at`, and `data` are required on every sheet. `expires_at` is recommended — publishers SHOULD declare it when they have a meaningful expiry policy, and MAY omit it when the sheet has no defined expiry.

`expires_at`, when present, indicates how long consumers should consider the sheet valid before re-fetching. Sheets carrying multi-currency `offers` or scheduled promotions SHOULD use shorter `expires_at` windows to reflect price volatility.

## data — Schema.org JSON-LD

The data block is a valid Schema.org Product (or `ProductGroup`, or a recognized subtype) document with optional project extensions under the `pagefront:` namespace.

### Required and recommended core fields

Required:
- `@context`: `"https://schema.org"` (the standard JSON-LD context)
- `@type`: `"Product"` (or `"ProductGroup"`, or a recognized subtype)
- `@id`: stable URL-shaped identifier
- `name`: product name as displayed to humans
- `inLanguage`: BCP 47 language tag (`fr`, `fr-CA`, `en-GB`, etc.); the language of all prose fields and language-scoped media in this sheet
- `url` (canonical URL of the human page), conditional on `@type`: required for `Product` and subtypes, and optional for `ProductGroup`. A parent `ProductGroup` Sheet with no backing family page omits `url` and is located by `sheet_url` (see "Multi-Sheet variant families").
- One identifier, conditional on `@type`:
  - For `Product` (and product subtypes): one of `sku`, `gtin13`, `gtin`, `mpn`, or `productID`.
  - For `ProductGroup`: `productGroupID`. Per-variant SKUs SHOULD also be declared on each entry in `hasVariant`.

Recommended:
- `brand`: typed Brand or Organization
- `description`: prose description in `inLanguage`
- `category`: hierarchical category string (e.g., "Apparel > Knitwear > Sweaters")
- `image`: array of ImageObject (see image roles below)
- `video`: array of VideoObject (see video roles below)
- `offers`: array of Offer (see offers section)
- `isVariantOf`: ProductGroup if the product belongs to a variant family
- `pagefront:availableLanguages`: array of `{lang, url}` objects pointing at language siblings, when the publisher publishes in multiple languages
- `question`: array of Schema.org `Question` entries with `acceptedAnswer` (see "Product Q&A" below)
- `pagefront:document`: array of typed product documents (see "Documents" below)
- `pagefront:relatedProduct`: array of typed product relationships (see "Related products" below)

#### ProductGroup variant completeness

ProductGroup Sheets SHOULD declare all variants in the family. The `hasVariant` array is intended to be exhaustive: consumers reading a ProductGroup Sheet expect it to reflect the complete variant family at the moment of emission, not a subset. When variants live on different pages and the production pipeline can discover them all, the resulting Sheet should include each. When some variants cannot be discovered, producers should emit per-variant Product Sheets when a parent ProductGroup Sheet is not produced, rather than a partial ProductGroup Sheet.

#### Multi-Sheet variant families

When variants have their own pages carrying substantial per-variant content — their own media gallery, description, and offers — producers SHOULD model the family as multiple Sheets rather than inlining every variant into one ProductGroup Sheet. Inlining works when variants are thin (a color and a price), but it collapses when each variant page is a rich product page in its own right.

The structure is N+1 Sheets:

- **One parent ProductGroup Sheet** at the family's canonical URL. Its `hasVariant` array enumerates every variant, each entry linking to that variant's own Sheet. When the family has no backing page of its own — the variants are the only human-facing pages and there is no family landing page — the parent is page-less: it omits the data-block `url` (there is no family page to point at) and carries only `sheet_url` as its location. Consumers reach a page-less parent by `sheet_url`, typically by following `isVariantOf.sheet_url` from a variant Sheet.
- **One Product Sheet per variant**, each carrying `isVariantOf` pointing at the parent's `@id`.

This gives bidirectional traversal. A variant Sheet reaches its parent via `isVariantOf`; the parent reaches its variants via `hasVariant`. An agent landing on a variant page reaches that variant's Sheet via `Link: rel="describedby"`, follows `isVariantOf` to the parent Sheet, and reads the parent's `hasVariant` to enumerate sibling variants. An agent landing on the family page reads the parent's `hasVariant` to reach each variant directly.

Each parent `hasVariant` entry carries:

- `@id` *(required)* — matches exactly the `@id` in the variant's own Sheet. The exact-string match is what lets a consumer recognize the parent's reference and the variant's self-description as the same product; see "Product identity and deduplication" for the `@id` contract.
- `url` *(required)* — the variant's page.
- `sheet_url` *(recommended)* — the URL of the variant's Sheet. It lets a consumer fetch the variant Sheet directly without first loading the variant page and reading its `describedby` link. A producer emitting both the parent and the variant Sheets knows this URL and SHOULD populate it. When `sheet_url` is absent, a consumer reaches the variant Sheet via `url` + `describedby`. When `sheet_url` is present but unresolvable, the consumer falls back to `url` + `describedby`.
- `name`, the axis value (e.g. `color`), `price`, and an `image` render-hint — *optional*, but enough together to render a family picker without fetching every variant Sheet.

Each variant Sheet carries `isVariantOf` with the parent's `@id`, and SHOULD carry the parent's `sheet_url` so traversal to the parent is symmetric — a consumer on the variant Sheet can fetch the parent directly rather than resolving it through the variant page.

A parent ProductGroup Sheet, with two `hasVariant` entries each linking to a variant Sheet:

```json
{
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "@id": "https://merchant.com/pagefront/product/aurora-jacket.en.json",
  "name": "Aurora Jacket",
  "inLanguage": "en",
  "productGroupID": "AURORA-JACKET",
  "url": "https://merchant.com/products/aurora-jacket",
  "variesBy": ["https://schema.org/color"],
  "hasVariant": [
    {
      "@type": "Product",
      "@id": "https://merchant.com/pagefront/product/aurora-jacket-onyx.en.json",
      "url": "https://merchant.com/products/aurora-jacket?variant=onyx",
      "sheet_url": "https://merchant.com/pagefront/product/aurora-jacket-onyx.en.json",
      "name": "Aurora Jacket — Onyx",
      "color": "Onyx",
      "image": "https://merchant.com/images/aurora-jacket-onyx-packshot.jpg"
    },
    {
      "@type": "Product",
      "@id": "https://merchant.com/pagefront/product/aurora-jacket-sand.en.json",
      "url": "https://merchant.com/products/aurora-jacket?variant=sand",
      "sheet_url": "https://merchant.com/pagefront/product/aurora-jacket-sand.en.json",
      "name": "Aurora Jacket — Sand",
      "color": "Sand",
      "image": "https://merchant.com/images/aurora-jacket-sand-packshot.jpg"
    }
  ]
}
```

The corresponding variant Product Sheet for the Onyx colorway, pointing back at the parent via `isVariantOf` and carrying its own media array:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://merchant.com/pagefront/product/aurora-jacket-onyx.en.json",
  "name": "Aurora Jacket — Onyx",
  "inLanguage": "en",
  "sku": "AURORA-ONYX",
  "url": "https://merchant.com/products/aurora-jacket?variant=onyx",
  "color": "Onyx",
  "isVariantOf": {
    "@type": "ProductGroup",
    "@id": "https://merchant.com/pagefront/product/aurora-jacket.en.json",
    "sheet_url": "https://merchant.com/pagefront/product/aurora-jacket.en.json"
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

A **page-less parent** ProductGroup — a family whose variants each have their own page but that has no family landing page of its own. The data block omits `url` (there is no family page to point at) and is served at its own envelope `sheet_url`; consumers reach it by following each variant's `isVariantOf.sheet_url`. The `productGroupID` identifier requirement still holds — only `url` is dropped. Each variant entry still carries its own page `url`:

```json
{
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "@id": "https://merchant.com/pagefront/product/studio-pendant.en.json",
  "name": "Studio Pendant Lamp",
  "inLanguage": "en",
  "productGroupID": "STUDIO-PENDANT",
  "variesBy": ["https://schema.org/material"],
  "hasVariant": [
    {
      "@type": "Product",
      "@id": "https://merchant.com/pagefront/product/studio-pendant-brass.en.json",
      "url": "https://merchant.com/products/studio-pendant-brass",
      "sheet_url": "https://merchant.com/pagefront/product/studio-pendant-brass.en.json",
      "name": "Studio Pendant Lamp — Brass",
      "material": "Brass",
      "image": "https://merchant.com/images/studio-pendant-brass-packshot.jpg"
    },
    {
      "@type": "Product",
      "@id": "https://merchant.com/pagefront/product/studio-pendant-black.en.json",
      "url": "https://merchant.com/products/studio-pendant-black",
      "sheet_url": "https://merchant.com/pagefront/product/studio-pendant-black.en.json",
      "name": "Studio Pendant Lamp — Matte Black",
      "material": "Matte Black",
      "image": "https://merchant.com/images/studio-pendant-black-packshot.jpg"
    }
  ]
}
```

Each variant Sheet points back at this page-less parent exactly as in the Onyx example above — `isVariantOf` carrying the parent's `@id` and `sheet_url` — so the parent is reachable even though it has no page.

#### Per-variant URLs

Each entry in `hasVariant` MAY declare a `url` field. The ProductGroup's top-level `url` remains the canonical URL of the product family (typically the merchant's primary listing page or the page from which variant discovery began). The variant's `@id` remains the primary identifier for the variant; the per-variant `url` is supplementary metadata that carries addressability information — consumers can use it to construct direct links to variant-specific page states. This matters for agents recommending specific variants to users, for sharing links, and for any consumer that needs to address a variant individually.

When the parent ProductGroup has no family page (the page-less parent of a multi-Sheet variant family, see "Multi-Sheet variant families"), its top-level `url` is absent and the family is located by `sheet_url` instead. The per-variant `url` fields on `hasVariant` entries are unaffected: each variant still declares its own page `url` under the same guidance above.

Three patterns govern whether to populate it:

1. **Shared-URL variants.** Variants share the parent product's URL and are distinguished only by `@id`. The `url` field on individual variants is genuinely unnecessary here and MAY be omitted.
2. **Same-page parameterized variants.** Variants share the parent product's page, but each has a distinct addressable URL via platform-specific query parameters (e.g., `?variant={id}` on Shopify). The page is the same; the URL differs by which variant is pre-selected. Per-variant `url` SHOULD be populated because it carries real addressability information consumers can use. These query-parameter URLs are semantically equivalent to the parent product URL — the difference is only which variant is pre-selected — so consumers SHOULD treat them as the same canonical page with a different default state, not as different resources.
3. **Distinct-page variants.** Each variant has its own page on its own URL (for example a watch family where each dial color is its own page, though such families are typically modeled as separate Sheets rather than as variants in one Sheet). Per-variant `url` is essential.

In short: per-variant `url` SHOULD be populated when each variant has a meaningfully distinct addressable URL (cases 2 and 3). It MAY be omitted only when variants share the exact same URL with no parameter-based differentiation (case 1, rare in practice).

#### ProductGroup `name` and Google Merchant Center `item_group_title`

For implementers transitioning from Google Merchant Center feed formats: the `name` field on a `ProductGroup` is the Pagefront equivalent of Google's `item_group_title` attribute. The two carry the same intent — a human-readable title for the variant family that is distinct from any individual variant's `name`. Pagefront expresses it via Schema.org's native `name` on the `ProductGroup` rather than minting a dedicated attribute, because the semantic is already covered by Schema.org's existing vocabulary.

#### Variant dimensions

ProductGroup Sheets SHOULD declare the axes along which their variants differ. v0.7 recommends, in order of preference:

1. **Schema.org-native variant properties on each `hasVariant` entry**, when the axis is one Schema.org models directly: `color`, `size`, `material`. The corresponding `variesBy` array on the `ProductGroup` SHOULD reference these property names so consumers can discover the variant axes without scanning variants.
2. **`additionalProperty` entries** with a `propertyID` drawn from the suggested registry below, when Schema.org has no native property for the dimension. Each `additionalProperty` carries `propertyID` (the dimension identifier) and `value` (the variant's value on that dimension).

`variesBy` entries are represented in two forms depending on which kind of axis they reference. Schema.org-native axes are referenced by their full Schema.org URI (`https://schema.org/color`, `https://schema.org/size`, `https://schema.org/material`). Registry entries and producer-defined axes are referenced by the bare `propertyID` string (`storage`, `case_size`, `width`). Consumers distinguish the two forms by the presence of a URI scheme. A ProductGroup that varies along both Schema.org-native and non-native axes will have mixed entries:

```json
"variesBy": ["https://schema.org/color", "storage"]
```

Each variant in `hasVariant` declares its value on every axis: Schema.org-native axes via the Schema.org property name (`color`, `size`, `material`) directly on the variant, and non-native axes via an `additionalProperty` entry whose `propertyID` matches the bare-string axis in `variesBy`.

The v0.7 suggested registry for non-Schema.org-native variant dimensions:

- `width` — shoe width (e.g., `D`, `EE`), bag/strap width, etc.
- `capacity` — fluid capacity, bag volume, etc.
- `finish` — surface finish (e.g., `matte`, `polished`, `brushed`).
- `memory` — RAM in electronics (e.g., `16 GB`).
- `storage` — disk or flash storage (e.g., `512 GB`, `1 TB`).
- `display_size` — diagonal screen size (e.g., `13.6"`, `15"`).
- `power` — power rating (e.g., `65 W`, `100 W`).
- `voltage` — voltage rating (e.g., `120 V`, `230 V`).

The registry is **suggested, not closed**. Publishers MAY introduce their own `propertyID` values when none of the suggested ones fit; consumers SHOULD treat unknown `propertyID` values as opaque axes rather than rejecting them. Conventions stabilize over time through real-merchant use, and a future version may close or extend the registry based on observed practice.

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

#### Configurator vs. ProductGroup guidance

Configurable products can in principle be expressed two ways: with `pagefront:configurator` declaring a parametric option space, or with `ProductGroup` + `hasVariant` + `offers` enumerating each combination as a discrete SKU. The choice is normative — each pattern has a defined scope, and using both for the same dimension (linter rule W-010) is an authoring error.

Use `pagefront:configurator` when **any** of the following holds:

- **Combinatorial impracticality.** Listing every combination as a separate `Offer` is not how the merchant manages inventory or surfaces options to buyers.
- **Continuous dimensions.** At least one dimension is genuinely continuous — engraving text, custom dimensions (a watch strap cut to wrist circumference), free-form monogram choice, custom date inscription, or similar parametric inputs.
- **Made-to-order economics.** The product is produced on demand from configured inputs rather than picked from inventory. (Typically paired with `pagefront:madeToOrderTerms` for the economic terms.)
- **Four or more variant axes.** Products with 4 or more variant axes SHOULD use `pagefront:configurator`. The 3-axis ceiling for `ProductGroup` reflects that real-world axes carry enough values that 4+ axis combinations are impractical to manage as discrete inventory SKUs — a 4-axis product where each axis has 3+ values already exceeds 80 combinations, past the point where `ProductGroup` enumeration scales cleanly. An exception applies only when the cartesian product is unusually small AND every combination ships from inventory as a discrete SKU; in practice the exception rarely applies, and producers facing borderline cases should default to configurator.

**Axis count is per-Sheet, not per-product family.** The axis counts above refer to the variant axes expressed within a single Sheet — on one canonical URL — not to the total a logical product family might carry across all its representations. A family with more axes than one Sheet expresses is routinely factored across multiple Sheets by picking one axis as the page boundary. Picture a watch family with three axes — dial color, strap, and case back — where the merchant gives each dial color its own page. Each Sheet then expresses only strap and case back — two axes, well within the `ProductGroup` envelope. Cross-Sheet relationships (`isVariantOf` to a parent family Sheet, or `pagefront:relatedProduct` between siblings) carry the factored axis.

A producer with a 4+ axis family therefore has two valid options:

1. **Factor across Sheets**, keeping each at 3 or fewer axes (the factoring example below). Best for in-stock families with a discrete SKU per combination: it keeps each Sheet tractable and matches how customers navigate — shopping by dial, then choosing strap and case back within it.
2. **Express the full space in one Sheet** using `pagefront:configurator` (the configurator example below). Best for made-to-order or continuous-dimension products, where there is no per-combination inventory to enumerate.

Use `ProductGroup` + `hasVariant` + `offers` when **all** of the following hold:

- The variant space has 3 or fewer axes.
- All axes are discrete (no continuous dimensions).
- Each combination is a discrete SKU shipping from inventory.

The 3-axis ceiling is a per-Sheet tractability limit, not a statement about product complexity: real-world axes carry enough values that 4+ axis combinations are impractical to manage as discrete SKUs even when the cartesian product looks small.

Worked examples:

- **Made-to-order configurator.** A custom ring offered in 14 gold options × 5 sizes × 2 band styles — 140 configurations, made to order, none held in inventory. Made-to-order economics and combinatorial scale together force the configurator; even at 3 axes it is the only tractable representation.
- **Cross-Sheet factoring, `ProductGroup` per axis.** A watch family with three axes — dial color, strap, and case back — where the merchant gives each dial color its own page. Each Sheet then expresses only the remaining two axes (strap × case back) as a `ProductGroup` whose `hasVariant` enumerates the discrete in-stock SKUs; cross-Sheet relationships connect the dials. The same logical complexity, distributed across tractable Sheets each well inside the 3-axis ceiling.
- **Three-axis `ProductGroup` at the boundary.** A watch line of 3 case materials × 3 strap types × 3 case sizes = 27 combinations, each stocked as a discrete SKU. All axes discrete, all combinations in inventory, axis count at the ceiling: one `ProductGroup` with `hasVariant` enumerating all 27 entries — the upper end of the envelope, but unambiguously inside it.

##### Mixed cross-Sheet factoring

A product's axes can split across both mechanisms at once: some axes factored into separate pages (each a Sheet, connected by the variant relationship), and the remaining axes configured within each page (via `pagefront:configurator`). The factored axes and the configurator axes are two disjoint sets — no axis appears in both roles on any single Sheet, which keeps each Sheet clear of the W-010 conflict (configurator and `hasVariant`/`isVariantOf` declaring the same dimension).

The pattern:

- **Factored axes** (the page-boundary axes) are expressed through the variant relationship: a parent `ProductGroup` Sheet whose `hasVariant` enumerates the per-page variants, each page carrying `isVariantOf` to the parent. `variesBy` on the parent lists the factored axes.
- **Configurator axes** (the within-page axes) are expressed through `pagefront:configurator` on each page's Product Sheet.
- The two axis sets are disjoint. An axis is either factored or configured, never both.

For example, an engagement ring with four axes — shape, band style, carat, and metal — splits two-and-two. Shape and band style are factored into pages: each (shape × band) combination is its own page and Sheet, so they are the family axes, carried by a parent `ProductGroup` (`variesBy`: shape, band style) whose `hasVariant` enumerates the per-combination pages. Carat and metal are configured within each page, carried by a `pagefront:configurator` (`dimensions`: carat, metal) on each page's Product Sheet. No Sheet declares any axis as both a variant axis and a configurator dimension, so W-010 does not fire.

The rule: when a product's axes exceed what one mechanism handles cleanly, partition them — pick the axes that are factored into pages (the variant relationship) and the axes that are configured within a page (the configurator), keeping the two sets disjoint. This composes the cross-Sheet factoring pattern with the configurator: factoring handles the page-boundary axes, the configurator handles the rest.

##### Configurator pricing and price bands

`pagefront:configurator` describes a configurable option space; `basePrice`, `basePriceCurrency`, and `priceFormula` are optional, so a configurator does not have to carry pricing. When a producer cannot extract per-combination pricing — the page resolves a configured price only after selection, or only one slice of the price grid is visible (a carat ladder shown for a single metal, say) — the configurator can still carry the `dimensions` (the option space) without complete pricing.

In that case, pair the configurator with a Schema.org `AggregateOffer` on the same Sheet's `offers`, giving the price band for that Sheet's configurable axes:

- `lowPrice` — the cheapest configuration's total (the "from" price), which is almost always extractable.
- `highPrice` — the most expensive configuration's total, the ceiling of the band.
- `priceCurrency` — from the page's context.
- No `itemOffered`: the `AggregateOffer` is nested in the Product's `offers`, so position binds it to that Product; there is no sibling offer to disambiguate.

Because both bounds are required, a partial band is not valid. When a producer can compute both bounds, it emits the `AggregateOffer`. When the ceiling genuinely cannot be computed, the producer omits the `AggregateOffer` entirely and emits the configurator alone — the option space without a price band — rather than emitting an incomplete `AggregateOffer`. A configurator-only Sheet remains valid; a half-populated `AggregateOffer` (a `lowPrice` with no `highPrice`) does not.

The division of labor: the configurator describes what is configurable (the option space), the `AggregateOffer` describes what it costs (the price band). A consumer reads the options from the configurator and the band from `offers`, with no pricing required inside the configurator.

Scope the band to the Sheet's own configurable axes. On a Sheet where some axes are factored into pages (mixed cross-Sheet factoring, above), the factored axes are fixed for that page, so the `AggregateOffer` ranges only over the page's configurator axes. For example, an engagement-ring page with shape and band fixed (factored) and carat × metal configured carries an `AggregateOffer` whose `lowPrice` is that page's floor (smallest carat, cheapest metal) and whose `highPrice` is that page's ceiling (largest carat, most expensive metal) — the band spans only carat × metal, not the whole family's price spread across shapes and bands, which is captured implicitly by the set of per-page bands.

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://merchant.com/pagefront/product/solitaire-ring-round-pave.en.json",
  "name": "Solitaire Engagement Ring — Round, Pavé Band",
  "inLanguage": "en",
  "sku": "RING-SOLITAIRE-ROUND-PAVE",
  "url": "https://merchant.com/products/solitaire-ring?shape=round&band=pave",
  "pagefront:configurator": {
    "@type": "pagefront:Configurator",
    "dimensions": [
      {
        "name": "carat",
        "options": [
          { "value": "0.5" },
          { "value": "1.0" },
          { "value": "1.5" },
          { "value": "2.0" }
        ]
      },
      {
        "name": "metal",
        "options": [
          { "value": "14k white gold" },
          { "value": "18k yellow gold" },
          { "value": "platinum" }
        ]
      }
    ]
  },
  "offers": [
    {
      "@type": "AggregateOffer",
      "lowPrice": 1800,
      "highPrice": 9200,
      "priceCurrency": "USD"
    }
  ]
}
```

Linter rules W-007 (single-variant ProductGroup), W-009 (empty `hasVariant`), and W-010 (configurator and `hasVariant` declaring the same dimension) implement guardrails around this decision. The 4-axis ceiling does not change those checks — it only adjusts which model is recommended for borderline-by-axis-count products.

#### Product dimensions

Product dimensions are expressed using Schema.org's native `height`, `width`, `depth`, and `weight` properties on the Product. Each takes a `QuantitativeValue` with a `value` (numeric) and a `unitCode` (UN/CEFACT unit code).

Recommended unit codes:

- **Length dimensions** (`height`, `width`, `depth`): `CMT` (centimetres), `MMT` (millimetres), `INH` (inches).
- **Weight**: `GRM` (grams), `KGM` (kilograms), `LBR` (pounds), `ONZ` (ounces).

The choice of unit is the producer's. Consumers reading the Sheet read the `unitCode` and convert as needed. Producers should choose units appropriate to the product category — centimetres for soft goods and apparel, millimetres for jewelry and watches, grams for jewelry and small items, kilograms for larger objects.

Example — a leather bag 20cm tall, 30cm wide, 10cm deep, weighing 800g:

```json
{
  "@type": "Product",
  "name": "Leather Tote",
  "height": { "@type": "QuantitativeValue", "value": 20, "unitCode": "CMT" },
  "width":  { "@type": "QuantitativeValue", "value": 30, "unitCode": "CMT" },
  "depth":  { "@type": "QuantitativeValue", "value": 10, "unitCode": "CMT" },
  "weight": { "@type": "QuantitativeValue", "value": 800, "unitCode": "GRM" }
}
```

For products where dimensions vary by variant (a bag offered in multiple sizes, a board offered in multiple lengths), each variant entry in `hasVariant` MAY declare its own dimensions. The `ProductGroup`-level dimensions can be omitted, or set to the canonical/primary variant's dimensions, with per-variant entries carrying the actual differences.

The `QuantitativeValue` object accepts an optional `description` field for clarifying nuance — for example `"Weight in size L"` when weight varies by variant, or `"Total gold weight (excludes gemstones)"` when weight is partial.

Distinguish from per-material weight: `pagefront:Material` entries inside `pagefront:materialComposition` carry an optional `weightGrams` field for cases where total product weight is distributed across multiple materials (common in jewelry — gold band weight separate from gemstone weight). The Product-level `weight` is the total; the Material-level `weightGrams` is per-component. Both can coexist in the same Sheet.

These dimensions describe the product itself, not packaging or shipping container. Shipping dimensions, if relevant, belong on the Offer's `shippingDetails` rather than on the Product.

For products where dimensions are not meaningful (digital products, services), these fields should simply be omitted; the spec does not require them.

#### Age suitability

Products carrying an age recommendation (toys, games, children's equipment) SHOULD declare it via Schema.org's `audience` property, carrying a `PeopleAudience` with `suggestedMinAge` and/or `suggestedMaxAge` — both numbers, in years. An open-ended recommendation ("5 and up") declares only `suggestedMinAge`. `suggestedGender` MAY be added where the merchant themselves declares a gendered audience; producers SHOULD NOT infer one.

Regulatory age warnings are a different statement — not "who this is for" but "who this must be kept from," as in the EU toy-safety warning "Not suitable for children under 36 months." A warning is carried as an `additionalProperty` convention: a `PropertyValue` with `name: "age_warning"` and the warning text as `value`, in the sheet's `inLanguage`. The two coexist on the same product; a recommendation and a warning answer different questions, and one never substitutes for the other.

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

### Image roles

Each ImageObject can declare a role via `additionalProperty`. The closed enumeration (unchanged from v0.4):

- `hero` — the primary image, typically lifestyle or evocative
- `packshot` — product on neutral background, isolation shot
- `lifestyle` — product in use or in context
- `detail` — close-up of construction, fabric, finish, or distinguishing feature
- `flatlay` — top-down product layout, common in apparel
- `swatch` — color or material sample
- `size_chart` — measurement diagram (typically apparel)
- `context` — environmental or scale-reference shot

A single image may declare more than one role (a packshot that also serves as the hero). Renderers and consumers should treat roles as filter inputs, not as exclusive categories.

```json
{
  "@type": "ImageObject",
  "url": "https://...",
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "role", "value": "packshot" },
    { "@type": "PropertyValue", "name": "role", "value": "hero" }
  ]
}
```

The role enum is closed. Additional values require a spec amendment. Publishers needing roles outside the enum can use unprefixed PropertyValues that consumers may ignore.

### Associating images with variants

When a ProductGroup Sheet's `image` array contains images that depict specific variants (a packshot of one color, a lifestyle shot featuring one size, a swatch for one finish), the image SHOULD declare which variant(s) it depicts via Schema.org's `about` property. This mirrors the `itemOffered` pattern used to associate Offers with variants.

Producers SHOULD declare `about` on every image in a ProductGroup Sheet. For variant-specific images, `about` points at the depicted variant's `@id` — a single reference for an image of one variant, or an array of references for an image applying to multiple variants (a comparison shot, a color-swatch chart, an infographic). For family-level images (applying to the whole product family rather than to specific variants — family overview, packaging, the product without variant emphasis), `about` points at the ProductGroup's `@id`.

Per-variant packshot — a single `about` reference to one variant:

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

Multi-variant image — a swatch chart depicting every color in the family, with `about` as an array of references:

```json
{
  "@type": "ImageObject",
  "url": "https://merchant.com/media/widget-color-chart.jpg",
  "about": [
    { "@id": "https://merchant.com/product/widget#color-midnight" },
    { "@id": "https://merchant.com/product/widget#color-silver" },
    { "@id": "https://merchant.com/product/widget#color-starlight" }
  ],
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "role", "value": "swatch" }
  ]
}
```

Family-level image — a general product shot without variant emphasis, with `about` set to the ProductGroup's `@id`:

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

Declaring `about` on every image — rather than treating omission as a convention for family-level images — disambiguates family-level images (where the producer affirmatively states "this applies to the ProductGroup") from images where variant association is simply unknown or omitted in error. The pattern is also symmetric with `itemOffered` on Offers, where every Offer always declares its target — there is no convention of "Offer without itemOffered applies to the whole family."

The pattern is Schema.org-native by design: `about` is well-defined and widely supported, so Pagefront introduces no typed extension.

VideoObject supports the same pattern via the same `about` property. Variant-specific product videos (a tutorial featuring one configuration, a demonstration of one finish) can declare their variant association identically — single `about` reference for one-variant videos, array for multi-variant videos. Family-level videos in a ProductGroup Sheet should declare `about` pointing at the ProductGroup's `@id`, following the same every-video rule as images.

### Textual framing for media

Producers SHOULD populate textual framing for images that benefit from publisher context — lifestyle imagery, infographics, comparative diagrams, swatches in context, any image where the publisher's intent isn't self-evident from the visual content alone. Producers MAY skip textual framing for packshots and other studio imagery where visual analysis can describe the content reliably.

Schema.org provides two fields for this purpose, used by convention:

- `caption`: short, display-quality text that accompanies the image, typically merchant-approved for human reading. Use when the merchant already has caption text in their content management system.
- `description`: longer or more semantic text that may not be displayed but provides machine-readable framing. Use when the merchant has richer context than a caption would carry.

Producers populating both fields should ensure they carry meaningfully different content; identical or near-identical `caption` and `description` add noise.

Both fields serve machine readers; the distinction is length and provenance (`caption` short and publisher-vetted, `description` longer and optional), not consumer type.

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

### Video roles

Each VideoObject in the `video` array can declare a role via `additionalProperty`, mirroring the image-role pattern. The closed enumeration:

- `overview` — primary product video, typically short (30–90 seconds), showing the product itself. The video equivalent of a hero image.
- `tutorial` — how-to-use, how-to-install, how-to-assemble, how-to-care-for content. Typically longer (2–10 minutes), instructional in voice.
- `lifestyle` — atmospheric, product-in-context footage, often without explicit narration. The video equivalent of lifestyle photography.
- `construction` — manufacturing footage, behind-the-scenes, how-it's-made. Carries the same provenance/transparency value as `pagefront:manufacturingChain` and is encouraged for publishers whose differentiation includes production transparency.
- `demonstration` — product in functional use (instrument played, tool operating, audio sample). For products where motion or sound is part of the value proposition.
- `comparison` — A/B with another product or alternative configuration. Used when the publisher wants to surface how their product differs from named alternatives.
- `unboxing` — packaging-opening footage, merchant- or partner-produced. Distinct from user-generated unboxing content (see note below on user-generated media).
- `spin` — 360° product rotation, typically generated from photogrammetry. Conceptually closer to a rich image than a video but uses video format for delivery.

A single video may declare more than one role when appropriate (an `overview` that also serves as `lifestyle`). Renderers and consumers should treat roles as filter inputs, not as exclusive categories.

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

The role enum is closed. Additional values require a spec amendment.

#### Video hosting: contentUrl, embedUrl, or both

Publishers MAY declare `contentUrl` (the raw video file URL), `embedUrl` (a player URL such as YouTube or Vimeo), or both. The spec doesn't prescribe hosting.

When both are present, consumers SHOULD prefer `contentUrl` for direct playback contexts and `embedUrl` for browser-rendered contexts where the embed provides player controls, analytics, and rights management the raw file doesn't.

#### Multiple thumbnails

A `VideoObject` usually carries a single preview via `thumbnailUrl` (a URL string), as shown in the examples above. When a single video is surfaced under more than one preview image that carry distinct meaning — different scenes, framings, or use-cases the merchant deliberately chose — use Schema.org's `thumbnail` property (an array of `ImageObject`) instead of `thumbnailUrl`, so each preview keeps its own context (`description`/`caption`).

The distinction is content, not count:

- **Interchangeable previews** (same scene, different crops or sizes, no distinct meaning) → `thumbnailUrl` with one URL. There's nothing to distinguish, so a single preview suffices.
- **Meaningful previews** (different scenes or use-cases) → `thumbnail` with an array of `ImageObject`, each carrying its own `description`/`caption`. The difference between previews is information to preserve.

This remains one `VideoObject` — one video, identified by its `contentUrl`/`embedUrl`. Multiple previews of one video are never multiple `VideoObject`s; that would misrepresent the page and create a dedup artifact (two `VideoObject`s sharing one `contentUrl` are the same video).

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

#### Accessibility

Publishers SHOULD include `caption` (a short summary, typically one to three sentences) and/or `transcript` (the full spoken or signed content of the video) on every VideoObject. Captions/transcripts serve consumers in audio-restricted contexts, consumers using accessibility tools, and consumers parsing the sheet without rendering the video.

Pagefront does not require captions or transcripts. The validator's linter (rule W-012) warns when accessibility metadata is absent on videos with `overview` or `tutorial` roles — the cases where consumer comprehension matters most.

#### Video and internationalization

Video is language-scoped. A French-language sheet's `video` array contains French-language videos; an English-language sheet's contains English-language videos. Cross-language navigation between sheets is via the `Link` header's `hreflang` parameter (per v0.5's internationalization model), not via mixing languages within a single sheet's video array.

When a video is genuinely language-agnostic (silent construction footage, instrument demonstrations without spoken content), publishers MAY include the same video file in multiple language sheets. The `caption` and `transcript` fields, if present, SHOULD match the sheet's `inLanguage`.

#### What's not in `video`

- **User-generated review videos** belong in `pagefront:userGeneratedMedia` (a future field, not in v0.6). The publisher isn't the author and the trust signal is fundamentally different from publisher-authored video.
- **Live streams and scheduled broadcasts** are out of scope. Schema.org's `BroadcastEvent` and `LiveBlogPosting` cover this case; Pagefront may revisit if real consumer use cases surface.
- **Promotional videos / advertisements** typically fall under `overview` or `lifestyle`. The spec doesn't define a distinct `commercial` role because the routing distinction doesn't help consumers.
- **`hero` is not a video role.** The image role `hero` exists to disambiguate within an image set where multiple images could be the primary one. Most products have one overview video; the disambiguation isn't needed. Publishers wanting to surface a primary video should use `overview`.

### Product Q&A

Pagefront Sheets MAY carry a `question` array on the `Product` (or `ProductGroup`) data block to express FAQ-style content scoped to the product. The affordance uses Schema.org's native `Question` and `Answer` vocabulary with `acceptedAnswer` linking them; no `pagefront:` term is minted because Schema.org already covers the shape.

Each entry has `@type: Question`, a `name` field carrying the question, and an `acceptedAnswer` of `@type: Answer` carrying the answer prose:

```json
"question": [
  {
    "@type": "Question",
    "name": "Is this watch water-resistant?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Yes. The case is rated to 100 metres (10 ATM), suitable for swimming and snorkelling but not for high-speed water sports or scuba diving."
    }
  },
  {
    "@type": "Question",
    "name": "Does the strap fit a 19 mm lug width?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "No. This model uses a 20 mm lug width. A 19 mm strap will leave a visible gap and is not recommended."
    }
  }
]
```

Questions and their answers are language-scoped to the sheet's `inLanguage`, like all other prose fields. A French-language sheet carries French-language Q&A; an English-language sheet carries English-language Q&A. Cross-language sibling sheets carry parallel Q&A in their respective languages.

v0.7 follows Schema.org's pattern of a single `acceptedAnswer` per question. Schema.org also defines a `suggestedAnswer` array for community-style Q&A; publishers MAY use it, but the typical Pagefront case (publisher-authored Q&A about their own product) is a single authoritative answer.

### Documents

Pagefront Sheets MAY carry a `pagefront:document` array surfacing typed product-related documents that Schema.org under-specifies on `Product`: manuals, spec sheets, compatibility lists, assembly instructions, care guides, warranty documents, certificates, environmental declarations, audit reports, lab tests, safety data sheets, installation guides, user guides, quick-start cards, brochures.

Each entry has the shape:

- `@type: pagefront:Document` *(required)*
- `url` *(required)* — direct URL to the document, typically PDF.
- `role` *(required)* — closed enum (see below).
- `name` *(recommended)* — human-readable title.
- `inLanguage` *(recommended)* — BCP 47 language tag. MAY differ from the sheet's `inLanguage` when the document is multilingual or is published in a different language than the sheet (a common case for safety data sheets and certification PDFs).
- `description` *(optional)* — short prose describing what the document contains.
- `encodingFormat` *(optional)* — MIME type; defaults to `application/pdf` when omitted.

The closed `role` enum (v0.7):

- `manual` — full product manual.
- `assembly` — assembly instructions.
- `care_guide` — care and maintenance instructions.
- `spec_sheet` — technical specification sheet.
- `compatibility` — a list of products, systems, or standards this product works with. Distinct from `spec_sheet`: a spec sheet states the product's own properties, whereas a compatibility document answers whether it interoperates with something else.
- `warranty` — warranty terms document.
- `certificate` — certification document (e.g., authenticity, compliance).
- `environmental_declaration` — standardized environmental product declaration (e.g. Type III EPD, PEP ecopassport).
- `audit_report` — third-party audit report.
- `lab_test` — laboratory test results.
- `safety_data_sheet` — SDS, typically for chemical or hazardous-material products.
- `installation_guide` — installation instructions distinct from general assembly.
- `user_guide` — user-facing guide distinct from a full manual (typically shorter, task-oriented).
- `quick_start` — quick-start or getting-started card.
- `brochure` — marketing or sales brochure; a promotional overview, not an authoritative technical source.

Additional values require a spec amendment. Category-specific roles (e.g., `dental_imaging_protocol` for medical devices) are intentionally out of scope in v0.7; publishers needing category-specific framing SHOULD use the closest enum value and convey specifics in `name` and `description`.

A compatibility document's *contents* are candidates for structured expression. Where the compatible products are identifiable, publishers SHOULD also emit `pagefront:relatedProduct` entries with `relationship: compatible_with`, so consumers can answer compatibility questions from structured data rather than by parsing a PDF. The `compatibility` document role links the human-readable artifact; it is not a substitute for the relationships themselves where those can be expressed.

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

### Energy efficiency

Products regulated under the EU energy-labelling framework (Regulation (EU) 2017/1369 — major appliances, light sources, electronic displays, and similar) carry an efficiency class that Schema.org models natively, so Pagefront mints no vocabulary. Declare `hasEnergyConsumptionDetails` on the `Product`, carrying an `EnergyConsumptionDetails` object whose `hasEnergyEfficiencyCategory` is a canonical `EUEnergyEfficiencyEnumeration` URI:

- The rescaled A–G label (mandatory for most product categories since 2021): `https://schema.org/EUEnergyEfficiencyCategoryA` through `https://schema.org/EUEnergyEfficiencyCategoryG`.
- The legacy plus-classes, for categories still labelled under the older scale: `EUEnergyEfficiencyCategoryA1Plus` (A+), `EUEnergyEfficiencyCategoryA2Plus` (A++), `EUEnergyEfficiencyCategoryA3Plus` (A+++).

When the product's label runs on a sub-scale, `energyEfficiencyScaleMax` (the most efficient class on the label) and `energyEfficiencyScaleMin` (the least efficient) MAY bound the scale so consumers can position the class within the label it actually appears on.

The energy label graphic — the standardized colored-arrow artwork — is an artifact, not structured data. It MAY ride in the `image` array like any product image, or as a `pagefront:document` entry with `role: "certificate"` when the merchant publishes it as a downloadable document (commonly alongside the product information sheet). The structured `hasEnergyConsumptionDetails` declaration SHOULD be present whenever the class is known, whether or not the label graphic is published.

```json
{
  "@type": "Product",
  "name": "EcoWash 9 kg Washing Machine",
  "url": "https://merchant.com/products/ecowash-9kg",
  "hasEnergyConsumptionDetails": {
    "@type": "EnergyConsumptionDetails",
    "hasEnergyEfficiencyCategory": "https://schema.org/EUEnergyEfficiencyCategoryB",
    "energyEfficiencyScaleMin": "https://schema.org/EUEnergyEfficiencyCategoryG",
    "energyEfficiencyScaleMax": "https://schema.org/EUEnergyEfficiencyCategoryA"
  },
  "pagefront:document": [
    {
      "@type": "pagefront:Document",
      "url": "https://merchant.com/docs/ecowash-9kg-energy-label.pdf",
      "role": "certificate",
      "name": "EU Energy Label",
      "inLanguage": "en"
    }
  ]
}
```

### Related products

Pagefront Sheets MAY carry a `pagefront:relatedProduct` array expressing typed relationships between products. Schema.org has loose relations (`isRelatedTo`, `isSimilarTo`, `isAccessoryOrSparePartFor`, `isConsumableFor`) but these are untyped beyond the four built-in relations and don't carry the typed-relationship semantics agents need for context-aware recommendations. Schema.org's `isAccessoryOrSparePartFor` fuses two distinct relationships into one untyped property. Pagefront separates them: `accessory` (an optional add-on that extends the product) and `spare_part` (a replacement for a component the product already has, ordered on wear or failure). Consumers act on the difference — an accessory is an upsell, a spare part is aftermarket support — so the distinction is typed rather than left to the consumer to infer from the target product's name.

Each entry has the shape:

- `@type: pagefront:RelatedProduct` *(required)*
- `relationship` *(required)* — closed enum (see below).
- A target identifier, in one of two forms:
  - `@id` reference to another Pagefront Sheet (preferred for same-publisher products).
  - A Schema.org identifier on the target object: `sku`, `gtin`, `gtin13`, or `mpn` (for cross-merchant or non-Pagefront-published references).
- `name` *(recommended)* — human-readable name of the related product.
- `url` *(recommended)* — canonical URL of the related product page.
- `image` *(optional)* — a single image URL for rendering the reference in a list without dereferencing. This is a render convenience, not authoritative imagery: it may be stale relative to the target product's own Sheet, which holds the canonical, fully-roled image set. Producers should populate it with the related product's primary identifying image (its hero or packshot). Consumers rendering a related-products carousel may use this image directly; consumers needing current or role-specific imagery should dereference to the target Sheet via `@id` or `url`.

Note the parallel with Schema.org-native relationship fields: `isRelatedTo`, `isSimilarTo`, and `hasPart` reference a Schema.org `Product`, which carries its own `image` property (a URL or `ImageObject`) via the `additionalProperties: true` policy. The `image` field on `pagefront:relatedProduct` provides the same render-hint capability for typed relationships that the Schema.org `Product` reference already provides for untyped ones. Both are the same convention — an image via Schema.org's `image` — surfaced through different mechanisms because `pagefront:relatedProduct` is a closed Pagefront extension while the Schema.org relationship fields are open.

The closed `relationship` enum (v0.7):

- `accessory` — an optional add-on (lens cap for a camera, strap for a watch).
- `consumable` — a consumable required for ongoing use (ink for a printer, filter for a coffee machine).
- `required_part` — a part required for the product to function (battery sold separately).
- `spare_part` — a replacement for a component of this product, ordered when the original wears out or fails. Distinct from `required_part`: a required part is needed for the product to function at all, whereas a spare part replaces something the product already has.
- `often_bought_with` — frequently purchased together; statistical/behavioral.
- `recommended_with` — a complementary pairing curated by the publisher. The products are intended to go together — the strap with the watch, the top with the pants, the necklace with the earrings, the lens cap with the camera (though that latter case is typically better expressed as `accessory`). The "with" carries semantic weight: the relationship asserts that the related product *pairs* with the source product. This is narrower than the spec's earlier framing — generic "You may also like" surfaces, where the publisher isn't asserting complementarity, do NOT belong here.
- `replaces` — the current product replaces the named older product.
- `replaced_by` — the current product has been superseded by the named newer product.
- `bundle_component` — part of a published bundle with the named product.
- `compatible_with` — compatible with the named product (a sleeve sized for a specific laptop model).

Additional values require a spec amendment.

The "You may also like" pattern, common on small-shop product pages, is brand-internal browsing rather than complementary pairing — the publisher is surfacing other items in their catalog without asserting any complementarity claim. This belongs in Schema.org's native `isRelatedTo` (without `description`, since the framing prose carries no semantic content beyond generic adjacency). The same applies at any catalog scale: when the publisher isn't asserting complementarity, the relationship is adjacency, not pairing. See the patterns guidance below for the full mapping.

#### Operationally-tracked vs. marketing-curated relationships

The typed relationships in the closed enum divide along a scale-dependent line in how publishers declare them.

Some are **operationally tracked** by publishers regardless of catalog size: `accessory`, `consumable`, `required_part`, `spare_part`, `replaces`, `replaced_by`, `bundle_component`, and `compatible_with`. These relationships reflect business operations (inventory, product hierarchy, parts management, lifecycle) that publishers maintain because they're required for commerce, not for marketing display. A publisher with 10,000+ SKUs still knows which products are accessories of which, because it must manage that inventory.

Others are **marketing-declared**: `often_bought_with` and `recommended_with`. These work cleanly at small catalog scales where marketing teams hand-curate pairings. At larger scales, the same relationships are typically generated by recommendation engines (SearchSpring, Dynamic Yield, Algolia Recommend, Shopify recommendations) and displayed in publisher-controlled UIs but not individually declared by the publisher.

Producers SHOULD use typed enum values for relationships that reflect deliberate publisher declarations — operationally-tracked data, or genuine marketing curation. Producers SHOULD NOT coerce algorithmic recommendation-engine output into typed enum values; these are publisher-surfaced but not publisher-declared, and belong in Schema.org's native `isRelatedTo` (Pattern 5 in the relationship-patterns guidance below).

For the marketing-shaped values specifically:

- `often_bought_with`: Use when the publisher has explicitly identified a co-purchase pattern (sometimes surfaced as a merchandising rule, sometimes manually curated as "frequently bought together"). Do NOT use for raw recommendation-engine output even when the engine claims to compute co-purchase data; the engine's output goes to `isRelatedTo` unless the publisher has reviewed and endorsed specific pairings.
- `recommended_with`: Use when the publisher has manually curated a pairing in their content management system (a marketing editor selecting "this product pairs with this one"). Storyblok's `linked_products` field with editor-populated values is a representative example. Do NOT use for recommendation-engine output even when displayed in a "Recommended" UI section; the engine's output goes to `isRelatedTo`.

Rule-based generation is an intermediate case. When a publisher defines a rule that produces relationships (e.g., "show all watch straps for any watch product"), the rule itself is a publisher declaration but each specific pairing is rule-generated rather than individually declared. Producers SHOULD treat these as `isRelatedTo`, since each specific pairing wasn't individually curated — the publisher's declaration is at the rule level, not at the pairing level.

#### The structured-identifier requirement

Beyond whether the publisher typed the relationship, `pagefront:relatedProduct` has a structural prerequisite: each entry must carry at least one structured identifier — `@id` (URL-shaped), `sku`, `gtin`, `gtin13`, or `mpn`. The JSON Schema enforces this via `anyOf`; a reference with only `name` and `url` does not validate as a `pagefront:relatedProduct` entry. The reason is the typed extension's contract: a typed relationship implies the consumer can act on the target — dereference it, fetch its Sheet, compare offers — and a name plus a link is too thin for that.

Schema.org's `isRelatedTo` carries no such requirement. A reference with only `name` and `url` is a valid Schema.org `Product` reference, permitted via the `additionalProperties: true` policy on Schema.org-typed blocks.

A producer should therefore use `pagefront:relatedProduct` only when BOTH conditions are met:

1. **Is the relationship publisher-typed?** (Operational data, manual editor curation, explicit merchant tagging — see the operational-vs-adjacency guidance above.)
2. **Does the source data carry a structured identifier?** (`sku`, `gtin`, `gtin13`, `mpn`, or an `@id` derived from a stable identifier.)

If either fails, the reference belongs in `isRelatedTo`. A typed relationship without a structured identifier is still untyped from the schema's perspective — the consumer can't act on the typing without something to dereference. An algorithmic recommendation that happens to carry a SKU is still untyped from the operational perspective — the publisher never declared the relationship type.

The schema rejects a `pagefront:relatedProduct` entry that carries no identifier key at all, but it checks only that an identifier is *present*, not that its value is *usable* — an empty or non-URL-shaped identifier passes Layer 1. The validator's linter (rule W-019) closes that gap: it warns when a `pagefront:relatedProduct` entry carries a structured identifier that is present but empty, whitespace-only, or not dereferenceable, signalling that the reference should either gain a real identifier or move to `isRelatedTo`.

A publisher-curated pairing that carries only a name and URL — no `sku`, `gtin`, or `@id` — is emitted as `isRelatedTo`, because it does not meet `pagefront:relatedProduct`'s identifier requirement even though the publisher curated it:

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

#### Five patterns for product-to-product relationships

Product-to-product relationships in Pagefront Sheets come in five recognizable patterns, each with a distinct Schema.org or Pagefront field. Producers should choose the field that matches the relationship's actual semantics, not coerce all relationships into one pattern.

**Pattern 1 — `pagefront:relatedProduct` with a typed enum value.** For operationally-tracked relationships (`accessory`, `consumable`, `required_part`, `spare_part`, `replaces`, `replaced_by`, `bundle_component`, `compatible_with`), where the relationship type changes consumer behavior. Use when the merchant's operational data declares the typed relationship explicitly. See the typed-enum guidance above for full details.

**Pattern 2 — Schema.org `isSimilarTo`.** For products the publisher asserts are similar — same kind, same use case, same general category. Schema.org defines `isSimilarTo` as products "of approximately the same kind." Use when the merchant surfaces "similar styles" or "alternatives" — products that could substitute for the source product.

**Pattern 3 — Schema.org `isPartOf` / `hasPart` for family or collection membership.** When the source product belongs to a named collection or family and the relationship being expressed is "siblings within that family," the right model is the family itself as a first-class entity. Use `isPartOf` to declare the source product's membership in the family; the family entity carries `hasPart` pointing at sibling members. These siblings belong to the same family — they are not merely "related" to the source product. The family entity can be modeled as a Schema.org `Collection` or `ProductGroup` with `name`, `url`, and `hasPart` entries. A future v0.8 Catalog vocabulary (see strategy notes) will address this case more directly.

Pattern 3 also covers **named family and series hierarchies** — a brand whose catalog is organized as family → series → product, the way Apple's iPod family contained the Touch series. The hierarchy is expressed by nesting, not by new vocabulary: the product declares `isPartOf` its series, and the series entity itself declares `isPartOf` the family. Two levels of `isPartOf` carry the full lineage; consumers walk up as far as the Sheet nests. Each level is a `Collection` (a curated grouping of distinct products) or a `ProductGroup` (when that level's members are variants of one product):

```json
{
  "@type": "Product",
  "name": "Aria Touch 256 GB",
  "url": "https://merchant.com/products/aria-touch-256",
  "isPartOf": {
    "@type": "Collection",
    "name": "Aria Touch",
    "url": "https://merchant.com/collections/aria-touch",
    "isPartOf": {
      "@type": "Collection",
      "name": "Aria",
      "url": "https://merchant.com/collections/aria"
    }
  }
}
```

The nesting depth is the producer's choice: a Sheet MAY declare only the immediate series when the family adds nothing consumers act on, and MAY nest further when the merchant's catalog genuinely has more levels. Sibling enumeration stays where it was — the series entity's `hasPart` lists the series' members, exactly as in the single-level case above.

**Pattern 4 — Schema.org `isRelatedTo` with `description`.** For adjacency relationships where the publisher surfaces framing prose alongside the recommendation — descriptor text, headline framing, or carousel-level intent that carries semantic content beyond pure adjacency. Use Schema.org's `description` field on each `Product` reference to preserve the framing. Example: a "More in this color" carousel preserves the framing via `description` fields on each `Product` reference, distinguishing this color-extension recommendation from pure algorithmic adjacency.

**Pattern 5 — Schema.org `isRelatedTo` without `description`.** For pure algorithmic adjacency — recommendation-engine output without semantic framing. The publisher displays these but doesn't frame them; the carousel heading is generic ("You may also like," "We think you'd like," "Customers also viewed"). Use `isRelatedTo` without `description`; the relationship is genuinely untyped adjacency.

Producers should map each carousel or recommendation surface to the matching pattern based on what the publisher actually communicates. A single product page often carries several at once — a "Similar Styles" carousel (→ `isSimilarTo`), a "More in this color" carousel (→ `isRelatedTo` with `description`), an "Explore the collection" carousel (→ `isPartOf`/`hasPart`), and a generic "You may also like" carousel (→ `isRelatedTo` without `description`) — each mapping to the pattern its framing implies.

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

The two `isRelatedTo` entries above show Patterns 4 and 5 sharing one field: the first carries `description` (a framed "More in this color" recommendation, Pattern 4), the second does not (pure "We Think You'd Like" adjacency, Pattern 5). The presence or absence of `description` is exactly what distinguishes the two patterns.

A `pagefront:relatedProduct` entry identifies its target in one of two forms — an `@id` reference to another Pagefront Sheet (for same-publisher products) or a Schema.org identifier such as `gtin13` (for cross-merchant references). Both appear here:

```json
"pagefront:relatedProduct": [
  {
    "@type": "pagefront:RelatedProduct",
    "relationship": "accessory",
    "@id": "https://merchant.com/pagefront/product/widget-strap-leather.en.json",
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

v0.7 carries qualitative relationships only. Weighted relationships (e.g., `often_bought_with` with a percentage) are not modeled; see the open design questions section.

#### Bundles

Bundles appear in two structurally different forms, and they use different vocabulary.

**Bundle as relationship.** Separately-sellable products bundled WITH a primary product. Picture a paddle board sold with a set of accessories — a wheelie backpack, a carbon paddle, a hand pump, a fin, a leash — each separately priced and separately sold, bundled with the board. From the board's perspective, each is a `bundle_component`: use `pagefront:relatedProduct` with `relationship: bundle_component` and a structured identifier (`sku`, `gtin`, `@id`) for each. Each component is a real product the merchant sells; the relationship declares it travels with the board.

**Bundle as product.** A bundle that is itself a sellable entity, with its own name, price, and product page, composed of named component products. Picture a "kayak conversion bundle" sold as a single purchasable unit at its own discounted price — a paddle board plus the parts that convert it to a kayak. That is a product, not a relationship. Model it with Schema.org's `ProductCollection` type, which Schema.org defines for exactly this case (a set of products offered together, e.g. a camera plus a lens). Use `includesObject` pointing at `TypeAndQuantityNode` entries to list the component products and their quantities, and an `Offer` for the bundle's price.

```json
{
  "@type": "ProductCollection",
  "name": "Kayak Conversion Bundle",
  "includesObject": [
    {
      "@type": "TypeAndQuantityNode",
      "amountOfThisGood": 1,
      "typeOfGood": {
        "@type": "Product",
        "name": "Paddle Board",
        "url": "https://merchant.com/products/paddle-board"
      }
    },
    {
      "@type": "TypeAndQuantityNode",
      "amountOfThisGood": 1,
      "typeOfGood": {
        "@type": "Product",
        "name": "Kayak Conversion Seat",
        "url": "https://merchant.com/products/kayak-seat"
      }
    },
    {
      "@type": "TypeAndQuantityNode",
      "amountOfThisGood": 1,
      "typeOfGood": {
        "@type": "Product",
        "name": "Kayak Conversion Blade",
        "url": "https://merchant.com/products/kayak-blade"
      }
    }
  ],
  "offers": [
    {
      "@type": "Offer",
      "price": "845.00",
      "priceCurrency": "USD"
    }
  ]
}
```

`ProductCollection` is Schema.org-native, so no Pagefront extension is needed. It is newer and less widely supported than `Product`; a consumer that doesn't recognize it falls back to its supertype `Collection` and can still read the `includesObject` entries.

Reserve `bundle_component` for components that ship WITH the product being described. A separately-sold bundle that another product's Sheet merely links to is not a `bundle_component` of that product: it is its own `ProductCollection` (in its own Sheet) and is referenced from elsewhere with `pagefront:relatedProduct` — typically `recommended_with` or `accessory`, since the referencing product functions without it.

A "bundled with" component sometimes can't be resolved to a structured identifier — the page names and prices it but exposes no link or SKU, and the producer can't resolve it via catalog lookup, platform API, or sitemap. Because `pagefront:relatedProduct` requires an identifier, such a component can't be a `bundle_component`. Don't drop it — the buyer still receives it. Use Schema.org's `hasPart`, which has no identifier requirement; a `hasPart` entry with only a `name` is valid (add price via `additionalProperty` or an embedded `Offer` if the page shows it). The resolution order for "included with" components is: (1) resolve to an identifier → `pagefront:relatedProduct` with `bundle_component`; (2) resolution fails → Schema.org `hasPart` with the name (and price if shown); (3) never drop it.

### Offers

Offer modeling unchanged from v0.5 in core shape: `price`, `priceCurrency`, `availability`, `itemCondition`, `seller`, `shippingDetails`, `hasMerchantReturnPolicy`, `areaServed` / `eligibleRegion`, `acceptedPaymentMethod`.

The `availability` and `itemCondition` values are canonical Schema.org URIs (`InStock`, `OutOfStock`, `PreOrder`, `NewCondition`, `UsedCondition`, etc.). Both `http://schema.org/` and `https://schema.org/` scheme variants are accepted; consumers SHOULD treat them as semantically equivalent. The HTTPS form is canonical and recommended for new sheets.

#### itemOffered references

When a sheet declares multiple offers — typically a `ProductGroup` with multiple variants in `hasVariant` — each `Offer` SHOULD reference its target variant via `itemOffered: { "@id": "..." }` rather than duplicating the variant's identifiers inline:

```json
"offers": [
  {
    "@type": "Offer",
    "@id": "https://merchant.com/product/whitebird-mid-length#offer-58",
    "itemOffered": { "@id": "https://merchant.com/product/whitebird-mid-length#size-58" },
    "price": "1299.00",
    "priceCurrency": "EUR",
    ...
  }
]
```

The `@id` reference must resolve to an entry in `hasVariant` or to the root product `@id`. The validator's linter (rule E-001) flags broken `@id` references.

For single-Offer sheets where the `itemOffered` is unambiguously the root product, the `itemOffered` field MAY be omitted; Schema.org consumers will infer it from the Offer's position on the Product.

#### Product identity and deduplication

Consumers frequently encounter the same product referenced from multiple Sheets — a product's own Sheet, and references to it via `isRelatedTo`, `isSimilarTo`, `isPartOf`/`hasPart`, or `pagefront:relatedProduct` from other Sheets. To recognize these as the same product (deduplication), consumers rely on identity, and the identity key is `@id`.

- **`@id` is the identity key.** Per JSON-LD semantics, two references carrying the same `@id` denote the same product. Consumers deduplicate on `@id`.

- **`@id` matching is exact-string.** JSON-LD does not normalize `@id` values before comparison. Two `@id`s that are semantically equivalent but differ as strings — a locale prefix (`/en-fr/`), a trailing slash, a query parameter, a `?variant=` suffix — do NOT match, and dedup fails. Producers MUST emit the identical `@id` string for a product everywhere it appears: in the product's own Sheet and in every reference to it from other Sheets. A reference whose `@id` differs from the target product's own declared `@id` breaks deduplication even when both point at the same product.

- **Secondary-identifier fallback.** When a producer cannot construct a consistent `@id` for a reference — typically because the referenced product's identity cannot be resolved from the referencing context — the reference SHOULD carry a stable secondary identifier (`sku`, `gtin`, `gtin13`, `mpn`, or `productID`) so consumers can deduplicate on identity even when `@id`s are absent or inconsistent. Consumers SHOULD deduplicate on `@id` when present and consistent, and fall back to matching on these identifiers otherwise.

Producers are free to derive `@id` by any stable, deterministic rule (from the canonical URL, from a SKU, or otherwise); the spec does not prescribe the derivation. What the spec requires is consistency: the same product yields the same `@id` string across its own Sheet and all references to it. Producers deriving `@id` from a URL must normalize that URL consistently across both paths, or dedup will silently fail on normalization differences.

##### Cross-merchant canonical reference via `sameAs`

A reseller's Sheet describes the reseller's own page for a product whose brand publishes a canonical page of its own. The reseller's Sheet SHOULD carry Schema.org's `sameAs` pointing at the brand's canonical product page, so consumers can connect the reseller's listing to the manufacturer's authoritative presentation of the same product — for enrichment, for cross-merchant offer comparison, and for clustering listings of one product across sellers.

`sameAs` is a deduplication *hint*, not an identity key. `@id` remains the exact-string identity key defined above: consumers deduplicate on `@id` when present and consistent, fall back to secondary identifiers (`sku`, `gtin`, `gtin13`, `mpn`, `productID`) otherwise, and MAY use a shared `sameAs` target as an additional correlation signal when clustering cross-merchant listings. A shared `sameAs` target never merges two products whose identifiers otherwise differ, and a missing or divergent `sameAs` never breaks an `@id` or identifier match.

```json
{
  "@type": "Product",
  "@id": "https://reseller.com/pagefront/product/meridian-headlamp-400.en.json",
  "name": "Meridian Headlamp 400",
  "sku": "MER-HL400",
  "gtin13": "4066544923187",
  "url": "https://reseller.com/products/meridian-headlamp-400",
  "sameAs": "https://meridiangear.com/products/headlamp-400"
}
```

#### Price-on-request offers

Some merchants intentionally publish no price. Authorized-retailer models (luxury watches, high-end jewelry), quote-based pricing (industrial equipment, bespoke commissions), and regional-reseller routing all share the same pattern: the merchant's product page is real, the product is real, but the price lives behind a contact channel rather than on the page. When a Sheet reflects such a product, the Offer SHOULD declare `pagefront:priceOnRequest` rather than silently omit the price.

An Offer carrying `pagefront:priceOnRequest` is exempt from the otherwise-required `price` or `priceSpecification`. All other Offer fields apply normally — `availability`, `itemCondition`, `seller`, `shippingDetails`, `hasMerchantReturnPolicy`, `areaServed`, and so on. `priceCurrency` remains useful even without `price`: it signals what currency the eventual price will be quoted in.

```json
{
  "@type": "Offer",
  "availability": "https://schema.org/InStock",
  "itemCondition": "https://schema.org/NewCondition",
  "priceCurrency": "EUR",
  "pagefront:priceOnRequest": {
    "@type": "pagefront:PriceOnRequest",
    "method": "authorized_retailer",
    "contactUrl": "https://www.rolex.com/store-locator",
    "note": "Available exclusively through Rolex Official Retailers."
  }
}
```

The `method` field is a closed enumeration:

- `authorized_retailer` — the merchant routes buyers to a curated network of brand-authorized retailers (luxury watches, high-end audio).
- `dealer_network` — similar in structure to `authorized_retailer` but used for industrial and commercial products with regional dealer coverage.
- `quote_form` — the merchant provides a structured intake form that produces a quote (made-to-measure, custom configurations, B2B bulk).
- `email` — the merchant directs buyers to an email address for pricing.
- `phone` — the merchant directs buyers to a phone number for pricing.
- `unspecified` — the merchant has no structured inquiry channel; the product is on the page but the path to pricing is left to the buyer to discover.

Additional values require a spec amendment.

The validator's linter (rule W-016) warns when an Offer has commercial structure (availability, itemCondition, or other Offer fields are present) but lacks both `price`/`priceSpecification` and `pagefront:priceOnRequest`. This catches extraction failures — cases where a price exists on the merchant's page but the pipeline didn't capture it — while letting intentional omissions through.

For made-to-order products, see `pagefront:madeToOrderTerms` below.

For configurable products, see `pagefront:configurator` below.

For site-level promotions, see `pagefront:promotions` on each Offer.

#### Common pricing patterns

Real merchants express pricing in shapes beyond a single `price` + `priceCurrency` pair: regular-vs-sale prices, ranges across variants, quantity-tier discounts, and shipping declared alongside the price. Schema.org covers each natively, so Pagefront mints no typed extensions for them; the patterns below are surfaced here so producers can reach for them directly rather than navigating Schema.org's general documentation.

##### Sale pricing (regular price plus current discounted price)

When a product is on sale, declare both the regular price and the current price as `PriceSpecification` entries on the Offer, distinguished by `priceType`. Use `https://schema.org/ListPrice` for the regular (pre-discount) price and `https://schema.org/SalePrice` for the current price. The Offer's top-level `price` field SHOULD mirror the `SalePrice` so simple consumers that read only `price` see the current selling price.

```json
{
  "@type": "Offer",
  "price": "149.00",
  "priceCurrency": "EUR",
  "priceSpecification": [
    {
      "@type": "PriceSpecification",
      "priceType": "https://schema.org/ListPrice",
      "price": "199.00",
      "priceCurrency": "EUR"
    },
    {
      "@type": "PriceSpecification",
      "priceType": "https://schema.org/SalePrice",
      "price": "149.00",
      "priceCurrency": "EUR"
    }
  ]
}
```

##### Price ranges (product available across a range of prices)

When a product is available across a span of prices — typically a `ProductGroup`-style listing where individual variant prices aren't broken out, or a product with size- or material-based pricing tiers — use `AggregateOffer` at the Offer position with `lowPrice`, `highPrice`, and `priceCurrency`.

```json
{
  "@type": "AggregateOffer",
  "lowPrice": 800.00,
  "highPrice": 1400.00,
  "priceCurrency": "EUR"
}
```

##### Quantity-tier pricing (different prices at different quantity breakpoints)

When a product is priced in tiers by purchase quantity, declare multiple `PriceSpecification` entries on the Offer, each carrying an `eligibleQuantity` as a `QuantitativeValue` with `minValue` and (optionally) `maxValue`, plus the price for that tier.

```json
{
  "@type": "Offer",
  "priceCurrency": "EUR",
  "priceSpecification": [
    {
      "@type": "PriceSpecification",
      "price": "49.00",
      "priceCurrency": "EUR",
      "eligibleQuantity": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 9 }
    },
    {
      "@type": "PriceSpecification",
      "price": "39.00",
      "priceCurrency": "EUR",
      "eligibleQuantity": { "@type": "QuantitativeValue", "minValue": 10, "maxValue": 49 }
    },
    {
      "@type": "PriceSpecification",
      "price": "29.00",
      "priceCurrency": "EUR",
      "eligibleQuantity": { "@type": "QuantitativeValue", "minValue": 50 }
    }
  ]
}
```

##### Shipping cost declared alongside price

Declare shipping cost on the Offer via `shippingDetails`, carrying an `OfferShippingDetails` object with `shippingRate` (a `MonetaryAmount`) and `deliveryTime` (a `ShippingDeliveryTime`). Shipping cost is independent from the Offer's `price`; consumers compute the total cost themselves by summing `price` and the applicable shipping rate.

```json
{
  "@type": "Offer",
  "price": "120.00",
  "priceCurrency": "EUR",
  "shippingDetails": {
    "@type": "OfferShippingDetails",
    "shippingRate": {
      "@type": "MonetaryAmount",
      "value": "9.50",
      "currency": "EUR"
    },
    "deliveryTime": {
      "@type": "ShippingDeliveryTime",
      "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" },
      "transitTime": { "@type": "QuantitativeValue", "minValue": 3, "maxValue": 5, "unitCode": "DAY" }
    }
  }
}
```

#### Product lifecycle

Agents routinely need to answer "is this product current?" — on the market, not yet released, or discontinued and superseded. Schema.org and the existing relationship enum cover each lifecycle signal, so Pagefront mints no vocabulary.

- **Market availability.** `releaseDate` (Schema.org-native on `Product`) declares when the product reached — or will reach — the market. A future `releaseDate` pairs naturally with Offer `availability: "https://schema.org/PreOrder"`.
- **End of life.** A discontinued product's Offer declares `availability: "https://schema.org/Discontinued"`. The Sheet stays published: the page usually outlives the product, and the Sheet is how agents learn the product is gone rather than merely out of stock.
- **Succession.** When a successor exists, the discontinued product's Sheet SHOULD pair the `Discontinued` availability with a `pagefront:relatedProduct` entry of `relationship: "replaced_by"` pointing at the successor, so a consumer landing on the old product can route the buyer forward. The successor's own Sheet carries the inverse `replaces` entry pointing back.

A discontinued product referencing its successor:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://merchant.com/pagefront/product/trail-camera-2.en.json",
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
      "@id": "https://merchant.com/pagefront/product/trail-camera-3.en.json",
      "name": "Trail Camera 3",
      "url": "https://merchant.com/products/trail-camera-3"
    }
  ]
}
```

### Project extensions (pagefront: namespace)

The full set, with v0.7 additions marked:

- `pagefront:sizeChart` — structured size charts for apparel
- `pagefront:materialComposition` — decomposed materials with optional purity, provenance, weight
- `pagefront:manufacturingChain` — multi-stage manufacturing provenance
- `pagefront:construction` — construction notes (composite, knitwear, jewelry, etc.)
- `pagefront:configurator` — combinatorial product configuration spaces
- `pagefront:madeToOrderTerms` — economics for made-to-order products
- `pagefront:gemstone` — typed gemstone descriptions with grading
- `pagefront:promotions` — site-level promotional codes scoped to product / category / site_wide
- `pagefront:availableLanguages` — cross-language navigation hints
- `pagefront:priceOnRequest` — explicit declaration that price is intentionally not published (authorized retailers, quote requests, etc.)
- `pagefront:document` *(new in v0.7)* — typed product documents (manuals, spec sheets, certificates, safety data sheets, etc.)
- `pagefront:relatedProduct` *(new in v0.7)* — typed relationships between products (accessory, consumable, replaces, compatible_with, etc.)
- `pagefront:sizeRecommendation` *(new in v0.7)* — fit guidance relative to labeled size (runs small/large, recommended size adjustment)

Pre-v0.7 definitions are unchanged from v0.6; see the vocabulary document for full field specifications.

### Materials: `material` and `pagefront:materialComposition`

Pagefront Sheets carry material information in two complementary fields:

- `material` (Schema.org native) — a flat string giving a one-line summary of what the product is made of. Examples: `"leather"`, `"Harmonie leather"`, `"Goyardine Canvas & Chevroches Calfskin"`, `"904L stainless steel"`. Quick to scan, useful for simple consumers that don't want structure.
- `pagefront:materialComposition` (Pagefront extension) — a structured array of typed `pagefront:Material` objects. Each entry can carry percentage, purity (free-text or numeric), provenance (closed enum: `virgin`, `recycled`, `fair_mined`, `lab_grown`, `reclaimed`, `deadstock`), and weight in grams. Useful for sophisticated consumers doing comparison, filtering, sustainability analysis, or authentication.

The two fields are not alternatives. Producers should populate both when the data supports both. A Sheet declaring `material: "Harmonie leather"` and `pagefront:materialComposition: [{"material": "Harmonie leather"}]` is valid and useful — the flat string answers simple queries, the structured entry leaves room for the decomposition to grow when more data is available.

For multi-material products without percentages — common in luxury goods where named materials matter more than proportions — both fields work: `material: "Goyardine Canvas & Chevroches Calfskin"` plus `materialComposition` with two entries, each declaring just the material name. The `percentage` field is optional; the W-005 linter rule only fires when percentages are present and don't sum to ~100.

For textile and apparel products where percentages are meaningful, the structured entries carry percentages. Mixed cases — a leather bag with a percentage-relevant lining — can declare some entries with percentages and others without.

Note: `pagefront:fabricComposition` is an alias restricted by convention to textile cases. Same value shape as `materialComposition`. Use when the prose distinguishes fabric from overall composition (common in apparel with linings, trims, padding).

### Size guidance: `pagefront:sizeChart` and `pagefront:sizeRecommendation`

Two complementary fields with a clear division:

- `pagefront:sizeChart` (and Schema.org's `SizeSpecification` / `hasMeasurement`) carry measurements — size codes and body/garment measurements. They answer "what are the dimensions of each size."
- `pagefront:sizeRecommendation` (Pagefront extension) carries fit relative to the labeled size — whether the product runs small/true/large, and any recommended adjustment from the customer's usual size. It answers "how does this fit compared to its label," which Schema.org's size vocabulary does not express.

`pagefront:sizeRecommendation` is a single object with:

- `fitProfile` *(optional)* — closed enum: `runs_small`, `true_to_size`, `runs_large`.
- `sizeAdjustment` *(optional)* — a recommended offset from the customer's usual size: `direction` (`up`/`down`), `magnitude` (number, e.g. `0.5`), and `sizeSystem` (use Schema.org `SizeSystemEnumeration` values, e.g. `WearableSizeSystemEU`).
- `description` *(optional)* — product-specific rationale ("the wavy band sits differently, so we recommend half a size down") for a human to read.
- `appliesTo` *(optional)* — `@id` or axis identifier for which variant the guidance applies to.

The structured fields are what a consumer acts on: an agent that knows the customer's usual size can apply a `down` / `0.5` / `EU` adjustment automatically, reducing fit-driven returns. The `description` carries the reasoning the structured fields can't. Measurements stay in `pagefront:sizeChart` / Schema.org; only fit-relative-to-size advice goes here.

```json
"pagefront:sizeRecommendation": {
  "@type": "pagefront:SizeRecommendation",
  "fitProfile": "runs_large",
  "sizeAdjustment": {
    "@type": "pagefront:SizeAdjustment",
    "direction": "down",
    "magnitude": 0.5,
    "sizeSystem": "WearableSizeSystemEU"
  },
  "description": "The wavy band sits differently from a standard ring, so we recommend going half a size down from your usual."
}
```

## Internationalization

Unchanged from v0.5. Pagefront Sheets are language-scoped: one `inLanguage` per sheet, multi-currency handled inline via multiple `Offer` entries with `areaServed`. Cross-language navigation via `Link: rel="describedby"` with `hreflang` parameters.

v0.6 extends this to video: the `video` array's contents are language-scoped to the sheet's `inLanguage`. See the "Video and internationalization" subsection above for details.

## Sheet URL convention

Unchanged from v0.5. The recommended URL shape:

```
/pagefront/{type}/{id}.{lang}.json
```

Discovery via `Link: rel="describedby"` remains authoritative; the URL convention is a recommendation for predictability.

## Discovery (RFC 8288 / RFC 9727)

Unchanged from v0.5.

## Why completeness is not in the sheet

Unchanged from v0.4.1. The completeness score is computed by the validator against an external rubric, not embedded in the published sheet.

## What changed from v0.3 in summary

| Area | v0.3 | v0.4 | v0.5 | v0.6 | v0.7 |
|---|---|---|---|---|---|
| Project codename / namespace | `transformer:` | `pagefront:` | unchanged | unchanged | unchanged |
| Provenance block | Required, with rich per-field metadata | Removed | unchanged | unchanged | unchanged |
| Production model | Implicitly third-party extraction | Explicitly first-party authoring as default | unchanged | unchanged | unchanged |
| Image roles | Free-text `role` PropertyValue | Closed enumeration with formal definitions | unchanged | unchanged | unchanged |
| Video | Not supported | Not supported | Not supported | Closed enumeration of video roles; `VideoObject` array sibling to `image` | + multiple thumbnails: `thumbnailUrl` for interchangeable previews, `thumbnail` (ImageObject array) for previews carrying distinct context |
| Accessibility metadata on media | Not specified | Optional `caption` on images | unchanged | Recommended `caption`/`transcript` on videos; linter warns for `overview`/`tutorial` without | unchanged |
| Configurable products | Not modeled | `pagefront:configurator` | normative configurator-vs-ProductGroup guidance | unchanged | + mixed cross-Sheet factoring (page-factored + within-page axes, disjoint and W-010-safe); configurator price bands via `AggregateOffer` when per-combination pricing isn't fully extractable |
| Made-to-order economics | Not modeled | `pagefront:madeToOrderTerms` | unchanged | unchanged | unchanged |
| Material composition | `transformer:fabricComposition` (textile only) | `pagefront:materialComposition` (general) | unchanged | unchanged | unchanged |
| Gemstones | Stuffed into Certification.additionalProperty | `pagefront:gemstone` typed extension | unchanged | unchanged | unchanged |
| Manufacturing chain | `transformer:manufacturingChain` (Apparel-implicit) | `pagefront:manufacturingChain`, generalized | unchanged | unchanged | unchanged |
| Discovery | RFC 8288/9727 with `describedby` | + recommended `/pagefront/{type}/{id}.json` convention | + `{lang}` segment; singular `{type}` vocabulary | unchanged | unchanged |
| Completeness scoring | Six sections including provenance considerations | Six sections, no provenance weighting | Removed from envelope in v0.4.1 | unchanged | unchanged |
| Internationalization | Not addressed | `inLanguage` declared but multi-language unspecified | Normative i18n model | + video is language-scoped per the same model | + Q&A is language-scoped; `pagefront:document.inLanguage` MAY differ from sheet |
| Identifier requirement | Single anyOf list | unchanged | Conditional on `@type` | unchanged | unchanged |
| `itemOffered` redundancy | Open question | Open question | Demonstrated pattern in AFS revision | Normative recommendation: use `@id` reference | unchanged |
| Sheet field name | `artifact_url` | unchanged | renamed to `sheet_url` (breaking) | unchanged | unchanged |
| Product Q&A | Not modeled | Not modeled | Not modeled | Not modeled | Schema.org-native `question[]` with `acceptedAnswer` |
| Product documents | Not modeled | Not modeled | Not modeled | Not modeled | `pagefront:document[]` with closed `role` enum |
| Typed product relationships | Schema.org loose relations only | unchanged | unchanged | unchanged | `pagefront:relatedProduct[]` with closed `relationship` enum |
| Variant dimension expression | Implicit | Implicit | Implicit | Implicit | Documented: Schema.org-native where possible; suggested `propertyID` registry otherwise |

## Open design questions carried forward

1. Extension namespace sub-paths within `pagefront:` (per-type URIs) remain to be defined as the spec stabilizes.
2. ~~Multiple offers' `itemOffered` redundancy.~~ **Resolved in v0.6.** `@id` reference pattern is now the normative recommendation.
3. Completeness scoring weights. Section weights pending calibration against real merchant data; validator/rubric concern, not a spec concern.
4. Schema.org version pinning cadence. Project needs documented update cadence (review with each Schema.org major release).

## Open design questions surfaced in v0.4

5. **Configurator pricing formula.** v0.4 uses a descriptive string. A structured DSL would let consumers compute prices deterministically. Worth deferring until real consumer demand surfaces.
6. **Image role multiplicity.** Should the order of roles encode preference (first role is primary), or should roles be unordered? Still open. Video roles inherit the same ambiguity.
7. ~~**`pagefront:configurator` vs `isVariantOf`.**~~ Resolved in v0.5.
8. **Certification scope vocabulary.** `scope` values are currently free-text. Open question: closed enum, or free-text with conventions per category?
9. **AftermarketService taxonomy.** Common services (`free_resizing`, `lifetime_warranty`, `repair_credit`) but no defined vocabulary. Spec should document conventions without closing the set.
10. ~~**Sheet URL stability.**~~ Resolved in v0.5.

## Open design questions surfaced in v0.5

11. **Index files and catalog enumeration.** Should publishers expose `/pagefront/product/index.{lang}.json` for crawlers? Still deferred in v0.7 pending real consumer use cases; revisit in a future version.
12. **Fallback resolution semantics.** v0.5 recommends BCP 47 language-family fallback (`fr-CA` → `fr`). Open question: what should consumers do when no language preference matches at all?
13. **Region-scoped certifications.** EU certifications (CE, OEKO-TEX) and US certifications (UL, FCC) have different shapes. v0.6 stays category-agnostic; typed certification extensions deferred.
14. **Translation consistency.** Spec doesn't enforce that French and English variants say semantically the same thing. Whether to add `pagefront:translatedFrom` is open.
15. **Currency-conversion freshness signaling.** Per-Offer `priceLastVerified` field is finer-grained than envelope `expires_at` but more complex. Open.

## New design questions surfaced in v0.6

16. **Video role overlap with image roles.** Both `image` and `video` arrays carry `lifestyle` and `context`-shaped roles. Consumers querying "show me lifestyle content" need to look in two places. Acceptable trade for clarity; revisit if it causes consumer pain.
17. **`spin` belongs in `image` or `video`?** A 360° rotation is technically video but functionally a rich image. v0.6 places it in `video` because the delivery format is typically `.mp4` or HLS. Publishers using interactive 360° viewers (JS-based, not video) may need a future image-side `spin` role.
18. **User-generated media as a separate field.** Reviews on most merchant sites include user-submitted videos and photos. Pagefront v0.6 omits these from `video` and `image` because the trust signal differs. A future `pagefront:userGeneratedMedia` field is worth designing but requires real case studies first.
19. **Video transcripts and the size budget.** Full transcripts of tutorial videos can run to several thousand words. At catalog scale (a merchant with 5,000 SKUs, each with 2-3 videos), transcript content could dominate sheet size. Whether to allow `transcript` to be an external URL (`transcriptUrl`) rather than inline content is worth considering. Schema.org has both patterns.
20. **Tracking known deviations across versions.** Real-merchant validation keeps surfacing narrow spec defects — the AFS `productGroupID` issue in v0.5, the Schema.org HTTP/HTTPS scheme issue in v0.6 — that no amount of upfront design would have caught. Less an open design question than a process note: worth maintaining a forward-running "known deviations" record alongside the spec so future implementers and validators don't rediscover the same edge cases. Where this record lives (changelog, separate doc, validator rules with case-study back-references) is open.
21. **Cross-page variant discovery.**

## New design questions surfaced in v0.7

22. **Category-specific document roles.** The `pagefront:document` `role` enum is intentionally category-agnostic in v0.7. Real publishers may need category-specific roles — `dental_imaging_protocol` for medical devices, `nutrition_panel` for food, `installation_drawing` for industrial fittings — that don't map cleanly onto the closed set. v0.7 directs publishers to use the closest enum value and convey specifics in `name` and `description`. Whether to extend the closed enum, open it for category prefixes, or formalize a category-specific role registry is an open question; revisit when real publisher demand makes the trade-off concrete.
23. **Relationship strength or weighting on `pagefront:relatedProduct`.** `often_bought_with` and `recommended_with` are qualitative in v0.7. A future version may add a `strength` or `weight` field (percentage of co-purchase, publisher-asserted prominence). v0.7 stays qualitative because weighted relationships invite a category of merchant self-asserted commercial signals that Pagefront has deliberately kept out of the vocabulary; see also "merchant-asserted popularity ranking" in the non-goals section.
24. **Multiple accepted answers for Q&A.** Schema.org's `Question` allows a single `acceptedAnswer` plus a `suggestedAnswer` array. v0.7 follows Schema.org's pattern (single accepted answer) because publisher-authored Q&A about one's own product is typically authoritative. Whether Pagefront should surface `suggestedAnswer` as a recommended pattern — for community-contributed answers the publisher has curated but not endorsed as authoritative — is open; revisit if real implementer feedback surfaces use cases.
25. **`encodingFormat` default semantics.** `pagefront:document.encodingFormat` defaults to `application/pdf` when omitted. The vast majority of product documents are PDFs, but the default arguably hides a producer choice that consumers may want to make explicit. Whether to require `encodingFormat` rather than defaulting it is open. The spec recommends ProductGroup Sheets be complete and acknowledges per-variant URLs, but it does not specify how producers should discover variant relationships when the merchant's site exposes them only heuristically. This is a production-pipeline concern rather than a spec concern, but the linter rules that warn on suspected incompleteness depend on pipeline knowledge the Sheet itself cannot carry. Future versions may address whether per-Sheet metadata about variant discovery completeness is warranted.

## What v0.7 deliberately does *not* address

These are deferred to later versions when concrete consumer needs justify the complexity:

- **Provenance and confidence metadata.** Removed in v0.4 entirely.
- **Cryptographic signing of sheets.** Out of scope. The sheet's authority comes from being served on the publisher's domain.
- **Cross-sheet dependencies.** Each sheet is self-contained.
- **Per-variant inventory and pricing structures finer-grained than `Offer`.**
- **Index files for catalog enumeration.** Tracked as open question #11.
- **Bundle products.** The bundle-as-product case — a bundle that is itself a sellable entity with its own name, price, and composition — is now addressed via Schema.org's `ProductCollection` (with `includesObject` and `TypeAndQuantityNode`), documented in the Related products section; it is no longer deferred. What remains out of scope is a Pagefront-native bundle-product type: Pagefront does not introduce one because Schema.org's `ProductCollection` covers the case. A future Pagefront extension would only be justified if `ProductCollection` proves inadequate against real merchant bundles.
- **Live streams and scheduled broadcasts.** Out of scope for video.
- **User-generated review videos and photos.** Tracked as open question #18.
- **Audio-only media** (podcasts, audio descriptions of products). Schema.org has `AudioObject`. v0.7 stays focused on image, video, and now documents; audio added if real use cases surface.
- **Merchant-asserted popularity ranking.** Google Merchant Center's `popularity_rank` attribute and equivalent self-asserted percentile signals are intentionally out of scope. Pagefront represents the publisher's authoritative statement about *what a product is*, not its commercial ranking among other products in the same catalog. For verifiable rating signals, use Schema.org's `aggregateRating`. For external recognition, use Schema.org's `award`. Self-asserted popularity rankings — where the merchant ranks their own catalog and asks consumers and agents to trust the ranking — are a different class of signal: not a fact about the product, but a marketing-surface decision. Pagefront leaves that surface to the publisher's page and does not add it to the vocabulary.
- **Weighted product relationships.** `pagefront:relatedProduct` is qualitative; co-purchase percentages and similar weights are tracked as open question #23 and not in v0.7.

## Status

Draft sketch v0.7. Additive release on top of v0.6 — no breaking changes. v0.6 Sheets remain structurally valid under v0.7 once their `format_version` envelope field is updated from `"0.6"` to `"0.7"`; the new affordances (`question`, `pagefront:document`, `pagefront:relatedProduct`) are optional additions.

v0.7 surfaces three Pagefront-shape affordances that fill gaps observed in recent platform-side work (Google Merchant Center's January 2026 conversational attributes), but each is designed as a Pagefront affordance rather than a syndication of any single feed format. v0.7 also documents variant dimension expression and a cross-reference for implementers transitioning from Google feed formats.

Pending work to fully land v0.7:

1. **Worked examples** — adding `question`, `pagefront:document`, and `pagefront:relatedProduct` to at least one case study to demonstrate the new fields against real merchant content.
2. **Linter rules** — warnings for: documents declaring `role: safety_data_sheet` without `inLanguage`; `pagefront:relatedProduct` entries lacking both `@id` and a Schema.org identifier; Q&A entries whose `acceptedAnswer.text` is empty.
3. **Scoring rubric update** — fold document presence and Q&A coverage into the completeness signal.
