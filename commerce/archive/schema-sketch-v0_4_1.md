# Product Page Schema — v0.4.1 Sketch

Status: draft / sketch, not yet a spec.
Format version: 0.4.1
Schema.org version targeted: 30.0 (2026-03-19)

## Changelog from v0.4

- **Completeness block removed from the envelope.** The completeness score is not part of the published artifact. Scoring is a function of the validator and the SaaS dashboard, not the spec. Rationale below under "Why completeness is not in the artifact."
- No other normative changes from v0.4. This is a cleanup release that finishes propagating a decision the project had already made in principle but had not propagated through the schema, the JSON Schema, or the case-study artifacts.

## Changelog from v0.3

- **Project codename changed from `transformer` to `pagefront`.** The extension namespace prefix follows: v0.3's `transformer:` becomes v0.4's `pagefront:`. All typed extensions are renamed mechanically; semantics are unchanged from the v0.3 sketch.
- **Provenance block removed.** v0.3's per-field provenance metadata is no longer part of the spec. The artifact is the publisher's authoritative statement; provenance was solving a problem the format itself does not yet have.
- **Implicit production-model framing reset.** v0.3 implicitly assumed third-party extraction as the canonical production path; v0.4 assumes first-party authoring as the default. Extraction tooling remains a valid producer of artifacts but no longer shapes the schema's defaults.
- **Image roles formalized as an enumeration.** The `role` PropertyValue on ImageObject is now defined with a closed initial set of values, surfaced in the rendering tests as a load-bearing signal.
- **`pagefront:configurator` introduced** as a first-class extension for products with multi-dimensional pricing/customization (jewelry, furniture, custom apparel).
- **`pagefront:madeToOrderTerms` introduced** consolidating production lead time, returns nuances, and aftermarket services for made-to-order products.
- **`pagefront:fabricComposition` generalized to `pagefront:materialComposition`.** The textile-only framing of v0.3 is replaced by a structure that handles any material with optional purity and provenance attributes. `pagefront:fabricComposition` remains as an alias for textile cases.
- **`pagefront:gemstone` introduced** for jewelry products requiring typed gemstone grading.
- **Discovery mechanism unchanged from v0.3** (RFC 8288/9727-based linking via `Link: rel="describedby"` headers, with HTML `<link>` fallback and `profile` parameter). v0.4 adds a **recommended URL convention** (`/pagefront/{type}/{id}.json`) for implementation guidance, while keeping the `Link` mechanism as the authoritative discovery path.

## Design principles

- **Schema.org is the data vocabulary.** The data block is valid Schema.org JSON-LD; consumers ignoring the project envelope still get a clean Schema.org document.
- **The artifact is the publisher's authoritative statement.** No confidence flags, no audit metadata, no per-field provenance in v0.4. The artifact's contents are what the publisher is willing to stand behind.
- **Sparse data, exhaustive documentation.** Properties present when they have values, absent otherwise.
- **Project extensions are explicit and minimal.** Vocabulary extensions live under a project namespace; the data block remains parseable as Schema.org by consumers that ignore the namespace.
- **First-party authoring is the assumed production model.** The publisher generates the artifact from their canonical product data. Extraction-from-HTML is a fallback path for sites that haven't adopted the format directly; it's a valid path but not the schema's design center.

## The envelope

Project-defined publication metadata wrapping the Schema.org payload.

```json
{
  "$schema": "https://themachineweb.org/pagefront/commerce/schemas/product/v0.4.json",
  "format_version": "0.4",
  "schema_org_version": "30.0",
  "canonical_url": "https://merchant.com/products/widget-123",
  "artifact_url": "https://merchant.com/pagefront/products/widget-123.json",
  "generated_at": "2026-05-10T14:32:00Z",
  "expires_at": "2026-05-10T15:32:00Z",
  "data": { ... }
}
```

Envelope fields are project-defined and required on every artifact.

`expires_at` indicates how long consumers should consider the artifact valid before re-fetching. For static catalogs this can be hours or days; for live pricing it should be minutes. Consumers must respect cache semantics.

## data — Schema.org JSON-LD

The data block is a valid Schema.org Product (or subtype) document with optional project extensions under the `pagefront:` namespace.

### Required and recommended core fields

Required:
- `@type`: "Product" (or recognized subtype)
- `@id`: stable URL-shaped identifier
- `name`: product name as displayed to humans
- `url`: canonical URL of the human page
- `inLanguage`: ISO 639 language code; the source-of-truth language for prose fields
- One of `sku`, `gtin13`, `mpn`, or `productID`

