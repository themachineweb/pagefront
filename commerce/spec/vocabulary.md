# Pagefront Vocabulary

Namespace: `https://themachineweb.org/pagefront/vocabulary/`
Prefix: `pagefront:`
Vocabulary version: 0.5.0 (the vocabulary carries the commerce release version; see [`releases.md`](releases.md))
Schema.org version targeted: 30.0

This document defines the **pagefront vocabulary**, a small set of typed extensions to Schema.org used in pagefront product sheets. The vocabulary fills gaps in Schema.org's coverage for commerce-specific concerns: structured size charts, multi-stage manufacturing provenance, configurable products, made-to-order economics, gemstone grading, videos with structured role classification, typed product documents, typed product relationships, and a few others.

The vocabulary follows Schema.org's conventions wherever possible. Where Schema.org has no native vocabulary for something a pagefront sheet needs to express, this document defines the term.

## How to use this vocabulary

A pagefront sheet references this vocabulary by declaring the `pagefront:` prefix in its JSON-LD `@context`:

```json
{
  "@context": [
    "https://schema.org",
    { "pagefront": "https://themachineweb.org/pagefront/vocabulary/" }
  ],
  "@type": "Product",
  ...
  "pagefront:sizeChart": { ... }
}
```

JSON-LD processors that follow the prefix will resolve `pagefront:SizeChart` to `https://themachineweb.org/pagefront/vocabulary/SizeChart`. Consumers that don't dereference the prefix still parse the sheet correctly because the property names are self-describing.

The companion JSON-LD context file is available at `https://themachineweb.org/pagefront/vocabulary/context.jsonld` and is reproduced in the "JSON-LD Context" section below.

## Design principles

- **Schema.org first.** Every concept that has a Schema.org type or property is expressed using Schema.org. The pagefront vocabulary covers only what Schema.org doesn't.
- **Closed enums where the set is bounded.** Image roles, material provenance categories, gemstone origins, and promotion scopes are closed enums. Stages and aftermarket services are open vocabularies because they vary by category.
- **Composition over inheritance.** Pagefront types are flat objects with properties; they do not subclass Schema.org types. This keeps the vocabulary easy to read and easy to validate.
- **Stable IRIs.** Once a term is published in this vocabulary, its IRI does not change. Deprecation is preferred over renaming.

## Types

### pagefront:AftermarketService

A service offered to the customer after delivery.

**Properties:**
- `service` *(required)*: service identifier. Open vocabulary; common values: `free_resizing`, `lifetime_warranty`, `repair_credit`, `free_engraving`, `cleaning_service`.
- `limit` *(optional)*: free-text constraint on the service (e.g., `"±2 EU sizes"`, `"first year only"`).
- `description` *(optional)*: free-text description.

### pagefront:AuthorizedResellers

The brand's statement of which sellers it authorizes to sell its products: an **authorization claim**. Added in v0.9. Schema.org has no authorization relation between a brand and a seller: `member` / `memberOf` is membership, `seller` / `offeredBy` are offer-level, and `availableAtOrFrom` is a place. This type carries the one outbound organization→organization edge on the Commerce Organization Sheet. It is admitted on that sheet, as the one exception to its no-enumeration rule, because it is the brand exercising authority over its own distribution, answering a question only the brand can answer ("is this listing grey-market or counterfeit?"), and because brands already publish and maintain this list (a "Revendeurs" / "Stockists" / "Where to buy" page). The grounds, the direction-of-trust rule, and the consumer resolution steps are in "Authorized resellers" in [`organization.md`](organization.md). It is not a catalog of what anyone sells and sets no precedent for enumeration.

**Properties:**
- `exhaustive` *(optional, boolean, default `false`)*: when `true`, the list is complete and a seller absent from it is NOT authorized. When `false` or absent, absence is no statement.
- `reseller` *(required, array, one or more entries)*: the authorized sellers. Each entry is an object with:
  - `organization` *(required)*: the reseller, in one of two forms. A **reference stub** `{"@type": "Organization", "@id": "…"}` whose `@id` resolves to the reseller's own Commerce Organization Sheet; or an **inline** Schema.org `Organization` for a reseller without a sheet, carrying `name` *(required)* plus at least one locating key: `url` *(required for a reseller that sells online; it is the key consumers match an `Offer.seller` against)* and/or `address` *(a `PostalAddress`; a physical point of sale is identified by its address, and many stockist lists publish nothing else)*. An inline entry with neither is not an identifiable reseller and does not validate.
  - `areaServed` *(optional)*: territory-scoped authorization, Schema.org-native: a `Country`, `DefinedRegion`, or `AdministrativeArea` (or an array of them). Absent means the authorization is not scoped to a territory. A physical reseller's location is its `address`; `areaServed` is a different fact.

The brand does NOT list itself; its own selling is declared by the `seller` value of `pagefront:commerceRole`. Publisher-stated only: entries MUST come from the brand's own published reseller / where-to-buy pages; guessed or searched-up resellers are non-conformant. Only the brand's sheet is authoritative for who it authorizes; a reseller's own claim of authorization carries no weight, and no reciprocal field exists.

Used via the `pagefront:authorizedResellers` property on the `Organization` data block of a Commerce Organization Sheet whose `commerceRole` includes `brand_owner`, whose value is a single `pagefront:AuthorizedResellers` object.

### pagefront:Configurator

The option space of a product whose configuration is determined by user choice across multiple dimensions. Used when the variant space is too large to enumerate as separate Schema.org `Product` instances under a `ProductGroup`. A configurator carries no prices: the prices for its option space are stated by an offer, in `pagefront:ConfiguratorPricing`. A dimension's options are the values a product can be ordered in. Services offered around the order (a sizing kit, a sample, a consultation) are not options of a dimension and MUST NOT appear in `options`; they belong in a dimension's `note` or in `pagefront:madeToOrderTerms.aftermarketServices`. (Until 2026-10-01 the type carried `basePrice`, `basePriceCurrency` and `priceFormula`; they are removed.)

**Properties:**
- `@id` *(optional; required when any offer prices this configurator)*: same-document identifier, e.g. the Sheet's `@id` with `#configurator` appended. It is what a pricing block's `configurator` reference points at.
- `dimensions` *(required)*: array of `pagefront:ConfiguratorDimension` objects.
- `exclusions` *(optional)*: array of partial configurations that cannot be ordered together. Each entry is an object mapping dimension names to option values. A configuration that matches every pair in an entry is excluded, and its total price is undefined. From release 0.4.0, every pair MUST name a declared dimension and, where that dimension lists `options`, one of their values, written as the option writes it.

Used via the `pagefront:configurator` property on `Product`. The rules are in "Configurator pricing and price bands" in the Pagefront Spec.

### pagefront:ConfiguratorDimension

A single dimension of a configurator (e.g., diamond carat, band style, ring size).

**Properties:**
- `name` *(required)*: dimension identifier (e.g., `diamond_carat`, `band_style`, `ring_size`).
- `options` *(optional)*: array of option objects, each with a `value` *(required)* and optionally a `description`. Omitted when the dimension is continuous, system-defined (e.g., ring sizes in a known sizing system), or free text. Options carry no price; `priceModifier` and `currency` on an option, permitted until 2026-10-01, are removed.
  - `value` is a stable identifier for the option, and the human label goes in `description`. A value SHOULD be lowercase with no spaces, and stable across languages and editions of the same product (`yellow_gold`, `three_quarter_pave`, `0.5`). A numeric option uses the number as a string, with no unit (`"0.5"`, and never `"0.5ct"`); the unit belongs in the dimension's `note`. The reason: option values are the keys that `pagefront:configuratorPricing.modifiers` and `baseConfiguration` are compared against, literally, and that two Sheets for the same product in different languages must share. The identifier form does not apply to a dimension that declares a `system`: sizing dimensions follow the declared system's notation instead (`52` in EU, `L½` in UK), without the system's name.
  - `description` is the label a buyer sees for the option, in the Sheet's `inLanguage`.
- `inputType` *(optional)*: closed enum: `select`, `text`; default `select`. `text` declares a free-text dimension (engraving, monogram, custom inscription). A `text` dimension has no `options`.
- `maxLength` *(optional, integer)*: for `text` dimensions, the maximum number of characters accepted.
- `affectsPrice` *(optional, boolean, default `true`)*: `false` declares that no option in this dimension changes the price. Typical for size, free personalisation, delivery slot. A dimension whose `affectsPrice` is not `false` is a *priced dimension*.
- `system` *(optional)*: sizing system if applicable (e.g., `EU`, `US`, `UK`, `JP`).
- `note` *(optional)*: a factual statement about the dimension, written for a machine: in the third person, with no address to the reader and no call to action ("A free ring sizer can be ordered before the size is confirmed", where the page says "Not sure about your size? Just select the ring sizer"). It is restated from the page and is never page copy.

