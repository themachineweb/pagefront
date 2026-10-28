# Pagefront Commerce — Completeness Dimensions

**Status: NON-NORMATIVE.** This document defines no conformance requirement.

The Pagefront standard defines a shared dimension taxonomy so that sheet completeness can be discussed comparably across producers, tools, and writeups. It does **not** define weights, formulas, or an official score. Weighted scoring is a consumer-side concern: validators, dashboards, registries, and agents apply their own rubrics over these dimensions, encoding their own view of what matters — a compliance agent legitimately weights legal entities heavily; a visual-shopping agent legitimately weights media. Implementations version their rubrics independently of the format.

The linter ([`rules.md`](rules.md), normative) judges correctness — every rule is defensible on the sheet's own terms. A score's weights are a valuation, and valuations differ per consumer. The standard therefore keeps the taxonomy and leaves the valuation out, the same division Schema.org observes: Schema.org doesn't score pages — Lighthouse and the Rich Results Test do, as their vendors' judgment.

## The six dimensions

Carried from the v0.4.1 rubric. Field lists are **illustrative and non-exhaustive**, naming v0.8 schema fields (`product.json`) that naturally count toward each dimension. Dimensions classify by a field's *nature*, not its namespace — a `pagefront:` construct belongs wherever its content points. Some constructs plausibly serve more than one dimension (a certification document is both documentation and trust; a gemstone block is both extension adoption and attribute data); a consumer rubric may count a field toward whichever dimensions its valuation cares about.

**identity** — the fields that establish unambiguously *which product this is*: its name, identifiers, brand, and place in a variant family.
Illustrative fields: `@id`, `@type`, `name`, `url`, `brand`, `sku`, `gtin`, `gtin13`, `mpn`, `productID`, `productGroupID`, and the variant-family linkage (`isVariantOf`, `hasVariant`, `variesBy`).

**core_attributes** — the product's intrinsic characteristics: what it is, what it's made of, its dimensions, origin, and structured specifications.
Illustrative fields: `description`, `category`, `color`, `material`, `weight`, `height`, `width`, `depth`, `countryOfOrigin`, `additionalProperty`; and the structured attribute constructs `pagefront:featureGroup`, `pagefront:materialComposition`, `pagefront:fabricComposition`, `pagefront:gemstone`, `pagefront:construction`, `pagefront:sizeChart`, `pagefront:sizeRecommendation`, `pagefront:careInstructions`.

**media** — the visual and audiovisual record of the product.
Illustrative fields: `image` (with `role` annotations and captions), `video` (with roles, thumbnails, captions/transcripts).

**offers** — the commercial terms: what it costs, whether it's available, and under what conditions it changes hands.
Illustrative fields: `offers[]` with `price`, `priceCurrency`, `priceSpecification`, `availability`, `itemCondition`, `seller`, `shippingDetails`, `hasMerchantReturnPolicy`, `areaServed`/`eligibleRegion`, `acceptedPaymentMethod`, `pagefront:estimatedDelivery`, `pagefront:promotions`, `pagefront:priceOnRequest`; and the price-space and terms constructs `pagefront:configurator`, `pagefront:madeToOrderTerms`.

**trust** — signals a consumer can verify or hold someone to: third-party attestations, responsible entities, safety, and provenance.
Illustrative fields: `aggregateRating`, `review`, `hasCertification`, `manufacturer`, `pagefront:legalEntity`, `pagefront:safetyWarning`, `pagefront:safetyNotice`, `pagefront:manufacturingChain`, `pagefront:document` (certificates, declarations of conformity, test reports, and similar).

**extensions** — adoption of the enrichment and discovery surfaces beyond the core record.
Illustrative fields: `question` (product Q&A), `pagefront:relatedProduct` and the Schema.org relationship fields (`isRelatedTo`, `isSimilarTo`, `isPartOf`, `hasPart`), `pagefront:productHighlights`, `pagefront:availableLanguages`.

Placement notes for the v0.8 additions: `pagefront:featureGroup` sits in **core_attributes** — grouped spec tables are attribute data; the namespace is a mechanism, not the field's nature. `pagefront:productHighlights` sits in **extensions** — publisher-authored selling points are a merchandising surface over the record, not an intrinsic attribute. `pagefront:legalEntity` sits in **trust**.

## Relation to the linter

Linter findings are machine-readable input to any scorer: the canonical report ([`../../core/spec/linter.md`](../../core/spec/linter.md), "Output format") carries stable rule IDs, severities, and paths, and rule IDs map naturally onto dimensions (e.g. PDP-W-001 missing image → media; PDP-W-024 legal-entity address → trust). How a rubric weights them is the rubric's business. Conformance and scoring remain distinct concerns: a fully conformant sheet can be thin, and a rich sheet can fail lint.

## History

v0.4 embedded a `completeness` block inside the published sheet. v0.4.1 removed it — the sheet is the publisher's authoritative statement about the product; the score is a consumer's judgment about the sheet — and moved score computation to consumers (see "Why completeness is not in the sheet" in the Product Sheet design notes, [`product-notes.md`](product-notes.md#why-completeness-is-not-in-the-sheet)), leaving the rubric itself as a forthcoming standard document that was never published. This document completes the move: the rubric, too, is consumer-side. What the standard keeps is this dimension taxonomy, so that different consumers' scores, however weighted, are at least talking about the same axes.
