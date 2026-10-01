# Product Page Schema — v0.5 Sketch

Status: draft / sketch, not yet a spec.
Format version: 0.5
Schema.org version targeted: 30.0 (2026-03-19)

## Changelog from v0.4.1

- **Vocabulary settled.** The published Sheet (the JSON-LD file the publisher serves at a stable URL on their own domain) is now formally named the **Pagefront Sheet** — capitalized as a proper noun for the format, lowercase `sheet` in generic running prose. The collective layer of all Sheets published across the web is the **Machine Web**. The specification document is the **Pagefront Spec**. Earlier drafts used "artifact" and "sidecar" interchangeably for what is now the Sheet; v0.5 settles on "Sheet" throughout.
- **Envelope field rename: `artifact_url` → `sheet_url`.** Reflects the settled vocabulary. **This is a breaking wire-format change.** v0.4.1 Sheets carrying `artifact_url` will not validate under v0.5; the published `product-v0_5.schema.json` (pending) treats `sheet_url` as the required field name. Consumers reading v0.4.1 Sheets in transition periods should accept either name; producers should emit only `sheet_url` from v0.5 onward.
- **Internationalization model defined.** Pagefront Sheets are language-scoped: one `inLanguage` per sheet, multi-currency handled inline via multiple `Offer` entries with `areaServed`. Cross-language navigation via `Link: rel="describedby"` with `hreflang` parameters. BCP 47 tags for all language identification. Detailed below under "Internationalization."
- **Sheet URL convention promoted from recommendation to normative pattern.** `/pagefront/{type}/{id}.{lang}.json` is the recommended URL shape. Discovery via `Link: rel="describedby"` remains authoritative. Details below under "Sheet URL convention."
- **Conditional identifier requirement.** The schema's identifier `anyOf` now branches on the root `@type`: `Product` requires one of `sku/gtin13/gtin/mpn/productID`; `ProductGroup` requires `productGroupID`. The v0.4.1 schema's unconditional rule misclassified ProductGroup sheets (surfaced by the AFS Whitebird Option B revision).
- **Configurator vs. ProductGroup guidance is now normative.** v0.4 surfaced this as an open question (#7). v0.5 resolves it: `pagefront:configurator` for combinatorial spaces (made-to-order, continuous dimensions, configurations that can't be enumerated as Offers); native `ProductGroup` + multiple `Offer` entries for discrete SKU families that ship from inventory.
- **`additionalProperty` is the documented escape hatch** for properties the vocabulary doesn't yet cover, restated for clarity. Closed enums (image roles, manufacturing stages) are not extensible through the sheet; extension goes through the standard's versioning process.

## Changelog from v0.4

- **Completeness block removed from the envelope.** The completeness score is not part of the published sheet. Scoring is a function of the validator and the SaaS dashboard, not the spec. Rationale below under "Why completeness is not in the sheet."
- No other normative changes from v0.4. v0.4.1 was a cleanup release that finished propagating a decision the project had already made in principle but had not propagated through the schema, the JSON Schema, or the case-study sheets.

## Changelog from v0.3

- **Project codename changed from `transformer` to `pagefront`.** The extension namespace prefix follows: v0.3's `transformer:` becomes v0.4's `pagefront:`. All typed extensions are renamed mechanically; semantics are unchanged from the v0.3 sketch.
- **Provenance block removed.** v0.3's per-field provenance metadata is no longer part of the spec. The sheet is the publisher's authoritative statement; provenance was solving a problem the format itself does not yet have.
- **Implicit production-model framing reset.** v0.3 implicitly assumed third-party extraction as the canonical production path; v0.4 assumes first-party authoring as the default. Extraction tooling remains a valid producer of sheets but no longer shapes the schema's defaults.
- **Image roles formalized as an enumeration.** The `role` PropertyValue on ImageObject is now defined with a closed initial set of values, surfaced in the rendering tests as a load-bearing signal.
- **`pagefront:configurator` introduced** as a first-class extension for products with multi-dimensional pricing/customization (jewelry, furniture, custom apparel).
- **`pagefront:madeToOrderTerms` introduced** consolidating production lead time, returns nuances, and aftermarket services for made-to-order products.
- **`pagefront:fabricComposition` generalized to `pagefront:materialComposition`.** The textile-only framing of v0.3 is replaced by a structure that handles any material with optional purity and provenance attributes. `pagefront:fabricComposition` remains as an alias for textile cases.
- **`pagefront:gemstone` introduced** for jewelry products requiring typed gemstone grading.
- **Discovery mechanism unchanged from v0.3** (RFC 8288/9727-based linking via `Link: rel="describedby"` headers, with HTML `<link>` fallback and `profile` parameter). v0.4 adds a **recommended URL convention** (`/pagefront/{type}/{id}.json`) for implementation guidance, while keeping the `Link` mechanism as the authoritative discovery path.

## Design principles

- **Schema.org is the data vocabulary.** The data block is valid Schema.org JSON-LD; consumers ignoring the project envelope still get a clean Schema.org document.
- **The sheet is the publisher's authoritative statement.** No confidence flags, no audit metadata, no per-field provenance in v0.4. The sheet's contents are what the publisher is willing to stand behind.
- **Sparse data, exhaustive documentation.** Properties present when they have values, absent otherwise.
- **Project extensions are explicit and minimal.** Vocabulary extensions live under a project namespace; the data block remains parseable as Schema.org by consumers that ignore the namespace.
- **First-party authoring is the assumed production model.** The publisher generates the sheet from their canonical product data. Extraction-from-HTML is a fallback path for sites that haven't adopted the format directly; it's a valid path but not the schema's design center.

## The envelope

Project-defined publication metadata wrapping the Schema.org payload.

```json
{
  "$schema": "https://themachineweb.org/pagefront/commerce/schemas/product/v0.5.json",
  "format_version": "0.4",
  "schema_org_version": "30.0",
  "canonical_url": "https://merchant.com/products/widget-123",
  "sheet_url": "https://merchant.com/pagefront/product/widget-123.json",
  "generated_at": "2026-05-10T14:32:00Z",
  "expires_at": "2026-05-10T15:32:00Z",
  "data": { ... }
}
```

Envelope fields are project-defined and required on every sheet.

`expires_at` indicates how long consumers should consider the sheet valid before re-fetching. For static catalogs this can be hours or days; for live pricing it should be minutes. Consumers must respect cache semantics.

## data — Schema.org JSON-LD

The data block is a valid Schema.org Product (or subtype) document with optional project extensions under the `pagefront:` namespace.

### Required and recommended core fields

Required:
- `@type`: `"Product"` (or `"ProductGroup"`, or a recognized subtype)
- `@id`: stable URL-shaped identifier
- `name`: product name as displayed to humans
- `url`: canonical URL of the human page
- `inLanguage`: BCP 47 language tag (`fr`, `fr-CA`, `en-GB`, etc.); the language of all prose fields in this sheet
- One identifier, conditional on `@type`:
  - For `Product` (and product subtypes): one of `sku`, `gtin13`, `gtin`, `mpn`, or `productID`.
  - For `ProductGroup`: `productGroupID`. Per-variant SKUs SHOULD also be declared on each entry in `hasVariant`.

Recommended:
- `brand`: typed Brand or Organization
- `description`: prose description in `inLanguage`
- `category`: hierarchical category string (e.g., "Apparel > Knitwear > Sweaters")
- `image`: array of ImageObject (see image roles below)
- `offers`: array of Offer (see offers section)
- `isVariantOf`: ProductGroup if the product belongs to a variant family
- `pagefront:availableLanguages`: array listing the URLs of language siblings, when the publisher publishes in multiple languages

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

The role enum is closed for v0.4. Additional values require a spec amendment. Publishers needing roles outside the enum can use unprefixed PropertyValues that consumers may ignore.

### Offers

Offer modeling unchanged from v0.3 in core shape: `price`, `priceCurrency`, `availability`, `itemCondition`, `seller`, `shippingDetails`, `hasMerchantReturnPolicy`, `eligibleRegion`, `acceptedPaymentMethod`.

For made-to-order products, see `pagefront:madeToOrderTerms` below.

For configurable products, see `pagefront:configurator` below.

For products with site-level promotions (Mother's Day codes, seasonal sales), the `pagefront:promotions` array on the offer carries promo entries with explicit `scope` (`product` / `category` / `site_wide`). Publishers may include or omit site-wide promotions at their discretion; the sheet's `expires_at` should match the promo window when included.

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

#### When to use pagefront:configurator vs. native ProductGroup + Offers

v0.4 left this as an open design question. v0.5 resolves it normatively:

- **Use `pagefront:configurator`** when the variant space is combinatorial — when listing every combination as a separate `Offer` would be impractical, or when at least one dimension is genuinely continuous (engraving text, custom dimensions, free-form options), or when the product is made-to-order from configured inputs rather than picked from inventory.

- **Use Schema.org's native `ProductGroup` + multiple `Offer`s** when the variants form a small enumerable set with distinct SKUs that ship from inventory.

Worked examples:

- **Kimaï Jackie Pear Half-Band:** configurator. Fourteen carat options × five sizes × two band styles = 140 configurations, made-to-order, no inventory. The configurator is the only tractable representation.
- **AFS Whitebird Mid Length:** native ProductGroup + three Offers. Three discrete sizes (5'8, 6'6, 6'8), three SKUs, three independent inventory positions. The Whitebird is picked off a shelf, not configured.
- **Nitto Vahé:** sibling-URL ProductGroup (one product page per colour) with size as an internal variant dimension. The colour variants are URL-distinct because Nitto chose that URL strategy; the size variants are internal to each sheet.

The validation linter (per the project's validation tooling) warns when both `pagefront:configurator` with priced dimensions and `offers[*].price` with explicit per-variant prices are declared in the same sheet — that's a structural signal that one of them is being misused. Publishers can override the warning when they genuinely need both (a rare case — see the cross-reference paragraph above), but the default expectation is that the choice between the two is exclusive.

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

## Why completeness is not in the sheet

A "completeness" or "agent-readiness" score is a useful object — but it does not belong inside the published sheet, and v0.4.1 removes it.

The score is **derivable**. Any consumer holding the rubric can compute the score from the `data` block in milliseconds. Shipping a precomputed score in the sheet is redundant. Worse, a shipped score can disagree with the recomputed one (intentionally or through implementation drift), undermining the trust the score is meant to carry.

The score is **self-reported**. A publisher computing a score about themselves and embedding it in their own sheet is a structural conflict of interest. Lighthouse scores work because Lighthouse computes them. The pagefront score works the same way: it should be produced by the validator, not by the sheet.

The score is **rubric-bound**, not sheet-bound. Section weights, missing-field arrays, and subtype-specific calibrations are functions of the rubric version, not the product. Versioning these alongside the sheet's `format_version` creates sheet churn for changes the sheet itself has nothing to do with.

The score is **a SaaS concern**, in the sense developed by `saas-architecture-notes.md`. The merchant dashboard surfaces "your score is 58; here is how to lift it" as a feature merchants want and use. The published sheet serves a different audience (agents, crawlers, AI consumers) that does not need the score embedded.

### Where the score lives instead

- **The validator.** Public tool that takes a Sheet URL and emits a score, plus the missing-field breakdown. Implementations of the validator are bound to a specific rubric version; the sheet is not.
- **The merchant dashboard.** Shows the merchant their current score with edit affordances to lift it.
- **The public registry.** When listing compliant sites, can publish each site's score alongside the listing as registry-computed metadata.
- **Case studies and explainer documents.** Free to quote scores against specific sheets; the score is then a property of the case study, not the sheet.

The rubric itself (sections, weights, what counts as present/absent in each) is documented separately from this spec — see `scoring-v0_4_1.md` (forthcoming) — and is referenced by the validator and registry. Pinning the rubric outside the sheet also lets the rubric evolve faster than the format does.

### Compatibility note

Sheets produced under v0.4 that include a `completeness` block are not invalid under v0.4.1; the field is removed from the schema as a normative requirement, but consumers should ignore it where present rather than reject it. v0.5 may reintroduce a small opt-in `pagefront:scoringNotes` field (publisher-authored prose about why specific sections score low) if real demand surfaces, but never the score itself.

## Internationalization

A Pagefront Sheet is **language-scoped**: a single `inLanguage` declaration governs all human-readable text in the data block. Multi-currency and multi-region offerings are handled inside the sheet via multiple `Offer` entries with `areaServed` and `priceCurrency` set per offer. Cross-language navigation is handled outside the sheet, via the `Link` header's `hreflang` parameter (per RFC 8288).

This is the shape the existing case study sheets already conform to — they all declare `inLanguage` at the data-block level and would extend cleanly to multi-language publication. v0.5 documents the pattern rather than introducing new structure.

### The five axes of i18n, separated

Under the umbrella of "internationalization" five distinct concerns travel that the spec needs to address separately:

1. **Language of human-readable text.** `name`, `description`, image captions, free-text fields. Varies by Sheet.
2. **Currency.** Price, shipping fees, return policy costs. Varies by `Offer` inside a Sheet.
3. **Availability region.** Whether the product ships to a given country. Varies by `Offer` via `areaServed`.
4. **Regulatory and certification context.** OEKO-TEX, CE, UL, FCC — recognition differs by region. Varies by `Offer` and by `hasCertification` declarations.
5. **Cultural fit / market positioning.** Sizing conventions, measurement units, marketing copy. Varies with the language variant.

These don't all move together. A French manufacturer selling worldwide in EUR has axes 1, 3, and 4 to vary; axis 2 doesn't. A US merchant with EU and UK distribution has all five varying. The mechanism the spec defines handles each axis at the appropriate level.

### Multi-language: one sheet per language variant

Each language variant is its own sheet, served at its own URL, declared with its own `inLanguage`. The data block within each sheet is normal Schema.org JSON-LD with a single language; consumers parse it without special handling.

For a product available in French and English:
- `/pagefront/product/whitebird-mid-length.fr.json` — `inLanguage: "fr"`
- `/pagefront/product/whitebird-mid-length.en.json` — `inLanguage: "en"`

The canonical page's HTTP response carries `Link` headers listing both, with `hreflang` parameters:

```
Link: </pagefront/product/whitebird-mid-length.fr.json>; rel="describedby"; hreflang="fr"; type="application/ld+json",
      </pagefront/product/whitebird-mid-length.en.json>; rel="describedby"; hreflang="en"; type="application/ld+json"
```

A consumer requesting `Accept-Language: fr` reads the French sheet; one requesting `Accept-Language: en` reads the English one. Cross-sheet consistency (do the French and English versions say semantically the same thing?) is the publisher's responsibility, not the spec's.

### Multi-currency: one sheet, multiple Offers

Within a single language-scoped sheet, regional currency variation is handled by multiple `Offer` entries. The English-language sheet for a product available in UK, US, and Australia carries three offers:

```json
"offers": [
  { "@type": "Offer", "price": "1299.00", "priceCurrency": "GBP", "areaServed": "GB", ... },
  { "@type": "Offer", "price": "1599.00", "priceCurrency": "USD", "areaServed": "US", ... },
  { "@type": "Offer", "price": "2399.00", "priceCurrency": "AUD", "areaServed": "AU", ... }
]
```

Schema.org's `areaServed` and `eligibleRegion` / `ineligibleRegion` are the primary mechanisms; pagefront does not introduce additional region-scoping fields. Per-region return policies (`hasMerchantReturnPolicy` per offer) and per-region shipping details (`shippingDetails` per offer) follow the same pattern.

This means: the multi-language case requires multiple sheets (and N publications to maintain), but the multi-region case within one language is handled inside a single sheet (one publication). The cost falls where it belongs — on the publisher who genuinely has multiple languages, not on every multi-region publisher.

### Language granularity: BCP 47 and the publisher's choice

Language identification uses BCP 47 tags throughout. `inLanguage` accepts any valid BCP 47 tag; `Link: hreflang=` parameters accept the same. The publisher decides the granularity of the distinctions they publish at:

- `fr` — generic French, no regional commitment.
- `fr-FR` — French as used in France specifically.
- `fr-CA` — Canadian French (Quebec usage: *courriel*, *magasiner*, etc.).
- `fr-BE` — Belgian French (*septante*, *nonante*).
- `fr-CH` — Swiss French (similar to Belgian on numerals).

For most products the language-level granularity (`fr`, `en`) is sufficient. For luxury, regulated, or formal-register content where regional differences in wording materially affect the merchant's positioning, region-language granularity (`fr-CA`, `fr-FR`) is correct. The spec doesn't pick the granularity; it just propagates whatever the publisher publishes via `inLanguage` and `hreflang`.

### Fallback resolution

When a consumer requests `Accept-Language: fr-CA` and the publisher published only `fr-FR` and `fr`, the consumer SHOULD fall back along the BCP 47 language-family chain: try `fr-CA` (no match), then `fr` (match if published), then the next language in their preference list. This matches HTML hreflang convention and what browsers already do.

Publishers MAY publish an unregioned variant (`fr`) as an explicit "any French speaker, no regional commitment" default, in addition to or instead of region-specific variants. This is the recommended pattern for publishers who don't have separate regional content but want to declare their language coverage clearly.

The spec is silent on what consumers should do when no language preference matches at all. Reasonable defaults exist (pick the first sheet listed in the `Link` header, or whichever is declared as the publisher's canonical) but specifying this is out of scope for v0.5.

### Cross-sheet navigation (optional)

Publishers MAY include a `pagefront:availableLanguages` field listing the URLs of their language variants, so a consumer that lands on one sheet can find its siblings without re-fetching the canonical page:

```json
"pagefront:availableLanguages": [
  { "lang": "fr", "url": "https://afs-foiling.com/pagefront/product/whitebird-mid-length.fr.json" },
  { "lang": "en", "url": "https://afs-foiling.com/pagefront/product/whitebird-mid-length.en.json" }
]
```

This is convenience metadata, not the discovery mechanism. The authoritative discovery path remains the canonical page's `Link` headers; `pagefront:availableLanguages` is a publisher-elected shortcut.

### What this doesn't solve

Worth being upfront about the limits:

- **Translation quality.** The spec doesn't enforce that French and English variants say semantically the same thing. Publishers who publish multiple languages own the consistency problem.
- **Currency conversion freshness.** A publisher with three currency offers in one sheet has three sets of prices to keep current. The `expires_at` field on the envelope can encode shorter expiry windows for multi-currency sheets; the spec recommends but does not enforce.
- **Region-specific certification fields.** EU certifications (CE, OEKO-TEX) and US certifications (UL, FCC) have different shapes and recognition rules. v0.5 stays category-agnostic; if real cases surface, typed certification extensions can be added in v0.6+.
- **The "mostly-same text with a few region-specific phrases" case.** A publisher who only differs between `fr-FR` and `fr-BE` by a handful of words still has to publish two full sheets under this model. The translation-quality cost is high relative to the actual content difference. The spec can't fix this; the publisher decides whether the regional distinction is worth the operational cost.

## Sheet URL convention

The recommended URL shape for product sheets:

```
/pagefront/product/{id}.{lang}.json
```

Examples:
- `/pagefront/product/whitebird-mid-length.fr.json`
- `/pagefront/product/whitebird-mid-length.en.json`
- `/pagefront/product/jackie-pear-half-band.fr.json`

For single-language publishers, the `{lang}` segment MAY be omitted:

```
/pagefront/product/{id}.json
```

In this case, the sheet's `inLanguage` field declares the actual language, and the publisher SHOULD include `hreflang` in the canonical page's `Link` header so consumers know what language to expect.

### URL convention is recommended, not normative

Discovery via the canonical page's `Link: rel="describedby"` header is the authoritative path. A publisher who serves sheets at `/api/sheet/{id}` is equally conformant as long as the `Link` header points there. The recommended URL shape exists to reduce setup friction, support sitemap-based crawlers, and give consumers a fallback heuristic when `Link` headers aren't yet honored — not to constrain publisher choice.

That said, **publishers SHOULD use the recommended convention when there isn't a compelling reason to diverge.** A predictable URL shape reduces the chance of misconfiguration, lets crawlers operate without requiring `Link` header parsing, and makes URLs human-readable for debugging.

### The `{type}` vocabulary

For commerce sheets, the `{type}` segment uses lowercase singular nouns matching the resource type. The Sheet URL identifies a single resource, not a collection — `/pagefront/product/{id}` reads as "the product `{id}`" the same way `/pagefront/brand/{id}` reads as "the brand `{id}`."

- `product` — individual product pages.
- `brand` — brand-level pages with manufacturer info, certifications, governance.
- `category` — category landing pages (defined but not yet specified in detail).
- `collection` — curated product groupings (defined but not yet specified in detail).

The vocabulary aligns with Schema.org's own type names (`Product`, `Brand`, etc., all singular). The vocabulary is extensible through the standard's process. Non-commerce resource types (events, real estate, recipes) will define their own `{type}` values when those scopes are added.

### The `{id}` shape

The `{id}` segment is URL-safe and stable. The publisher chooses the format:

- A slug derived from the product name: `whitebird-mid-length`, `jackie-pear-half-band`.
- A numeric internal ID: `438201`.
- A SKU or model number: `WB-ML-58`.
- A UUID for high-cardinality catalogs.

What matters is **stability for the life of the resource**. The Sheet URL should survive product renames, recategorizations, and parent-page URL migrations. When a product is genuinely retired and replaced, that's a new product and a new Sheet URL; when a product is renamed, the Sheet URL should stay the same (with the `name` field updated to reflect the rename).

Slug-derived IDs are convenient but fragile: renaming a product would change its slug and break the URL's stability. Publishers using slug-derived IDs SHOULD either (a) freeze the slug at first publication and not update it on rename, or (b) maintain HTTP 301 redirects from old sheet URLs to new ones, just as they would for HTML page URL migrations.

### Index files (deferred)

Whether publishers should expose `/pagefront/product/index.json` (or `index.{lang}.json`) as a catalog enumeration mechanism is an open question. Crawlers benefit from index files (no need to traverse sitemaps); merchants benefit from less of them (one more thing to keep current). v0.5 leaves index files unspecified; v0.6 may revisit if real consumer use cases surface.

### Stability summary

For each level of the URL, the stability commitment is:

- **`/pagefront/` prefix** — fixed by convention.
- **`{type}` segment** — fixed by the standard's vocabulary; new types added through the versioning process.
- **`{id}` segment** — stable for the life of the resource. Publisher chooses the format; publisher commits to stability.
- **`{lang}` segment** — stable for the life of the language variant. Adding a new language adds a new file; removing a language is a publication event the publisher SHOULD handle with 410 Gone or a redirect to the closest remaining variant.
- **`.json` extension** — fixed. Future formats (e.g. CBOR for binary efficiency) would use distinct extensions and be announced through separate `Link` entries.

## Discovery (RFC 8288 / RFC 9727)

### What's required

Discovery uses HTTP `Link` response headers per RFC 8288 as the primary mechanism, with HTML `<link>` element fallback. Per-page sheet links use `rel="describedby"` (the sheet is a structured description of the resource, not a different rendering).

```
Link: <https://merchant.com/pagefront/product/widget-123.json>;
      rel="describedby";
      type="application/json";
      profile="https://themachineweb.org/pagefront/commerce/schemas/product/v0.5";
      title="Pagefront product sheet"
```

```html
<link rel="describedby"
      type="application/json"
      href="https://merchant.com/pagefront/product/widget-123.json"
      title="Pagefront product sheet">
```

Both forms together are the recommended belt-and-suspenders approach.

The `Link` header (or `<link>` element) is the **authoritative discovery mechanism**. The Sheet URL itself can be any URL on the publisher's domain that the link points to. Consumers MUST NOT rely on path-shape conventions to locate sheets; they MUST follow the link.

### Recommended URL convention

See the dedicated **Sheet URL convention** section above. Discovery via the `Link` header remains authoritative; the URL convention is a recommendation for predictability.

### Platform-specific implementation notes

Platforms differ in how easily they expose arbitrary paths to plugins or apps. Reference-implementation guidance (kept in Pagefront's implementation docs, not in this spec):

- **Shopify:** Use the platform's app proxy mechanism. Sheets may live under `/apps/pagefront/product/{handle}.{lang}.json`. The `Link` header is the source of truth; the path follows Shopify's app conventions.
- **WordPress:** Custom REST endpoint such as `/wp-json/pagefront/v1/product/{id}.{lang}.json`, or a static path served via plugin configuration.
- **Static-site generators (Hugo, Next.js, etc.):** Emit files at `/pagefront/{type}/{id}.{lang}.json` during build. This matches the recommended convention directly.
- **Custom backends:** Use the recommended convention or any path the application's routing supports, with `Link` headers wired up correctly.

## What changed from v0.3 in summary

| Area | v0.3 | v0.4 | v0.5 |
|---|---|---|---|
| Project codename / namespace | `transformer:` | `pagefront:` | unchanged |
| Provenance block | Required, with rich per-field metadata | Removed | unchanged |
| Production model | Implicitly third-party extraction | Explicitly first-party authoring as default | unchanged |
| Image roles | Free-text `role` PropertyValue | Closed enumeration with formal definitions | unchanged |
| Configurable products | Not modeled | `pagefront:configurator` extension | unchanged; normative guidance on configurator vs ProductGroup |
| Made-to-order economics | Not modeled | `pagefront:madeToOrderTerms` extension | unchanged |
| Material composition | `transformer:fabricComposition` (textile only) | `pagefront:materialComposition` (general); fabricComposition aliased | unchanged |
| Gemstones | Stuffed into Certification.additionalProperty | `pagefront:gemstone` typed extension | unchanged |
| Manufacturing chain | `transformer:manufacturingChain` (Apparel-implicit) | `pagefront:manufacturingChain`, generalized | unchanged |
| Discovery | RFC 8288/9727 with `describedby`; URL pattern unspecified | Same mechanism + recommended `/pagefront/{type}/{id}.json` convention | Adds `{lang}` segment; singular `{type}` vocabulary specified (`product`, `brand`, `category`, `collection`) |
| Completeness scoring | Six sections including provenance considerations | Six sections, no provenance weighting | Removed from envelope in v0.4.1 — computed by the validator, not embedded |
| Internationalization | Not addressed | `inLanguage` declared but multi-language unspecified | Normative i18n model: one sheet per language; multi-currency via multiple Offers; BCP 47 throughout; `hreflang` discovery |
| Identifier requirement | Single anyOf list (sku/gtin13/mpn/productID) | unchanged | Conditional on `@type`: `productGroupID` for ProductGroup; per-type rule explicit |
| `pagefront:availableLanguages` | — | — | New optional field listing language sibling URLs |

## Open design questions carried forward

1. Extension namespace. Set to `pagefront:` for v0.4, resolving to `https://themachineweb.org/pagefront/vocabulary/`. Sub-paths within the vocabulary namespace (per-type URIs) remain to be defined as the spec stabilizes.
2. Multiple offers' `itemOffered` redundancy. Each offer carries `itemOffered` with sku/gtin even though it's the same product. Could be resolved with `@id` reference. (Partially addressed in v0.5: the AFS revision demonstrates `itemOffered: { "@id": "..." }` referencing variants in `hasVariant`. The pattern works; whether to elevate to normative recommendation in v0.6 is open.)
3. Completeness scoring weights. Section weights are placeholder values pending calibration against real merchant data across multiple categories. A validator/rubric concern, not a spec concern; tracked here only because the rubric references the section structure documented under the project.
4. Schema.org version pinning cadence. Project needs documented update cadence (review with each Schema.org major release).

## Open design questions surfaced in v0.4

5. **Configurator pricing formula.** v0.4 uses a descriptive string for the pricing formula. A structured DSL (JSON Logic, a small expression language, or formal arithmetic over named dimensions) would let consumers compute prices deterministically. Worth deferring until real consumer demand surfaces.
6. **Image role multiplicity.** v0.4 permits multiple roles per image. Open question: should the order of roles encode preference (first role is primary)? Or should roles be unordered and consumers pick based on context?
7. ~~**`pagefront:configurator` vs `isVariantOf`.**~~ **Resolved in v0.5.** Configurator for combinatorial spaces; native ProductGroup + Offers for discrete SKU families. Normative guidance documented above; linter warns on the cross-reference case where both are populated.
8. **Certification scope vocabulary.** `scope` values are currently free-text (`yarn`, `fabric`, `diamond`, `finished_product`). Open question: should this be a closed enum, or remain free-text with conventions per category?
9. **AftermarketService taxonomy.** v0.4 defines the structure but not a vocabulary of services. `free_resizing`, `lifetime_warranty`, `repair_credit` are common; spec should probably document conventions without closing the set.
10. ~~**Sheet URL stability across canonical URL changes.**~~ **Resolved in v0.5.** The `{id}` segment is stable for the life of the resource; publishers choose between slugs (which they freeze at first publication or 301-redirect on rename) and stable identifiers (SKU, UUID). Consumers SHOULD rely on `Link` discovery rather than caching sheet URLs.

## New design questions surfaced in v0.5

11. **Index files and catalog enumeration.** Should publishers expose `/pagefront/product/index.{lang}.json` for crawlers to enumerate catalogs without sitemap traversal? Deferred to v0.6 pending real consumer use cases.
12. **Fallback resolution semantics.** v0.5 recommends BCP 47 language-family fallback (`fr-CA` → `fr`) for consumers, matching HTML hreflang convention. Open question: what should consumers do when no language preference matches at all? Pick the first sheet in the `Link` header? Use a publisher-declared default? Out of scope for v0.5; revisit if multi-language adoption surfaces ambiguity.
13. **Region-scoped certifications.** EU certifications (CE, OEKO-TEX) and US certifications (UL, FCC) have different shapes and recognition rules. v0.5 stays category-agnostic; v0.6+ may add typed certification extensions if real cases surface.
14. **Translation consistency.** The spec doesn't enforce that French and English language variants say semantically the same thing. Whether to add a `pagefront:translatedFrom` field declaring source-language relationships is an open question. Probably out of scope for the standard (this is a publisher discipline problem, not a format problem) but worth tracking.
15. **Currency-conversion freshness signaling.** A publisher with multiple currencies in one sheet has multiple price sets to keep current. Whether to add a per-Offer `priceLastVerified` field is open. The `expires_at` envelope field encodes sheet-level freshness; per-offer freshness is finer-grained but more complex.

## What v0.5 deliberately does *not* address

These are deferred to later versions when concrete consumer needs justify the complexity:

- **Provenance and confidence metadata.** Removed in v0.4 entirely. May return as opt-in fields in v0.6+ if real consumers express specific needs.
- **Cryptographic signing of sheets.** Out of scope. The sheet's authority comes from being served on the publisher's domain; cryptographic verification is a future concern.
- **Cross-sheet dependencies.** Each sheet is self-contained. Consumers needing to link across sheets (e.g., a product referencing a brand sheet) can use URL references; structured cross-sheet relationships are a v1.0 concern.
- **Per-variant inventory and pricing structures finer-grained than `Offer`.** Schema.org's existing `Offer` is sufficient; richer per-variant modeling deferred.
- **Index files for catalog enumeration.** Tracked as open question #11; not in v0.5.
- **Bundle products.** Multiple products sold together with a single price. Conceptually adjacent to configurators but distinct in shape. Deferred.

## Status

Draft sketch v0.5. Adds the internationalization model, formalizes the Sheet URL convention, makes the identifier requirement conditional on `@type`, and resolves two v0.4 open design questions (configurator vs ProductGroup, URL stability). No breaking changes vs v0.4.1 — v0.4.1 sheets remain valid under v0.5, with the new fields treated as optional additions.

Pending work to fully land v0.5:

1. **JSON Schema update** — extend `product-v0_4_1.schema.json` to `product-v0_5.schema.json` with the conditional `@type` identifier rule and `pagefront:availableLanguages` field.
2. **AFS Whitebird as bilingual worked example** — produce French and English variants of the existing Whitebird sheet, with `Link` headers and `pagefront:availableLanguages` cross-references demonstrated. AFS is a French company with English-language site presence, which makes it the cleanest case study target.
3. **Linter rule for configurator/Offer disagreement** — add to the validation tooling per the configurator-vs-ProductGroup resolution.
4. **Scoring rubric document** (`scoring-v0_5.md`) — referenced by the schema sketch and case studies but not yet written; carries forward from the v0.4.1 rubric structure.