### pagefront:ConfiguratorPricing

A market's price list for a configurator's option space, carried by the offer that sells the configured product. Added 2026-10-01. The configurator describes what can be ordered; the offer states what it costs in one currency under one tax basis, and names the configurator it prices. Schema.org has no vocabulary for a parametric price list attached to an offer.

**Properties:**
- `@type` *(required)*: const `pagefront:ConfiguratorPricing`.
- `configurator` *(required)*: a reference `{ "@id": … }` to a `pagefront:Configurator` declared in the same Sheet. This is the link between an offer and the option space it prices.
- `baseConfiguration` *(required)*: object mapping every priced dimension name to exactly one of that dimension's option values. It is a complete, orderable configuration. A `text` dimension has no key: the base configuration leaves it empty.
- `basePrice` *(required)*: the total price of `baseConfiguration`, as an amount, in the offer's `priceCurrency`, under the offer's tax-inclusion statement. A component price (one part of a product assembled from several priced parts) is never a base price.
- `modifiers` *(required)*: object keyed by priced dimension name; each value is an object keyed by option value giving that option's modifier as an amount. A modifier MAY be negative. The option named in `baseConfiguration` MUST have a modifier of zero. A dimension declared `affectsPrice: false` has no entry. A `text` dimension whose `affectsPrice` is left at its default of `true` MUST have a single modifier under its name, keyed `"*"`, meaning any non-empty input.
- `adjustments` *(optional)*: array of `{ "when": { dimension: value, … }, "priceModifier": … }`, the `priceModifier` an amount. An adjustment applies when the configuration matches every pair in `when`. From release 0.4.0, every pair in `when` MUST name a dimension of the configurator and, where that dimension lists `options`, one of their values, written as the option writes it. Use an adjustment when one option's price depends on another dimension. Any price grid can be expressed with adjustments; producers MUST verify that prices are additive before omitting them.
- `pricing` *(optional)*: closed enum: `complete`, `partial`; default `complete`. `partial` declares that at least one priced option has no modifier. A missing modifier states nothing about the option's price and is never read as zero. Consumers MUST NOT compute totals from a `partial` pricing.

The total price of a configuration is `basePrice`, plus the modifier of each selected option, plus the `"*"` modifier of each priced `text` dimension given a non-empty input, plus the `priceModifier` of every applicable adjustment. Totals for configurations excluded by the configurator's `exclusions` are undefined. Currency and tax inclusion come only from the enclosing offer (`priceCurrency`, `priceSpecification.valueAddedTaxIncluded`); the pricing block carries no currency of its own. An amount is a JSON number or a decimal string; a Sheet uses one of the two for all its amounts, and amounts are compared numerically whatever the carrier ("Amounts" in the Pagefront Spec).

Option values are matched literally, by their string form, with no case folding and no trimming: a string value is its own key, and a number or boolean value is keyed by its JSON serialization (`0.5`, `1`, `true`). The same comparison applies to the values in `baseConfiguration`, in `when`, and in `exclusions`.

Used via the `pagefront:configuratorPricing` property on `Offer` and `AggregateOffer`, whose value is a single `pagefront:ConfiguratorPricing` object. A configurator is priced by at most one offer per Sheet. The rules are in "Configurator pricing and price bands" in the Pagefront Spec.

### pagefront:Construction

Construction details: stitch type, gauge, machine, distinctive assembly notes. Generalizable beyond knitwear to furniture, leather goods, watches, and other constructed products.

**Properties:**
- `stitch` *(optional)*: stitch or weave type (e.g., `"waffle knit"`, `"twill"`).
- `gauge` *(optional)*: numeric gauge or thread count.
- `machine` *(optional)*: machine or technique used (e.g., `"circular"`, `"flat bed"`, `"hand-loomed"`).
- `constructionNotes` *(optional)*: free-text notes for distinctive assembly characteristics.

Additional properties are permitted for category-specific construction signatures (watch movements, joinery types, etc.).

### pagefront:DeliveryEstimate

An estimated delivery window, used on offers.

**Properties:**
- `earliest` *(optional)*: earliest expected delivery date (ISO 8601 date).
- `latest` *(optional)*: latest expected delivery date.
- `description` *(optional)*: human-readable description.

### pagefront:Document

A typed product-related document: manual, spec sheet, compatibility list, assembly instructions, care guide, warranty, certificate, environmental declaration, audit report, lab test, safety data sheet, installation or user guide, quick-start card, brochure. Schema.org under-specifies document types on `Product`; this type surfaces them.

**Properties:**
- `url` *(required)*: direct URL to the document, typically PDF.
- `role` *(required)*: closed enum: `manual`, `assembly`, `care_guide`, `spec_sheet`, `compatibility`, `warranty`, `certificate`, `environmental_declaration`, `audit_report`, `lab_test`, `safety_data_sheet`, `installation_guide`, `user_guide`, `quick_start`, `brochure`, `repairability_index`, `recall_notice`, `declaration_of_conformity`.
- `name` *(recommended)*: human-readable title of the document.
- `inLanguage` *(recommended)*: BCP 47 language tag. MAY differ from the parent sheet's `inLanguage` when the document is multilingual or in a different language than the sheet (common for safety data sheets and certification PDFs).
- `description` *(optional)*: short prose describing what the document contains.
- `encodingFormat` *(optional)*: MIME type; defaults to `application/pdf` when omitted.

Where a `compatibility` document's compatible products are identifiable, publishers SHOULD also emit `pagefront:relatedProduct` entries with `relationship: compatible_with`, so consumers can answer compatibility questions from structured data without parsing a PDF. The `compatibility` role links the human-readable artifact; it does not replace those relationships where they can be expressed.

Used via the `pagefront:document` property on `Product` (or `ProductGroup`), whose value is an array of `pagefront:Document` objects.

### pagefront:Duration

A duration in days, used in `pagefront:MadeToOrderTerms.productionLeadTime` and similar fields.

**Properties:**
- `minDays` *(optional)*: minimum duration in days (integer, ≥ 0).
- `maxDays` *(optional)*: maximum duration in days (integer, ≥ 0).
- `description` *(optional)*: human-readable description (e.g., `"6-8 weeks from order"`).

### pagefront:FeatureGroup

A named, ordered group of technical specifications: one section of the "Specifications" table a product page renders ("Audio," "Battery," "Connectivity"). Schema.org's `additionalProperty` carries the rows but has no grouping, no ordering, and no raw/display value split; this type supplies the grouping shell. The rows themselves stay Schema.org-native `PropertyValue` objects (composition over inheritance); only the shell is a Pagefront term.

