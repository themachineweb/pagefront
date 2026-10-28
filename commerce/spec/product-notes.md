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

## Why examples use unregistered `propertyID` values

For "Variant dimensions" in [`product.md`](product.md#variant-dimensions).

Spec examples and worked illustrations of the unregistered path SHOULD use `propertyID` values with no plausible registration future, such as an idiosyncratic, single-merchant facet. A common cross-vertical term risks getting registered later, which would silently invalidate the example's premise. The choice of `earcup_fold_mechanism` as the illustration in "Feature groups" follows this guidance.

## What's not in `video`

For "Video roles" in [`product.md`](product.md#video-roles).

- **User-generated review videos** belong in `pagefront:userGeneratedMedia` (a future field, not in v0.6). The publisher isn't the author and the trust signal is fundamentally different from publisher-authored video.
- **Live streams and scheduled broadcasts** are out of scope. Schema.org's `BroadcastEvent` and `LiveBlogPosting` cover this case; Pagefront may revisit if real consumer use cases surface.
- **Promotional videos / advertisements** typically fall under `overview` or `lifestyle`. The spec doesn't define a distinct `commercial` role because the routing distinction doesn't help consumers.
- **`hero` is not a video role.** The image role `hero` exists to disambiguate within an image set where multiple images could be the primary one. Most products have one overview video; the disambiguation isn't needed. Publishers wanting to surface a primary video should use `overview`.

## Why feature groups are minted

For "Feature groups" in [`product.md`](product.md#feature-groups).

The extension trigger is **Schema.org under-specification**: Schema.org's `additionalProperty` carries name/value pairs, but as one flat list. It has no grouping (which section does a row belong to), no ordering (sections and rows render in a merchant-chosen order that carries editorial intent), and no split between the raw comparable value and the merchant's display formatting. Consumers comparing products need the raw values; consumers rendering a spec table need the structure.

The shape is composition over inheritance: only the grouping shell is minted, and the rows inside it stay Schema.org-native `PropertyValue` objects.

The registry is a coordination artifact (convergence by producer opt-in); a registry-*enforced* cross-publisher comparison contract remains open, tracked as open design question #26.

## Why `pagefront:presentationValue` exists

For `pagefront:presentationValue` in [`product.md`](product.md#feature-groups).

`pagefront:presentationValue` exists because `PropertyValue` has no field that can carry display formatting cleanly. Merchants render values like "Up to 30 h (ANC on)" where the comparable quantity is `30` `HUR`. The display string carries qualifiers and locale formatting that must not pollute `value` (a consumer comparing battery life needs `30`), and overloading `description` would conflate formatting with explanation. So the raw value goes in Schema.org's `value`, and the display string, when the merchant has one, goes in `pagefront:presentationValue`.

## Why product highlights are minted and ordered

For "Product highlights" in [`product.md`](product.md#product-highlights).

The extension trigger is a **Schema.org gap**: no Schema.org property carries an ordered, publisher-curated highlight list. `description` is continuous prose; `additionalProperty` is specification data; neither expresses "these three points, in this order, are what the merchant leads with." The ordering is part of the signal, so the term is marked `@container: @list` in the JSON-LD context to survive JSON-LD processing, which otherwise treats arrays as unordered sets.

## Why legal entities are role-typed

For "Legal entities" in [`product.md`](product.md#legal-entities).

The driver is regulation: the EU General Product Safety Regulation (GPSR) requires products sold into the EU to name a responsible economic operator established in the EU, and licensed goods routinely separate the brand owner from the licensee that actually manufactures and markets the product. Agents fielding "who is legally behind this product?" (for safety recalls, compliance checks, warranty claims) need the entities *and their roles*.

The extension trigger is **Schema.org under-specification**: Schema.org's `manufacturer` names one organization in one fixed role. It has no typing for the other roles regulation distinguishes (a licensee, an authorized representative, an importer), and consumers cannot dispatch on a role the vocabulary cannot express.

## Why the reference form does not replace the inline form

For "Referencing a Commerce Organization Sheet" in [`product.md`](product.md#referencing-a-commerce-organization-sheet).

The reference form removes the drift-prone duplication of stable organization data across every product the brand sells. An `authorized_representative` or `importer` has nothing to reference, and GPSR Art. 19 wants the responsible entity resolvable at the listing itself; compliance-grade data stays on the product.

The reference form does not replace the inline form. `authorized_representative` and `importer` are per-product, per-market facts about third parties, and `manufacturer` ≠ `brand_owner` for licensed goods; the manufacturing licensee is named only at the product. The reference form needs no new machinery. A Schema.org `Organization` reduced to `@type` + `@id` is already a reference stub, and the linter's existing stub-vs-inline distinction (PDP-E-001 / PDP-W-020) applies unchanged. The v0.8 schema requires `organization.name`, so the stub form fails Layer 1 until the v0.9 schema makes `name` optional when `@id` is present; the SHOULD in the spec is contingent on that relaxation landing in the same cut. The linter exempts reference stubs from PDP-W-024, the no-postal-address warning, in the same cut, because the address lives on the referenced sheet and the warning would be a false positive on a pure pointer.

## Why safety warnings are verbatim and per language

For "Safety warnings" in [`product.md`](product.md#safety-warnings).

The extension trigger is a **Schema.org gap**: Schema.org has no product-safety-warning vocabulary.

The merchant's published wording is the compliance artifact, and a paraphrase is a new, unreviewed safety statement.

GPSR requires safety information in the language of the member state where the product is sold, and the per-language sibling sheets (`pagefront:availableLanguages`) are the mechanism that satisfies it.

## Why safety notices are a field of their own

For "Safety notices" in [`product.md`](product.md#safety-notices).

The extension trigger is a **Schema.org gap**: `availability: "https://schema.org/Discontinued"` means "no longer sold." It does not mean "dangerous — return it." Schema.org has no vocabulary for recalls, hazards, or remedies, and a consumer that reads a recalled product's Sheet as merely discontinued fails the buyer.

## Why related products are typed

For "Related products" in [`product.md`](product.md#related-products).

Schema.org has loose relations (`isRelatedTo`, `isSimilarTo`, `isAccessoryOrSparePartFor`, `isConsumableFor`) but these are untyped beyond the four built-in relations and don't carry the typed-relationship semantics agents need for context-aware recommendations. Schema.org's `isAccessoryOrSparePartFor` fuses two distinct relationships into one untyped property. Pagefront separates them: `accessory` (an optional add-on that extends the product) and `spare_part` (a replacement for a component the product already has, ordered on wear or failure). Consumers act on the difference (an accessory is an upsell, a spare part is aftermarket support), so the distinction is typed; the consumer does not have to infer it from the target product's name.

## Why `image` on a related product mirrors Schema.org's

For `image` on a related product in [`product.md`](product.md#related-products).

The Schema.org-native relationship fields are parallel: `isRelatedTo`, `isSimilarTo`, and `hasPart` reference a Schema.org `Product`, which carries its own `image` property (a URL or `ImageObject`) via the `additionalProperties: true` policy. The `image` field on `pagefront:relatedProduct` provides the same render-hint capability for typed relationships that the Schema.org `Product` reference already provides for untyped ones. Both are the same convention, an image via Schema.org's `image`, surfaced through different mechanisms because `pagefront:relatedProduct` is a closed Pagefront extension while the Schema.org relationship fields are open.

## Why typed relationships divide along operational and marketing lines

For "Operationally-tracked vs. marketing-curated relationships" in [`product.md`](product.md#operationally-tracked-vs-marketing-curated-relationships).

The typed relationships in the closed enum divide along a scale-dependent line in how publishers declare them.

Some are **operationally tracked** by publishers regardless of catalog size: `accessory`, `consumable`, `required_part`, `spare_part`, `replaces`, `replaced_by`, `bundle_component`, `compatible_with`, and `service`. These relationships reflect business operations (inventory, product hierarchy, parts management, lifecycle, service offerings) that publishers maintain because commerce requires them. A publisher with 10,000+ SKUs still knows which products are accessories of which, because it must manage that inventory.

Others are **marketing-declared**: `often_bought_with` and `recommended_with`. These work cleanly at small catalog scales where marketing teams hand-curate pairings. At larger scales, the same relationships are typically generated by recommendation engines (SearchSpring, Dynamic Yield, Algolia Recommend, Shopify recommendations) and displayed in publisher-controlled UIs but not individually declared by the publisher.

## Why a typed relationship needs a structured identifier

For "The structured-identifier requirement" in [`product.md`](product.md#the-structured-identifier-requirement).

The reason is the typed extension's contract: a typed relationship implies the consumer can act on the target (dereference it, fetch its Sheet, compare offers), and a name plus a link is too thin for that.

A typed relationship without a structured identifier is still untyped from the schema's perspective, because the consumer can't act on the typing without something to dereference. An algorithmic recommendation that happens to carry a SKU is still untyped from the operational perspective, because the publisher never declared the relationship type.

## Why `price` is the displayed consumer price

For `price` in [`product.md`](product.md#offers).

EU price-indication law defines the price a trader must display to a consumer as the final unit price including VAT and all other taxes: Directive 98/6/EC, Article 2(a) ("selling price shall mean the final price for a unit of the product, or a given quantity of the product, including VAT and all other taxes"), as amended by Directive (EU) 2019/2161, consolidated text in force since 28 May 2022. The shipping exclusion follows Directive 2011/83/EU, Article 6(1)(e), under which freight, delivery and postal charges are disclosed as additional charges beside the total price. That article governs the checkout-time total price, and it is cited here for the shipping exclusion alone.

Taking `price` from the rendered page is a producer obligation: a linter can detect a missing tax-basis statement (PDP-W-028), and whether a stated basis is true lies beyond what any linter can check.

## Why returns and shipping default to the seller sheet

For "Return policy" in [`product.md`](product.md#return-policy).

A store-wide policy stated once on the seller's Organization Sheet does not duplicate and drift across product sheets, so a product carries terms only where it deviates.

This is the format's one semantic cross-sheet dependency: answering "can I return this product" may require the seller sheet when the product is silent. The read rides the existing `Offer.seller` edge and stays `@id`-keyed for identity; `pagefront:sheetUrl` on the seller reference says where the seller sheet is. It is scoped to return and shipping terms; it does NOT generalize to other fields. `pagefront:fulfillmentTerms` is minted in the vocabulary alongside the Commerce Organization Sheet for the same reason. v0.9 removed `hasMerchantReturnPolicy` and `shippingDetails` from the routine Offer shape; both remain valid as per-product overrides.

## Why a warranty goes where the guarantor is

For "Warranty" in [`product.md`](product.md#warranty).

Schema.org defines `warranty` on `Offer` (and `Demand`) only, and has no product-level warranty property. A warranty given by the seller is part of the offer. A warranty given by the manufacturer belongs to the product, follows it across every retailer, and is claimed against the manufacturer, so `pagefront:manufacturerWarranty` is minted on the Product, which is also where a manufacturer's own sheet, which may carry no Offer at all, states its warranty. The distinction matters to consumers because the claim path and the portability differ.

## Why delivery modes stay apart from shipping details

For "Delivery" in [`product.md`](product.md#delivery).

Pages describe how the customer receives an item as "delivery". Schema.org files delivery cost, destination and timing under `shippingDetails` and the mode under `availableDeliveryMethod`, whose `DeliveryMethod` enumeration has three members in Schema.org 30.1. Pagefront uses both names unchanged and keeps the facts apart.

## Why checkout is a one-variable template

For "Where to buy" in [`product.md`](product.md#where-to-buy).

A checkout template uses only the variables Pagefront defines, so that a consumer can fill every placeholder; the offer itself identifies the item, so a template does not take a product or variant identifier. Checkout depends on the market, hence the region requirement. The source rule mirrors the sheet-URL rule: a producer does not construct a checkout URL from a platform's URL pattern, for the same reason it does not construct sheet URLs.

Programmatic purchase, an endpoint a program calls to place an order, as described by Schema.org's `potentialAction` with a `BuyAction`, involves authentication, payment and order creation. It is a transaction protocol, and Pagefront describes offers, so Pagefront does not specify it. An Offer may carry it; consumers act on it under that protocol's terms, and this document says nothing about them. Where an item is not sold on the page at all, as on a manufacturer's own product page, there is no Offer and no checkout; directing shoppers to the retailers that sell it is not covered here.

Both properties are Schema.org's own, so "Where to buy" mints no `pagefront:` term and the Offer block admits them without a schema change; it was added in release 0.5.0.

## Why `itemOffered` may be omitted on a single Offer

For "itemOffered references" in [`product.md`](product.md#itemoffered-references).

For single-Offer sheets where the `itemOffered` is unambiguously the root product, Schema.org consumers infer it from the Offer's position on the Product; with several Offers the reference is what ties each to its variant.

## Why both schema.org schemes are accepted

For `availability` in [`product.md`](product.md#offers).

Sheets in the wild carry `http://schema.org/` and `https://schema.org/` URIs; consumers treat them as semantically equivalent, and new sheets use the `https` form. "Upstream-equivalent forms" states the general rule.

## Why the tax basis belongs to the offer and its region

For "Tax inclusion" in [`product.md`](product.md#tax-inclusion).

The tax basis of a price is a property of the (offer, region) pair. Whether tax is included is jurisdictional: EU and UK displayed prices include VAT, while US prices conventionally exclude sales tax added at checkout. The amount is jurisdictional too: under destination-based VAT the same product carries different gross prices across member states. A sheet's several region-scoped Offers may therefore each carry a different basis, and neither the sheet nor the seller has a single basis of its own.

Directive 98/6/EC governs products offered by traders to consumers; net pricing on a trade sheet falls outside its scope.

## Why `UnitPriceSpecification` carries the flag

For "Tax inclusion" in [`product.md`](product.md#tax-inclusion).

`UnitPriceSpecification` is the recommended type for the entry, including an entry that carries only `valueAddedTaxIncluded`, as on an `AggregateOffer`, where there is no single `price` to mirror. Two reasons. It is the type the sale-pricing pattern already uses with `priceType`. And it is the type consumers of Schema.org offer markup document for `priceSpecification` entries: Google's merchant listing documentation names `UnitPriceSpecification` and no other price specification type, so the flag sits on the entry type those consumers already parse. An entry of this type needs no unit to carry the flag. `valueAddedTaxIncluded` is defined on its parent `PriceSpecification`, so an existing plain `PriceSpecification` entry carries the flag as well.

## Why completeness is not in the sheet

For the spec as a whole, [`product.md`](product.md).

A completeness score is a valuation, and valuations differ per consumer: a compliance agent weights legal entities heavily, a visual-shopping agent weights media. No single score would be right for both, so the sheet carries none. Scoring is consumer-side, over the shared dimension taxonomy in [`scoring.md`](scoring.md); the linter judges correctness only.

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
