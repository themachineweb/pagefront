# Product Page Schema — v0.6 Sketch

Status: draft / sketch, not yet a spec.
Format version: 0.6
Schema.org version targeted: 30.0 (2026-03-19)

## Changelog from v0.5

- **Video support added.** Pagefront Sheets may now carry a top-level `video` array of `VideoObject` entries, sibling to `image`. A closed enumeration of video roles is defined (`overview`, `tutorial`, `lifestyle`, `construction`, `demonstration`, `comparison`, `unboxing`, `spin`). Both self-hosted (`contentUrl`) and embedded (`embedUrl`) videos are supported. Detailed below under "Video roles."
- **Accessibility recommendation for video.** Publishers SHOULD include `caption` or `transcript` on every `VideoObject`. This is a recommendation, not a requirement; the validator's linter (W-012) warns when accessibility metadata is absent, particularly on `overview` and `tutorial` roles where consumer comprehension matters most.
- **`itemOffered` `@id` reference pattern is now recommended.** In multi-Offer sheets (typically `ProductGroup` with `hasVariant`), each `Offer` SHOULD reference its target variant via `itemOffered: { "@id": "..." }` rather than duplicating the variant's identifiers inline. Resolves open question #2; the AFS Whitebird v0.5 revision demonstrated the pattern works.
- **Video is language-scoped.** Following the v0.5 internationalization model, the `video` array's contents are language-specific to the sheet's `inLanguage`. A French-language sheet carries French-language videos; an English-language sheet carries English-language videos. The same underlying video file MAY appear in multiple language sheets when its content is language-agnostic (instrumental demonstration, silent construction footage, etc.).
- **HTTP and HTTPS Schema.org URIs are both accepted.** Sheets carrying `http://schema.org/InStock` or `http://schema.org/NewCondition` are valid under v0.6, matching how every major Schema.org consumer (Google Rich Results, schema.org's own validator) treats the two scheme variants as semantically equivalent. The validator's linter (rule W-013) warns publishers still emitting HTTP URIs and recommends migrating to HTTPS as the canonical form. This relaxes the v0.5 regex, which over-constrained valid input.

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

Unchanged from v0.5. Pagefront defines the structure of the published Sheet; what's inside the Sheet is the publisher's authoritative statement. The Sheet is JSON-LD, served at a stable URL on the publisher's domain, discoverable via `Link: rel="describedby"`. Schema.org is the data vocabulary; `pagefront:` extensions cover what Schema.org under-specifies for commerce. The format prioritizes Schema.org compatibility — consumers ignoring `pagefront:` extensions parse the Sheet as clean Schema.org JSON-LD.

## The envelope

Unchanged from v0.5.

```json
{
  "$schema": "https://themachineweb.org/pagefront/commerce/schemas/product/v0.6.json",
  "format_version": "0.6",
  "schema_org_version": "30.0",
  "canonical_url": "https://merchant.com/product/widget-123",
  "sheet_url": "https://merchant.com/pagefront/product/widget-123.json",
  "generated_at": "2026-05-10T14:32:00Z",
  "expires_at": "2026-05-10T15:32:00Z",
  "data": { ... }
}
```

Envelope fields are project-defined and required on every sheet.

`expires_at` indicates how long consumers should consider the sheet valid before re-fetching. Sheets carrying multi-currency `offers` or scheduled promotions SHOULD use shorter `expires_at` windows to reflect price volatility.

## data — Schema.org JSON-LD

The data block is a valid Schema.org Product (or `ProductGroup`, or a recognized subtype) document with optional project extensions under the `pagefront:` namespace.

### Required and recommended core fields

Required:
- `@type`: `"Product"` (or `"ProductGroup"`, or a recognized subtype)
- `@id`: stable URL-shaped identifier
- `name`: product name as displayed to humans
- `url`: canonical URL of the human page
- `inLanguage`: BCP 47 language tag (`fr`, `fr-CA`, `en-GB`, etc.); the language of all prose fields and language-scoped media in this sheet
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

The role enum is closed. Additional values require a spec amendment. Publishers needing roles outside the enum can use unprefixed PropertyValues that consumers may ignore.

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

The `@id` reference must resolve to an entry in `hasVariant` or to the root product `@id`. The validator's linter (rule W-003) warns on broken `@id` references.

For single-Offer sheets where the `itemOffered` is unambiguously the root product, the `itemOffered` field MAY be omitted; Schema.org consumers will infer it from the Offer's position on the Product.

For made-to-order products, see `pagefront:madeToOrderTerms` below.

For configurable products, see `pagefront:configurator` below.

For site-level promotions, see `pagefront:promotions` on each Offer.

### Project extensions (pagefront: namespace)

Unchanged from v0.5. The full set:

- `pagefront:sizeChart` — structured size charts for apparel
- `pagefront:materialComposition` — decomposed materials with optional purity, provenance, weight
- `pagefront:manufacturingChain` — multi-stage manufacturing provenance
- `pagefront:construction` — construction notes (composite, knitwear, jewelry, etc.)
- `pagefront:configurator` — combinatorial product configuration spaces
- `pagefront:madeToOrderTerms` — economics for made-to-order products
- `pagefront:gemstone` — typed gemstone descriptions with grading
- `pagefront:promotions` — site-level promotional codes scoped to product / category / site_wide
- `pagefront:availableLanguages` — cross-language navigation hints

Definitions are unchanged from v0.5; see the vocabulary document for full field specifications.

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

| Area | v0.3 | v0.4 | v0.5 | v0.6 |
|---|---|---|---|---|
| Project codename / namespace | `transformer:` | `pagefront:` | unchanged | unchanged |
| Provenance block | Required, with rich per-field metadata | Removed | unchanged | unchanged |
| Production model | Implicitly third-party extraction | Explicitly first-party authoring as default | unchanged | unchanged |
| Image roles | Free-text `role` PropertyValue | Closed enumeration with formal definitions | unchanged | unchanged |
| Video | Not supported | Not supported | Not supported | Closed enumeration of video roles; `VideoObject` array sibling to `image` |
| Accessibility metadata on media | Not specified | Optional `caption` on images | unchanged | Recommended `caption`/`transcript` on videos; linter warns for `overview`/`tutorial` without |
| Configurable products | Not modeled | `pagefront:configurator` | normative configurator-vs-ProductGroup guidance | unchanged |
| Made-to-order economics | Not modeled | `pagefront:madeToOrderTerms` | unchanged | unchanged |
| Material composition | `transformer:fabricComposition` (textile only) | `pagefront:materialComposition` (general) | unchanged | unchanged |
| Gemstones | Stuffed into Certification.additionalProperty | `pagefront:gemstone` typed extension | unchanged | unchanged |
| Manufacturing chain | `transformer:manufacturingChain` (Apparel-implicit) | `pagefront:manufacturingChain`, generalized | unchanged | unchanged |
| Discovery | RFC 8288/9727 with `describedby` | + recommended `/pagefront/{type}/{id}.json` convention | + `{lang}` segment; singular `{type}` vocabulary | unchanged |
| Completeness scoring | Six sections including provenance considerations | Six sections, no provenance weighting | Removed from envelope in v0.4.1 | unchanged |
| Internationalization | Not addressed | `inLanguage` declared but multi-language unspecified | Normative i18n model | + video is language-scoped per the same model |
| Identifier requirement | Single anyOf list | unchanged | Conditional on `@type` | unchanged |
| `itemOffered` redundancy | Open question | Open question | Demonstrated pattern in AFS revision | Normative recommendation: use `@id` reference |
| Sheet field name | `artifact_url` | unchanged | renamed to `sheet_url` (breaking) | unchanged |

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

11. **Index files and catalog enumeration.** Should publishers expose `/pagefront/product/index.{lang}.json` for crawlers? Deferred to v0.7 pending real consumer use cases.
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

## What v0.6 deliberately does *not* address

These are deferred to later versions when concrete consumer needs justify the complexity:

- **Provenance and confidence metadata.** Removed in v0.4 entirely.
- **Cryptographic signing of sheets.** Out of scope. The sheet's authority comes from being served on the publisher's domain.
- **Cross-sheet dependencies.** Each sheet is self-contained.
- **Per-variant inventory and pricing structures finer-grained than `Offer`.**
- **Index files for catalog enumeration.** Tracked as open question #11.
- **Bundle products.**
- **Live streams and scheduled broadcasts.** Out of scope for video.
- **User-generated review videos and photos.** Tracked as open question #18.
- **Audio-only media** (podcasts, audio descriptions of products). Schema.org has `AudioObject`. v0.6 stays focused on image and video; audio added if real use cases surface.

## Status

Draft sketch v0.6. Adds video support (closed role enumeration, accessibility recommendation, language-scoping), recommends the `itemOffered` `@id` pattern resolved in the v0.5 AFS revision, and tightens internationalization to cover video. No breaking changes vs v0.5 — v0.5 sheets remain valid under v0.6, with `video` treated as an optional addition.

Pending work to fully land v0.6:

1. **JSON Schema update** — extend `product-v0_5.schema.json` to `product-v0_6.schema.json` with the new `video` array, VideoObject shape, and role enumeration.
2. **Vocabulary doc entry for video roles** — formal definitions in `vocabulary.md`.
3. **AFS Whitebird as video worked example** — AFS publishes product videos on `afs-foiling.com`; updating the Whitebird sheet to include overview, demonstration, and construction videos demonstrates v0.6 cleanly.
4. **Linter rule W-012** — warn on `overview` or `tutorial` videos lacking `caption` and `transcript`.
5. **Scoring rubric update** — add a media-completeness signal that considers video presence and accessibility metadata.