**Properties:**
- `name` *(required)*: the group's display name, in the sheet's `inLanguage`.
- `sortOrder` *(optional)*: integer position of the group among its siblings, lowest first. When absent, array order is the display order.
- `feature` *(required)*: array of Schema.org `PropertyValue` rows. Each row carries `name` *(required)*, `value` *(required: the raw comparable value, a number, string, or boolean)*, and optionally `propertyID` (a stable measure identifier, producer-defined), `unitCode` (UN/CEFACT, for numeric values), `description` (clarifying nuance), and `pagefront:presentationValue` (the merchant's display-formatted rendering, when it differs from the raw value).

Used via the `pagefront:featureGroup` property on `Product` (or `ProductGroup`), whose value is an array of `pagefront:FeatureGroup` objects.

### pagefront:Gemstone

Typed gemstone grading for jewelry products. Captures shape, origin, the four C grades, and certifying body.

**Properties:**
- `type` *(required)*: gemstone type. Open vocabulary; common values: `diamond`, `ruby`, `sapphire`, `emerald`, `pearl`, `opal`.
- `origin` *(optional)*: closed enum: `natural_mined`, `lab_grown`, `treated`, `synthetic`.
- `shape` *(optional)*: cut shape (e.g., `pear`, `round`, `oval`, `marquise`, `cushion`).
- `caratWeight` *(optional)*: weight in carats.
- `colorGrade` *(optional)*: color grade (e.g., `D`, `DEF`, `G`).
- `clarityGrade` *(optional)*: clarity grade (e.g., `VS1`, `VS+`, `SI1`).
- `cutGrade` *(optional)*: cut quality grade (e.g., `Excellent`, `Very Good`).
- `certifyingBody` *(optional)*: certifying authority (e.g., `GIA`, `IGI`, `HRD`).

### pagefront:LegalEntity

A role-typed legal entity behind a product: the declarations regulation requires (EU GPSR responsible persons and similar) and licensed goods make necessary. Schema.org's `manufacturer` names one organization in one fixed role, with no typing for licensees, importers, or authorized representatives; this type supplies the roles.

**Properties:**
- `role` *(required)*: closed enum: `brand_owner`, `licensee`, `authorized_representative`, `importer`, `manufacturer`.
- `organization` *(required)*: a Schema.org `Organization` with `name` *(required, unless the entry is a reference stub carrying `@id`)*; `address` (a `PostalAddress`), `url`, `email` *(optional; address recommended for compliance-grade declarations)*.

Note (v0.9, not a new term): the v0.9 JSON Schema relaxes `organization.name` to optional when an `@id` is present, so an entry can be a reference stub (`{"@type": "Organization", "@id": "…"}`) resolving to a Commerce Organization Sheet; see the schema delta. The vocabulary terms are unchanged by that.

Schema.org's native `manufacturer` field remains valid alongside; when both are present and an entry has `role: "manufacturer"`, the two SHOULD name the same organization.

Used via the `pagefront:legalEntity` property on `Product` (or `ProductGroup`), whose value is an array of `pagefront:LegalEntity` objects.

### pagefront:MadeToOrderTerms

For products with `availability: MadeToOrder`, the terms that follow from custom production. Consolidates lead time, cancellation policy, returns nuances, and aftermarket services.

**Properties:**
- `productionLeadTime` *(optional)*: a `pagefront:Duration` object expressing how long production takes after order placement.
- `cancellationPolicy` *(optional)*: free-text description of cancellation rules.
- `returnsExceptions` *(optional)*: array of strings naming circumstances under which returns are permitted for an otherwise non-returnable product (e.g., `"Defects in manufacturing"`, `"Item does not match description"`).
- `aftermarketServices` *(optional)*: array of `pagefront:AftermarketService` objects describing services offered after delivery.

### pagefront:ManufacturingStage

A single stage in a product's manufacturing chain. Used in `pagefront:manufacturingChain`, an ordered array of stages from raw material to finished product.

**Properties:**
- `stage` *(required)*: stage identifier. Open vocabulary; common values include `yarn_spinning`, `weaving`, `knitting`, `dyeing`, `cutting`, `assembly`, `finishing`, `polishing`, `plating`.
- `country` *(required)*: ISO 3166-1 alpha-2 country code where this stage occurs.
- `facility` *(optional)*: facility or workshop name.
- `facilityCountry` *(optional)*: country code of the facility, if different from the country attribute (rare; usually omitted).

### pagefront:Material

A structured material entry, used in `pagefront:materialComposition` (or its textile-restricted alias `pagefront:fabricComposition`).

**Properties:**
- `material` *(required)*: material name (e.g., `"combed cotton"`, `"gold"`, `"merino wool"`). Open vocabulary.
- `percentage` *(optional)*: percentage of the total composition this material represents (0–100).
- `purity` *(optional)*: free-text purity expression (e.g., `"18ct"`, `"925"`).
- `purityPercentage` *(optional)*: numeric purity as a percentage (e.g., `75` for 18ct gold).
- `provenance` *(optional)*: closed enum: `virgin`, `recycled`, `fair_mined`, `lab_grown`, `reclaimed`, `deadstock`.
- `weightGrams` *(optional)*: weight of this material in grams (useful for jewelry where total weight is distributed across materials).

### pagefront:Measurement

A single named measurement across all sizes in a size chart.

**Properties:**
- `name` *(required)*: human-readable measurement name (e.g., `"Half chest"`, `"Sleeve length, shoulder point"`).
- `values` *(required)*: object mapping size labels to numeric values. Keys must match entries in the parent `SizeChart.sizes` array; values are numbers expressed in the parent's `unitCode`.

### pagefront:ModelReference

A reference to a model wearing the product, for fit context.

**Properties:**
- `name` *(required)*: model name as displayed.
- `heightCm` *(optional)*: model height in centimetres.
- `wearsSize` *(optional)*: which size of the product the model is wearing; should match an entry in `SizeChart.sizes`.

### pagefront:PricingCondition

A condition that must be satisfied for a price or offer to apply. Currently used on `OfferShippingDetails` via `pagefront:appliesWhen`.

**Properties:**
- `minimumOrderValue` *(optional)*: a Schema.org `MonetaryAmount` representing the minimum order subtotal that triggers this pricing rule.

### pagefront:RelatedProduct

A typed relationship between this product and another product. Surfaces relationships that Schema.org's loose relations (`isRelatedTo`, `isSimilarTo`, `isAccessoryOrSparePartFor`, `isConsumableFor`) do not carry the typed semantics for.

**Properties:**
- `relationship` *(required)*: closed enum: `accessory`, `consumable`, `required_part`, `spare_part`, `often_bought_with`, `recommended_with`, `replaces`, `replaced_by`, `bundle_component`, `compatible_with`, `service`. `spare_part` is distinct from `required_part`: a required part is needed for the product to function at all (a purchase-time necessity), whereas a spare part replaces a component the product already has (an aftermarket replacement, ordered when the original wears out or fails). `service` targets a purchasable service attached to the product (installation, extended warranty, maintenance plan); it is distinct from `accessory` (a physical add-on) and from the warranty *document* role on `pagefront:Document`.
- A target identifier, in one of two forms:
  - `@id` *(preferred for same-publisher products)*: reference to another Pagefront Sheet.
  - One of `sku`, `gtin`, `gtin13`, `mpn` *(for cross-merchant or non-Pagefront-published references)*: Schema.org identifier on the target object.
- `name` *(recommended)*: human-readable name of the related product.
- `url` *(recommended)*: canonical URL of the related product page.

Relationships are qualitative. Quantitative weighting (e.g., co-purchase percentages on `often_bought_with`) is not modeled; see the Pagefront Spec's open design questions.

Used via the `pagefront:relatedProduct` property on `Product` (or `ProductGroup`), whose value is an array of `pagefront:RelatedProduct` objects.

### pagefront:Promotion

A promotional code or discount applicable to an offer.

**Properties:**
- `scope` *(required)*: closed enum: `product`, `category`, `site_wide`. Consumers use this to distinguish product-specific promos from inherited site-level offers.
- `code` *(optional)*: promo code the customer enters at checkout.
- `discountPercentage` *(optional)*: discount as a percentage (0–100).
- `discountAmount` *(optional)*: discount as a fixed amount (string-encoded number).
- `discountCurrency` *(optional)*: ISO 4217 currency code for `discountAmount`.
- `occasion` *(optional)*: free-text occasion (e.g., `"Mother's Day"`, `"Black Friday"`).
- `validUntil` *(optional)*: expiration timestamp (ISO 8601).

### pagefront:SafetyNotice

A structured recall or safety notice for a product subject to a corrective measure (GPSR Arts. 35–37 and equivalent regimes). Schema.org has no recall vocabulary, and `availability: Discontinued` means "no longer sold" and does not mean "dangerous — return it." A `recall` notice overrides commercial signals: consumers SHOULD NOT recommend purchase while one is present and SHOULD surface the remedy.

**Properties:**
- `noticeType` *(required)*: closed enum: `recall`, `warning`.
- `hazard` *(optional)*: free-text hazard description.
- `remedy` *(optional)*: closed enum: `repair`, `replacement`, `refund` (the GPSR Art. 37 remedy set).
- `description` *(optional)*: free-text remedy or instruction detail.
- `reference` *(optional)*: URL of the official alert (e.g. the EU Safety Gate entry).
- `datePublished` *(optional)*: ISO 8601 date the notice was published.
- `url` *(optional)*: the publisher's own notice page.

Used via the `pagefront:safetyNotice` property on `Product` (or `ProductGroup`), whose value is an array of `pagefront:SafetyNotice` objects. The human-readable notice artifact links via the `recall_notice` document role, which does not replace the structured notice.

### pagefront:SafetyWarning

A typed product safety warning: the safety information GPSR Art. 19 requires distance-selling listings to display, and equivalents elsewhere. Schema.org has no product-safety-warning vocabulary.

**Properties:**
- `text` *(required)*: the warning, in the parent sheet's `inLanguage`. Producers SHOULD emit the page's published wording, unparaphrased.
- `pictogram` *(optional)*: URL of the warning pictogram image.
- `hazardCategory` *(optional)*: open vocabulary; common values: `choking_hazard`, `suffocation`, `fire`, `electrical`, `chemical`, `entanglement`. Consumers treat unknown values as opaque categories.

Warnings are language-scoped like all prose fields; per-language sibling sheets are what satisfy GPSR's language-of-member-state requirement.

Used via the `pagefront:safetyWarning` property on `Product` (or `ProductGroup`), whose value is an array of `pagefront:SafetyWarning` objects.

### pagefront:SizeAdjustment

A recommended size offset from the customer's usual size, used in `pagefront:SizeRecommendation`.

**Properties:**
- `direction` *(required)*: closed enum: `up`, `down`.
- `magnitude` *(required)*: numeric size offset (e.g., `0.5`, `1`, `2`).
- `sizeSystem` *(optional)*: the size system the magnitude is expressed in. Use Schema.org `SizeSystemEnumeration` values (e.g., `WearableSizeSystemEU`, `WearableSizeSystemUS`, `WearableSizeSystemUK`), so the offset is unambiguous; free text is not used here.

### pagefront:SizeChart

A structured size chart with named measurements and size columns. Typically used for apparel but applicable to any product with size variants.

**Properties:**
- `unitCode` *(required)*: UN/CEFACT unit code for all measurements (e.g., `CMT` for centimetres, `INH` for inches, `MMT` for millimetres).
- `sizes` *(required)*: array of size labels (e.g., `["S", "M", "L", "XL", "XXL"]`).
- `measurements` *(required)*: array of `pagefront:Measurement` objects.
- `modelReferences` *(optional)*: array of `pagefront:ModelReference` objects for fit context.

### pagefront:SizeRecommendation

Fit guidance relative to a product's labeled size: how the product fits compared to its size label, and any recommended adjustment. Schema.org models size specifications and measurements (`SizeSpecification`, `hasMeasurement`, `sizeSystem`) but has no fit-advisory concept. Use Schema.org's size vocabulary for measurements and size charts; use this only for fit-relative-to-size advice.

**Properties:**
- `fitProfile` *(optional)*: how the product fits relative to its labeled size. Closed enum: `runs_small`, `true_to_size`, `runs_large`.
- `sizeAdjustment` *(optional)*: a `pagefront:SizeAdjustment` object expressing a recommended offset from the customer's usual size.
- `description` *(optional)*: human-readable rationale for the recommendation (e.g., `"the wavy band sits differently, so we recommend half a size down"`). Carries the product-specific reasoning that the structured fields cannot.
- `appliesTo` *(optional)*: `@id` or axis identifier indicating which variant or configuration the guidance applies to, for products where fit guidance differs across variants.

When the Sheet also carries a sizing dimension in `pagefront:configurator` (a dimension that declares a `system`), `sizeAdjustment.sizeSystem` MUST be the same system as that dimension's `system`: `WearableSizeSystemEU` for `EU`, `WearableSizeSystemUK` for `UK`, `WearableSizeSystemUS` for `US`, `WearableSizeSystemJP` for `JP`. An adjustment that omits `sizeSystem` is read in the sizing dimension's system. If the merchant's advice is stated in another system, the producer keeps the merchant's wording in `description` and omits `sizeAdjustment`, because converting between systems is an inference.

Used via the `pagefront:sizeRecommendation` property on `Product` (or `ProductGroup`), whose value is a single `pagefront:SizeRecommendation` object.

### pagefront:SocialAccount

An official account the organization operates on a social platform. Added in v0.9, together with the `sameAs` tightening on the Commerce Organization Sheet: `sameAs` carries identity authority records only, and a handle is platform presence, so social profiles leave `sameAs` and get this typed home.

**Properties:**
- `platform` *(required)*: the platform, lowercase. Open vocabulary, because platforms outlive spec cadence; conventional values: `instagram`, `facebook`, `tiktok`, `youtube`, `x`, `pinterest`, `linkedin`, `snapchat`, `twitch`, `weibo`, `wechat`.
- `url` *(required)*: the profile URL, the resolvable key.
- `handle` *(recommended)*: the platform-native handle, without the leading `@`.

Publisher-stated only: entries MUST be accounts the publisher links from its own pages; guessed or searched-up handles are non-conformant. A social profile is NOT a `sameAs` entry, and it is NOT automatically a contact channel; an account the organization also offers for support additionally appears in `contactPoint`.

Used via the `pagefront:socialAccount` property on the `Organization` data block of a Commerce Organization Sheet (any `commerceRole`), whose value is an array of `pagefront:SocialAccount` objects.

## Properties

In addition to the types above, the vocabulary defines a small number of properties used on Schema.org types.

### pagefront:appliesWhen

Used on `OfferShippingDetails` to express conditions under which the shipping rate applies. Value is a `pagefront:PricingCondition`.

### pagefront:authorizedResellers

Used on the `Organization` data block of a Commerce Organization Sheet whose `commerceRole` includes `brand_owner`, and only there, to state which sellers the brand authorizes to sell its products. Value is a single `pagefront:AuthorizedResellers` object; the rules are on that type. Added in v0.9. Linter rule ORG-W-006 warns when the property appears on a sheet not declaring `brand_owner`; no rule warns on its absence.

### pagefront:availableLanguages

Used on `Product` (or `ProductGroup`) to list the URLs of sibling sheets in other languages, when the publisher publishes the same resource in multiple languages. It is the language-variant mechanism: a publisher with more than one language variant of a sheet SHOULD declare it on each of them, listing every sibling. The discovery link carries no language attribute; each sibling is declared by its own page, and its `inLanguage` states its language.

Value is an array of objects, each with:
- `lang` *(required)*: BCP 47 language tag matching the sibling sheet's `inLanguage`.
- `url` *(required)*: absolute URL of the sibling sheet.

Each `url` is a traversal hint under "Traversal hints" in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md#traversal-hints-normative)): it MAY be stale, since a sibling's address can change between updates of this sheet. A consumer MUST be able to reach a sibling through the sibling's own page, the language variant of this sheet's canonical page, and the sheet that page declares with `alternate`; it SHOULD treat the entry as an optimisation over that path, and MUST NOT cache a sibling's URL across the page's changes.

```json
"pagefront:availableLanguages": [
  { "lang": "fr", "url": "https://merchant.com/api/sheets/widget.fr.json" },
  { "lang": "en", "url": "https://merchant.com/api/sheets/widget.en.json" }
]
```

### pagefront:careInstructions

Used on `Product` to express care instructions. Value is an array of strings, each a single care instruction.

### pagefront:collectionKind

Used on the `Collection` data block of a Commerce Collection Sheet (see [`collection.md`](collection.md)) as the sheet's kind discriminator, and on `Collection` member entries (`hasPart`, `isPartOf`, the `itemListElement` of an organization sheet's `hasOfferCatalog`, a product sheet's `isPartOf`) so a consumer can tell a subcategory from a nested collection before fetching it. Value is a single string from the closed Collection kinds enum (see "Enumerated values"). Required on the data block of that sheet type; recommended on a `Collection` entry; not used elsewhere. Added in release 0.5.0, with the Commerce Collection Sheet.

### pagefront:commerceRole

Used on the `Organization` data block of a Commerce Organization Sheet (see [`organization.md`](organization.md)) as the sheet's role discriminator. Value is an array of one or more values from the closed Commerce roles enum (see "Enumerated values"). Required on that sheet type; not used on Product Sheets. Added in v0.9.

### pagefront:configurator

Used on `Product` to express a configurable option space. Value is a `pagefront:Configurator`. It carries no prices; see `pagefront:configuratorPricing`.

### pagefront:configuratorPricing

Used on `Offer` and on `AggregateOffer` to state the prices of a configurator's option space in that offer's currency and tax basis. Value is a single `pagefront:ConfiguratorPricing` object, which names the configurator it prices; the rules are on that type. Added 2026-10-01.

### pagefront:construction

Used on `Product` to express construction details. Value is a `pagefront:Construction`.

### pagefront:document

Used on `Product` (or `ProductGroup`) to surface typed product-related documents. Value is an array of `pagefront:Document` objects.

### pagefront:dutiesIncludedRegions

Used on `OfferShippingDetails` to declare regions for which duties and import taxes are included in the offer price. Value is an array of ISO 3166-1 alpha-2 country codes.

### pagefront:estimatedDelivery

Used on `Offer` to express an estimated delivery window. Value is a `pagefront:DeliveryEstimate`.

### pagefront:fabricComposition

Alias for `pagefront:materialComposition`, restricted by convention to textile cases. Same value shape.

### pagefront:featureGroup

Used on `Product` (or `ProductGroup`) to express grouped, ordered technical specifications. Value is an array of `pagefront:FeatureGroup` objects.

### pagefront:fulfillmentTerms

Used on the `Organization` data block of a Commerce Organization Sheet carrying the `seller` commerce role, to express the store-wide shipping defaults: destinations, rates, and delivery timeframes. Value is an array of Schema.org-native `OfferShippingDetails` objects; free-shipping thresholds ride on the existing `pagefront:appliesWhen` / `pagefront:PricingCondition` machinery, as they do on an Offer. Added in v0.9.

Composition over inheritance, per house pattern: Schema.org scopes `OfferShippingDetails` to the Offer (via `shippingDetails`), so the Pagefront term is only the org-level attachment point Schema.org lacks. The payload stays plain Schema.org, and no parallel shipping vocabulary is minted. Offer-level `shippingDetails` remains valid as the per-product override for products that deviate from the store defaults; consumers resolve product-else-seller along the `Offer.seller` edge, mirroring return policy (see "Return policy" in the Pagefront Spec). The Nitto organization sheet (`../case-studies/nitto/nitto-organization-v0_9.json`) is a worked example: the full ten-entry store shipping policy, with two free-shipping-threshold tiers across Colissimo point-relais and home delivery, plus five export zones.

### pagefront:gemstone

Used on `Product` to express typed gemstone grading. Value is a `pagefront:Gemstone`.

### pagefront:legalEntity

Used on `Product` (or `ProductGroup`) to declare the role-typed legal entities behind the product. Value is an array of `pagefront:LegalEntity` objects.

### pagefront:madeToOrderTerms

Used on `Product` to express terms that follow from made-to-order production. Value is a `pagefront:MadeToOrderTerms`.

### pagefront:manufacturerWarranty

Used on `Product` (or `ProductGroup`) to state a warranty given by the product's manufacturer. Value is a Schema.org `WarrantyPromise`, the same shape as `warranty` on the Offer (`durationOfWarranty`, `description`, optional `name` and `warrantyScope`). Added in v0.9.

Schema.org defines `warranty` on `Offer` and `Demand` only, so a manufacturer's warranty has no product-level home, and a manufacturer's own sheet, which may carry no Offer, has no place to state it. The term is only that attachment point; the payload stays plain Schema.org. It is distinct from the seller's `warranty` on the Offer by guarantor, claim path and portability: a manufacturer's warranty follows the product across every retailer and is claimed against the manufacturer. When the page does not name the manufacturer as the guarantor, the statement stays on the Offer. The rules are in "Warranty" in the Pagefront Spec.

### pagefront:manufacturingChain

Used on `Product` to express an ordered manufacturing chain. Value is an array of `pagefront:ManufacturingStage` objects, ordered from raw material to finished product.

### pagefront:materialComposition

Used on `Product` to express decomposed material composition with optional purity and provenance. Value is an array of `pagefront:Material` objects.

### pagefront:presentationValue

Used on a Schema.org `PropertyValue` inside a `pagefront:FeatureGroup.feature` row to carry the merchant's display-formatted rendering of the row's value ("Up to 30 h (ANC on)") when it differs from the raw comparable `value` (`30` with `unitCode: "HUR"`). Value is a string. Omitted when the raw value renders acceptably as-is.

### pagefront:priceOnRequest

Used on `Offer` to explicitly declare that no price is published, for authorized-retailer routing, dealer networks, quote-based pricing, or merchants directing buyers to email or phone for pricing. An `Offer` carrying `pagefront:priceOnRequest` is exempt from the otherwise-required `price` or `priceSpecification`.

Value is a `pagefront:PriceOnRequest` object:

- `@type` *(required)*: const `pagefront:PriceOnRequest`.
- `method` *(required)*: closed enum: `authorized_retailer`, `dealer_network`, `quote_form`, `email`, `phone`, `unspecified`.
- `contactUrl` *(optional)*: URL of the inquiry channel; recommended for `authorized_retailer`, `dealer_network`, `quote_form`.
- `contactEmail` *(optional)*: email address; recommended when `method` is `email`.
- `contactPhone` *(optional)*: phone number; recommended when `method` is `phone`.
- `note` *(optional)*: free-text guidance shown to consumers.

### pagefront:productHighlights

Used on `Product` (or `ProductGroup`) to carry the merchant's ranked selling points. Value is an ordered array of short, publisher-authored strings in the sheet's `inLanguage`; 3–10 entries recommended. Publisher-authored only; auto-generated bullets are excluded. The term is marked `@container: @list` in the JSON-LD context so ordering survives JSON-LD processing.

### pagefront:relatedProduct

Used on `Product` (or `ProductGroup`) to express typed relationships to other products. Value is an array of `pagefront:RelatedProduct` objects.

### pagefront:promotions

Used on `Offer` to express promotional codes and discounts. Value is an array of `pagefront:Promotion` objects.

### pagefront:safetyNotice

Used on `Product` (or `ProductGroup`) to declare recall or safety notices for a product under a corrective measure. Value is an array of `pagefront:SafetyNotice` objects. Absent on virtually all sheets.

### pagefront:safetyWarning

Used on `Product` (or `ProductGroup`) to carry the product's safety warnings, language-scoped to the sheet. Value is an array of `pagefront:SafetyWarning` objects.

### pagefront:sheetUrl

Used on a reference to an entity to declare the URL of the Pagefront sheet describing that entity. Value is an absolute URL (string). In v0.9 it applies to organization references: `Offer.seller`, `Product.brand`, and the `organization` of a reference-form `pagefront:legalEntity` entry. Added in v0.9. With the Commerce Collection Sheet ([`collection.md`](collection.md)) it also applies to collection references: the member entries of a collection sheet's `hasPart` and `isPartOf`, of a product sheet's `isPartOf` and of an organization sheet's `hasOfferCatalog`, which reference a product, product-group or collection sheet, and the `brand` reference of a brand collection.

`@id` identifies an entity and does not locate its sheet, and the discovery rule forbids constructing sheet URLs, so a sheet reached by reference is located by the publisher's declaration. The URL's host is checked per edge: the product sheet's host for seller references, the `@id`'s host for brand references, either for legal-entity references; the canonical host of the referencing sheet for the members and parents of a collection sheet and the entries of `hasOfferCatalog`. The fetched sheet must declare the referenced `@id` at the node the edge points at: the data block for organization and collection references, `data.brand` for brand references. The rules are the linking contract in [`organization.md`](organization.md#linking-contract-identity-only) and "Identity" in [`collection.md`](collection.md#identity).

It plays the role `sheet_url` plays on variant entries (`hasVariant[]`, `isVariantOf`) in the Pagefront Spec, in a different position: `sheet_url` is a Pagefront structural field on product-family entries, and `pagefront:sheetUrl` is a vocabulary term that can sit inside any Schema.org-typed reference.

Like `sheet_url`, it is a traversal hint under "Traversal hints" in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md#traversal-hints-normative)). It MAY be stale: the organization sheet's address can change between updates of the sheet carrying the reference. A consumer MUST be able to reach the organization sheet through the entity's page, the reference's `url` and then the Sheet that page declares, SHOULD treat the hint as an optimisation over that path, and MUST NOT cache the organization sheet's URL across the page's changes. The linking contract applies its host and identity checks to whichever URL is followed.

### pagefront:sizeChart

Used on `Product` to express a structured size chart. Value is a `pagefront:SizeChart`.

### pagefront:sizeRecommendation

Used on `Product` (or `ProductGroup`) to express fit guidance relative to the product's labeled size. Value is a single `pagefront:SizeRecommendation` object.

### pagefront:socialAccount

Used on the `Organization` data block of a Commerce Organization Sheet (any `commerceRole`) to list the official social accounts the organization operates. Value is an array of `pagefront:SocialAccount` objects; the rules are on that type. Added in v0.9.

## Enumerated values

### Image roles

The `role` value in an `ImageObject.additionalProperty` of name `"role"` is a closed enum:

- `hero`: primary image, typically lifestyle or evocative.
- `packshot`: product on neutral background, isolation shot.
- `lifestyle`: product in use or in context.
- `detail`: close-up of construction, fabric, finish, or distinguishing feature.
- `flatlay`: top-down product layout, common in apparel.
- `swatch`: colour or material sample.
- `size_chart`: measurement diagram.
- `context`: environmental or scale-reference shot.

A single `ImageObject` may declare multiple roles.

### Video roles

The `role` value in a `VideoObject.additionalProperty` of name `"role"` is a closed enum, mirroring the image-role pattern:

- `overview`: primary product video, typically short (30–90 seconds), showing the product itself. The video equivalent of a hero image.
- `tutorial`: how-to-use, how-to-install, how-to-assemble, how-to-care-for content. Typically longer (2–10 minutes), instructional in voice.
- `lifestyle`: atmospheric, product-in-context footage, often without explicit narration.
- `construction`: manufacturing footage, behind-the-scenes, how-it's-made. Carries provenance/transparency value similar to `pagefront:manufacturingChain`.
- `demonstration`: product in functional use (instrument played, tool operating, audio sample). For products where motion or sound is part of the value proposition.
- `comparison`: A/B with another product or alternative configuration.
- `unboxing`: packaging-opening footage, merchant- or partner-produced. Distinct from user-generated unboxing content.
- `spin`: 360° product rotation, typically generated from photogrammetry. Uses video format for delivery.

A single `VideoObject` may declare multiple roles.

The Pagefront Spec recommends `caption` and `transcript` on every VideoObject, especially for `overview` and `tutorial` roles. The validator's linter (PDP-W-012) warns when accessibility metadata is absent on those roles.

Note: Pagefront does not define a `pagefront:` type for video. Schema.org's native `VideoObject` carries the video; the role enum above is the only Pagefront-defined addition. Consequently, `video` does not appear in the JSON-LD context block below.

### Certification scope

The `scope` value in a `Certification.additionalProperty` of name `"scope"` is currently free-text but follows conventional values per category:

- `yarn`, `fabric`, `finished_product`: apparel/textile.
- `diamond`, `gemstone`, `metal`: jewelry.
- `ingredient`, `packaging`, `final_product`: food/cosmetics.
- `organization`: entity-level, cross-category: the certification attaches to the organization itself (B-Corp, ISO 14001, company-wide Fair Trade). Used on a Commerce Organization Sheet's `hasCertification`. Added in v0.9.

A future version may close this enum once conventions stabilize across categories.

### Commerce roles

The closed enum for `pagefront:commerceRole` on a Commerce Organization Sheet (added in v0.9):

- `brand_owner`: owns the brand under which products are sold; the entity a `Product.brand` link resolves to.
- `manufacturer`: makes the products.
- `seller`: sells products directly to end customers; the entity an `Offer.seller` link resolves to.

The values reuse the `pagefront:LegalEntity` role names, adding `seller`, which the legalEntity enum lacks. `licensee`, `authorized_representative`, and `importer` remain legalEntity-only: they are per-product compliance declarations. Additional values require a spec amendment.

### Collection kinds

The closed enum for `pagefront:collectionKind` on a Commerce Collection Sheet and on `Collection` member entries (added in release 0.5.0, with [`collection.md`](collection.md)):

- `category`: a node of the storefront's navigation tree. A root category has no `isPartOf`; every other category has at least one, each resolving to another `category` sheet on the same host.
- `collection`: a set outside the tree, curated or rule-based (new arrivals, a sale, a capsule). It MAY nest in another `collection` and MUST NOT point at a `category`.
- `brand`: the products a store sells under one label. The sheet carries `brand`, a reference to the `Brand` node it is keyed on, and has no `isPartOf`.

What separates a category from a collection is the tree. Additional values require a spec amendment.

## Schema.org-native patterns

Some affordances Pagefront Sheets need are already well-covered by Schema.org's native vocabulary. For these, Pagefront does not mint a `pagefront:` term; the recommendation is to use Schema.org's existing types and properties. This section catalogues such patterns so implementers know where to look when something appears absent from the `pagefront:` namespace. None of the patterns below mints a term. (The section began as the v0.7 pattern catalogue; entries added in later versions are marked.)

**Product Q&A.** FAQ-style content scoped to a product is expressed with Schema.org's `Question` and `Answer` types, linked via `acceptedAnswer`, in a `question` array on the `Product` (or `ProductGroup`) data block. Each entry carries `@type: Question`, a `name` holding the question, and an `acceptedAnswer` of `@type: Answer` whose `text` holds the answer; multiple questions are multiple array entries. Q&A prose is language-scoped to the parent sheet's `inLanguage`. Pagefront uses a single `acceptedAnswer` per question (typically the publisher's own authoritative answer); `suggestedAnswer` arrays remain available for community-style Q&A.

**Variant family title.** The human-readable title of a variant family is expressed via the Schema.org-native `name` property on `ProductGroup`. This is the Pagefront equivalent of Google Merchant Center's `item_group_title` attribute.

**Variant axes named by Schema.org-native properties.** Where Schema.org has a native property for a variant axis (`color`, `size`, `material`), variants SHOULD use that property directly. The `variesBy` array on the parent `ProductGroup` references the property names so consumers discover variant axes without scanning variants. For dimensions Schema.org doesn't model natively, `additionalProperty` with a `propertyID` drawn from the Pagefront Spec's suggested registry is recommended.

**Aggregate rating.** A product's review summary is expressed with Schema.org's native `AggregateRating` on the `Product` (or `ProductGroup`) data block, via the `aggregateRating` property. Producers SHOULD emit:
- `ratingValue`: the average rating.
- `bestRating` / `worstRating`: the rating scale bounds. RECOMMENDED whenever the scale is not the Schema.org default of 1–5, so consumers can normalise; a non-5 scale without these is silently misread.
- `ratingCount`: the number of ratings contributing to the average.
- `reviewCount`: the number of written reviews.

`ratingCount` and `reviewCount` are distinct and SHOULD NOT be conflated: many consumers leave a star rating without writing a review, so the two counts commonly differ. `ratingCount` conveys how many ratings the average is based on (the average's reliability); `reviewCount` conveys how much written review content exists. When a source exposes only one count, emit the one it provides and leave the other field absent.

An aggregate rating may blend product-quality signals with seller/fulfilment experience (some review platforms mix product and merchant reviews). Where a producer can distinguish them it SHOULD scope the product's `aggregateRating` to product reviews; where it cannot, the blend is a known limitation consumers should be aware of.

**Product lifecycle.** Market availability is expressed with Schema.org's `releaseDate` on the `Product`; end-of-life with Offer `availability: "https://schema.org/Discontinued"`, paired with a `pagefront:relatedProduct` entry of `relationship: "replaced_by"` pointing at the successor (whose own Sheet carries the inverse `replaces`). Schema.org carries the lifecycle facts and the existing relationship enum carries the succession link. See "Product lifecycle" in the Pagefront Spec.

**Cross-merchant canonical reference.** A reseller's Sheet SHOULD carry Schema.org's `sameAs` pointing at the brand's own canonical product page, connecting the reseller's listing to the manufacturer's authoritative presentation. `sameAs` is a deduplication hint. `@id` remains the exact-string identity key, with secondary-identifier fallback, per "Product identity and deduplication" in the Pagefront Spec.

**EU energy efficiency.** The efficiency class of products regulated under the EU energy-labelling framework is expressed with Schema.org's `hasEnergyConsumptionDetails`, carrying an `EnergyConsumptionDetails` whose `hasEnergyEfficiencyCategory` is an `EUEnergyEfficiencyEnumeration` URI (rescaled A–G classes, or the legacy A+/A++/A+++ classes where still in force), with `energyEfficiencyScaleMin`/`energyEfficiencyScaleMax` bounding sub-scale labels. The label graphic itself rides as an image or a `pagefront:document` entry with `role: "certificate"`. See "Energy efficiency" in the Pagefront Spec.

**Age suitability.** Age recommendations are expressed with Schema.org's `audience` on the `Product`, carrying a `PeopleAudience` with `suggestedMinAge`/`suggestedMaxAge` in years (`suggestedGender` MAY be added where the merchant declares it). Regulatory age warnings ("Not suitable for children under 36 months") are carried as an `additionalProperty` convention with `name: "age_warning"` and the warning text as `value`. See "Age suitability" in the Pagefront Spec.

**Family and series membership.** A brand → family → series hierarchy is expressed by nesting Schema.org's `isPartOf`: the product declares `isPartOf` its series, and the series entity declares `isPartOf` the family, each level a `Collection` or `ProductGroup`. Sibling enumeration stays on the family/series entity's `hasPart`. This is Pattern 3 of the relationship patterns; see "Five patterns for product-to-product relationships" in the Pagefront Spec.

**Country of origin.** The country a product (or manufacturing stage) originates from is expressed with Schema.org's native `countryOfOrigin` on `Product`, an ISO 3166-1 alpha-2 code, already typed in the schema. For multi-country, multi-stage provenance beyond a single origin country, see `pagefront:manufacturingChain`.

**Company registration identity** *(added in v0.9)*. Schema.org has no dedicated property for a company registration number and its register, and machine-key coverage of national registers is uneven. Commerce Organization Sheets therefore carry registration identity as a ladder of Schema.org-native machine keys (`leiCode` when the entity has an LEI, `iso6523Code` where the register has an ISO 6523 ICD, e.g. `"0002:808641435"` for a French SIREN) plus a generic `identifier` `PropertyValue` for the jurisdiction-flavored display form, every rung conditional on the data existing. The ladder, its authority order, its floor, and the publisher-stated-only rule are normative in "Company registration identity" in [`organization.md`](organization.md); no linter rule warns on absent registration identifiers. `vatID` remains separately recommended where applicable.

The corpus illustrates each rung. Nitto (MBTJM SAS) carries `iso6523Code` on ICD 0002 plus the RCS display form (`../case-studies/nitto/nitto-organization-v0_9.json`). Zalando SE illustrates the LEI rung, `leiCode` `529900YRFFGH5AXU4S86` plus the Handelsregister display form, that register having no ICD. Reformation (LYMI Inc.) illustrates the floor: `legalName` and address only, with nothing else published.

## JSON-LD Context

The following is the machine-readable JSON-LD context for the pagefront vocabulary. Consumers using JSON-LD processors can fetch this from `https://themachineweb.org/pagefront/vocabulary/context.jsonld`.

```json
{
  "@context": {
    "pagefront": "https://themachineweb.org/pagefront/vocabulary/",
    "AftermarketService": "pagefront:AftermarketService",
    "AuthorizedResellers": "pagefront:AuthorizedResellers",
    "Configurator": "pagefront:Configurator",
    "ConfiguratorDimension": "pagefront:ConfiguratorDimension",
    "ConfiguratorPricing": "pagefront:ConfiguratorPricing",
    "Construction": "pagefront:Construction",
    "DeliveryEstimate": "pagefront:DeliveryEstimate",
    "Document": "pagefront:Document",
    "Duration": "pagefront:Duration",
    "FeatureGroup": "pagefront:FeatureGroup",
    "Gemstone": "pagefront:Gemstone",
    "LegalEntity": "pagefront:LegalEntity",
    "MadeToOrderTerms": "pagefront:MadeToOrderTerms",
    "ManufacturingStage": "pagefront:ManufacturingStage",
    "Material": "pagefront:Material",
    "Measurement": "pagefront:Measurement",
    "ModelReference": "pagefront:ModelReference",
    "PricingCondition": "pagefront:PricingCondition",
    "Promotion": "pagefront:Promotion",
    "RelatedProduct": "pagefront:RelatedProduct",
    "SafetyNotice": "pagefront:SafetyNotice",
    "SafetyWarning": "pagefront:SafetyWarning",
    "SizeAdjustment": "pagefront:SizeAdjustment",
    "SizeChart": "pagefront:SizeChart",
    "SizeRecommendation": "pagefront:SizeRecommendation",
    "SocialAccount": "pagefront:SocialAccount",

    "appliesWhen": {
      "@id": "pagefront:appliesWhen"
    },
    "authorizedResellers": {
      "@id": "pagefront:authorizedResellers"
    },
    "availableLanguages": {
      "@id": "pagefront:availableLanguages",
      "@container": "@list"
    },
    "careInstructions": {
      "@id": "pagefront:careInstructions",
      "@container": "@list"
    },
    "commerceRole": {
      "@id": "pagefront:commerceRole",
      "@container": "@set"
    },
    "configurator": {
      "@id": "pagefront:configurator"
    },
    "configuratorPricing": {
      "@id": "pagefront:configuratorPricing"
    },
    "construction": {
      "@id": "pagefront:construction"
    },
    "document": {
      "@id": "pagefront:document",
      "@container": "@list"
    },
    "dutiesIncludedRegions": {
      "@id": "pagefront:dutiesIncludedRegions",
      "@container": "@list"
    },
    "estimatedDelivery": {
      "@id": "pagefront:estimatedDelivery"
    },
    "fabricComposition": {
      "@id": "pagefront:fabricComposition",
      "@container": "@list"
    },
    "feature": {
      "@id": "pagefront:feature",
      "@container": "@list"
    },
    "featureGroup": {
      "@id": "pagefront:featureGroup",
      "@container": "@list"
    },
    "fulfillmentTerms": {
      "@id": "pagefront:fulfillmentTerms",
      "@container": "@list"
    },
    "gemstone": {
      "@id": "pagefront:gemstone"
    },
    "legalEntity": {
      "@id": "pagefront:legalEntity",
      "@container": "@list"
    },
    "madeToOrderTerms": {
      "@id": "pagefront:madeToOrderTerms"
    },
    "manufacturerWarranty": {
      "@id": "pagefront:manufacturerWarranty"
    },
    "manufacturingChain": {
      "@id": "pagefront:manufacturingChain",
      "@container": "@list"
    },
    "materialComposition": {
      "@id": "pagefront:materialComposition",
      "@container": "@list"
    },
    "presentationValue": {
      "@id": "pagefront:presentationValue"
    },
    "priceOnRequest": {
      "@id": "pagefront:priceOnRequest"
    },
    "productHighlights": {
      "@id": "pagefront:productHighlights",
      "@container": "@list"
    },
    "promotions": {
      "@id": "pagefront:promotions",
      "@container": "@list"
    },
    "relatedProduct": {
      "@id": "pagefront:relatedProduct",
      "@container": "@list"
    },
    "reseller": {
      "@id": "pagefront:reseller",
      "@container": "@list"
    },
    "safetyNotice": {
      "@id": "pagefront:safetyNotice",
      "@container": "@list"
    },
    "safetyWarning": {
      "@id": "pagefront:safetyWarning",
      "@container": "@list"
    },
    "sheetUrl": {
      "@id": "pagefront:sheetUrl",
      "@type": "@id"
    },
    "sizeChart": {
      "@id": "pagefront:sizeChart"
    },
    "sizeRecommendation": {
      "@id": "pagefront:sizeRecommendation"
    },
    "socialAccount": {
      "@id": "pagefront:socialAccount",
      "@container": "@list"
    }
  }
}
```

## Versioning and stability

The versioning scheme, the release table and the release notes are in [`releases.md`](releases.md). In short:

- **Sheet specs.** Each sheet spec (product, organization, and future ones) has its own semver and evolves independently. Before 1.0, a breaking or an additive change bumps the minor and a fix or clarification bumps the patch.
- **Releases.** A commerce release is a named, versioned bundle of member versions: each sheet spec and this vocabulary. Its bump follows its members: major if any member bumps major, else minor if any member bumps minor, else patch. A new sheet type joining is a minor. 1.0.0 is a release like any other.
- **This vocabulary.** It has no independent version and carries the release version: this is vocabulary 0.5.0, the vocabulary of commerce release 0.5.0.
- **On the wire.** A sheet's envelope carries `release`, and its `$schema` names the sheet-spec version that release bundles for the sheet's type. Sheets carrying `format_version` belong to the legacy draft line (format versions 0.9 and earlier), which stays valid against the legacy schemas.
- **Rule catalogue and linter.** Each has its own semver, independent of the release and of the sheet specs.

**Annotations.** The "added in v0.7", "added in v0.9" and similar annotations throughout this document name legacy format versions, the scheme in use before 2026-10-01. They are kept as history. New annotations name the release: "added in release 0.3.0".

**Breaking changes.** A change that would make a conforming sheet non-conforming follows semver: it ships in a new minor of its sheet spec before 1.0.0 and in a new major from 1.0.0, and the release bumps with it. The breaking changes each sheet spec plans are listed in that spec under "Planned breaking changes."

### Stability from release 1.0.0

Pagefront commits to predictable change in place of a frozen vocabulary. From release 1.0.0:

- An existing term never changes meaning. A changed meaning takes a new term.
- A term, value or rule to be removed is first deprecated. A deprecated term is marked as such, remains valid and resolvable for at least twelve months, and its removal is announced in the changelog before it happens.
- Sheets conforming at the start of a deprecation window remain conforming until it ends.

Before release 1.0.0, terms may still change. Every change is recorded in the changelog and versioned by semver as above. Consumers should pin to the release their tooling reads and treat unknown future releases as opaque.

### Term history

This is vocabulary 0.5.0. The versions named in this section are legacy format versions. `pagefront:Document` and `pagefront:RelatedProduct` were added in v0.7. `pagefront:FeatureGroup`, `pagefront:LegalEntity`, `pagefront:SafetyWarning`, `pagefront:SafetyNotice`, `pagefront:featureGroup`, `pagefront:feature`, `pagefront:presentationValue`, `pagefront:productHighlights`, `pagefront:legalEntity`, `pagefront:safetyWarning`, and `pagefront:safetyNotice` were added in v0.8. `pagefront:commerceRole`, `pagefront:fulfillmentTerms`, `pagefront:SocialAccount`, `pagefront:socialAccount`, `pagefront:AuthorizedResellers`, `pagefront:authorizedResellers`, (2026-09-24) `pagefront:manufacturerWarranty`, (2026-09-30) `pagefront:sheetUrl`, and (2026-10-01) `pagefront:ConfiguratorPricing` and `pagefront:configuratorPricing` were added in v0.9. No term is added in release 0.3.0 or in release 0.4.0. From release 1.0.0 the stability policy above applies to every term.

Note: v0.5 made envelope/structural changes (the `sheet_url` rename, internationalization model, and URL convention) without adding new vocabulary terms, which is why the vocabulary jumped from 0.4 to 0.6. v0.7 adds two new types (`pagefront:Document`, `pagefront:RelatedProduct`) and adopts Schema.org-native vocabulary for product Q&A without minting a parallel `pagefront:` term. v0.8 adds four new types (`pagefront:FeatureGroup`, `pagefront:LegalEntity`, `pagefront:SafetyWarning`, `pagefront:SafetyNotice`) and five new data-block properties (`pagefront:featureGroup`, `pagefront:productHighlights`, `pagefront:legalEntity`, `pagefront:safetyWarning`, `pagefront:safetyNotice`), and adopts Schema.org-native vocabulary for machine-readable categories (`CategoryCode`) and multiple GTINs without minting parallel terms. v0.9 adds four new properties: `pagefront:commerceRole`, the role discriminator on the Commerce Organization Sheet, with its closed Commerce roles enum; `pagefront:fulfillmentTerms`, the org-level attachment point for store-wide shipping defaults carried as Schema.org-native `OfferShippingDetails`; `pagefront:socialAccount`, the typed home for official social accounts, with the `pagefront:SocialAccount` type, landed together with the tightening of `sameAs` on that sheet to identity authority records only; and `pagefront:authorizedResellers`, the brand's authorization claim over its distribution, with the `pagefront:AuthorizedResellers` type, added 2026-08-31 within the 0.9 draft. v0.9 also adds one certification scope value (`organization`), adopts Schema.org-native vocabulary for company registration identity (a ladder of machine keys, `leiCode` when the entity has an LEI, else `iso6523Code` where the register has an ICD, plus an `identifier` `PropertyValue` for the display form) without minting a term, and relaxes the `pagefront:LegalEntity` `organization.name` requirement in the JSON Schema so reference stubs (`@type` + `@id`) validate. All of this is additive: no term is renamed or removed, and existing v0.8 sheets stay valid. The 2026-10-01 revision is the exception: it removes the price properties of `pagefront:Configurator` and of its options, and a sheet that carried them needs re-emission.

## Changelog

### Unreleased

### 0.5.0 — 2026-10-18

The vocabulary of commerce release 0.5.0. One term is added, `pagefront:collectionKind`, with the Commerce Collection Sheet; nothing is renamed or removed.

- **Editorial: traversal-hint pointers.** The notes on `pagefront:sheetUrl` and `pagefront:availableLanguages` point at "Traversal hints" in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md)), where the rule now lives.
Changes land here and are versioned at the next release; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

- **Addition (release 0.5.0): `pagefront:collectionKind`.** Minted with the Commerce Collection Sheet ([`collection.md`](collection.md)): the kind discriminator on that sheet's `Collection` data block and on `Collection` member entries, with the closed Collection kinds enum `category`, `collection`, `brand` (see "Enumerated values"). `pagefront:sheetUrl` extends to collection references: the member entries of `hasPart`, `isPartOf` and `hasOfferCatalog`, checked against the referencing sheet's canonical host, and the `brand` reference of a brand collection, checked under the brand edge. No other term changes; the JSON-LD context block gains its `collectionKind` mapping at the release.
- **Clarification: `pagefront:availableLanguages` is the language-variant mechanism.** `hreflang` is removed from the discovery link in the Pagefront Spec, and the property's entry says a publisher with more than one language variant of a sheet SHOULD declare it. The fallback path for a stale entry is the sibling's own page and the sheet it declares with `alternate`. Shape and values are unchanged.
- **Clarification: traversal hints.** `pagefront:sheetUrl` and the `url` of each `pagefront:availableLanguages` entry are traversal hints that MAY be stale. A consumer MUST be able to reach the target through its page, SHOULD treat the hint as an optimisation over that path, and MUST NOT cache a sheet URL across the page's changes. The general rule is stated under "Traversal hints" in the Pagefront Spec; the two term entries refer to it. No term is added, renamed or removed.

### 0.4.0 — 2026-10-02

The vocabulary of commerce release 0.4.0. No term is added, renamed or removed. The release makes `$schema` required on sheets carrying `release`, in the Product Sheet spec (0.10.0) and the Organization Sheet spec (0.4.0), and requires the pairs of a configurator's `exclusions` and of an adjustment's `when` to resolve to a declared dimension and option. The vocabulary takes the release version.

### 2026-10-01 — Versioning scheme replaced

Each sheet spec now has its own semver, and a commerce release bundles the sheet specs and this vocabulary; the scheme and the release table are in [`releases.md`](releases.md). In the sheet envelope `release` replaces `format_version` (breaking, release 0.3.0), and `$schema` names the sheet-spec version. Sheets carrying `format_version` form the legacy draft line and stay valid against the legacy schemas. Breaking changes follow semver; the "held for 1.0" rule and the "Path to 1.0" plan are withdrawn, and the stability policy applies from release 1.0.0. This document is vocabulary 0.3.0. No term changes.

### 2026-10-01 — One amount carrier per Sheet

Replaces the amount typing of the entry below: `basePrice`, modifiers and adjustment amounts in `pagefront:ConfiguratorPricing` are amounts, each a JSON number or a decimal string, and a Sheet uses one carrier for all its amounts. No term changes.

### 2026-10-01 — Numeric configurator amounts, note register, size-system consistency

Second addendum to the configurator pricing change of the same date. `basePrice`, modifiers and adjustment amounts in `pagefront:ConfiguratorPricing` are JSON numbers; they were decimal strings in the first text of that date. A dimension's `note` is defined as a third-person factual statement and an option's `description` as the label a buyer sees. Sizing dimensions follow their system's notation in place of the identifier form. On `pagefront:SizeRecommendation`, `sizeAdjustment.sizeSystem` MUST match the system of the Sheet's sizing dimension, and advice stated in another system stays in `description`. No term is added, renamed or removed.

### 2026-10-01 — Option identifiers, free-text dimensions, order-time services

Addendum to the configurator pricing change of the same date. An option's `value` is defined as a stable identifier (lowercase, no spaces, shared across languages and editions, numbers as strings without a unit), with the label in `description`. `pagefront:ConfiguratorDimension` gains `inputType` (`select` or `text`) and `maxLength`; a priced `text` dimension has one modifier, keyed `"*"`. Services offered around the order are not options and MUST NOT appear in `options`. No term is renamed or removed.

### 2026-10-01 — Configurator pricing moves to the offer

Breaking (pre-1.0), taken within 0.9 as a recorded exception to the held-for-1.0 rule; the format version stays 0.9. `pagefront:Configurator` loses `basePrice`, `basePriceCurrency` and `priceFormula`, and its options lose `priceModifier` and `currency`: a configurator describes the option space and carries no prices. It gains `@id` and `exclusions`, and `pagefront:ConfiguratorDimension` gains `affectsPrice`. `pagefront:ConfiguratorPricing` and the `pagefront:configuratorPricing` property are added: an `Offer` or `AggregateOffer` states a market's prices for the option space and names the configurator it prices. The removed properties were plain members of the type with no term of their own in the JSON-LD context, so no IRI is retired. The four defects that motivated the change are in the Pagefront Spec's changelog entry of the same date.

### 2026-09-30 — `pagefront:sheetUrl`

Additive; no sheet changes conformance. `pagefront:sheetUrl` added: organization references declare where the organization sheet is, and `@id` stays the identity. Host checks are edge-typed (seller sheets on the product sheet's host, brand sheets on the brand's `@id` host, legal-entity sheets on either), and the `@id` must match at the node the edge points at. Consumers do not construct sheet URLs and treat unresolvable inherited terms as unknown; seller identity across domains is publisher-asserted pending a domain-association mechanism. The JSON-LD context maps `sheetUrl` with `"@type": "@id"`, since its value is an IRI reference.

### 2026-09-24 — Versioning policy revised

Policy and prose only; no term, schema or sheet changes conformance. Releases before 1.0 are 0.9.x, one per new sheet type; 1.0 is defined as the complete commerce sheet set; breaking changes are held for 1.0; from 1.0, stability is deprecation-based (a term never changes meaning, removals are deprecated first and stay valid for at least twelve months). The earlier "permanent identifiers within a major version" statements are replaced by that policy.

## References

- Commerce releases and the versioning scheme: [`releases.md`](releases.md)
- Product Sheet schema, spec version 0.11.0: `https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json` (published file: [`../schemas/product/v0.11.0.json`](../schemas/product/v0.11.0.json))
- Organization Sheet schema, spec version 0.5.0: `https://themachineweb.org/pagefront/spec/commerce/organization/v0.5.0.json` (published file: [`../schemas/organization/v0.5.0.json`](../schemas/organization/v0.5.0.json))
- Collection Sheet schema, spec version 0.1.0: `https://themachineweb.org/pagefront/spec/commerce/collection/v0.1.0.json` (published file: [`../schemas/collection/v0.1.0.json`](../schemas/collection/v0.1.0.json))
- Product Sheet schema, spec version 0.10.0, for sheets declaring release 0.4.0: `https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json` (published file: [`../schemas/product/v0.10.0.json`](../schemas/product/v0.10.0.json))
- Organization Sheet schema, spec version 0.4.0, for sheets declaring release 0.4.0: `https://themachineweb.org/pagefront/spec/commerce/organization/v0.4.0.json` (published file: [`../schemas/organization/v0.4.0.json`](../schemas/organization/v0.4.0.json))
- Schema.org vocabulary: `https://schema.org/`
- JSON-LD 1.1: `https://www.w3.org/TR/json-ld11/`
- RFC 8288 (Web Linking): `https://www.rfc-editor.org/rfc/rfc8288`
- RFC 9727 (Linkset for Common Web Standards): `https://www.rfc-editor.org/rfc/rfc9727`