Recommended:
- `brand`: typed Brand or Organization
- `description`: prose description in `inLanguage`
- `category`: hierarchical category string (e.g., "Apparel > Knitwear > Sweaters")
- `image`: array of ImageObject (see image roles below)
- `offers`: array of Offer (see offers section)
- `isVariantOf`: ProductGroup if the product belongs to a variant family

### Image roles

Each ImageObject can declare a role via `additionalProperty`. The v0.4 enumeration:

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

The role enum is closed for v0.4. Additional values require a spec amendment. Publishers needing roles outside the enum can use unprefixed PropertyValues that consumers may ignore.

### Offers

Offer modeling unchanged from v0.3 in core shape: `price`, `priceCurrency`, `availability`, `itemCondition`, `seller`, `shippingDetails`, `hasMerchantReturnPolicy`, `eligibleRegion`, `acceptedPaymentMethod`.

For made-to-order products, see `pagefront:madeToOrderTerms` below.

For configurable products, see `pagefront:configurator` below.

For products with site-level promotions (Mother's Day codes, seasonal sales), the `pagefront:promotions` array on the offer carries promo entries with explicit `scope` (`product` / `category` / `site_wide`). Publishers may include or omit site-wide promotions at their discretion; the artifact's `expires_at` should match the promo window when included.

### Project extensions (pagefront: namespace)

The following extensions are defined in v0.4. All are optional; products use them when applicable.

#### pagefront:sizeChart (Apparel)

Structured size chart with named measurements, size columns, and unit code. Carries optional model references for fit context.

```json
"pagefront:sizeChart": {
  "@type": "pagefront:SizeChart",
  "unitCode": "CMT",
  "sizes": ["S", "M", "L", "XL", "XXL"],
  "measurements": [
    {
      "@type": "pagefront:Measurement",
      "name": "Half chest",
      "values": { "S": 56, "M": 58, "L": 60, "XL": 62, "XXL": 64 }
    }
  ],
  "modelReferences": [
    {
      "@type": "pagefront:ModelReference",
      "name": "Malek",
      "heightCm": 186,
      "wearsSize": "L"
    }
  ]
}
```

#### pagefront:materialComposition

Structured decomposition of materials, replacing v0.3's textile-specific `pagefront:fabricComposition`. Each entry can carry purity, provenance (recycled / virgin / fair-mined / lab-grown), and weight.

```json
"pagefront:materialComposition": [
  {
    "@type": "pagefront:Material",
    "material": "gold",
    "purity": "18ct",
    "purityPercentage": 75,
    "provenance": "recycled",
    "weightGrams": 6.25
  }
]
```

For pure textiles, the simpler form (just `material` and `percentage`) remains valid and is aliased as `pagefront:fabricComposition`.

#### pagefront:construction (Apparel and other constructed goods)

Construction details — stitch type, gauge, machine, distinctive assembly notes. Generalizable beyond knitwear; furniture, leather goods, and watches all have analogous construction signatures.

```json
"pagefront:construction": {
  "@type": "pagefront:Construction",
  "stitch": "waffle knit",
  "gauge": 14,
  "machine": "circular",
  "constructionNotes": "Two-piece back with central seam."
}
```

#### pagefront:manufacturingChain

Ordered list of manufacturing stages with country and optional facility. Generalizes the single `countryOfOrigin` field for products with meaningful provenance distinctions (yarn spun in country X, knitted in country Y, assembled in country Z).

```json
"pagefront:manufacturingChain": [
  {
    "@type": "pagefront:ManufacturingStage",
    "stage": "yarn_spinning",
    "country": "FR"
  },
  {
    "@type": "pagefront:ManufacturingStage",
    "stage": "knitting",
    "country": "FR",
    "facility": "Atelier in Troyes"
  },
  {
    "@type": "pagefront:ManufacturingStage",
    "stage": "assembly",
    "country": "FR",
    "facility": "Clamart workshop"
  }
]
```

The `stage` enum is open in v0.4; common values include `yarn_spinning`, `weaving`, `knitting`, `dyeing`, `cutting`, `assembly`, `finishing`. Publishers may use category-appropriate stages.

#### pagefront:gemstone (Jewelry)

Typed gemstone grading. Captures the four Cs and certifying body for diamonds; generalizes to other gemstones via the `type` field.

```json
"pagefront:gemstone": {
  "@type": "pagefront:Gemstone",
  "type": "diamond",
  "origin": "lab_grown",
  "shape": "pear",
  "caratWeight": 1.5,
  "colorGrade": "DEF",
  "clarityGrade": "VS+",
  "cutGrade": "Excellent",
  "certifyingBody": "IGI"
}
```

#### pagefront:configurator

For products whose price and configuration are determined by user choice across multiple dimensions. Replaces the `Product` / `ProductGroup` / `hasVariant` model when the variant space is too large to enumerate (e.g., ring with 14 carat options × 5 ring sizes × 2 band styles = 140 combinations).

```json
"pagefront:configurator": {
  "@type": "pagefront:Configurator",
  "dimensions": [
    {
      "name": "diamond_carat",
      "options": [
        { "value": 0.5, "priceModifier": "0", "currency": "EUR" },
        { "value": 1.0, "priceModifier": "1480", "currency": "EUR" }
      ]
    },
    {
      "name": "band_style",
      "options": [
        { "value": "plain", "priceModifier": "0" },
        { "value": "three_quarter_pave", "priceModifier": "350" }
      ]
    },
    {
      "name": "ring_size",
      "system": "EU",
      "note": "Free post-purchase resizing within ±2 EU sizes."
    }
  ],
  "basePrice": "915.00",
  "basePriceCurrency": "EUR",
  "priceFormula": "basePrice + sum(dimension.priceModifier for each selected option)"
}
```

The `priceFormula` field is descriptive in v0.4 (a human-readable expression). A future version may formalize a structured pricing DSL once real consumer needs are clear.

When a configurator dimension also exists as a separate-URL variant (e.g., diamond shape exists as both a configurator option and a sibling product), publishers should declare the dimension in both `isVariantOf.hasVariant` (for the URL-distinct variants) and `pagefront:configurator.dimensions` (for the local options). Cross-reference URLs are encouraged.

#### pagefront:madeToOrderTerms

For products with `availability: MadeToOrder`, the terms that follow from custom production. Consolidates production lead time, cancellation policy, returns nuances, and aftermarket services.

```json
"pagefront:madeToOrderTerms": {
  "@type": "pagefront:MadeToOrderTerms",
  "productionLeadTime": {
    "@type": "pagefront:Duration",
    "minDays": 42,
    "maxDays": 56,
    "description": "6-8 weeks from order"
  },
  "cancellationPolicy": "Once placed, cannot be cancelled.",
  "returnsExceptions": [
    "Defects in manufacturing",
    "Item does not match description"
  ],
  "aftermarketServices": [
    {
      "@type": "pagefront:AftermarketService",
      "service": "free_resizing",
      "limit": "±2 EU sizes",
      "description": "Free post-purchase resizing offered."
    }
  ]
}
```

#### pagefront:certification

Most certifications fit Schema.org's `hasCertification` directly. The project's small extension is the `scope` PropertyValue, indicating whether the certification covers the yarn, the fabric, the finished product, the diamond, etc. Without scope, certifications are ambiguous (OEKO-TEX on yarn vs. OEKO-TEX on finished garment carry different meanings).

```json
"hasCertification": [
  {
    "@type": "Certification",
    "name": "OEKO-TEX",
    "issuedBy": { "@type": "Organization", "name": "OEKO-TEX Association" },
    "additionalProperty": [
      { "@type": "PropertyValue", "name": "scope", "value": "yarn" }
    ]
  }
]
```

#### pagefront:promotions

Promotional codes and discounts applicable to the offer. Each entry declares scope (`product`, `category`, or `site_wide`) so consumers can distinguish product-specific promotions from inherited site-level offers.

```json
"pagefront:promotions": [
  {
    "@type": "pagefront:Promotion",
    "code": "SPRING10",
    "discountPercentage": 10,
    "scope": "site_wide",
    "validUntil": "2026-05-31T23:59:59Z"
  }
]
```

## Why completeness is not in the artifact

A "completeness" or "agent-readiness" score is a useful object — but it does not belong inside the published artifact, and v0.4.1 removes it.

The score is **derivable**. Any consumer holding the rubric can compute the score from the `data` block in milliseconds. Shipping a precomputed score in the artifact is redundant. Worse, a shipped score can disagree with the recomputed one (intentionally or through implementation drift), undermining the trust the score is meant to carry.

The score is **self-reported**. A publisher computing a score about themselves and embedding it in their own artifact is a structural conflict of interest. Lighthouse scores work because Lighthouse computes them. The pagefront score works the same way: it should be produced by the validator, not by the artifact.

The score is **rubric-bound**, not artifact-bound. Section weights, missing-field arrays, and subtype-specific calibrations are functions of the rubric version, not the product. Versioning these alongside the artifact's `format_version` creates artifact churn for changes the artifact itself has nothing to do with.

The score is **a SaaS concern**, in the sense developed by `saas-architecture-notes.md`. The merchant dashboard surfaces "your score is 58; here is how to lift it" as a feature merchants want and use. The published artifact serves a different audience (agents, crawlers, AI consumers) that does not need the score embedded.

### Where the score lives instead

- **The validator.** Public tool that takes an artifact URL and emits a score, plus the missing-field breakdown. Implementations of the validator are bound to a specific rubric version; the artifact is not.
- **The merchant dashboard.** Shows the merchant their current score with edit affordances to lift it.
- **The public registry.** When listing compliant sites, can publish each site's score alongside the listing as registry-computed metadata.
- **Case studies and explainer documents.** Free to quote scores against specific artifacts; the score is then a property of the case study, not the artifact.

The rubric itself (sections, weights, what counts as present/absent in each) is documented separately from this spec — see `scoring-v0_4_1.md` (forthcoming) — and is referenced by the validator and registry. Pinning the rubric outside the artifact also lets the rubric evolve faster than the format does.

### Compatibility note

Artifacts produced under v0.4 that include a `completeness` block are not invalid under v0.4.1; the field is removed from the schema as a normative requirement, but consumers should ignore it where present rather than reject it. v0.5 may reintroduce a small opt-in `pagefront:scoringNotes` field (publisher-authored prose about why specific sections score low) if real demand surfaces, but never the score itself.

## Discovery (RFC 8288 / RFC 9727)

### What's required

Discovery uses HTTP `Link` response headers per RFC 8288 as the primary mechanism, with HTML `<link>` element fallback. Per-page artifact links use `rel="describedby"` (the artifact is a structured description of the resource, not a different rendering).

```
Link: <https://merchant.com/pagefront/products/widget-123.json>;
      rel="describedby";
      type="application/json";
      profile="https://themachineweb.org/pagefront/commerce/schemas/product/v0.4";
      title="Pagefront product artifact"
```

```html
<link rel="describedby"
      type="application/json"
      href="https://merchant.com/pagefront/products/widget-123.json"
      title="Pagefront product artifact">
```

Both forms together are the recommended belt-and-suspenders approach.

The `Link` header (or `<link>` element) is the **authoritative discovery mechanism**. The artifact URL itself can be any URL on the publisher's domain that the link points to. Consumers MUST NOT rely on path-shape conventions to locate artifacts; they MUST follow the link.

### Recommended URL convention

For ease of implementation and inspectability, the recommended URL pattern is:

```
https://{publisher-domain}/pagefront/{type}/{id}.json
```

Where:
- `{type}` is the resource type: `products` at v0.4; `articles`, `listings`, etc. in future versions.
- `{id}` is a stable identifier for the resource. Publishers may use a slug (e.g., `vahe-manches-longues-indigo`), a SKU, a UUID, or any other identifier they treat as durable. The spec does not constrain `{id}` shape.

This convention is recommended, not required. Conformance depends only on the `Link` mechanism. Publishers whose platforms make this path impractical (Shopify themes, certain CMS deployments) may serve the artifact from any path their `Link` header points to.

### Platform-specific implementation notes

Platforms differ in how easily they expose arbitrary paths to plugins or apps. Reference-implementation guidance (in pagefront's implementation docs, not in this spec):

- **Shopify:** Use the platform's app proxy mechanism. Artifacts may live under `/apps/pagefront/products/{handle}.json`. The `Link` header is the source of truth; the path follows Shopify's app conventions.
- **WordPress:** Custom REST endpoint such as `/wp-json/pagefront/v1/products/{id}.json`, or a static path served via plugin configuration.
- **Static-site generators (Hugo, Next.js, etc.):** Emit files at `/pagefront/{type}/{id}.json` during build. This matches the recommended convention directly.
- **Custom backends:** Use the recommended convention or any path that works with the application's routing.

### URL stability

Whether the artifact URL changes when the canonical URL changes is an open design question (see "Open design questions" below). Publishers using slug-based `{id}` values will see the artifact URL track the canonical URL; publishers using stable SKU- or UUID-based `{id}` values will preserve artifact URLs across canonical URL restructures. Both patterns are valid; consumers SHOULD discover artifacts via `Link` headers rather than caching artifact URLs across canonical URL changes.

## What changed from v0.3 in summary

| Area | v0.3 | v0.4 |
|---|---|---|
| Project codename / namespace | `transformer:` | `pagefront:` |
| Provenance block | Required, with rich per-field metadata | Removed |
| Production model | Implicitly third-party extraction | Explicitly first-party authoring as default |
| Image roles | Free-text `role` PropertyValue | Closed enumeration with formal definitions |
| Configurable products | Not modeled | `pagefront:configurator` extension |
| Made-to-order economics | Not modeled | `pagefront:madeToOrderTerms` extension |
| Material composition | `transformer:fabricComposition` (textile only) | `pagefront:materialComposition` (general); fabricComposition aliased |
| Gemstones | Stuffed into Certification.additionalProperty | `pagefront:gemstone` typed extension |
| Manufacturing chain | `transformer:manufacturingChain` (Apparel-implicit) | `pagefront:manufacturingChain`, generalized |
| Discovery | RFC 8288/9727 with `describedby`; URL pattern unspecified | Same mechanism + recommended `/pagefront/{type}/{id}.json` convention |
| Completeness scoring | Six sections including provenance considerations | Removed from envelope in v0.4.1 — computed by the validator, not embedded in the artifact |

## Open design questions carried forward

1. Extension namespace. Set to `pagefront:` for v0.4, resolving to `https://themachineweb.org/pagefront/vocabulary/`. Sub-paths within the vocabulary namespace (per-type URIs) remain to be defined as the spec stabilizes.
2. Multiple offers' `itemOffered` redundancy. Each offer carries `itemOffered` with sku/gtin even though it's the same product. Could be resolved with `@id` reference.
3. Completeness scoring weights. Section weights are placeholder values pending calibration against real merchant data across multiple categories. As of v0.4.1 this is a validator/rubric concern rather than a spec concern; tracked here only because the rubric still references the section structure documented under the project.
4. Schema.org version pinning cadence. Project needs documented update cadence (review with each Schema.org major release).

## New design questions in v0.4

5. **Configurator pricing formula.** v0.4 uses a descriptive string for the pricing formula. A structured DSL (JSON Logic, a small expression language, or formal arithmetic over named dimensions) would let consumers compute prices deterministically. Worth deferring until real consumer demand surfaces.
6. **Image role multiplicity.** v0.4 permits multiple roles per image. Open question: should the order of roles encode preference (first role is primary)? Or should roles be unordered and consumers pick based on context?
7. **`pagefront:configurator` vs `isVariantOf`.** When a dimension is both a configurator option and a sibling-URL variant (Kimaï's diamond_shape), the artifact must declare it in both places. Awkward but currently unavoidable.
8. **Certification scope vocabulary.** `scope` values are currently free-text (`yarn`, `fabric`, `diamond`, `finished_product`). Open question: should this be a closed enum, or remain free-text with conventions per category?
9. **AftermarketService taxonomy.** v0.4 defines the structure but not a vocabulary of services. `free_resizing`, `lifetime_warranty`, `repair_credit` are common; spec should probably document conventions without closing the set.
10. **Artifact URL stability across canonical URL changes.** The `{id}` segment in the recommended URL convention can be a slug (artifact URL tracks canonical URL) or a stable identifier like SKU/UUID (artifact URL decoupled from canonical URL). Both work; the spec doesn't pick. Consumers SHOULD rely on `Link` discovery rather than caching artifact URLs, but if a stable-ID convention emerges as best practice it could be elevated to a recommendation.

## What v0.4 deliberately does *not* address

These are deferred to later versions when concrete consumer needs justify the complexity:

- **Provenance and confidence metadata.** Removed in v0.4 entirely. May return as opt-in fields in v0.5+ if real consumers express specific needs.
- **Cryptographic signing of artifacts.** Out of scope for v0.4. The artifact's authority comes from being served on the publisher's domain; cryptographic verification is a future concern.
- **Cross-artifact dependencies.** v0.4 assumes each artifact is self-contained. Consumers needing to link across artifacts (e.g., a product referencing a brand artifact) can use URL references; structured cross-artifact relationships are a v1.0 concern.
- **Per-variant inventory and pricing structures finer-grained than `Offer`.** Schema.org's existing `Offer` is sufficient for v0.4; richer per-variant modeling deferred.

## Status

Draft sketch v0.4.1. Cleanup release: completeness block removed from the envelope to reflect a decision the project had already made in principle. No other normative changes from v0.4. The Nitto, Kimaï, and AFS Whitebird artifacts have been re-emitted in v0.4.1 form. The scoring rubric has been extracted to a separate document (`scoring-v0_4_1.md`, forthcoming) referenced by the validator and the public registry.
