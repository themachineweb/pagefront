# Pagefront Product Sheet

Status: normative spec.
Product Sheet spec version: 0.10.0
Commerce release: 0.4.0
Schema.org version targeted: 30.0 (2026-03-19)

**Versioning.** This sheet spec has its own semver, 0.10.0, and is a member of commerce release 0.4.0. A sheet declares the release in its envelope (`release`) and names this spec version in `$schema`. Before 1.0 a breaking or an additive change bumps the minor and a fix or clarification bumps the patch; the release bumps with its members. The scheme, the release table and the legacy draft line (sheets carrying `format_version`) are in [`releases.md`](releases.md). The "v0.7", "v0.9" and similar version names throughout this document are legacy format versions, kept as history.

## Design principles

Unchanged from v0.6. Pagefront defines the structure of the published Sheet; what's inside the Sheet is the publisher's authoritative statement. The Sheet is JSON-LD, served at a stable URL on the publisher's domain, discoverable via `Link: rel="describedby"`. Schema.org is the data vocabulary; `pagefront:` extensions cover what Schema.org under-specifies for commerce. The format prioritizes Schema.org compatibility: consumers ignoring `pagefront:` extensions parse the Sheet as clean Schema.org JSON-LD.

### What the schema validates

The JSON Schema validates the envelope and `pagefront:`-prefixed extensions strictly. Schema.org-typed content within the data block is permitted by reference and validated upstream by Schema.org-aware consumers. Producers extend the Sheet with Schema.org properties Pagefront doesn't explicitly model; the schema's `additionalProperties: true` policy on Schema.org-typed blocks lets these through without constraint.

Schema.org is large, well-specified upstream, and evolving. Pagefront re-validating Schema.org content would mean duplicating Schema.org's own work, choosing which subset of Schema.org to constrain (every choice excludes valid Schema.org), and maintaining the duplication forever as Schema.org evolves. Pagefront's job is to define the envelope and its typed extensions; Schema.org's job is to define the content vocabulary; consumers compose the two.

Pagefront-recommended patterns built on Schema.org vocabulary (sale pricing via `PriceSpecification`, quantity-tier pricing via `eligibleQuantity`, video accessibility via `caption`/`transcript`, etc.) therefore require no schema changes when they are added or refined. The spec documents the patterns; the schema permits them; consumers interpret them. Schema changes are reserved for envelope fields and `pagefront:`-prefixed extension types.

### When to extend Schema.org with `pagefront:` vocabulary

Pagefront extends Schema.org with `pagefront:`-prefixed vocabulary only when one of three conditions holds:

1. **Schema.org gap.** Schema.org lacks vocabulary for the concept being modeled. Examples in v0.7: `pagefront:Configurator` (configurator economics), `pagefront:MadeToOrderTerms` (made-to-order production), `pagefront:Material` with composition properties (typed material breakdown with `percentage`, purity, provenance, weight).
2. **Schema.org under-specification.** Schema.org models the concept but without the closed-enum typing, mandatory structure, or precision agents need to dispatch on. Examples in v0.7: `pagefront:RelatedProduct` (Schema.org's typed relations are limited to four kinds; agents need more typed coverage), `pagefront:Document` (Schema.org has no typed-role enum for product documents like manuals, warranties, certificates), the image and video role enums (Schema.org has no opinion on image roles; Pagefront's closed enum lets consumers dispatch).
3. **Schema.org mismatch with Pagefront's contract.** Schema.org's model conflicts with how Pagefront wants the data shaped. Example in v0.7: `pagefront:PriceOnRequest` (Schema.org has no affordance for "the merchant intentionally publishes no price"; the extension addresses the gap directly).

When none of these triggers fire, Pagefront uses Schema.org-native vocabulary. Image-to-variant association uses Schema.org's `about`. Product Q&A uses Schema.org's `Question`/`Answer`. Pricing patterns use Schema.org's `PriceSpecification` and `AggregateOffer`. Product dimensions use Schema.org's `height`/`width`/`depth`/`weight` with `QuantitativeValue`. Untyped product relationships use Schema.org's `isRelatedTo` and `isSimilarTo`. Certifications use Schema.org's native `Certification` type and `hasCertification` field, with applicability `scope` carried as a `scope` PropertyValue convention; no type is minted for it. The schema permits these via the `additionalProperties: true` policy on Schema.org-typed blocks.

v0.7 documents five further recommended patterns on the same principle, each surfaced by real-merchant sheet production and each fully covered by Schema.org's existing vocabulary: product lifecycle (`releaseDate`, and Offer `availability: Discontinued` paired with a `replaced_by` relationship; see "Product lifecycle"); cross-merchant canonical references (`sameAs` as a deduplication hint alongside the `@id` identity key; see "Cross-merchant canonical reference via `sameAs`"); EU energy efficiency (`hasEnergyConsumptionDetails` with `EUEnergyEfficiencyEnumeration` categories; see "Energy efficiency"); age suitability (`audience` with `PeopleAudience` plus an `additionalProperty` convention for regulatory age warnings; see "Age suitability"); and family and series membership (nested `isPartOf`; see "Five patterns for product-to-product relationships"). None mints a `pagefront:` term, and none required a schema change. The property choices were verified against Schema.org's `domainIncludes` declarations: each pattern uses only properties whose domain covers `Product` (or `Thing`), so the Sheets stay clean Schema.org even under domain-aware validation.

The split is also a signal: `pagefront:`-prefixed fields mean "Pagefront-typed extension with closed-enum or structured shape"; Schema.org-native fields mean "upstream-validated vocabulary."

This principle has operated implicitly across v0.7's decisions; documenting it guards against drift. A contributor proposing a `pagefront:` extension should be able to name which of the three triggers fires; if none do, the answer is Schema.org-native.

### Upstream-equivalent forms

Where an upstream standard (Schema.org, RFC 5646 for BCP 47, ISO 3166, etc.) treats two or more forms as semantically equivalent, Pagefront accepts all of them. The standard recommends a canonical form via linter warning but does not reject the non-canonical forms as invalid. Producers SHOULD emit canonical forms; consumers MUST treat forms as their upstream standard treats them: case-insensitive comparison for BCP 47 tags, scheme-insensitive comparison for Schema.org URIs, and so on.

Two concrete examples:

- **Schema.org URIs.** `http://schema.org/InStock` and `https://schema.org/InStock` both validate. Schema.org treats the scheme variants as semantically equivalent; the validator's linter (rule PDP-W-013) warns on the legacy HTTP form and recommends migrating to HTTPS as the canonical form.
- **BCP 47 tags.** `en-US` and `en-us` both validate. RFC 5646 declares language tags case-insensitive; the validator's linter (rule PDP-W-017) warns when the case differs from the conventional canonical form (lowercase language subtag, uppercase region subtag).

The schema enforces structural validity; the linter expresses canonical preference.

## The envelope

Unchanged from v0.5.

```json
{
  "$schema": "https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json",
  "release": "0.4.0",
  "schema_org_version": "30.0",
  "canonical_url": "https://merchant.com/product/widget-123",
  "sheet_url": "https://merchant.com/api/sheets/widget-123.json",
  "generated_at": "2026-05-10T14:32:00Z",
  "expires_at": "2026-05-10T15:32:00Z",
  "data": {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Widget 123"
  }
}
```

Envelope fields are project-defined. `$schema`, `release`, `schema_org_version`, `canonical_url`, `sheet_url`, `generated_at`, and `data` are required on every sheet that carries `release`. On the legacy draft line, `format_version` stands in for `release` and `$schema` is optional. `expires_at` is recommended: publishers SHOULD declare it when they have a meaningful expiry policy, and MAY omit it when the sheet has no defined expiry.

`release` and `$schema` are the sheet's two version statements:

- `release` is the commerce release the sheet is written against, as a full semver (`"0.4.0"`). The name is generic because the envelope is shared across verticals; the vertical is identified by `$schema`. It replaces `format_version`, the field of the legacy draft line.
- `$schema` is the URL of the JSON Schema for the sheet's own sheet-spec version, with the full semver in its last segment: `https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json` for Product Sheet spec 0.10.0. It names the sheet spec; the release has no schema of its own. `$schema` is REQUIRED on every sheet carrying `release`: it is what identifies the vertical and the sheet type, and what the release is checked against. It is optional only on the legacy draft line.
- The release and the sheet type resolve to exactly one sheet-spec version through the release table in [`releases.md`](releases.md) (machine-readable in [`releases.json`](releases.json)). `$schema` MUST name that version: a Product Sheet declaring release 0.4.0 points `$schema` at `product/v0.10.0.json`, and one declaring release 0.3.0 at `product/v0.9.0.json` (linter rule PDP-E-002).
- A sheet is judged by the release it declares: it is validated against the schema of the sheet-spec version that release bundles, and by the rules that apply from that release. A requirement introduced by a later release does not apply to it. Whether `$schema` is required is itself such a requirement: the schema of Product Sheet spec 0.10.0 requires it, and the schema of 0.9.0 does not.
- A sheet carrying both `format_version` and `release` is invalid (PDP-E-016).

A sheet carrying `format_version` and no `release` belongs to the legacy draft line, format versions 0.9 and earlier. It validates against the legacy schema, which stays served at `https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json`, and it gains nothing from later releases. See "The legacy draft line" in [`releases.md`](releases.md).

`expires_at`, when present, indicates how long consumers should consider the sheet valid before re-fetching. Sheets carrying multi-currency `offers` or scheduled promotions SHOULD use shorter `expires_at` windows to reflect price volatility.

## data — Schema.org JSON-LD

The data block is a valid Schema.org Product (or `ProductGroup`, or a recognized subtype) document with optional project extensions under the `pagefront:` namespace.

### Required and recommended core fields

Required:
- `@context`: `"https://schema.org"` when the data block uses no `pagefront:` term. A data block that uses any `pagefront:` term MUST declare the prefix, in the array form `["https://schema.org", {"pagefront": "https://themachineweb.org/pagefront/vocabulary/"}]`; see [vocabulary.md, "How to use this vocabulary"](vocabulary.md#how-to-use-this-vocabulary). Under the bare string a `pagefront:` key is an opaque IRI with scheme `pagefront`: it does not resolve to the vocabulary, and the vocabulary context's `@container` declarations do not apply to it.
- `@type`: `"Product"` (or `"ProductGroup"`, or a recognized subtype)
- `@id`: stable URL-shaped identifier
- `name`: product name as displayed to humans
- `inLanguage`: BCP 47 language tag (`fr`, `fr-CA`, `en-GB`, etc.); the language of all prose fields and language-scoped media in this sheet
- `url` (canonical URL of the human page), conditional on `@type`: required for `Product` and subtypes, and optional for `ProductGroup`. A parent `ProductGroup` Sheet with no backing family page omits `url` and is located by `sheet_url` (see "Multi-Sheet variant families").
- One identifier, conditional on `@type`:
  - For `Product` (and product subtypes): one of `sku`, `gtin13`, `gtin`, `mpn`, or `productID`.
  - For `ProductGroup`: `productGroupID`. Per-variant SKUs SHOULD also be declared on each entry in `hasVariant`.

A note on GPSR traceability identifiers (Art. 9(5)): the product *type* identification the regulation asks for is covered by `mpn`/`productID`. Batch and serial numbers identify individual units, so they are out of scope for a Sheet and MUST NOT be stuffed into `sku`.

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

#### Multiple GTINs

A product legitimately carries more than one GTIN when the same product ships under different barcodes: regional packaging variants (the EU box and the US box of one product), re-releases where a manufacturer reissues the product under a new barcode, or multipack-versus-single packaging of the same sellable unit. `gtin` and `gtin13` therefore accept a single string or an array of strings; each `gtin13` entry must be 13 digits, as before.

Every listed GTIN identifies the product. Consumers MUST treat a match on *any* listed GTIN as identifying it; the array carries alternates for one product. Variants with different GTINs are different `hasVariant` entries, each with its own `gtin`. For deduplication, a match on any listed GTIN is a valid secondary-identifier fallback per "Product identity and deduplication."

```json
{
  "@type": "Product",
  "name": "Meridian Headlamp 400",
  "url": "https://merchant.com/products/meridian-headlamp-400",
  "sku": "MER-HL400",
  "gtin13": ["4066544923187", "0194253715880"]
}
```

The identifier requirement is unchanged: one of `sku`, `gtin13`, `gtin`, `mpn`, or `productID` must be present; an array satisfies it just as a single value does.

#### Machine-readable category

`category` remains the human-readable hierarchical string (`"Apparel > Knitwear > Sweaters"`). It now also accepts a Schema.org `CategoryCode` object identifying the category in a published taxonomy, or an array mixing the string and coded forms. Schema.org covers this natively, so no `pagefront:` term is minted.

A `CategoryCode` entry carries:

- `codeValue` *(required)*: the code in the taxonomy (e.g. `"212"` in the Google product taxonomy).
- `inCodeSet` *(recommended)*: a URL identifying the taxonomy the code belongs to. Consumers dispatch on this URL to know how to interpret `codeValue`; a code without its code set is ambiguous. Use the taxonomy's canonical URL, e.g. `https://www.google.com/basepages/producttype/taxonomy.en-US.txt` for the Google product taxonomy, or the UNSPSC codeset URL for UNSPSC.
- `name` *(recommended)*: the category's human-readable name in that taxonomy.

Producers that know a taxonomy code SHOULD emit both the human-readable string and at least one coded entry. The string serves rendering and simple consumers; the code serves comparison and aggregation across merchants:

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

#### ProductGroup variant completeness

ProductGroup Sheets SHOULD declare all variants in the family. The `hasVariant` array is intended to be exhaustive: consumers reading a ProductGroup Sheet expect it to reflect the complete variant family at the moment of emission. When variants live on different pages and the production pipeline can discover them all, the resulting Sheet should include each. When some variants cannot be discovered, producers should emit per-variant Product Sheets without a wrapping ProductGroup. A partial ProductGroup Sheet does not apply here because consumers read `hasVariant` as complete.

#### Multi-Sheet variant families

When variants have their own pages carrying substantial per-variant content (their own media gallery, description, and offers), producers SHOULD model the family as multiple Sheets. Inlining every variant into one ProductGroup Sheet works when variants are thin (a color and a price), but it collapses when each variant page is a rich product page in its own right.

The structure is N+1 Sheets:

- **One parent ProductGroup Sheet** at the family's canonical URL. Its `hasVariant` array enumerates every variant, each entry linking to that variant's own Sheet. When the family has no backing page of its own (the variants are the only human-facing pages and there is no family landing page), the parent is page-less: it omits the data-block `url` (there is no family page to point at) and carries only `sheet_url` as its location. Consumers reach a page-less parent by `sheet_url`, typically by following `isVariantOf.sheet_url` from a variant Sheet.
- **One Product Sheet per variant**, each carrying `isVariantOf` pointing at the parent's `@id`.

This gives bidirectional traversal. A variant Sheet reaches its parent via `isVariantOf`; the parent reaches its variants via `hasVariant`. An agent landing on a variant page reaches that variant's Sheet via `Link: rel="describedby"`, follows `isVariantOf` to the parent Sheet, and reads the parent's `hasVariant` to enumerate sibling variants. An agent landing on the family page reads the parent's `hasVariant` to reach each variant directly.

Each parent `hasVariant` entry carries:

- `@id` *(required)*: matches exactly the `@id` in the variant's own Sheet. The exact-string match is what lets a consumer recognize the parent's reference and the variant's self-description as the same product; see "Product identity and deduplication" for the `@id` contract.
- `url` *(required)*: the variant's page.
- `sheet_url` *(recommended)*: the URL of the variant's Sheet. It lets a consumer fetch the variant Sheet directly without first loading the variant page and reading its `describedby` link. A producer emitting both the parent and the variant Sheets knows this URL and SHOULD populate it. When `sheet_url` is absent, a consumer reaches the variant Sheet via `url` + `describedby`. When `sheet_url` is present but unresolvable, the consumer falls back to `url` + `describedby`.
- `name`, the axis value (e.g. `color`), `price`, and an `image` render-hint: *optional*, but enough together to render a family picker without fetching every variant Sheet.

Each variant Sheet carries `isVariantOf` with the parent's `@id`, and SHOULD carry the parent's `sheet_url` so traversal to the parent is symmetric: a consumer on the variant Sheet can fetch the parent directly, without resolving it through the variant page.

A parent ProductGroup Sheet, with two `hasVariant` entries each linking to a variant Sheet:

```json
{
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "@id": "https://merchant.com/pagefront/commerce/product/aurora-jacket.en.json",
  "name": "Aurora Jacket",
  "inLanguage": "en",
  "productGroupID": "AURORA-JACKET",
  "url": "https://merchant.com/products/aurora-jacket",
  "variesBy": ["https://schema.org/color"],
  "hasVariant": [
    {
      "@type": "Product",
      "@id": "https://merchant.com/pagefront/commerce/product/aurora-jacket-onyx.en.json",
      "url": "https://merchant.com/products/aurora-jacket?variant=onyx",
      "sheet_url": "https://merchant.com/pagefront/commerce/product/aurora-jacket-onyx.en.json",
      "name": "Aurora Jacket — Onyx",
      "color": "Onyx",
      "image": "https://merchant.com/images/aurora-jacket-onyx-packshot.jpg"
    },
    {
      "@type": "Product",
      "@id": "https://merchant.com/pagefront/commerce/product/aurora-jacket-sand.en.json",
      "url": "https://merchant.com/products/aurora-jacket?variant=sand",
      "sheet_url": "https://merchant.com/pagefront/commerce/product/aurora-jacket-sand.en.json",
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

A **page-less parent** ProductGroup: a family whose variants each have their own page but that has no family landing page of its own. Its data block omits `url` and is located by `sheet_url`, as described at the start of this section. The `productGroupID` identifier requirement still holds; only `url` is dropped. Each variant entry still carries its own page `url`:

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

#### Per-variant URLs

Each entry in `hasVariant` MAY declare a `url` field. The ProductGroup's top-level `url` remains the canonical URL of the product family (typically the merchant's primary listing page or the page from which variant discovery began). The variant's `@id` remains the primary identifier for the variant; the per-variant `url` is supplementary metadata that carries addressability information: consumers can use it to construct direct links to variant-specific page states. Agents recommending specific variants to users, link sharing, and any consumer that needs to address a variant individually rely on it.

When the parent ProductGroup has no family page (the page-less parent of a multi-Sheet variant family, see "Multi-Sheet variant families"), its top-level `url` is absent and the family is located by `sheet_url` instead. The per-variant `url` fields on `hasVariant` entries are unaffected: each variant still declares its own page `url` under the same guidance above.

Three patterns govern whether to populate it:

1. **Shared-URL variants.** Variants share the parent product's URL and are distinguished only by `@id`. The `url` field on individual variants is unnecessary here and MAY be omitted.
2. **Same-page parameterized variants.** Variants share the parent product's page, but each has a distinct addressable URL via platform-specific query parameters (e.g., `?variant={id}` on Shopify). The page is the same; the URL differs by which variant is pre-selected. Per-variant `url` SHOULD be populated because it carries addressability information consumers can use. These query-parameter URLs are semantically equivalent to the parent product URL, so consumers SHOULD treat them as the same canonical page with a different default state.
3. **Distinct-page variants.** Each variant has its own page on its own URL (for example a watch family where each dial color is its own page, though such families are typically modeled as separate Sheets). Per-variant `url` is essential.

Per-variant `url` SHOULD be populated when each variant has a meaningfully distinct addressable URL (cases 2 and 3). It MAY be omitted only when variants share the exact same URL with no parameter-based differentiation (case 1, rare in practice).

#### ProductGroup `name` and Google Merchant Center `item_group_title`

For implementers transitioning from Google Merchant Center feed formats: the `name` field on a `ProductGroup` is the Pagefront equivalent of Google's `item_group_title` attribute. The two carry the same intent: a human-readable title for the variant family that is distinct from any individual variant's `name`. Pagefront expresses it via Schema.org's native `name` on the `ProductGroup`; no dedicated attribute is minted, because the semantic is already covered by Schema.org's existing vocabulary.

#### Variant dimensions

ProductGroup Sheets SHOULD declare the axes along which their variants differ. v0.7 recommends, in order of preference:

1. **Schema.org-native variant properties on each `hasVariant` entry**, when the axis is one Schema.org models directly: `color`, `size`, `material`. The corresponding `variesBy` array on the `ProductGroup` SHOULD reference these property names so consumers can discover the variant axes without scanning variants.
2. **`additionalProperty` entries** with a `propertyID` drawn from the Pagefront Property Registry (below), when Schema.org has no native property for the dimension. Each `additionalProperty` carries `propertyID` (the dimension identifier) and `value` (the variant's value on that dimension).

`variesBy` entries are represented in two forms depending on which kind of axis they reference. Schema.org-native axes are referenced by their full Schema.org URI (`https://schema.org/color`, `https://schema.org/size`, `https://schema.org/material`). Registry entries and producer-defined axes are referenced by the bare `propertyID` string: `storage` and `width` are registry entries; `packaging_ribbon_color` illustrates a producer-defined axis with no registry entry. Consumers distinguish the two forms by the presence of a URI scheme. A ProductGroup that varies along both Schema.org-native and non-native axes will have mixed entries:

```json
"variesBy": ["https://schema.org/color", "storage"]
```

Each variant in `hasVariant` declares its value on every axis: Schema.org-native axes via the Schema.org property name (`color`, `size`, `material`) directly on the variant, and non-native axes via an `additionalProperty` entry whose `propertyID` matches the bare-string axis in `variesBy`. On such an entry, `name` remains the display label and may be localized; `propertyID` is the language-neutral coordination key.

Non-Schema.org-native `propertyID` values are drawn from the **Pagefront Property Registry**, a machine-readable, versioned registry published at:

```
https://themachineweb.org/pagefront/commerce/registry/properties.json
```

superseding the v0.7 inline suggested-registry list. Each entry carries:

- `id`: the `propertyID` value.
- `definition`: a short description of the dimension.
- `valueType`: `string`, `number`, or `boolean`.
- `recommendedUnitCode`: a UN/CEFACT unit code, or `null` when no UN/CEFACT code exists for the concept (in which case a `unitLabel` carries the conventional symbol, e.g. `"MP"` for megapixels).
- `repeatable`: present and `true` for axes that take multiple values per product (e.g. `input_type`, `port`).
- `verticals`: the product categories the entry is used in.
- `status`: `proposed`, `stable`, or `deprecated` (see "Registry governance" below).

Normative guidance:

- Producers SHOULD draw `propertyID` values from the registry and emit values in the entry's recommended unit (`recommendedUnitCode`, or `unitLabel` when no UN/CEFACT code exists), so raw values compare across sheets without conversion.
- Consumers MUST treat `propertyID` values not present in the registry as opaque but usable identifiers (unchanged from v0.7) and MUST NOT reject sheets over them.
- Consumers MAY ship a pinned snapshot of the registry; fetching it at runtime is not required. The registry is a coordination artifact for authoring-time convergence between independent producers.
- Spec examples and worked illustrations of the unregistered path SHOULD use `propertyID` values with no plausible registration future, such as an idiosyncratic, single-merchant facet. A common cross-vertical term risks getting registered later, which would silently invalidate the example's premise.

#### Registry governance

The Pagefront Property Registry's lifecycle is modeled on IANA's link-relation registry (see RFC 8288 §6.2.1, already referenced in "Discovery" below): entries move through three states.

- **`proposed`**: a candidate identifier, observed in real-merchant use but not yet broadly converged on.
- **`stable`**: an identifier with enough independent-producer adoption that the spec recommends it without reservation.
- **`deprecated`**: superseded by a preferred alternative, but still resolvable and valid; sheets that already emit it remain conformant.

Entries are **never removed or renamed** once published: the same permanence guarantee the spec gives `pagefront:Document` and `pagefront:RelatedProduct` (see "Versioning and stability" in the Pagefront Vocabulary). A `propertyID` that appears in a sheet today resolves to the same definition in the registry regardless of later status changes; renaming would break every sheet that already emitted the old identifier, so deprecation without removal is the only transition the registry makes.

Registry versions (`registry_version`) are **additive only**: a new version may add entries or advance existing ones along the `proposed` → `stable` → `deprecated` lifecycle; it removes or redefines none, as stated above. A consumer pinning an older registry snapshot (see "Consumers MAY ship a pinned snapshot" above) stays correct about every entry that existed at pin time.

**Registration path.** New entries are proposed from observed real-merchant use (facet analysis of produced sheets surfacing a `propertyID` that recurs across independent publishers) and submitted via the spec repository, the same venue that governs the rest of the Pagefront Spec. There is no separate registry-specific governance body; the registry is versioned and published alongside the spec it serves.

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

Configurable products can in principle be expressed two ways: with `pagefront:configurator` declaring a parametric option space, or with `ProductGroup` + `hasVariant` + `offers` enumerating each combination as a discrete SKU. The choice is normative: each pattern has a defined scope, and using both for the same dimension (linter rule PDP-W-010) is an authoring error.

Use `pagefront:configurator` when **any** of the following holds:

- **Combinatorial impracticality.** Listing every combination as a separate `Offer` is not how the merchant manages inventory or surfaces options to buyers.
- **Continuous dimensions.** At least one dimension is continuous: engraving text, custom dimensions (a watch strap cut to wrist circumference), free-form monogram choice, custom date inscription, or similar parametric inputs.
- **Made-to-order economics.** The product is produced on demand from configured inputs. (Typically paired with `pagefront:madeToOrderTerms` for the economic terms.)
- **Four or more variant axes.** Products with 4 or more variant axes SHOULD use `pagefront:configurator`. The 3-axis ceiling for `ProductGroup` reflects that real-world axes carry enough values that 4+ axis combinations are impractical to manage as discrete inventory SKUs: a 4-axis product where each axis has 3+ values already exceeds 80 combinations, past the point where `ProductGroup` enumeration scales cleanly. An exception applies only when the cartesian product is unusually small AND every combination ships from inventory as a discrete SKU; in practice the exception rarely applies, and producers facing borderline cases should default to configurator.

**Axis count is per-Sheet.** The axis counts above refer to the variant axes expressed within a single Sheet, on one canonical URL. The total a logical product family carries across all its representations is not the measure. A family with more axes than one Sheet expresses is routinely factored across multiple Sheets by picking one axis as the page boundary. Picture a watch family with three axes (dial color, strap, and case back) where the merchant gives each dial color its own page. Each Sheet then expresses only strap and case back: two axes, well within the `ProductGroup` envelope. Cross-Sheet relationships (`isVariantOf` to a parent family Sheet, or `pagefront:relatedProduct` between siblings) carry the factored axis.

A producer with a 4+ axis family therefore has two valid options:

1. **Factor across Sheets**, keeping each at 3 or fewer axes (the factoring example below). Best for in-stock families with a discrete SKU per combination: it keeps each Sheet tractable and matches how customers navigate (shopping by dial, then choosing strap and case back within it).
2. **Express the full space in one Sheet** using `pagefront:configurator` (the configurator example below). Best for made-to-order or continuous-dimension products, where there is no per-combination inventory to enumerate.

Use `ProductGroup` + `hasVariant` + `offers` when **all** of the following hold:

- The variant space has 3 or fewer axes.
- All axes are discrete (no continuous dimensions).
- Each combination is a discrete SKU shipping from inventory.

For the reason behind the 3-axis ceiling and its per-Sheet scope, see "Four or more variant axes" and "Axis count is per-Sheet" above.

Worked examples:

- **Made-to-order configurator.** A custom ring offered in 14 gold options × 5 sizes × 2 band styles: 140 configurations, made to order, none held in inventory. Made-to-order economics and combinatorial scale together force the configurator; even at 3 axes it is the only tractable representation.
- **Cross-Sheet factoring, `ProductGroup` per axis.** A watch family with three axes (dial color, strap, and case back) where the merchant gives each dial color its own page. Each Sheet then expresses only the remaining two axes (strap × case back) as a `ProductGroup` whose `hasVariant` enumerates the discrete in-stock SKUs; cross-Sheet relationships connect the dials. The same logical complexity, distributed across tractable Sheets each well inside the 3-axis ceiling.
- **Three-axis `ProductGroup` at the boundary.** A watch line of 3 case materials × 3 strap types × 3 case sizes = 27 combinations, each stocked as a discrete SKU. All axes discrete, all combinations in inventory, axis count at the ceiling: one `ProductGroup` with `hasVariant` enumerating all 27 entries, the upper end of the envelope, but unambiguously inside it.

##### Mixed cross-Sheet factoring

A product's axes can split across both mechanisms at once: some axes factored into separate pages (each a Sheet, connected by the variant relationship), and the remaining axes configured within each page (via `pagefront:configurator`). The factored axes and the configurator axes are two disjoint sets: no axis appears in both roles on any single Sheet, which keeps each Sheet clear of the PDP-W-010 conflict (configurator and `hasVariant`/`isVariantOf` declaring the same dimension).

The pattern:

- **Factored axes** (the page-boundary axes) are expressed through the variant relationship: a parent `ProductGroup` Sheet whose `hasVariant` enumerates the per-page variants, each page carrying `isVariantOf` to the parent. `variesBy` on the parent lists the factored axes.
- **Configurator axes** (the within-page axes) are expressed through `pagefront:configurator` on each page's Product Sheet.
- The two axis sets are disjoint: an axis is either factored or configured.

For example, an engagement ring with four axes (shape, band style, carat, and metal) splits two-and-two. Shape and band style are factored into pages: each (shape × band) combination is its own page and Sheet, so they are the family axes, carried by a parent `ProductGroup` (`variesBy`: shape, band style) whose `hasVariant` enumerates the per-combination pages. Carat and metal are configured within each page, carried by a `pagefront:configurator` (`dimensions`: carat, metal) on each page's Product Sheet. No Sheet declares any axis as both a variant axis and a configurator dimension, so PDP-W-010 does not fire.

When a product's axes exceed what one mechanism handles cleanly, partition them into axes factored into pages (the variant relationship) and axes configured within a page (the configurator), keeping the two sets disjoint.

##### Configurator pricing and price bands

A configurator carries no prices. `pagefront:configurator` describes the product's option space: its dimensions, their options, and the combinations that cannot be ordered together (`exclusions`). The prices for that option space live in an offer, in `pagefront:configuratorPricing`, and the pricing block names the configurator it prices. A price list belongs to a market. It has a currency and a tax basis, which an offer already states, and a product sold in two markets can have two price lists that are not exchange-rate conversions of each other.

`pagefront:configuratorPricing` is permitted on an `Offer` and on an `AggregateOffer`. Its value is a `pagefront:ConfiguratorPricing` object; the field definitions are in [`vocabulary.md`](vocabulary.md). The rules:

- **The pricing block names its configurator.** A configurator that an offer prices MUST declare an `@id`, a same-document identifier such as the Sheet's `@id` with `#configurator` appended. The block's `configurator` MUST be a reference `{ "@id": … }` to a `pagefront:Configurator` declared in the same Sheet. This reference is the only link between an offer and the option space it prices; two objects sitting on the same Product state no such link.
- **`basePrice` is the total of a complete configuration.** `baseConfiguration` names exactly one option for every priced dimension, which makes it a configuration a buyer can order. `basePrice` is what the buyer pays for exactly that configuration. A component price is never a base price: on a product assembled from several priced parts (a frame and a top, a setting and a stone), the price of one part MUST NOT be published as `basePrice`.
- **Every option in a priced dimension has a modifier.** `modifiers` is keyed by dimension name, then by option value, and gives the amount each option adds to or subtracts from `basePrice`. An option that changes nothing carries a modifier of zero (`0`, or `"0"` in a Sheet whose amounts are strings), and the option named in `baseConfiguration` MUST carry zero. A missing modifier states nothing about that option's price, and consumers MUST NOT read it as zero. A block in which any priced option has no modifier MUST declare `pricing: "partial"`.
- **A dimension that never changes the price says so.** It declares `affectsPrice: false` on the configurator, has no entry in `modifiers`, and has no key in `baseConfiguration`. Size, free personalisation and delivery slot are the typical cases. A dimension is *priced* unless it declares `affectsPrice: false`.
- **A priced dimension enumerates its options.** A `select` dimension with no `options` (a continuous measure, a sizing system) has no option values to key a modifier by. When its choice never changes the price, declare `affectsPrice: false`. When it does, the block cannot state that part of the price list: declare `pricing: "partial"`, and leave the dimension out of `baseConfiguration` and `modifiers`.
- **A free-text dimension has one modifier.** A dimension declared `inputType: "text"` (engraving, monogram, custom inscription) has no `options`, and MAY state the number of characters accepted in `maxLength`. The base configuration leaves it empty, so it has no key in `baseConfiguration`. When its `affectsPrice` is left at the default of `true`, it MUST have a single modifier under its name, keyed `"*"`, which applies to any non-empty input. Free engraving is `affectsPrice: false` and has no modifier.
- **Adjustments carry what is not additive.** When one option's price depends on the choice made in another dimension, `adjustments` lists the difference: each entry has a `when` (a partial configuration) and a `priceModifier`, and applies to every configuration that matches every pair in its `when`. Any price grid can be expressed this way. Producers MUST verify that the prices are additive before omitting `adjustments`.
- **Excluded configurations have no total.** A configuration that matches every pair of an entry in the configurator's `exclusions` cannot be ordered, and its total is undefined.
- **References resolve.** Every pair in an exclusion, and in an adjustment's `when`, MUST name a dimension the configurator declares. Where that dimension lists `options`, the pair's value MUST be the `value` of one of them, written as the option writes it, with the same JSON type (`"1"` for an option whose value is `"1"`). A dimension that lists no options takes any value. A pair that resolves to nothing would exclude no configuration, or never apply, without any sign of it. This requirement is new in Product Sheet spec 0.10.0 (linter rule PDP-E-017, which applies from release 0.4.0).
- **Currency and tax basis come from the offer.** Every amount in the block is in the enclosing offer's `priceCurrency`, under that offer's tax-inclusion statement (`priceSpecification.valueAddedTaxIncluded`, see "Tax inclusion"). The block carries no currency of its own.
- **Amounts use the Sheet's carrier.** `basePrice`, every modifier and every adjustment's `priceModifier` are amounts, carried as the rest of the Sheet's amounts are: all JSON numbers, or all decimal strings. See "Amounts" under "Common pricing patterns."

The total price of a configuration is `basePrice`, plus the modifier of each selected option, plus the `"*"` modifier of each priced free-text dimension given a non-empty input, plus the `priceModifier` of every adjustment that applies. Consumers MUST NOT compute totals from a block that declares `pricing: "partial"`, and MUST NOT compute a total for an excluded configuration.

Option values are identifiers. An option's `value` is a stable identifier for the option, and its human label goes in `description`. A value SHOULD be lowercase with no spaces, and stable across languages and editions of the same product (`yellow_gold`, `three_quarter_pave`, `0.5`). A numeric option uses the number as a string, with no unit (`"0.5"`, and never `"0.5ct"`); the unit belongs in the dimension's `note`. Option values are the keys that `modifiers` and `baseConfiguration` are compared against, literally, and two Sheets for the same product in different languages must share them: the French and the English Sheet of one desk both say `solid_oak`, and each describes it in its own language. In a dimension that declares a `system`, the value is the size as that system writes it, without the system's name (linter rules PDP-W-036 and PDP-W-037).

Values are matched by their string form, with no case folding and no trimming. A string value is its own key; a number or boolean value is keyed by its JSON serialization (`0.5`, `1`, `true`). The same comparison applies to the values in `baseConfiguration`, in an adjustment's `when`, and in `exclusions`.

**Labels, notes and quoted statements.** An option's `description` is the label a buyer sees. A dimension's `note` is a factual statement for a machine: third person, no address to the reader, no call to action. The split follows what a field is for. Fields that carry a legal or safety statement (safety warnings, warranty, return terms) are quoted verbatim, because the merchant's published wording is the statement. Descriptive fields such as configurator notes are restated as facts: "A free ring sizer can be ordered before the size is confirmed" where the page says "Not sure about your size? Just select the ring sizer." Linter rule PDP-W-038 warns on a note that reads as page copy.

Options are the values a product can be ordered in. Services offered around the order (a sizing kit, a sample, a consultation) are not options of a dimension and MUST NOT appear in `options`; they belong in the dimension's `note` or in `pagefront:madeToOrderTerms.aftermarketServices`.

The offer's own price fields agree with the block:

- An `Offer` carrying a pricing block MUST have `price` equal to `basePrice` (linter rule PDP-E-010).
- An `AggregateOffer` carrying a pricing block MUST have `lowPrice` and `highPrice` equal to the totals of the cheapest and the dearest non-excluded configurations computed from the block (PDP-E-011). With `pricing: "partial"` those totals cannot be computed, and the bounds are the ones the page states.
- The `AggregateOffer` takes no `itemOffered`: it is nested in the Product's `offers`, so position binds it to that Product.

A configurator is priced by at most one offer per Sheet (PDP-E-012). A merchant selling in several currencies publishes one Sheet per market, each at its own canonical URL, and each Sheet's offer carries that market's price list.

How much of the price list a producer can state decides the shape:

1. **The full grid is known.** Emit the pricing block with every modifier, on an `Offer` (`price` is the base price) or on an `AggregateOffer` (the band is the computed one).
2. **Part of the grid is known.** The page resolves a configured price only after selection, or shows one slice of the grid (a carat ladder for a single metal, say). Emit the block with `pricing: "partial"`: the base configuration and its total, and the modifiers that are known. On an `AggregateOffer`, both bounds are still required, so a partial band is not valid: when the ceiling cannot be established, use an `Offer` at the base price instead.
3. **Only the option space is known.** Emit the configurator alone. A configurator-only Sheet remains valid; a half-populated `AggregateOffer` (a `lowPrice` with no `highPrice`) does not.

An offer with a price that sits beside a configurator and carries no pricing block is not linked to it: nothing states which configuration that price is for. The linter warns on it (PDP-W-034).

Scope the band to the Sheet's own configurable axes. On a Sheet where some axes are factored into pages (mixed cross-Sheet factoring, above), the factored axes are fixed for that page, so the pricing block and its `AggregateOffer` range only over the page's configurator dimensions. For example, an engagement-ring page with shape and band fixed (factored) and carat × metal configured carries an `AggregateOffer` whose `lowPrice` is that page's floor and whose `highPrice` is that page's ceiling. The band spans only carat × metal; the whole family's price spread across shapes and bands is captured implicitly by the set of per-page bands.

The example below is a desk with three priced dimensions (top size, top material, frame), one unpriced dimension (frame colour), one exclusion (the largest top is not made in solid oak) and one adjustment (oak veneer costs 30 more on the largest top than the two modifiers add up to).

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

The base configuration (120 × 60 cm, laminate, fixed frame) totals 349.00, which is `lowPrice` because no modifier is negative. A 160 × 80 cm oak veneer top on an electric frame totals 349.00 + 90 + 80 + 250 + 30 = 799.00, the adjustment included. The dearest configuration that can be ordered is 140 × 70 cm, solid oak, electric frame: 349.00 + 40 + 220 + 250 = 859.00, which is `highPrice`. The 160 × 80 cm solid oak top would total more, and it is excluded. Frame colour appears nowhere in the pricing block.

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

Linter rules PDP-W-007 (single-variant ProductGroup), PDP-W-009 (empty `hasVariant`), and PDP-W-010 (configurator and `hasVariant` declaring the same dimension) implement guardrails around the configurator-or-ProductGroup decision. The 3-axis ceiling does not change those checks; it only adjusts which model is recommended for borderline-by-axis-count products. Rules PDP-E-007 to PDP-E-012 and PDP-W-032 to PDP-W-035 check the pricing block against the configurator it names, and PDP-E-001 checks that the reference resolves. PDP-E-013, PDP-W-036, PDP-W-037 and PDP-W-038 check the configurator's own dimensions, option values and notes.

#### Product dimensions

Product dimensions are expressed using Schema.org's native `height`, `width`, `depth`, and `weight` properties on the Product. Each takes a `QuantitativeValue` with a `value` (numeric) and a `unitCode` (UN/CEFACT unit code).

Recommended unit codes:

- **Length dimensions** (`height`, `width`, `depth`): `CMT` (centimetres), `MMT` (millimetres), `INH` (inches).
- **Weight**: `GRM` (grams), `KGM` (kilograms), `LBR` (pounds), `ONZ` (ounces).

The choice of unit is the producer's. Consumers reading the Sheet read the `unitCode` and convert as needed. Producers should choose units appropriate to the product category: centimetres for soft goods and apparel, millimetres for jewelry and watches, grams for jewelry and small items, kilograms for larger objects.

For example, a leather bag 20cm tall, 30cm wide, 10cm deep, weighing 800g:

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

The `QuantitativeValue` object accepts an optional `description` field for clarifying nuance, for example `"Weight in size L"` when weight varies by variant, or `"Total gold weight (excludes gemstones)"` when weight is partial.

Distinguish from per-material weight: `pagefront:Material` entries inside `pagefront:materialComposition` carry an optional `weightGrams` field for cases where total product weight is distributed across multiple materials (common in jewelry, where gold band weight is separate from gemstone weight). The Product-level `weight` is the total; the Material-level `weightGrams` is per-component. Both can coexist in the same Sheet.

These dimensions describe the product itself. Packaging and shipping-container dimensions do not belong here; shipping dimensions, if relevant, belong on the Offer's `shippingDetails`.

For products where dimensions are not meaningful (digital products, services), these fields should be omitted; the spec does not require them.

#### Age suitability

Products carrying an age recommendation (toys, games, children's equipment) SHOULD declare it via Schema.org's `audience` property, carrying a `PeopleAudience` with `suggestedMinAge` and/or `suggestedMaxAge`, both numbers, in years. An open-ended recommendation ("5 and up") declares only `suggestedMinAge`. `suggestedGender` MAY be added where the merchant themselves declares a gendered audience; producers SHOULD NOT infer one.

Regulatory age warnings are a different statement: a recommendation says "who this is for," and a warning says "who this must be kept from," as in the EU toy-safety warning "Not suitable for children under 36 months." A warning is carried as an `additionalProperty` convention: a `PropertyValue` with `name: "age_warning"` and the warning text as `value`, in the sheet's `inLanguage`. The two coexist on the same product; a recommendation and a warning answer different questions, and neither substitutes for the other.

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

- `hero`: the primary image, typically lifestyle or evocative
- `packshot`: product on neutral background, isolation shot
- `lifestyle`: product in use or in context
- `detail`: close-up of construction, fabric, finish, or distinguishing feature
- `flatlay`: top-down product layout, common in apparel
- `swatch`: color or material sample
- `size_chart`: measurement diagram (typically apparel)
- `context`: environmental or scale-reference shot

A single image may declare more than one role (a packshot that also serves as the hero). Renderers and consumers should treat roles as filter inputs.

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

Producers SHOULD declare `about` on every image in a ProductGroup Sheet. For variant-specific images, `about` points at the depicted variant's `@id`: a single reference for an image of one variant, or an array of references for an image applying to multiple variants (a comparison shot, a color-swatch chart, an infographic). For family-level images, those applying to the whole product family (family overview, packaging, the product without variant emphasis), `about` points at the ProductGroup's `@id`.

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

A multi-variant image, a swatch chart depicting every color in the family, with `about` as an array of references:

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

Declaring `about` on every image disambiguates family-level images (where the producer affirmatively states "this applies to the ProductGroup") from images where variant association is simply unknown or omitted in error. Treating omission as the convention for family-level images would leave the two indistinguishable. The pattern is also symmetric with `itemOffered` on Offers, where every Offer always declares its target; there is no convention of "Offer without itemOffered applies to the whole family."

The pattern is Schema.org-native: `about` is well-defined and widely supported, so Pagefront introduces no typed extension.

VideoObject supports the same pattern via the same `about` property. Variant-specific product videos (a tutorial featuring one configuration, a demonstration of one finish) can declare their variant association identically: a single `about` reference for one-variant videos, an array for multi-variant videos. Family-level videos in a ProductGroup Sheet should declare `about` pointing at the ProductGroup's `@id`, following the same every-video rule as images.

### Textual framing for media

Producers SHOULD populate textual framing for images that benefit from publisher context: lifestyle imagery, infographics, comparative diagrams, swatches in context, any image where the publisher's intent isn't self-evident from the visual content alone. Producers MAY skip textual framing for packshots and other studio imagery where visual analysis can describe the content reliably.

Schema.org provides two fields for this purpose, used by convention:

- `caption`: short, display-quality text that accompanies the image, typically merchant-approved for human reading. Use when the merchant already has caption text in their content management system.
- `description`: longer or more semantic text that may not be displayed but provides machine-readable framing. Use when the merchant has richer context than a caption would carry.

Producers populating both fields should ensure they carry meaningfully different content; identical or near-identical `caption` and `description` add noise.

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

### Video roles

Each VideoObject in the `video` array can declare a role via `additionalProperty`, mirroring the image-role pattern. The closed enumeration:

- `overview`: primary product video, typically short (30–90 seconds), showing the product itself. The video equivalent of a hero image.
- `tutorial`: how-to-use, how-to-install, how-to-assemble, how-to-care-for content. Typically longer (2–10 minutes), instructional in voice.
- `lifestyle`: atmospheric, product-in-context footage, often without explicit narration. The video equivalent of lifestyle photography.
- `construction`: manufacturing footage, behind-the-scenes, how-it's-made. Carries the same provenance/transparency value as `pagefront:manufacturingChain` and is encouraged for publishers whose differentiation includes production transparency.
- `demonstration`: product in functional use (instrument played, tool operating, audio sample). For products where motion or sound is part of the value proposition.
- `comparison`: A/B with another product or alternative configuration. Used when the publisher wants to surface how their product differs from named alternatives.
- `unboxing`: packaging-opening footage, merchant- or partner-produced. Distinct from user-generated unboxing content (see note below on user-generated media).
- `spin`: 360° product rotation, typically generated from photogrammetry. Conceptually closer to a rich image than a video but uses video format for delivery.

A single video may declare more than one role when appropriate (an `overview` that also serves as `lifestyle`). Renderers and consumers should treat roles as filter inputs.

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

A `VideoObject` usually carries a single preview via `thumbnailUrl` (a URL string), as shown in the examples above. When a single video is surfaced under more than one preview image that carry distinct meaning (different scenes, framings, or use-cases the merchant chose), use Schema.org's `thumbnail` property (an array of `ImageObject`) instead of `thumbnailUrl`, so each preview keeps its own context (`description`/`caption`).

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

#### Accessibility

Publishers SHOULD include `caption` (a short summary, typically one to three sentences) and/or `transcript` (the full spoken or signed content of the video) on every VideoObject. Captions/transcripts serve consumers in audio-restricted contexts, consumers using accessibility tools, and consumers parsing the sheet without rendering the video.

Pagefront does not require captions or transcripts. The validator's linter (rule PDP-W-012) warns when accessibility metadata is absent on videos with `overview` or `tutorial` roles.

#### Video and internationalization

Video is language-scoped. A French-language sheet's `video` array contains French-language videos; an English-language sheet's contains English-language videos. Cross-language navigation between sheets is via the `Link` header's `hreflang` parameter (per v0.5's internationalization model). A single sheet's video array does not mix languages.

When a video is language-agnostic (silent construction footage, instrument demonstrations without spoken content), publishers MAY include the same video file in multiple language sheets. The `caption` and `transcript` fields, if present, SHOULD match the sheet's `inLanguage`.

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
### Feature groups

Pagefront Sheets MAY carry a `pagefront:featureGroup` array expressing grouped, ordered technical specifications: the "Specifications" table a product page renders as named sections ("Audio," "Battery," "Connectivity"), each section an ordered list of name/value rows.

The extension trigger is **Schema.org under-specification**: Schema.org's `additionalProperty` carries name/value pairs, but as one flat list. It has no grouping (which section does a row belong to), no ordering (sections and rows render in a merchant-chosen order that carries editorial intent), and no split between the raw comparable value and the merchant's display formatting. Consumers comparing products need the raw values; consumers rendering a spec table need the structure.

The shape is composition over inheritance: only the grouping shell is minted, and the rows inside it stay Schema.org-native `PropertyValue` objects.

Each group carries:

- `@type: pagefront:FeatureGroup` *(required)*
- `name` *(required)*: the group's display name, in the sheet's `inLanguage`.
- `sortOrder` *(optional)*: integer position of the group among its siblings, lowest first. When absent, array order is the display order.
- `feature[]` *(required)*: the group's rows, each a Schema.org `PropertyValue`:
  - `name` *(required)*: the row's display label.
  - `value` *(required)*: the **raw comparable value**, a number where the quantity is numeric (with `unitCode` carrying the UN/CEFACT unit), a string or boolean otherwise. This is the field consumers compare across products.
  - `propertyID` *(optional)*: a stable identifier for the measure. SHOULD be drawn from the Pagefront Property Registry (see "Variant dimensions" above) when a matching entry exists; the registry covers `pagefront:featureGroup` measures (`cpu_cores`, `display_resolution`, `battery_life`, etc.) as well as variant dimensions. Otherwise producer-defined, as in v0.7.
  - `unitCode` *(optional)*: UN/CEFACT unit code for numeric values.
  - `description` *(optional)*: clarifying nuance, as on `QuantitativeValue` in "Product dimensions."
  - `pagefront:presentationValue` *(optional)*: the merchant's display-formatted rendering, when it differs from the raw value.

`pagefront:presentationValue` exists because `PropertyValue` has no field that can carry display formatting cleanly. Merchants render values like "Up to 30 h (ANC on)" where the comparable quantity is `30` `HUR`. The display string carries qualifiers and locale formatting that must not pollute `value` (a consumer comparing battery life needs `30`), and overloading `description` would conflate formatting with explanation. So the raw value goes in Schema.org's `value`, and the display string, when the merchant has one, goes in `pagefront:presentationValue`. When the raw value renders acceptably as-is, omit `pagefront:presentationValue`; most rows need only `value` and `unitCode`.

The audio example below draws `driver_size` and `active_noise_cancellation` from the Pagefront Property Registry (both `status: proposed`). `earcup_fold_mechanism` has no registry entry and is producer-defined: producers MAY mint IDs like it for facets too idiosyncratic to standardize, and consumers MUST treat them as opaque but usable, the same rule the registry gives any unregistered `propertyID` (see "Variant dimensions"). The choice of `earcup_fold_mechanism` as the illustration follows the guidance in "Variant dimensions".

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

Feature groups carry *specifications*: facts with a name and a value. They do not replace `additionalProperty` in its existing structural roles (image/video role declarations, variant axis values, the `age_warning` convention), which continue unchanged. A producer migrating a flat spec list into groups moves the rows; a producer with no grouping on the page can keep emitting flat `additionalProperty`: feature groups are for pages that actually group. A worked example against real merchant content is the Whitebird sheet (v0.9, 2026-08-11). It shows a foil-board size family's spec table promoted from per-variant `additionalProperty` rows, with registry and producer-defined `propertyID`s and dual-unit display strings in `pagefront:presentationValue`.

The row vocabulary (`propertyID` values and their units) follows the `propertyID` rule above; see "Variant dimensions" and "Registry governance" for the registry. The registry is a coordination artifact (convergence by producer opt-in); a registry-*enforced* cross-publisher comparison contract remains open, tracked as open design question #26.

### Product highlights

Pagefront Sheets MAY carry `pagefront:productHighlights`, an ordered array of short, publisher-authored selling-point strings: the merchant's own ranked statement of what matters about this product, as rendered in the page's highlight bullets.

The extension trigger is a **Schema.org gap**: no Schema.org property carries an ordered, publisher-curated highlight list. `description` is continuous prose; `additionalProperty` is specification data; neither expresses "these three points, in this order, are what the merchant leads with." The ordering is part of the signal, so the term is marked `@container: @list` in the JSON-LD context to survive JSON-LD processing, which otherwise treats arrays as unordered sets.

Normative guardrails:

- **Publisher-authored only.** Highlights are the merchant's editorial voice. Auto-generated bullets (summarized from the description, extracted by a pipeline, produced by a model) are excluded, consistent with the spec's stance on generated text in "Textual framing for media": a consumer can summarize the Sheet on its own terms; what it cannot derive is what the *merchant* chose to lead with.
- Each entry is one short selling point in the sheet's `inLanguage`: a phrase or sentence.
- 3–10 entries are recommended. One entry is not a ranking, and past ten the list stops being "what matters most."

The validator's linter (rule PDP-W-022) warns on empty or whitespace-only entries, which typically indicate an extraction failure.

```json
"pagefront:productHighlights": [
  "30-hour battery life with active noise cancellation",
  "Multipoint Bluetooth — paired to two devices at once",
  "Foldable aluminium frame at 220 g",
  "Replaceable ear cushions sold as spare parts"
]
```

### Documents

Pagefront Sheets MAY carry a `pagefront:document` array surfacing typed product-related documents that Schema.org under-specifies on `Product`: manuals, spec sheets, compatibility lists, assembly instructions, care guides, warranty documents, certificates, environmental declarations, audit reports, lab tests, safety data sheets, installation guides, user guides, quick-start cards, brochures.

Each entry has the shape:

- `@type: pagefront:Document` *(required)*
- `url` *(required)*: direct URL to the document, typically PDF.
- `role` *(required)*: closed enum (see below).
- `name` *(recommended)*: human-readable title.
- `inLanguage` *(recommended)*: BCP 47 language tag. MAY differ from the sheet's `inLanguage` when the document is multilingual or is published in a different language than the sheet (a common case for safety data sheets and certification PDFs).
- `description` *(optional)*: short prose describing what the document contains.
- `encodingFormat` *(optional)*: MIME type; defaults to `application/pdf` when omitted.

The closed `role` enum (v0.8):

- `manual`: full product manual.
- `assembly`: assembly instructions.
- `care_guide`: care and maintenance instructions.
- `spec_sheet`: technical specification sheet.
- `compatibility`: a list of products, systems, or standards this product works with. Distinct from `spec_sheet`: a spec sheet states the product's own properties, whereas a compatibility document answers whether it interoperates with something else.
- `warranty`: warranty terms document.
- `certificate`: certification document (e.g., authenticity, compliance).
- `environmental_declaration`: standardized environmental product declaration (e.g. Type III EPD, PEP ecopassport).
- `audit_report`: third-party audit report.
- `lab_test`: laboratory test results.
- `safety_data_sheet`: SDS, typically for chemical or hazardous-material products.
- `installation_guide`: installation instructions distinct from general assembly.
- `user_guide`: user-facing guide distinct from a full manual (typically shorter, task-oriented).
- `quick_start`: quick-start or getting-started card.
- `brochure`: marketing or sales brochure, a promotional overview. It does not serve as an authoritative technical source.
- `repairability_index`: a regulation-driven repairability score document (e.g. the French *indice de réparabilité* label, the EU's emerging repairability labels). Cross-category and regulation-driven. Distinct from `certificate`, on the same rationale that separates `environmental_declaration`: a certificate is a conformity attestation, whereas this is a standardized regulatory disclosure. The document carries the score; a structured repairability *score* field (numeric value, scale, jurisdiction) is not modeled in v0.8 and is recorded as an open design question.
- `recall_notice`: the human-readable recall or safety-notice artifact. Where a corrective measure applies, publishers SHOULD also emit the structured `pagefront:safetyNotice` (see "Safety notices"), so consumers can act on the recall from structured data. The `recall_notice` role links the artifact; it does not replace the structured notice. The division of labor is the same as `compatibility` versus `compatible_with` relationships.
- `declaration_of_conformity`: the manufacturer's self-issued EU Declaration of Conformity underlying CE marking. Distinct from `certificate`: a certificate is issued by a third party (a certification body attesting conformity), whereas a DoC is the manufacturer's own legal declaration.

Additional values require a spec amendment. Category-specific roles (e.g., `dental_imaging_protocol` for medical devices) are out of scope in v0.7; publishers needing category-specific framing SHOULD use the closest enum value and convey specifics in `name` and `description`.

A compatibility document's *contents* are candidates for structured expression. Where the compatible products are identifiable, publishers SHOULD also emit `pagefront:relatedProduct` entries with `relationship: compatible_with`, so consumers can answer compatibility questions from structured data. The `compatibility` document role links the human-readable artifact; it does not replace the relationships themselves where those can be expressed.

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

Products regulated under the EU energy-labelling framework (Regulation (EU) 2017/1369, covering major appliances, light sources, electronic displays, and similar) carry an efficiency class that Schema.org models natively, so Pagefront mints no vocabulary. Declare `hasEnergyConsumptionDetails` on the `Product`, carrying an `EnergyConsumptionDetails` object whose `hasEnergyEfficiencyCategory` is a canonical `EUEnergyEfficiencyEnumeration` URI:

- The rescaled A–G label (mandatory for most product categories since 2021): `https://schema.org/EUEnergyEfficiencyCategoryA` through `https://schema.org/EUEnergyEfficiencyCategoryG`.
- The legacy plus-classes, for categories still labelled under the older scale: `EUEnergyEfficiencyCategoryA1Plus` (A+), `EUEnergyEfficiencyCategoryA2Plus` (A++), `EUEnergyEfficiencyCategoryA3Plus` (A+++).

When the product's label runs on a sub-scale, `energyEfficiencyScaleMax` (the most efficient class on the label) and `energyEfficiencyScaleMin` (the least efficient) MAY bound the scale so consumers can position the class within the label it actually appears on.

The energy label graphic (the standardized colored-arrow artwork) is an artifact. It MAY ride in the `image` array like any product image, or as a `pagefront:document` entry with `role: "certificate"` when the merchant publishes it as a downloadable document (commonly alongside the product information sheet). The structured `hasEnergyConsumptionDetails` declaration SHOULD be present whenever the class is known, whether or not the label graphic is published.

For the legal entities behind a regulated product (the GPSR responsible person, the importer of record), see "Legal entities" below.

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

### Legal entities

Pagefront Sheets MAY carry a `pagefront:legalEntity` array declaring the legal entities behind a product. The driver is regulation: the EU General Product Safety Regulation (GPSR) requires products sold into the EU to name a responsible economic operator established in the EU, and licensed goods routinely separate the brand owner from the licensee that actually manufactures and markets the product. Agents fielding "who is legally behind this product?" (for safety recalls, compliance checks, warranty claims) need the entities *and their roles*.

The extension trigger is **Schema.org under-specification**: Schema.org's `manufacturer` names one organization in one fixed role. It has no typing for the other roles regulation distinguishes (a licensee, an authorized representative, an importer), and consumers cannot dispatch on a role the vocabulary cannot express.

Each entry carries:

- `@type: pagefront:LegalEntity` *(required)*
- `role` *(required)*: closed enum:
  - `brand_owner`: the entity owning the brand under which the product is sold.
  - `licensee`: an entity manufacturing or marketing the product under license from the brand owner.
  - `authorized_representative`: an entity formally appointed to act for the manufacturer in a jurisdiction (the GPSR responsible-person case).
  - `importer`: the entity placing the product on a market it was imported into.
  - `manufacturer`: the entity that manufactured the product.
- `organization` *(required)*: a Schema.org `Organization`, with `name` required and `address` (a `PostalAddress`), `url`, and `email` optional. Compliance declarations typically need the postal address; producers SHOULD populate it when the page or its legal notices carry one. When the organization has its own Commerce Organization Sheet, the entry SHOULD use the reference-stub form instead; see "Referencing a Commerce Organization Sheet" below.

Schema.org's native `manufacturer` field remains valid and unchanged: a Sheet MAY carry both, and simple consumers keep reading `manufacturer` without knowing about roles. `pagefront:legalEntity` is for role-typed, compliance-grade declarations; when both are present and one entry has `role: "manufacturer"`, the two SHOULD name the same organization. A worked example against real merchant content is the Whitebird sheet (v0.9, 2026-08-11). It shows a grounded `brand_owner` entry with postal address, with the ungroundable roles withheld.

#### Referencing a Commerce Organization Sheet

When a `legalEntity` entry's organization has its own Commerce Organization Sheet ([`organization.md`](organization.md)), typically the `brand_owner` and sometimes the `manufacturer`, the Product Sheet SHOULD express the `organization` as a reference stub, omitting the inline name and address:

```json
{
  "@type": "pagefront:LegalEntity",
  "role": "brand_owner",
  "organization": {
    "@type": "Organization",
    "@id": "https://meridiangear.com/#org",
    "pagefront:sheetUrl": "https://meridiangear.com/pagefront/commerce/organization/meridian-gear.en.json"
  }
}
```

The `@id` resolves to the organization sheet the same identity way as `Product.brand` and `Offer.seller`: exact-string `@id` match, per "Product identity and deduplication." `pagefront:sheetUrl` states where that sheet is; the rules for following it are the linking contract in [`organization.md`](organization.md#linking-contract-identity-only). This removes the drift-prone duplication of stable organization data across every product the brand sells.

When the entity is a third party with no sheet, or varies by product or market, it stays fully inline with `name` and `address`. An `authorized_representative` or `importer` (the GPSR responsible person, the importer of record) is the typical case. There is nothing to reference, and GPSR Art. 19 wants the responsible entity resolvable at the listing itself; compliance-grade data stays on the product.

The reference form does not replace the inline form. `authorized_representative` and `importer` are per-product, per-market facts about third parties, and `manufacturer` ≠ `brand_owner` for licensed goods; the manufacturing licensee is named only at the product. The reference form needs no new machinery. A Schema.org `Organization` reduced to `@type` + `@id` is already a reference stub, and the linter's existing stub-vs-inline distinction (PDP-E-001 / PDP-W-020) applies unchanged. A `brand_owner` or `manufacturer` reference stub SHOULD resolve to a Commerce Organization Sheet declaring the matching `pagefront:commerceRole`. The v0.8 schema requires `organization.name`, so the stub form fails Layer 1 until the v0.9 schema makes `name` optional when `@id` is present; the SHOULD above is contingent on that relaxation landing in the same cut. The linter exempts reference stubs from PDP-W-024, the no-postal-address warning, in the same cut, because the address lives on the referenced sheet and the warning would be a false positive on a pure pointer.

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

### Safety warnings

Pagefront Sheets MAY carry a `pagefront:safetyWarning` array expressing the product's safety warnings: the warnings GPSR (Reg. 2023/988) Art. 19 requires distance-selling listings to display, and their equivalents in other jurisdictions.

The extension trigger is a **Schema.org gap**: Schema.org has no product-safety-warning vocabulary. The `age_warning` `additionalProperty` convention (see "Age suitability") predates this field and remains valid for the age case; `pagefront:safetyWarning` is the general, typed form.

Each entry carries:

- `@type: pagefront:SafetyWarning` *(required)*
- `text` *(required)*: the warning, in the sheet's `inLanguage`.
- `pictogram` *(optional)*: URL of the warning pictogram image shown with the warning.
- `hazardCategory` *(optional)*: the hazard class, as an **open vocabulary**. Common values: `choking_hazard`, `suffocation`, `fire`, `electrical`, `chemical`, `entanglement`. Consumers SHOULD treat unknown values as opaque categories, without rejecting them; conventions stabilize through real-merchant use, as with the variant-dimension registry.

Producers SHOULD emit the warnings verbatim as shown on the page. The merchant's published wording is the compliance artifact, and a paraphrase is a new, unreviewed safety statement.

Warnings are language-scoped like all prose fields: a French-language sheet carries French-language warnings. GPSR requires safety information in the language of the member state where the product is sold, and the per-language sibling sheets (`pagefront:availableLanguages`) are the mechanism that satisfies it. A producer publishing into multiple EU markets publishes the warning in each language sheet, one language per sheet.

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

### Safety notices

Pagefront Sheets MAY carry a `pagefront:safetyNotice` array when the product is subject to a corrective measure: a recall or a formal safety warning under GPSR Arts. 35–37 or an equivalent regime. The field is absent on virtually all sheets; it is present only when the product is under a recall or a formal safety warning.

The extension trigger is a **Schema.org gap**: `availability: "https://schema.org/Discontinued"` means "no longer sold." It does not mean "dangerous — return it." Schema.org has no vocabulary for recalls, hazards, or remedies, and a consumer that reads a recalled product's Sheet as merely discontinued fails the buyer.

Each entry carries:

- `@type: pagefront:SafetyNotice` *(required)*
- `noticeType` *(required)*: closed enum, one of:
  - `recall`: the product is recalled; owners should stop using it and pursue the remedy.
  - `warning`: a formal safety warning short of a recall (usage restriction, corrective instruction).
- `hazard` *(optional)*: free-text description of the hazard.
- `remedy` *(optional)*: closed enum, `repair`, `replacement`, or `refund` (the remedy set GPSR Art. 37 obliges the recalling operator to offer).
- `description` *(optional)*: free-text detail on the remedy or the instructions to follow.
- `reference` *(optional)*: URL of the official alert (e.g. the EU Safety Gate entry).
- `datePublished` *(optional)*: ISO 8601 date the notice was published.
- `url` *(optional)*: the publisher's own notice page.

A `recall` notice **overrides commercial signals**. Whatever the Sheet's offers say, consumers SHOULD NOT recommend the product for purchase while a `recall` notice is present, and SHOULD surface the notice and its remedy to a user who owns or is considering the product. The validator's linter (rule PDP-W-023) warns when a `recall` notice coexists with an `InStock` offer, usually a sign the merchant's page has not caught up with the recall.

The `recall_notice` document role links the human-readable notice artifact (see "Documents"); the structured `pagefront:safetyNotice` is what consumers act on, and the document does not replace it. This is the same division of labor as the `compatibility` role versus `compatible_with` relationships.

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

### Related products

Pagefront Sheets MAY carry a `pagefront:relatedProduct` array expressing typed relationships between products. Schema.org has loose relations (`isRelatedTo`, `isSimilarTo`, `isAccessoryOrSparePartFor`, `isConsumableFor`) but these are untyped beyond the four built-in relations and don't carry the typed-relationship semantics agents need for context-aware recommendations. Schema.org's `isAccessoryOrSparePartFor` fuses two distinct relationships into one untyped property. Pagefront separates them: `accessory` (an optional add-on that extends the product) and `spare_part` (a replacement for a component the product already has, ordered on wear or failure). Consumers act on the difference (an accessory is an upsell, a spare part is aftermarket support), so the distinction is typed; the consumer does not have to infer it from the target product's name.

Each entry has the shape:

- `@type: pagefront:RelatedProduct` *(required)*
- `relationship` *(required)*: closed enum (see below).
- A target identifier, in one of two forms:
  - `@id` reference to another Pagefront Sheet (preferred for same-publisher products).
  - A Schema.org identifier on the target object: `sku`, `gtin`, `gtin13`, or `mpn` (for cross-merchant or non-Pagefront-published references).
- `name` *(recommended)*: human-readable name of the related product.
- `url` *(recommended)*: canonical URL of the related product page.
- `image` *(optional)*: a single image URL for rendering the reference in a list without dereferencing. This is a render convenience; it may be stale relative to the target product's own Sheet, which holds the canonical, fully-roled image set. Producers should populate it with the related product's primary identifying image (its hero or packshot). Consumers rendering a related-products carousel may use this image directly; consumers needing current or role-specific imagery should dereference to the target Sheet via `@id` or `url`.

The Schema.org-native relationship fields are parallel: `isRelatedTo`, `isSimilarTo`, and `hasPart` reference a Schema.org `Product`, which carries its own `image` property (a URL or `ImageObject`) via the `additionalProperties: true` policy. The `image` field on `pagefront:relatedProduct` provides the same render-hint capability for typed relationships that the Schema.org `Product` reference already provides for untyped ones. Both are the same convention, an image via Schema.org's `image`, surfaced through different mechanisms because `pagefront:relatedProduct` is a closed Pagefront extension while the Schema.org relationship fields are open.

The closed `relationship` enum (v0.8):

- `accessory`: an optional add-on (lens cap for a camera, strap for a watch).
- `consumable`: a consumable required for ongoing use (ink for a printer, filter for a coffee machine).
- `required_part`: a part required for the product to function (battery sold separately).
- `spare_part`: a replacement for a component of this product, ordered when the original wears out or fails. Distinct from `required_part`: a required part is needed for the product to function at all, whereas a spare part replaces something the product already has.
- `often_bought_with`: frequently purchased together; statistical/behavioral.
- `recommended_with`: a complementary pairing curated by the publisher. The products are intended to go together: the strap with the watch, the top with the pants, the necklace with the earrings, the lens cap with the camera (though that latter case is typically better expressed as `accessory`). The "with" carries semantic weight: the relationship asserts that the related product *pairs* with the source product. This is narrower than the spec's earlier framing. Generic "You may also like" surfaces, where the publisher isn't asserting complementarity, do NOT belong here.
- `replaces`: the current product replaces the named older product.
- `replaced_by`: the current product has been superseded by the named newer product.
- `bundle_component`: part of a published bundle with the named product.
- `compatible_with`: compatible with the named product (a sleeve sized for a specific laptop model).
- `service`: a purchasable service attached to this product: installation, an extended warranty, a maintenance plan. Distinct from `accessory`, which is a physical add-on; a `service` target is a service product the merchant sells against this product. Distinct also from warranty *documents*: a `pagefront:document` entry with `role: "warranty"` carries the terms of the warranty already included with the product, whereas a `service` relationship targets a separately purchasable service (an *extended* warranty is a `service`; the included warranty's terms are a document).

Additional values require a spec amendment.

The "You may also like" pattern, common on small-shop product pages, is brand-internal browsing: the publisher is surfacing other items in their catalog without asserting any complementarity claim. This belongs in Schema.org's native `isRelatedTo` (without `description`, since the framing prose carries no semantic content beyond generic adjacency). The same applies at any catalog scale: when the publisher isn't asserting complementarity, the relationship is adjacency. See the patterns guidance below for the full mapping.

#### Operationally-tracked vs. marketing-curated relationships

The typed relationships in the closed enum divide along a scale-dependent line in how publishers declare them.

Some are **operationally tracked** by publishers regardless of catalog size: `accessory`, `consumable`, `required_part`, `spare_part`, `replaces`, `replaced_by`, `bundle_component`, `compatible_with`, and `service`. These relationships reflect business operations (inventory, product hierarchy, parts management, lifecycle, service offerings) that publishers maintain because commerce requires them. A publisher with 10,000+ SKUs still knows which products are accessories of which, because it must manage that inventory.

Others are **marketing-declared**: `often_bought_with` and `recommended_with`. These work cleanly at small catalog scales where marketing teams hand-curate pairings. At larger scales, the same relationships are typically generated by recommendation engines (SearchSpring, Dynamic Yield, Algolia Recommend, Shopify recommendations) and displayed in publisher-controlled UIs but not individually declared by the publisher.

Producers SHOULD use typed enum values for relationships the publisher has declared itself: operationally-tracked data, or hand-curated marketing pairings. Producers SHOULD NOT coerce algorithmic recommendation-engine output into typed enum values; these are publisher-surfaced without being publisher-declared, and belong in Schema.org's native `isRelatedTo` (Pattern 5 in the relationship-patterns guidance below).

For the marketing-shaped values specifically:

- `often_bought_with`: Use when the publisher has explicitly identified a co-purchase pattern (sometimes surfaced as a merchandising rule, sometimes manually curated as "frequently bought together"). Do NOT use for raw recommendation-engine output even when the engine claims to compute co-purchase data; the engine's output goes to `isRelatedTo` unless the publisher has reviewed and endorsed specific pairings.
- `recommended_with`: Use when the publisher has manually curated a pairing in their content management system (a marketing editor selecting "this product pairs with this one"). Storyblok's `linked_products` field with editor-populated values is a representative example. Do NOT use for recommendation-engine output even when displayed in a "Recommended" UI section; the engine's output goes to `isRelatedTo`.

Rule-based generation is an intermediate case. When a publisher defines a rule that produces relationships (e.g., "show all watch straps for any watch product"), the rule itself is a publisher declaration, but each specific pairing is generated by the rule. Producers SHOULD treat these as `isRelatedTo`, since the publisher's declaration is at the rule level and no specific pairing was individually curated.

#### The structured-identifier requirement

Beyond whether the publisher typed the relationship, `pagefront:relatedProduct` has a structural prerequisite: each entry must carry at least one structured identifier: `@id` (URL-shaped), `sku`, `gtin`, `gtin13`, or `mpn`. The JSON Schema enforces this via `anyOf`; a reference with only `name` and `url` does not validate as a `pagefront:relatedProduct` entry. The reason is the typed extension's contract: a typed relationship implies the consumer can act on the target (dereference it, fetch its Sheet, compare offers), and a name plus a link is too thin for that.

Schema.org's `isRelatedTo` carries no such requirement. A reference with only `name` and `url` is a valid Schema.org `Product` reference, permitted via the `additionalProperties: true` policy on Schema.org-typed blocks.

A producer should therefore use `pagefront:relatedProduct` only when BOTH conditions are met:

1. **Is the relationship publisher-typed?** (Operational data, manual editor curation, explicit merchant tagging; see the operational-vs-adjacency guidance above.)
2. **Does the source data carry a structured identifier?** (`sku`, `gtin`, `gtin13`, `mpn`, or an `@id` derived from a stable identifier.)

If either fails, the reference belongs in `isRelatedTo`. A typed relationship without a structured identifier is still untyped from the schema's perspective, because the consumer can't act on the typing without something to dereference. An algorithmic recommendation that happens to carry a SKU is still untyped from the operational perspective, because the publisher never declared the relationship type.

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

#### Five patterns for product-to-product relationships

Product-to-product relationships in Pagefront Sheets come in five recognizable patterns, each with a distinct Schema.org or Pagefront field. Producers should choose the field that matches the relationship's actual semantics.

**Pattern 1: `pagefront:relatedProduct` with a typed enum value.** For operationally-tracked relationships (`accessory`, `consumable`, `required_part`, `spare_part`, `replaces`, `replaced_by`, `bundle_component`, `compatible_with`, `service`), where the relationship type changes consumer behavior. Use when the merchant's operational data declares the typed relationship explicitly. See the typed-enum guidance above for full details.

**Pattern 2: Schema.org `isSimilarTo`.** For products the publisher asserts are similar: same kind, same use case, same general category. Schema.org defines `isSimilarTo` as products "of approximately the same kind." Use when the merchant surfaces "similar styles" or "alternatives" (products that could substitute for the source product).

**Pattern 3: Schema.org `isPartOf` / `hasPart` for family or collection membership.** When the source product belongs to a named collection or family and the relationship being expressed is "siblings within that family," the right model is the family itself as a first-class entity. Use `isPartOf` to declare the source product's membership in the family; the family entity carries `hasPart` pointing at sibling members. These siblings belong to the same family. A plain "related" reference to the source product would lose that membership. The family entity can be modeled as a Schema.org `Collection` or `ProductGroup` with `name`, `url`, and `hasPart` entries. A future collection sheet type would address this case more directly; none is defined in 0.9.

Pattern 3 also covers **named family and series hierarchies**: a brand whose catalog is organized as family → series → product, the way Apple's iPod family contained the Touch series. The hierarchy is expressed by nesting: the product declares `isPartOf` its series, and the series entity itself declares `isPartOf` the family. Two levels of `isPartOf` carry the full lineage; consumers walk up as far as the Sheet nests. Each level is a `Collection` (a curated grouping of distinct products) or a `ProductGroup` (when that level's members are variants of one product):

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

The nesting depth is the producer's choice: a Sheet MAY declare only the immediate series when the family adds nothing consumers act on, and MAY nest further when the merchant's catalog has more levels. Sibling enumeration stays where it was: the series entity's `hasPart` lists the series' members, as in the single-level case above.

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

v0.8 carries qualitative relationships only. Weighted relationships (e.g., `often_bought_with` with a percentage) are not modeled; see the open design questions section.

#### Bundles

Bundles appear in two structurally different forms, and they use different vocabulary.

**Bundle as relationship.** Separately-sellable products bundled WITH a primary product. Picture a paddle board sold with a set of accessories (a wheelie backpack, a carbon paddle, a hand pump, a fin, a leash), each separately priced and separately sold, bundled with the board. From the board's perspective, each is a `bundle_component`: use `pagefront:relatedProduct` with `relationship: bundle_component` and a structured identifier (`sku`, `gtin`, `@id`) for each. Each component is a real product the merchant sells; the relationship declares it travels with the board.

**Bundle as product.** A bundle that is itself a sellable entity, with its own name, price, and product page, composed of named component products. Picture a "kayak conversion bundle" sold as a single purchasable unit at its own discounted price, a paddle board plus the parts that convert it to a kayak. That bundle is a product in its own right. It does not belong in the relationship fields. Model it with Schema.org's `ProductCollection` type, which Schema.org defines for this case (a set of products offered together, e.g. a camera plus a lens). Use `includesObject` pointing at `TypeAndQuantityNode` entries to list the component products and their quantities, and an `Offer` for the bundle's price.

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

Reserve `bundle_component` for components that ship WITH the product being described. A separately-sold bundle that another product's Sheet links to is its own `ProductCollection`, in its own Sheet. It is referenced from elsewhere with `pagefront:relatedProduct`, typically `recommended_with` or `accessory`, since the referencing product functions without it; `bundle_component` does not apply because the bundle does not ship with the referencing product.

A "bundled with" component sometimes can't be resolved to a structured identifier: the page names and prices it but exposes no link or SKU, and the producer can't resolve it via catalog lookup, platform API, or sitemap. Because `pagefront:relatedProduct` requires an identifier, such a component can't be a `bundle_component`. Keep it in the Sheet, because the buyer still receives it. Use Schema.org's `hasPart`, which has no identifier requirement; a `hasPart` entry with only a `name` is valid (add price via `additionalProperty` or an embedded `Offer` if the page shows it). The resolution order for "included with" components is: (1) resolve to an identifier → `pagefront:relatedProduct` with `bundle_component`; (2) resolution fails → Schema.org `hasPart` with the name (and price if shown); (3) in either case the component stays in the Sheet.
### Offers

Offer core shape: `price`, `priceCurrency`, `availability`, `itemCondition`, `seller`, `areaServed` / `eligibleRegion`, `acceptedPaymentMethod`, and `warranty` when the page states one. (v0.9 removes `hasMerchantReturnPolicy` and `shippingDetails` from this routine list; see "Return policy" below. Both fields remain valid as per-product overrides of the seller sheet's store-wide terms.)

`price` on a consumer Offer is the **displayed consumer price for the offer's declared region**: the unit amount a consumer in that region is shown and pays for the item itself, in `priceCurrency`, at the moment the sheet was generated. Where that region's consumer-protection law requires displayed prices to include value-added tax, `price` includes it. Where the prevailing convention displays prices before sales tax added at checkout, `price` excludes it. In both cases `price` excludes shipping, which is declared on `shippingDetails` or resolved from the seller sheet's `pagefront:fulfillmentTerms`.

The meaning follows EU price-indication law, which defines the price a trader must display to a consumer as the final unit price including VAT and all other taxes: Directive 98/6/EC, Article 2(a) ("selling price shall mean the final price for a unit of the product, or a given quantity of the product, including VAT and all other taxes"), as amended by Directive (EU) 2019/2161, consolidated text in force since 28 May 2022. The shipping exclusion follows Directive 2011/83/EU, Article 6(1)(e), under which freight, delivery and postal charges are disclosed as additional charges beside the total price. That article governs the checkout-time total price, and it is cited here for the shipping exclusion alone.

A producer MUST NOT publish, as `price`, an amount the consumer is never shown. In particular, a tax-exclusive amount obtained from a platform API whose store is configured to display prices excluding tax fails this rule in a region where the displayed price must include VAT. This is a producer obligation. A linter can detect a missing tax-basis statement (PDP-W-028); whether a stated basis is true lies beyond what any linter can check. "Tax inclusion" under "Common pricing patterns" says how to state the basis.

The `availability` and `itemCondition` values are canonical Schema.org URIs (`InStock`, `OutOfStock`, `PreOrder`, `NewCondition`, `UsedCondition`, etc.). Both `http://schema.org/` and `https://schema.org/` scheme variants are accepted; consumers SHOULD treat them as semantically equivalent. The HTTPS form is canonical and recommended for new sheets.

#### Return policy

The store-wide return policy is a property of the seller. It lives on the seller block of the seller's Commerce Organization Sheet ([`organization.md`](organization.md)) as `hasMerchantReturnPolicy`, stated once, so it does not duplicate and drift across Product Sheets.

A Product Sheet carries return terms only when the product deviates from the store default: a final-sale item, or a made-to-order product, whose returns exceptions already live in `pagefront:madeToOrderTerms` and stay there. Consumers resolve return terms by reading the product's own return terms if present; otherwise they follow `Offer.seller` to the seller's Commerce Organization Sheet and use its store-wide policy. The seller sheet is located by the reference's `pagefront:sheetUrl` and resolved per the linking contract in [`organization.md`](organization.md#linking-contract-identity-only), which places it on the product sheet's own host: terms are inherited only from that sheet. When the seller sheet cannot be resolved (no `pagefront:sheetUrl`, a failed host check, or an `@id` or role mismatch), the inherited terms are unknown. A consumer draws no conclusion about the product's return policy from its silence.

This is the format's one semantic cross-sheet dependency: answering "can I return this product" may require the seller sheet when the product is silent. The read rides the existing `Offer.seller` edge and stays `@id`-keyed for identity; `pagefront:sheetUrl` on the seller reference says where the seller sheet is. It is scoped to return and shipping terms; it does NOT generalize to other fields.

Shipping follows the same default-plus-override pattern, via minted vocabulary: store-wide shipping terms live on the seller sheet as `pagefront:fulfillmentTerms`, an array of Schema.org-native `OfferShippingDetails` objects, and an Offer carries `shippingDetails` only when the product deviates from those terms (bulky items with their own shipping rates, made-to-order lead times). Resolution is the same product-else-seller rule as returns: read the Offer's own `shippingDetails` if present, otherwise follow `Offer.seller` to the seller sheet's `pagefront:fulfillmentTerms`, with the seller sheet located and checked as for returns. Terms are inherited only from the seller sheet the linking contract resolves on the product sheet's own host; when none resolves, the shipping terms are unknown. (The term itself is minted in the vocabulary alongside the Commerce Organization Sheet.)

A warranty is a separate matter from returns and has its own section: see "Warranty" below.

#### Warranty

A warranty the page **states** ("2-year warranty", "lifetime warranty on manufacturing defects") is a `WarrantyPromise`. A warranty **document** (the terms as a file) is a `pagefront:document` entry with `role: "warranty"` (see "Documents"). A page may carry both.

**Who gives it decides where it goes.**

- A warranty given by the **seller** is part of the offer and lives on the Offer as Schema.org's `warranty`. Schema.org defines `warranty` on `Offer` (and `Demand`) only.
- A warranty given by the **manufacturer** belongs to the product, follows it across every retailer, and is claimed against the manufacturer. It lives on the Product as `pagefront:manufacturerWarranty`, whose value is a `WarrantyPromise`. Schema.org has no product-level warranty property, so this is where a manufacturer's own sheet, which may carry no Offer at all, states its warranty.

A retailer's sheet may carry both: the manufacturer's warranty on the Product and its own on the Offer. The distinction matters to consumers because the claim path and the portability differ.

**When the page does not say who gives it,** record the statement on the Offer as `warranty`. Place it in `pagefront:manufacturerWarranty` only when the page names the manufacturer as the guarantor.

**Shape.** A `WarrantyPromise` carries:

- `durationOfWarranty` — a `QuantitativeValue` with `value` and a UN/CEFACT `unitCode` (`ANN` years, `MON` months, `DAY` days), when a finite length is stated.
- `description` — the statement as written on the page.
- `name` (optional) — a short label ("Lifetime Warranty"); `WarrantyPromise` inherits `name` from `Thing`.
- `warrantyScope` (optional) — Schema.org's scope of the promise, where the page states one.

Where the page states no finite length (a lifetime warranty), omit `durationOfWarranty` and carry the statement in `description`. Do not encode "lifetime" as a large number.

**Multiple region-scoped Offers.** Each Offer carries its own `warranty`. Where the warranty is the same across markets the entries are identical; where it differs by market, each Offer states its own.

**Commercial warranty only.** `warranty` records the commercial promise as the page states it. Producers MUST NOT synthesize a warranty from a statutory minimum (such as a legal conformity guarantee) when the page states none.

**Paid extended warranties are out of scope.** Cover sold separately ("add 3-year protection for €49") is a distinct product with its own price; where the page offers it, it is a `service` relationship (see "Related products"). It is never carried in `warranty`.

A seller's warranty on the Offer:

```json
{
  "@type": "Offer",
  "price": "2299.00",
  "priceCurrency": "EUR",
  "areaServed": "FR",
  "availability": "https://schema.org/InStock",
  "warranty": {
    "@type": "WarrantyPromise",
    "durationOfWarranty": { "@type": "QuantitativeValue", "value": 2, "unitCode": "ANN" },
    "description": "All our boards come with a 2-year warranty."
  }
}
```

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

The validator's linter (rule PDP-W-030) warns when a `warranty` or `pagefront:manufacturerWarranty` entry carries neither `durationOfWarranty` nor `description`.

#### Trust strips

Product pages often display a strip combining several commitments ("2-year warranty · 30-day returns · free delivery"). Each fact has its own home; producers split the strip rather than storing it as one string:

- Warranty statement → `warranty` on the Offer, or `pagefront:manufacturerWarranty` on the Product (see "Warranty").
- Returns → `hasMerchantReturnPolicy` on the Offer, or the seller sheet's default (see "Return policy").
- Delivery cost, destination and timing → `shippingDetails` on the Offer, or the seller sheet's `pagefront:fulfillmentTerms`.
- Delivery modes → `availableDeliveryMethod` on the Offer (see "Delivery").

A fact the strip states that none of these can hold stays in the product's prose and is left out of the structured fields.

#### Delivery

Pages describe how the customer receives an item as "delivery". Schema.org files delivery cost, destination and timing under `shippingDetails` (`OfferShippingDetails`: `shippingDestination`, `shippingRate`, `deliveryTime` with handling and transit time); the property name is Schema.org's and is used unchanged.

The delivery **mode** is a separate fact. Offers state the modes available with Schema.org's `availableDeliveryMethod`, whose value is a `DeliveryMethod`, and a pickup location with `availableAtOrFrom`, whose value is a `Place`. The `DeliveryMethod` enumeration has three members (Schema.org 30.1): `https://schema.org/ParcelService`, `https://schema.org/OnSitePickup`, and `https://schema.org/LockerDelivery`. Click-and-collect and in-store pickup are `OnSitePickup`; locker delivery is `LockerDelivery`. These are delivery modes and are declared there; they are never approximated in `shippingDetails`.

#### itemOffered references

When a sheet declares multiple offers (typically a `ProductGroup` with multiple variants in `hasVariant`), each `Offer` SHOULD reference its target variant via `itemOffered: { "@id": "..." }`:

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

The `@id` reference must resolve to an entry in `hasVariant` or to the root product `@id`. The validator's linter (rule PDP-E-001) flags broken `@id` references.

For single-Offer sheets where the `itemOffered` is unambiguously the root product, the `itemOffered` field MAY be omitted; Schema.org consumers will infer it from the Offer's position on the Product.

#### Product identity and deduplication

Consumers frequently encounter the same product referenced from multiple Sheets: a product's own Sheet, and references to it via `isRelatedTo`, `isSimilarTo`, `isPartOf`/`hasPart`, or `pagefront:relatedProduct` from other Sheets. To recognize these as the same product (deduplication), consumers rely on identity, and the identity key is `@id`.

- **`@id` is the identity key.** Per JSON-LD semantics, two references carrying the same `@id` denote the same product. Consumers deduplicate on `@id`.

- **`@id` matching is exact-string.** JSON-LD does not normalize `@id` values before comparison. Two `@id`s that differ as strings, such as by a locale prefix (`/en-fr/`), a trailing slash, a query parameter, or a `?variant=` suffix, do NOT match even when they are semantically equivalent, and dedup fails. Producers MUST emit the identical `@id` string for a product everywhere it appears: in the product's own Sheet and in every reference to it from other Sheets. A reference whose `@id` differs from the target product's own declared `@id` breaks deduplication even when both point at the same product.

- **Secondary-identifier fallback.** When a producer cannot construct a consistent `@id` for a reference (typically because the referenced product's identity cannot be resolved from the referencing context), the reference SHOULD carry a stable secondary identifier (`sku`, `gtin`, `gtin13`, `mpn`, or `productID`) so consumers can deduplicate on identity even when `@id`s are absent or inconsistent. Consumers SHOULD deduplicate on `@id` when present and consistent, and fall back to matching on these identifiers otherwise. When `gtin` or `gtin13` carries an array of GTINs (see "Multiple GTINs"), a match on *any* listed GTIN is a valid fallback match; every listed GTIN identifies the product.

Producers are free to derive `@id` by any stable, deterministic rule (from the canonical URL, from a SKU, or otherwise); the spec does not prescribe the derivation. What the spec requires is consistency: the same product yields the same `@id` string across its own Sheet and all references to it. Producers deriving `@id` from a URL must normalize that URL consistently across both paths, or dedup will silently fail on normalization differences.

##### Cross-merchant canonical reference via `sameAs`

A reseller's Sheet describes the reseller's own page for a product whose brand publishes a canonical page of its own. The reseller's Sheet SHOULD carry Schema.org's `sameAs` pointing at the brand's canonical product page, so consumers can connect the reseller's listing to the manufacturer's authoritative presentation of the same product: for enrichment, for cross-merchant offer comparison, and for clustering listings of one product across sellers.

`sameAs` is a deduplication hint. `@id` is the identity key, matched as an exact string as defined above: consumers deduplicate on `@id` when present and consistent, fall back to secondary identifiers (`sku`, `gtin`, `gtin13`, `mpn`, `productID`) otherwise, and MAY use a shared `sameAs` target as an additional correlation signal when clustering cross-merchant listings. A shared `sameAs` target does not merge two products whose identifiers otherwise differ, and a missing or divergent `sameAs` does not break an `@id` or identifier match.

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

#### Price-on-request offers

Some merchants intentionally publish no price. Authorized-retailer models (luxury watches, high-end jewelry), quote-based pricing (industrial equipment, bespoke commissions), and regional-reseller routing all share the same pattern: the merchant's product page is real, the product is real, and the price lives behind a contact channel. When a Sheet reflects such a product, the Offer SHOULD declare `pagefront:priceOnRequest`.

An Offer carrying `pagefront:priceOnRequest` is exempt from the otherwise-required `price` or `priceSpecification`. All other Offer fields apply normally: `availability`, `itemCondition`, `seller`, `shippingDetails`, `areaServed`, and so on. `priceCurrency` remains useful even without `price`: it signals what currency the eventual price will be quoted in.

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

- `authorized_retailer`: the merchant routes buyers to a curated network of brand-authorized retailers (luxury watches, high-end audio).
- `dealer_network`: similar in structure to `authorized_retailer` but used for industrial and commercial products with regional dealer coverage.
- `quote_form`: the merchant provides a structured intake form that produces a quote (made-to-measure, custom configurations, B2B bulk).
- `email`: the merchant directs buyers to an email address for pricing.
- `phone`: the merchant directs buyers to a phone number for pricing.
- `unspecified`: the merchant has no structured inquiry channel; the product is on the page but the path to pricing is left to the buyer to discover.

Additional values require a spec amendment.

The validator's linter (rule PDP-W-016) warns when an Offer has commercial structure (availability, itemCondition, or other Offer fields are present) but lacks both `price`/`priceSpecification` and `pagefront:priceOnRequest`. This catches extraction failures (cases where a price exists on the merchant's page but the pipeline didn't capture it) while letting intentional omissions through.

For made-to-order products, see `pagefront:madeToOrderTerms` below.

For configurable products, see `pagefront:configurator` below. An offer states the prices of a configurator through `pagefront:configuratorPricing`; see "Configurator pricing and price bands."

For site-level promotions, see `pagefront:promotions` on each Offer.

#### Common pricing patterns

Real merchants express pricing in shapes beyond a single `price` + `priceCurrency` pair: regular-vs-sale prices, ranges across variants, quantity-tier discounts, and shipping declared alongside the price. Schema.org covers each natively, so Pagefront mints no typed extensions for them; the patterns below are collected here so producers can reach for them directly.

##### Amounts

An amount is carried in one of two JSON types: a JSON number (`2299`, `2299.5`), or a decimal string (`"2299.00"`). A decimal string has a dot as its decimal point, no thousands separators and no currency symbol; the currency is always stated beside the amount, in `priceCurrency` or `currency`. Both carriers are allowed because Schema.org accepts both for `price`.

A Sheet uses one carrier for all its amounts. That covers every field that carries a currency amount: `price` on an Offer and on a `priceSpecification` entry, `lowPrice` and `highPrice` on an `AggregateOffer`, the `value` of a `MonetaryAmount` wherever it appears (shipping rates, order-value thresholds), `price` render hints on `hasVariant` entries, `discountAmount` on a promotion, and `basePrice`, every modifier and every adjustment's `priceModifier` in a `pagefront:configuratorPricing` block. A Sheet that carries some amounts as numbers and others as strings is an authoring error (linter rule PDP-E-015).

A decimal string is recommended when amounts have fractional parts, because JSON numbers are floating point: `"19.99"` is exactly what it writes, and a consumer summing strings in decimal arithmetic gets exact totals. Whole amounts lose nothing as numbers.

Prices are zero or positive: an Offer's `price`, the bounds of an `AggregateOffer`, a `basePrice`, a variant's price hint and a `discountAmount` take no leading minus. Only modifiers and adjustment amounts are signed, since an option can cost less than the base option.

Consumers and the linter compare amounts numerically whatever the carrier: `349`, `349.0` and `"349.00"` are the same amount.

##### Sale pricing (regular price plus current discounted price)

When a product is on sale, declare both the regular price and the current price as `UnitPriceSpecification` entries on the Offer, distinguished by `priceType` (Schema.org defines `priceType` on `UnitPriceSpecification`). Use `https://schema.org/ListPrice` for the regular (pre-discount) price and `https://schema.org/SalePrice` for the current price. The Offer's top-level `price` field SHOULD mirror the `SalePrice` so simple consumers that read only `price` see the current selling price.

```json
{
  "@type": "Offer",
  "price": "149.00",
  "priceCurrency": "EUR",
  "priceSpecification": [
    {
      "@type": "UnitPriceSpecification",
      "priceType": "https://schema.org/ListPrice",
      "price": "199.00",
      "priceCurrency": "EUR"
    },
    {
      "@type": "UnitPriceSpecification",
      "priceType": "https://schema.org/SalePrice",
      "price": "149.00",
      "priceCurrency": "EUR"
    }
  ]
}
```

##### Tax inclusion

The tax basis of a price is a property of the (offer, region) pair. Whether tax is included is jurisdictional: EU and UK displayed prices include VAT, while US prices conventionally exclude sales tax added at checkout. The amount is jurisdictional too: under destination-based VAT the same product carries different gross prices across member states. A sheet's several region-scoped Offers may therefore each carry a different basis, and neither the sheet nor the seller has a single basis of its own.

Producers SHOULD state whether `price` includes value-added tax, using Schema.org's `valueAddedTaxIncluded` on a `UnitPriceSpecification` entry. An Offer that already carries `priceSpecification` entries sets the flag on each. An Offer carrying only `price` adds one entry mirroring it:

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

`UnitPriceSpecification` is the recommended type for the entry, including an entry that carries only `valueAddedTaxIncluded`, as on an `AggregateOffer`, where there is no single `price` to mirror. Two reasons. It is the type the sale-pricing pattern above already uses with `priceType`. And it is the type consumers of Schema.org offer markup document for `priceSpecification` entries: Google's merchant listing documentation names `UnitPriceSpecification` and no other price specification type, so the flag sits on the entry type those consumers already parse. An entry of this type needs no unit to carry the flag. `valueAddedTaxIncluded` is defined on its parent `PriceSpecification`, so an existing plain `PriceSpecification` entry carries the flag as well. Where a mirroring entry's `price` disagrees with the Offer's `price`, the Offer's `price` is authoritative; the disagreement is an authoring error (rule PDP-E-004).

`valueAddedTaxIncluded: false` is the correct statement for a trade or B2B sheet quoting net prices, and for regions whose displayed prices exclude sales tax. Directive 98/6/EC governs products offered by traders to consumers; net pricing on a trade sheet falls outside its scope. The flag is a statement about `price`: consumers do not compute tax from it, and do not derive one amount from the other.

When the flag is absent, consumers read `price` as the displayed consumer price per the rule above and cannot tell whether tax was included.

**Establishing the tax basis.** A producer reading a platform API must establish the basis of the amount it receives; the basis is usually determinable even when the region is not. In order of strength: explicit URL or route signals (a country query parameter, a locale path segment, a ccTLD, `hreflang` alternates); a merchant statement ("all prices include VAT", a tax or shipping page, terms and conditions); a platform store-level tax-display setting where exposed; currency as a proxy for the basis alone (a euro storefront implies the inclusive convention and leaves the member state, and so the rate, open); the seller's establishment market, defensible for a single-market storefront only.

**When the basis cannot be established.** Publish what is known and mark what is not, in this order of preference. Basis known and region unknown: publish the offer with the flag set and no `areaServed`. Neither known, and the merchant's page shows a rendered price: prefer the rendered storefront price over any API amount, publish it, omit the flag. Only a platform amount of unknown basis available: do not publish it as `price`. Publish the sheet without an offer, which is a valid state, or route the offer to review. An offer-less sheet is preferable to an offer of unknown basis: the first is honestly incomplete, the second is silently wrong.

**Prices that cannot state a basis.** `hasVariant[].price` render hints carry no region and no `priceSpecification`, so they cannot state a tax basis. A `pagefront:configurator` carries no prices; the amounts in a `pagefront:configuratorPricing` block sit inside an offer and take their currency, region and tax basis from it, so they are as authoritative as that offer's `price`. Render hints are non-authoritative display hints: consumers MUST NOT use them for computation or for quoting a price to a buyer, and MUST resolve the region-matched `Offer` for an authoritative amount. `AggregateOffer` is an offer type and carries its own `areaServed` and `priceSpecification` like any other offer.

A VAT-inclusive price depends on a rate that can change. Sheets carrying region-scoped offers SHOULD use shorter `expires_at` windows, consistent with the existing guidance for multi-currency offers and scheduled promotions.

##### Price ranges (product available across a range of prices)

When a product is available across a span of prices (typically a `ProductGroup`-style listing where individual variant prices aren't broken out, or a product with size- or material-based pricing tiers), use `AggregateOffer` at the Offer position with `lowPrice`, `highPrice`, and `priceCurrency`.

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

As of v0.9 this per-offer form is the deviation override; see "Return policy" above for the store-wide default on the seller sheet and the resolution rule.

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

Agents routinely need to answer "is this product current?": on the market, not yet released, or discontinued and superseded. Schema.org and the existing relationship enum cover each lifecycle signal, so Pagefront mints no vocabulary.

- **Market availability.** `releaseDate` (Schema.org-native on `Product`) declares when the product reached, or will reach, the market. A future `releaseDate` pairs naturally with Offer `availability: "https://schema.org/PreOrder"`.
- **End of life.** A discontinued product's Offer declares `availability: "https://schema.org/Discontinued"`. The Sheet stays published: the page usually outlives the product, and the Sheet is how agents learn that the product is discontinued, as distinct from out of stock.
- **Succession.** When a successor exists, the discontinued product's Sheet SHOULD pair the `Discontinued` availability with a `pagefront:relatedProduct` entry of `relationship: "replaced_by"` pointing at the successor, so a consumer landing on the old product can route the buyer forward. The successor's own Sheet carries the inverse `replaces` entry pointing back.

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

### Project extensions (pagefront: namespace)

The full set, with v0.7 additions marked:

- `pagefront:sizeChart`: structured size charts for apparel
- `pagefront:materialComposition`: decomposed materials with optional purity, provenance, weight
- `pagefront:manufacturingChain`: multi-stage manufacturing provenance
- `pagefront:construction`: construction notes (composite, knitwear, jewelry, etc.)
- `pagefront:configurator`: combinatorial product configuration spaces (the option space; it carries no prices)
- `pagefront:configuratorPricing` *(added 2026-10-01)*: on an `Offer` or `AggregateOffer`, the price list for the configurator the offer names (see "Configurator pricing and price bands")
- `pagefront:madeToOrderTerms`: economics for made-to-order products
- `pagefront:gemstone`: typed gemstone descriptions with grading
- `pagefront:promotions`: site-level promotional codes scoped to product / category / site_wide
- `pagefront:availableLanguages`: cross-language navigation hints
- `pagefront:priceOnRequest`: explicit declaration that price is intentionally not published (authorized retailers, quote requests, etc.)
- `pagefront:document` *(new in v0.7)*: typed product documents (manuals, spec sheets, certificates, safety data sheets, etc.)
- `pagefront:relatedProduct` *(new in v0.7)*: typed relationships between products (accessory, consumable, replaces, compatible_with, etc.)
- `pagefront:sizeRecommendation` *(new in v0.7)*: fit guidance relative to labeled size (runs small/large, recommended size adjustment)
- `pagefront:featureGroup` *(new in v0.8)*: grouped, ordered technical specifications (groups of Schema.org `PropertyValue` rows)
- `pagefront:productHighlights` *(new in v0.8)*: ordered, publisher-authored selling-point strings
- `pagefront:legalEntity` *(new in v0.8)*: role-typed legal entities behind the product (brand owner, licensee, authorized representative, importer, manufacturer)
- `pagefront:safetyWarning` *(new in v0.8)*: typed, language-scoped product safety warnings (GPSR Art. 19)
- `pagefront:safetyNotice` *(new in v0.8)*: structured recall/safety notices with hazard and remedy (GPSR Arts. 35–37)
- `pagefront:manufacturerWarranty` *(new in v0.9)*: a warranty given by the manufacturer, stated on the Product as a Schema.org `WarrantyPromise` (see "Warranty")

Pre-v0.8 definitions are unchanged from v0.7; see the vocabulary document for full field specifications.

### Materials: `material` and `pagefront:materialComposition`

Pagefront Sheets carry material information in two complementary fields:

- `material` (Schema.org native): a flat string giving a one-line summary of what the product is made of. Examples: `"leather"`, `"Harmonie leather"`, `"Goyardine Canvas & Chevroches Calfskin"`, `"904L stainless steel"`. Quick to scan, useful for simple consumers that don't want structure.
- `pagefront:materialComposition` (Pagefront extension): a structured array of typed `pagefront:Material` objects. Each entry can carry percentage, purity (free-text or numeric), provenance (closed enum: `virgin`, `recycled`, `fair_mined`, `lab_grown`, `reclaimed`, `deadstock`), and weight in grams. Useful for sophisticated consumers doing comparison, filtering, sustainability analysis, or authentication.

The two fields complement each other. Producers should populate both when the data supports both. A Sheet declaring `material: "Harmonie leather"` and `pagefront:materialComposition: [{"material": "Harmonie leather"}]` is valid and useful: the flat string answers simple queries, the structured entry leaves room for the decomposition to grow when more data is available.

For multi-material products without percentages (common in luxury goods where named materials matter more than proportions), both fields work: `material: "Goyardine Canvas & Chevroches Calfskin"` plus `materialComposition` with two entries, each declaring just the material name. The `percentage` field is optional; the PDP-W-005 linter rule only fires when percentages are present and don't sum to ~100.

For textile and apparel products where percentages are meaningful, the structured entries carry percentages. Mixed cases (a leather bag with a percentage-relevant lining) can declare some entries with percentages and others without.

Note: `pagefront:fabricComposition` is an alias restricted by convention to textile cases. Same value shape as `materialComposition`. Use when the prose distinguishes fabric from overall composition (common in apparel with linings, trims, padding).

### Size guidance: `pagefront:sizeChart` and `pagefront:sizeRecommendation`

The two fields divide as follows:

- `pagefront:sizeChart` (and Schema.org's `SizeSpecification` / `hasMeasurement`) carry measurements: size codes and body/garment measurements. They answer "what are the dimensions of each size."
- `pagefront:sizeRecommendation` (Pagefront extension) carries fit relative to the labeled size: whether the product runs small/true/large, and any recommended adjustment from the customer's usual size. It answers "how does this fit compared to its label," which Schema.org's size vocabulary does not express.

`pagefront:sizeRecommendation` is a single object with:

- `fitProfile` *(optional)*: closed enum: `runs_small`, `true_to_size`, `runs_large`.
- `sizeAdjustment` *(optional)*: a recommended offset from the customer's usual size: `direction` (`up`/`down`), `magnitude` (number, e.g. `0.5`), and `sizeSystem` (use Schema.org `SizeSystemEnumeration` values, e.g. `WearableSizeSystemEU`).
- `description` *(optional)*: product-specific rationale ("the wavy band sits differently, so we recommend half a size down") for a human to read.
- `appliesTo` *(optional)*: `@id` or axis identifier for which variant the guidance applies to.

When the Sheet also carries a sizing dimension in `pagefront:configurator`, `sizeAdjustment.sizeSystem` MUST be the system of that dimension (`WearableSizeSystemUK` for `system: "UK"`, and so on). If the merchant states the advice in another system, keep the merchant's wording in `description` and omit `sizeAdjustment`: converting between size systems is an inference, and a Sheet does not carry inferences. Linter rule PDP-E-014 flags the mismatch, and PDP-W-039 records advice carried as prose only.

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

## Sheet filename convention

The standard recommends a filename. Where a Sheet lives is the publisher's choice; the discovery declaration says where that is.

Recommended shape: `{id}.{lang}.json`

- **`{id}`**: a stable identifier for the resource. Publishers may use a slug, a SKU, a UUID or any other durable identifier; the standard does not constrain its shape. It MUST remain stable for the life of the resource. Publishers using slug-derived ids SHOULD either freeze the slug at first publication or maintain HTTP 301 redirects from old Sheet URLs to new ones, as they would for page URL migrations.
- **`{lang}`**: the BCP 47 tag matching the Sheet's `inLanguage`. Single-language publishers MAY omit this segment; `inLanguage` remains authoritative. Adding a language adds a file; removing one is a publication event the publisher SHOULD handle with 410 Gone or a redirect to the closest remaining variant.
- **`.json`**: fixed. Future serializations use distinct extensions and are announced as separate declarations.

The directory is the publisher's. `/pagefront/commerce/product/…`, `/apps/pagefront/…`, `/wp-json/pagefront/v1/…` and any other location are equally conformant.

This convention exists for publisher convenience and inspectability. It is not a discovery mechanism, and it is not sufficient to locate a Sheet; see Discovery.

## Discovery (RFC 8288 / RFC 9727)

Discovery uses HTTP `Link` response headers per RFC 8288 as the primary mechanism, with HTML `<link>` element fallback. Per-page sheet links use `rel="describedby"` (the sheet is a structured description of the resource; it is not a different rendering of it).

```
Link: <https://merchant.example/api/sheets/anorak.en.json>;
      rel="describedby";
      type="application/json";
      profile="https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json";
      title="Pagefront product sheet"
```

```html
<link rel="describedby"
      type="application/json"
      href="https://merchant.example/api/sheets/anorak.en.json"
      title="Pagefront product sheet">
```

**Discovery principle (normative).** A Sheet is located by publisher declaration. The publisher states where the Sheet is; the consumer follows that statement. A consumer MUST NOT construct a Sheet URL from the shape of a page URL, from the recommended filename convention, or from any other pattern the publisher has not declared, even where the construction would succeed.

**Sheets reached by reference.** Page-based discovery (`describedby`) finds the Sheet for the page being read. A Sheet reached by reference from another Sheet is located by the URL the referencing Sheet declares: organization sheets by `pagefront:sheetUrl` on the organization reference (`Offer.seller`, `Product.brand`, a reference-form `pagefront:legalEntity`; see the linking contract in [`organization.md`](organization.md#linking-contract-identity-only)), and page-less parent ProductGroup Sheets by `sheet_url` on a variant Sheet's `isVariantOf` (variant Sheets likewise by `sheet_url` on the parent's `hasVariant` entries). The prohibition on constructing Sheet URLs is unchanged: a reference that declares no URL leaves its Sheet undiscovered.

**Carriers (non-exhaustive).** At v0.9 the declaration is carried by `Link: rel="describedby"` on the canonical page response, with the HTML `<link>` element as fallback; both together are recommended. Later versions may register additional carriers. A carrier is conformant if the declaration originates from the publisher's origin.

Non-normative serving recommendation: publishers SHOULD serve sheets with `Access-Control-Allow-Origin: *`. Sheets are machine-facing public documents, and open CORS lets browser-based consumers (including the hosted validator at `/pagefront/commerce/product/validate`) read them directly.

## Why completeness is not in the sheet

A completeness score is a valuation, and valuations differ per consumer: a compliance agent weights legal entities heavily, a visual-shopping agent weights media. No single score would be right for both, so the sheet carries none. Scoring is consumer-side, over the shared dimension taxonomy in [`scoring.md`](scoring.md); the linter judges correctness only.

## What changed from v0.3 in summary

| Area | v0.3 | v0.4 | v0.5 | v0.6 | v0.7 | v0.8 |
|---|---|---|---|---|---|---|
| Project codename / namespace | `transformer:` | `pagefront:` | unchanged | unchanged | unchanged | unchanged |
| Provenance block | Required, with rich per-field metadata | Removed | unchanged | unchanged | unchanged | unchanged |
| Production model | Implicitly third-party extraction | Explicitly first-party authoring as default | unchanged | unchanged | unchanged | unchanged |
| Image roles | Free-text `role` PropertyValue | Closed enumeration with formal definitions | unchanged | unchanged | unchanged | unchanged |
| Video | Not supported | Not supported | Not supported | Closed enumeration of video roles; `VideoObject` array sibling to `image` | + multiple thumbnails: `thumbnailUrl` for interchangeable previews, `thumbnail` (ImageObject array) for previews carrying distinct context | unchanged |
| Accessibility metadata on media | Not specified | Optional `caption` on images | unchanged | Recommended `caption`/`transcript` on videos; linter warns for `overview`/`tutorial` without | unchanged | unchanged |
| Configurable products | Not modeled | `pagefront:configurator` | normative configurator-vs-ProductGroup guidance | unchanged | + mixed cross-Sheet factoring (page-factored + within-page axes, disjoint and PDP-W-010-safe); configurator price bands via `AggregateOffer` when per-combination pricing isn't fully extractable | unchanged |
| Made-to-order economics | Not modeled | `pagefront:madeToOrderTerms` | unchanged | unchanged | unchanged | unchanged |
| Material composition | `transformer:fabricComposition` (textile only) | `pagefront:materialComposition` (general) | unchanged | unchanged | unchanged | unchanged |
| Gemstones | Stuffed into Certification.additionalProperty | `pagefront:gemstone` typed extension | unchanged | unchanged | unchanged | unchanged |
| Manufacturing chain | `transformer:manufacturingChain` (Apparel-implicit) | `pagefront:manufacturingChain`, generalized | unchanged | unchanged | unchanged | unchanged |
| Discovery | RFC 8288/9727 with `describedby` | + recommended `/pagefront/{type}/{id}.json` convention | + `{lang}` segment; singular `{type}` vocabulary | unchanged | unchanged | unchanged |
| Completeness scoring | Six sections including provenance considerations | Six sections, no provenance weighting | Removed from envelope in v0.4.1 | unchanged | unchanged | unchanged |
| Internationalization | Not addressed | `inLanguage` declared but multi-language unspecified | Normative i18n model | + video is language-scoped per the same model | + Q&A is language-scoped; `pagefront:document.inLanguage` MAY differ from sheet | unchanged |
| Identifier requirement | Single anyOf list | unchanged | Conditional on `@type` | unchanged | unchanged | + `gtin`/`gtin13` accept string or array |
| `itemOffered` redundancy | Open question | Open question | Demonstrated pattern in AFS revision | Normative recommendation: use `@id` reference | unchanged | unchanged |
| Sheet field name | `artifact_url` | unchanged | renamed to `sheet_url` (breaking) | unchanged | unchanged | unchanged |
| Product Q&A | Not modeled | Not modeled | Not modeled | Not modeled | Schema.org-native `question[]` with `acceptedAnswer` | unchanged |
| Product documents | Not modeled | Not modeled | Not modeled | Not modeled | `pagefront:document[]` with closed `role` enum | + `repairability_index` role |
| Typed product relationships | Schema.org loose relations only | unchanged | unchanged | unchanged | `pagefront:relatedProduct[]` with closed `relationship` enum | + `service` relationship |
| Variant dimension expression | Implicit | Implicit | Implicit | Implicit | Documented: Schema.org-native where possible; suggested `propertyID` registry otherwise | unchanged |
| Grouped specifications | Not modeled | Not modeled | Not modeled | Not modeled | Not modeled | `pagefront:featureGroup[]` — grouped, ordered `PropertyValue` rows |
| Product highlights | Not modeled | Not modeled | Not modeled | Not modeled | Not modeled | `pagefront:productHighlights[]` — ordered publisher-authored selling points |
| Legal entities | Not modeled | Not modeled | Not modeled | Not modeled | Not modeled | `pagefront:legalEntity[]` — role-typed compliance entities (GPSR) |
| Machine-readable category | Display string | unchanged | unchanged | unchanged | unchanged | + Schema.org `CategoryCode` coded form |
| Product safety | Not modeled | Not modeled | Not modeled | Not modeled | Not modeled | `pagefront:safetyWarning[]`, `pagefront:safetyNotice[]`; `recall_notice`/`declaration_of_conformity` document roles |

## Open design questions carried forward

1. Extension namespace sub-paths within `pagefront:` (per-type URIs) remain to be defined as the spec stabilizes.
2. ~~Multiple offers' `itemOffered` redundancy.~~ **Resolved in v0.6.** `@id` reference pattern is now the normative recommendation.
3. ~~Completeness scoring weights.~~ **Resolved: scoring is consumer-side (see [`scoring.md`](scoring.md)).** The standard keeps a non-normative dimension taxonomy only; weights, formulas, and calibration are consumer rubric concerns, versioned independently of the format.
4. Schema.org version pinning cadence. Project needs documented update cadence (review with each Schema.org major release).

## Open design questions surfaced in v0.4

5. ~~**Configurator pricing formula.**~~ Resolved 2026-10-01: `priceFormula` is removed, and `pagefront:configuratorPricing` defines the total as the base price plus option modifiers plus adjustments. See "Configurator pricing and price bands."
6. **Image role multiplicity.** Should the order of roles encode preference (first role is primary), or should roles be unordered? Still open. Video roles inherit the same ambiguity.
7. ~~**`pagefront:configurator` vs `isVariantOf`.**~~ Resolved in v0.5.
8. **Certification scope vocabulary.** `scope` values are currently free-text. Open question: closed enum, or free-text with conventions per category?
9. **AftermarketService taxonomy.** Common services (`free_resizing`, `lifetime_warranty`, `repair_credit`) but no defined vocabulary. Spec should document conventions without closing the set.
10. ~~**Sheet URL stability.**~~ Resolved in v0.5.

## Open design questions surfaced in v0.5

11. **Index files and catalog enumeration.** Should publishers expose `/pagefront/commerce/product/index.{lang}.json` for crawlers? Still deferred in v0.7 pending real consumer use cases; revisit in a future version.
12. **Fallback resolution semantics.** v0.5 recommends BCP 47 language-family fallback (`fr-CA` → `fr`). Open question: what should consumers do when no language preference matches at all?
13. **Region-scoped certifications.** EU certifications (CE, OEKO-TEX) and US certifications (UL, FCC) have different shapes. v0.6 stays category-agnostic; typed certification extensions deferred.
14. **Translation consistency.** Spec doesn't enforce that French and English variants say semantically the same thing. Whether to add `pagefront:translatedFrom` is open.
15. **Currency-conversion freshness signaling.** Per-Offer `priceLastVerified` field is finer-grained than envelope `expires_at` but more complex. Open.

## New design questions surfaced in v0.6

16. **Video role overlap with image roles.** Both `image` and `video` arrays carry `lifestyle` and `context`-shaped roles. Consumers querying "show me lifestyle content" need to look in two places. Acceptable trade for clarity; revisit if it causes consumer pain.
17. **`spin` belongs in `image` or `video`?** A 360° rotation is technically video but functionally a rich image. v0.6 places it in `video` because the delivery format is typically `.mp4` or HLS. Publishers using interactive 360° viewers (JS-based, with no video delivery) may need a future image-side `spin` role.
18. **User-generated media as a separate field.** Reviews on most merchant sites include user-submitted videos and photos. Pagefront v0.6 omits these from `video` and `image` because the trust signal differs. A future `pagefront:userGeneratedMedia` field is worth designing but requires real case studies first.
19. **Video transcripts and the size budget.** Full transcripts of tutorial videos can run to several thousand words. At catalog scale (a merchant with 5,000 SKUs, each with 2-3 videos), transcript content could dominate sheet size. Whether to allow `transcript` to be an external URL (`transcriptUrl`) rather than inline content is worth considering. Schema.org has both patterns.
20. **Tracking known deviations across versions.** Real-merchant validation keeps surfacing narrow spec defects (the AFS `productGroupID` issue in v0.5, the Schema.org HTTP/HTTPS scheme issue in v0.6) that no amount of upfront design would have caught. This is a process note: worth maintaining a forward-running "known deviations" record alongside the spec so future implementers and validators don't rediscover the same edge cases. Where this record lives (changelog, separate doc, validator rules with case-study back-references) is open.
21. **Cross-page variant discovery.** The spec recommends ProductGroup Sheets be complete and acknowledges per-variant URLs, but it does not specify how producers should discover variant relationships when the merchant's site exposes them only heuristically. This is a production-pipeline concern, but the linter rules that warn on suspected incompleteness depend on pipeline knowledge the Sheet itself cannot carry. Future versions may address whether per-Sheet metadata about variant discovery completeness is warranted.

## New design questions surfaced in v0.7

22. **Category-specific document roles.** The `pagefront:document` `role` enum is category-agnostic in v0.7. Real publishers may need category-specific roles (`dental_imaging_protocol` for medical devices, `nutrition_panel` for food, `installation_drawing` for industrial fittings) that don't map cleanly onto the closed set. v0.7 directs publishers to use the closest enum value and convey specifics in `name` and `description`. Whether to extend the closed enum, open it for category prefixes, or formalize a category-specific role registry is an open question; revisit when real publisher demand makes the trade-off concrete.
23. **Relationship strength or weighting on `pagefront:relatedProduct`.** `often_bought_with` and `recommended_with` are qualitative in v0.7. A future version may add a `strength` or `weight` field (percentage of co-purchase, publisher-asserted prominence). v0.7 stays qualitative because weighted relationships invite a category of merchant self-asserted commercial signals that Pagefront has kept out of the vocabulary; see also "merchant-asserted popularity ranking" in the non-goals section.
24. **Multiple accepted answers for Q&A.** Schema.org's `Question` allows a single `acceptedAnswer` plus a `suggestedAnswer` array. v0.7 follows Schema.org's pattern (single accepted answer) because publisher-authored Q&A about one's own product is typically authoritative. Whether Pagefront should surface `suggestedAnswer` as a recommended pattern (for community-contributed answers the publisher has curated but not endorsed as authoritative) is open; revisit if real implementer feedback surfaces use cases.
25. **`encodingFormat` default semantics.** `pagefront:document.encodingFormat` defaults to `application/pdf` when omitted. The vast majority of product documents are PDFs, but the default arguably hides a producer choice that consumers may want to make explicit. Whether to require `encodingFormat` rather than defaulting it is open.

## New design questions surfaced in v0.8

26. ~~**Shared cross-publisher feature/measure registry.**~~ **Resolved in v0.8.** The Pagefront Property Registry (see "Variant dimensions" and "Registry governance") publishes governed, versioned `propertyID` identifiers with canonical `recommendedUnitCode`/`unitLabel`, covering `pagefront:featureGroup` rows as well as variant dimensions; its `proposed` → `stable` → `deprecated` lifecycle and additive-only versioning answer the "who governs it, how it versions" half of the original question. The registry does not *enforce*: it is a coordination artifact producers opt into, so `propertyID` values outside it remain valid opaque identifiers and comparison across merchants rests on convergence. Category-specific sub-registries remain unaddressed; revisit if a category's vocabulary outgrows the flat registry.
27. **Structured repairability score.** v0.8 links the repairability *document* (`pagefront:document` `role: "repairability_index"`) but does not model the score itself. A structured field (numeric value, scale, jurisdiction/scheme) would be the repairability analogue of `hasEnergyConsumptionDetails` for energy class. Schemes are still multiplying (the French index, the EU labels in progress) and their scales differ; premature to close a shape around them. Revisit when the regulatory landscape settles or consumer demand surfaces.
28. **Canonical domain for all Pagefront IRIs.** Resolved: all identifiers, machine and human, live on `themachineweb.org`, with machine paths mirroring the repository's vertical-first architecture: schemas at `https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json` (since release 0.3.0 the last segment carries the sheet-spec semver, `v0.9.0.json`, and the `v0.9.json` URL is the legacy schema), the vocabulary namespace at `https://themachineweb.org/pagefront/vocabulary/`, and the Property Registry at `https://themachineweb.org/pagefront/commerce/registry/properties.json`.

## What v0.8 deliberately does *not* address

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

## Planned breaking changes

Breaking changes follow semver: each of the changes below would make a conforming sheet non-conforming, and ships in a future minor of this spec under the 0.x rules, with the release bumping accordingly ([`releases.md`](releases.md)). None ships in Product Sheet spec 0.10.0. Planned as of 2026-10-02:

- **`@context` must declare the `pagefront` prefix wherever a `pagefront:` term is used.** Stated as prose in "Required and recommended core fields" and enforced by the linter (PDP-E-003, ORG-E-001); the JSON Schemas still accept the bare `"https://schema.org"` string beside `pagefront:` terms. A future schema version adds the constraint: when any data-block property name begins with `pagefront:`, `@context` is an array containing an object mapping `pagefront` to `https://themachineweb.org/pagefront/vocabulary/`. The top-level form does not see terms nested inside other objects, such as `pagefront:priceOnRequest` in an offer; the linter rules do.

## Status

Normative spec: Product Sheet spec 0.10.0, a member of commerce release 0.4.0. The versioning scheme is in [`releases.md`](releases.md): the spec has its own semver, breaking changes follow it, and the envelope carries `release` in place of `format_version`. The 2026-10-01 revisions move configurator pricing from `pagefront:configurator` into the offer; sheets that carried prices inside the configurator need re-emission. The 2026-09-02 revision removes the recommended Sheet URL convention and states the follow-the-link discovery rule as a standalone normative requirement; no conformance requirement changes, no sheet becomes invalid, and none needs to move. The paragraphs below describe the legacy format versions this spec grew through.

v0.9 was an additive release on top of v0.8, with no breaking changes to the data model. v0.8 Sheets remain structurally valid under v0.9 once their `format_version` envelope field is updated from `"0.8"` to `"0.9"`. Three changes land together, keeping the Product Sheet consistent with the new Commerce Organization Sheet ([`organization.md`](organization.md)): the `commerce/` segment in the Sheet URL convention, return and shipping policy as seller-sheet defaults with per-product overrides, and reference-capable `pagefront:legalEntity`. The `pagefront:commerceRole` and `pagefront:fulfillmentTerms` terms, the `organization` certification scope value, and the v0.9 schema updates are tracked with the Commerce Organization Sheet's own landing.

v0.8 was an additive release on top of v0.7, with no breaking changes. v0.7 Sheets remain structurally valid under v0.8 once their `format_version` envelope field is updated from `"0.7"` to `"0.8"`; the new affordances (`pagefront:featureGroup`, `pagefront:productHighlights`, `pagefront:legalEntity`, `pagefront:safetyWarning`, `pagefront:safetyNotice`, array-valued GTINs, coded `category`, the `repairability_index`/`recall_notice`/`declaration_of_conformity` roles, the `service` relationship) are optional additions.

The v0.8 changes were each surfaced by real-merchant sheet production: grouped spec tables, multi-GTIN products, taxonomy-coded categories, highlight bullets, repairability disclosures, GPSR entity blocks, safety warnings and recall notices, and attached-service upsells all appear on real product pages that v0.7 could not express or could express only lossily.

Pending work carried from v0.8:

1. **Worked examples**: resolved for `pagefront:featureGroup` and `pagefront:legalEntity` by the Whitebird v0.9 re-emission (2026-08-11; see the citations in "Feature groups" and "Legal entities"). The same artifact carries `pagefront:productHighlights`, with one caveat queued for editor review: the merchant page renders no explicit highlight bullets, so the entries are distilled from merchant-derived prose, in tension with the publisher-authored-only guardrail (see the case study's writeup).
2. **Linter rules**: landed. The legal-entity-address warning and the feature-value-unit warning are now defined as PDP-W-024 and PDP-W-025 in `rules.md`, joining PDP-W-022 (empty highlight entries).
3. **Scoring rubric update**: withdrawn as spec pending work; rubric evolution is consumer-side (see [`scoring.md`](scoring.md)). Folding feature-group and legal-entity presence into a completeness signal for regulated categories belongs to implementers' rubric backlogs.

Pending work carried from v0.7: worked case-study examples for `question` and `pagefront:document`, **still pending, and now exhausted against the current corpus**: none of the three case-study pages carries product-scoped Q&A or public document links (Whitebird and Kimaï have neither; Nitto has only a site-wide FAQ page and no PDFs). Resolving these two examples needs a fourth case study chosen for those features (a merchant with on-page product Q&A and downloadable manuals/SDS; electronics or appliances are natural donors), or an editor decision to illustrate them synthetically. (The document/Q&A completeness-rubric update formerly noted here is consumer-side per [`scoring.md`](scoring.md).) The `pagefront:relatedProduct` worked example is resolved by the Kimaï v0.9 re-emission (`../case-studies/kimai/kimai-jackie-pear-v0_9.json`, 2026-08-11): the merchant's "matching wedding bands" carousel as eight `recommended_with` entries, in the sharpened complementary-pairing meaning as distinct from a generic "you may also like" surface. (The v0.7 linter warnings, SDS documents without `inLanguage` and empty `acceptedAnswer.text`, are now defined as PDP-W-026 and PDP-W-027 in `rules.md`.)
## Changelog

Changes land under "Unreleased" and are versioned at the next release, when the heading becomes `### <version> — <date>`; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md). The dated entries below, headed "Changelog — <date>", predate that convention.

### Unreleased

_Nothing yet. Changes land here and are versioned at the next release; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)._

### 0.10.0 — 2026-10-02

Released in commerce release 0.4.0.

- **`$schema` is required on sheets carrying `release`.** Breaking: a release-line sheet without `$schema` no longer validates. `$schema` identifies the vertical and the sheet type and is what the declared release is checked against, so a sheet that omits it cannot be placed. It stays optional on the legacy draft line. See "The envelope."
- **(schema)** `$schema` joins `required`; `$id` at `https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json`. The 0.9.0 schema stays published, unchanged, for sheets declaring release 0.3.0.
- **Configurator references must resolve.** Breaking: every pair in an exclusion and in an adjustment's `when` names a dimension the configurator declares and, where that dimension lists options, one of its option values, written exactly. See "Configurator pricing and price bands." The schema does not express this; the linter checks it.
- **A sheet is judged by the release it declares.** It is validated against the schema that release bundles and by the rules that apply from that release. A sheet declaring release 0.3.0 is held to neither requirement above.
- **(linter)** Layer 1 resolves the schema from `release` and the sheet type. PDP-E-002 compares a present `$schema` with that schema's URL and is quiet when `$schema` is absent, which the schema itself reports from 0.10.0. PDP-E-017 is new and applies from release 0.4.0: an unresolved reference in an exclusion or an adjustment. PDP-E-018 is new: a `release` the release manifest does not list. Catalogue 0.16.0.

## Changelog — 2026-10-01: Versioning scheme replaced

_Each sheet spec now has its own semver, and a commerce release bundles the sheet specs and the vocabulary; the scheme and the release table are in [`releases.md`](releases.md). In the envelope `release` replaces `format_version` (breaking, release 0.3.0), and `$schema` names the sheet-spec version, `https://themachineweb.org/pagefront/spec/commerce/product/v0.9.0.json`. Sheets carrying `format_version` form the legacy draft line and stay valid against the legacy schema at `.../product/v0.9.json`. Breaking changes follow semver: "Held for 1.0" becomes "Planned breaking changes", with the same item, and none ships now. This document is Product Sheet spec 0.9.0, in commerce release 0.3.0. **(schema)** `release` required, `format_version` not accepted, `$id` at `v0.9.0.json`; the legacy schema is frozen (in `commerce/schemas/product/v0.9.json`). **(linter)** PDP-E-002 becomes "Release / schema mismatch" and keeps its legacy behaviour on legacy sheets; PDP-E-016 flags a sheet carrying both fields; catalogue 0.15.0._

## Changelog — 2026-10-01: One amount carrier per Sheet

_Replaces the amount-typing decision of the entry below. The format version stays 0.9. Existing Sheets stay valid if they already use one carrier for all their amounts, with one breaking exception recorded below; a Sheet that mixes numbers and strings now gets a linter error. The linter gains one rule._

- **Two carriers, one per Sheet.** Every amount is a JSON number or a decimal string (dot as decimal point, no thousands separators, no currency symbol), and a Sheet uses one of the two throughout. Both are allowed because Schema.org accepts both for `price`. A decimal string is recommended when amounts have fractional parts. See "Amounts" under "Common pricing patterns."
- **The earlier statement is withdrawn.** The entry below said pricing-block amounts and `AggregateOffer` bounds are numbers while the Offer's `price` is a decimal string. Each of those fields now accepts either carrier.
- **Examples.** Every example in this document was checked and already uses one carrier throughout; none changed.
- **Breaking: `hasVariant[].price` and `discountAmount` are tightened.** Both accepted any string. They now require an amount: a JSON number or a plain decimal string. A value such as `"£49"`, `"1 299,00"` or `"49.00 EUR"` no longer validates and needs re-emission as `49`, `"1299.00"` or `"49.00"`, with the currency in its own field. An Offer's `price`, which also accepted any string, is tightened the same way. Taken under the same recorded exception as the configurator pricing change. None of the case-study Sheets carries a value that fails.
- **Prices are not negative.** `Offer.price`, the `AggregateOffer` bounds, `basePrice`, `hasVariant[].price` and `discountAmount` take no leading minus; modifiers and adjustment amounts stay signed.
- **(schema)** Two shared definitions: `nonNegativeAmount`, referenced from `Offer.price`, `AggregateOffer.lowPrice` and `highPrice`, the pricing block's `basePrice`, `hasVariant[].price` and `pagefront:promotions[].discountAmount`; and the signed `amount`, referenced from modifier values and `adjustments[].priceModifier`. An `AggregateOffer` bound may now be a string and an Offer's `price` a number. `MonetaryAmount` and `priceSpecification` entries sit in Schema.org-typed blocks the schema does not model, so their amounts are checked by the linter alone. **(linter)** PDP-E-015 flags a Sheet whose amounts mix numbers and strings; all amount comparisons are numeric whatever the carrier; catalogue 0.14.0; lint-commerce 0.9.0.

## Changelog — 2026-10-01: Numeric configurator amounts, note register, size-system consistency

_Second addendum to the configurator pricing change of the same date, under the same recorded exception; the format version stays 0.9. Breaking against the first text of that date: a pricing block with string amounts no longer validates. The linter gains three rules._

- **Configurator amounts are JSON numbers.** `basePrice`, every modifier and every adjustment's `priceModifier` are numbers, matching `lowPrice` and `highPrice` on `AggregateOffer` and Schema.org's typing; the examples follow. The linter compares all amounts in a Sheet numerically. The Offer's `price` keeps its schema type, a decimal string.
- **Tax-inclusion entry.** `UnitPriceSpecification` stays the recommended type for a `priceSpecification` entry, including one that carries only `valueAddedTaxIncluded`; "Tax inclusion" now gives the reason. No rule objects to a unitless entry.
- **Notes are facts, labels are labels.** An option's `description` is the label a buyer sees; a dimension's `note` is a third-person factual statement. Legal and safety statements stay verbatim; descriptive fields are restated.
- **Sizing dimensions** follow their system's notation in place of the identifier form. No rule changes.
- **Size advice matches the sizing dimension.** `sizeAdjustment.sizeSystem` MUST be the system of the Sheet's sizing dimension; advice stated in another system stays in `description` with no `sizeAdjustment`.
- **(schema)** `basePrice`, modifier values and `priceModifier` in `configuratorPricing` are numbers. **(vocabulary)** definitions extended on `pagefront:ConfiguratorDimension`, `pagefront:ConfiguratorPricing` and `pagefront:SizeRecommendation`; no term is added. **(linter)** PDP-E-014 (size advice in another system than the sizing dimension), PDP-W-038 (a configurator note that reads as page copy), PDP-W-039 (size advice carried as prose only beside a sizing dimension); the pricing rules read amounts as numbers; catalogue 0.13.0; lint-commerce 0.9.0.

## Changelog — 2026-10-01: Option identifiers, free-text dimensions, order-time services

_Addendum to the configurator pricing change of the same date, under the same recorded exception; the format version stays 0.9. Two optional properties are added and the linter gains three rules._

- **Option values are identifiers.** An option's `value` is a stable identifier: lowercase, no spaces, shared across languages and editions of the same product, a number as a string with no unit. The label goes in `description`. Values are the keys the pricing block is compared against, literally, so a display label as a value ties the price list to one language's wording. The example in "Configurator pricing and price bands" follows.
- **Free-text dimensions.** `inputType: "text"` declares a free-text dimension, with an optional `maxLength`. It has no `options`, and when priced it has a single modifier keyed `"*"`, for any non-empty input.
- **Order-time services are not options.** A sizing kit, a sample or a consultation MUST NOT appear in a dimension's `options`; it belongs in the dimension's `note` or in `pagefront:madeToOrderTerms.aftermarketServices`.
- **(schema)** `inputType` and `maxLength` on `configuratorDimension`. **(vocabulary)** the definitions of `pagefront:Configurator`, `pagefront:ConfiguratorDimension` and `pagefront:ConfiguratorPricing` are extended; no term is added. **(linter)** PDP-E-013 (a `text` dimension with `options`), PDP-W-036 (an option value that looks like a display label), PDP-W-037 (an option in a sizing dimension that is not a size); PDP-W-032, PDP-E-009 and the computed total cover the `"*"` key; catalogue 0.12.0; lint-commerce 0.9.0.

## Changelog — 2026-10-01: Configurator pricing moves to the offer

_Breaking (pre-1.0). A 0.9 sheet that carries prices inside `pagefront:configurator` no longer validates and needs re-emission. The change is taken within 0.9 as a recorded exception to the held-for-1.0 rule; the format version stays 0.9. One type and one property are minted; the linter gains ten rules and PDP-E-001 gains a field._

Four defects in the model this replaces:

1. **An offer was not linked to the configurator.** Both sat on the same Product, and consumers could only assume that the offer's price was the configurator's starting point. Nothing stated which configuration the offer priced, so no rule could check that the two agreed.
2. **`basePrice` did not say which configuration it priced.** A producer could put a component price there (one part of a multi-part product) and nothing in the format flagged it, so consumers quoted a fraction of the real price.
3. **A missing `priceModifier` was indistinguishable from zero.** "Not stated" and "free" are different facts.
4. **A price list is a market's.** A product can have a different price list in each market, and those lists are not exchange-rate conversions of each other. A price list therefore belongs with a currency, in an offer, and the option space is the same in every market.

What changes:

- **A configurator carries no prices.** `basePrice`, `basePriceCurrency` and `priceFormula` are removed from `pagefront:Configurator`; `priceModifier` and `currency` are removed from its options. The configurator gains an optional `@id` (required once an offer prices it) and `exclusions`, the partial configurations that cannot be ordered together. A dimension gains `affectsPrice` (default `true`); `false` declares that no option in it changes the price.
- **Prices live in the offer, in `pagefront:configuratorPricing`.** Permitted on `Offer` and `AggregateOffer`. The block names the configurator it prices, names a complete `baseConfiguration`, gives its total as `basePrice`, and gives a modifier for every option of every priced dimension, `"0"` included. `adjustments` carry what is not additive. `pricing: "partial"` declares a price list with gaps, from which consumers do not compute totals. Currency and tax basis come only from the enclosing offer.
- **A base price is a configured total.** A component price is never a base price.
- **The offer's price fields agree with the block.** An `Offer`'s `price` equals `basePrice`; an `AggregateOffer`'s `lowPrice` and `highPrice` equal the cheapest and dearest non-excluded configurations computed from the block. A configurator-only Sheet remains valid, and a half-populated `AggregateOffer` remains invalid.
- **One offer per priced configurator per Sheet.** A merchant selling in several currencies publishes one Sheet per market.
- **Tax inclusion.** The "Prices that cannot state a basis" paragraph no longer lists configurator prices: pricing-block amounts take their basis from the offer and are authoritative.
- **(schema)** `configurator` loses the three price properties and gains `@id` and `exclusions`; configurator options reject `priceModifier` and `currency`; `configuratorDimension` gains `affectsPrice`; new `configuratorPricing` and `configurationSelection` definitions; `pagefront:configuratorPricing` on `offer` and `aggregateOffer`, and an `Offer` carrying it requires `price` and `priceCurrency`. **(vocabulary)** `pagefront:ConfiguratorPricing`, `pagefront:configuratorPricing`. **(linter)** PDP-E-001 covers the block's `configurator` reference; PDP-E-007 to PDP-E-012 and PDP-W-032 to PDP-W-035 are new; catalogue 0.11.0; lint-commerce 0.8.0.
- **Migration.** Move `basePrice` and the option modifiers into a pricing block on the offer for the same market, name the configuration the base price is the total of, give the configurator an `@id`, and mark never-priced dimensions `affectsPrice: false`. The case-study sheets are re-derived separately.

## Changelog — 2026-09-30: `pagefront:sheetUrl` on organization references

_Additive: no sheet changes conformance. One `pagefront:` term is minted; the schema gains three optional attachment points; the linter gains three rules._

- **Organization references declare where the organization sheet is.** `Offer.seller`, `Product.brand` and reference-form `pagefront:legalEntity` SHOULD carry `pagefront:sheetUrl` beside `@id`; `@id` stays the identity. Consumers do not construct sheet URLs, and a reference without `pagefront:sheetUrl` leaves the organization sheet undiscovered. See "Discovery" and the linking contract in [`organization.md`](organization.md#linking-contract-identity-only).
- **Host checks are edge-typed.** Seller sheets on the product sheet's host, brand sheets on the host of the brand's `@id`, legal-entity sheets on either. The `@id` is matched at the node the edge points at (the data block for organization references, `data.brand` for brand references), and the commerce role must fit the edge.
- **Inherited terms can be unknown.** Return and shipping terms are inherited only from the seller sheet the linking contract resolves on the product sheet's host; when none resolves, they are unknown. Seller identity across domains is publisher-asserted pending a domain-association mechanism. See "Return policy."
- **(schema)** `pagefront:sheetUrl` (a URI string) on the Offer's `seller`, on `brand`, and on a `pagefront:legalEntity` entry's `organization`. **(vocabulary)** `pagefront:sheetUrl`. **(linter)** PDP-E-005 and PDP-E-006 flag a seller or brand sheet URL on the wrong host; PDP-W-031 warns when a seller reference cannot be located and the Offer states no return or shipping terms of its own.

## Changelog — 2026-09-24: Versioning policy revised

_Policy and prose only. No schema, term or sheet changes conformance._

- **Releases before 1.0 are 0.9.x, one per new sheet type** (category, collection, catalog, in the order they are ready). New terms, schema additions, guidance and linter rules are absorbed into the current release and recorded here. See "Versioning and stability" and "Path to 1.0" in [`vocabulary.md`](vocabulary.md).
- **1.0 is defined** as the complete commerce sheet set: organization, product, category, collection and catalog, each specified, schema-validated, covered by linter rules and exercised by a real sheet, with every held change shipped.
- **Breaking changes are held for 1.0.** "Held for 0.10" is renamed "Held for 1.0"; its items are unchanged.
- **Stability from 1.0 is deprecation-based.** A term never changes meaning; removals are deprecated first, stay valid for at least twelve months, and are announced before removal.

## Changelog — 2026-09-24: Warranty, trust strips and delivery

_Additive: every conforming 0.9 sheet stays conforming. One `pagefront:` term is minted and the schema gains two optional attachment points._

- **Warranty statements have a documented home.** A warranty the page states is a Schema.org `WarrantyPromise`: a seller's warranty lives on the Offer as `warranty`, which joins the Offer core shape when the page states one; a manufacturer's warranty lives on the Product as the new `pagefront:manufacturerWarranty`, since Schema.org defines `warranty` on `Offer` and `Demand` only and a manufacturer's offer-less sheet had nowhere to state one. When the page does not say who gives it, the statement goes on the Offer. A warranty document stays a `pagefront:document` entry with `role: "warranty"`. See "Warranty."
- **Lifetime warranties omit `durationOfWarranty`** and carry the statement in `description`. Paid extended warranties are a `service` relationship and never `warranty`; statutory guarantees are never synthesized.
- **Trust strips are split across their fields.** Warranty, returns, delivery terms and delivery modes each go to their own home; what none can hold stays in prose. See "Trust strips."
- **Delivery modes use Schema.org's `availableDeliveryMethod`** (`ParcelService`, `OnSitePickup`, `LockerDelivery`) and `availableAtOrFrom`; `shippingDetails` keeps cost, destination and timing. See "Delivery."
- **(schema)** `warranty` on the Offer and `pagefront:manufacturerWarranty` on the data block, both attachment shells for Schema.org content. **(vocabulary)** `pagefront:manufacturerWarranty`. **(linter)** PDP-W-030 warns on a warranty entry with neither `durationOfWarranty` nor `description`.

## Changelog — 2026-09-18: Offer price tax basis

_Documentation and linter only: no schema change, no `pagefront:` term minted. Every conforming 0.9 sheet stays conforming._

- **`price` on a consumer Offer is defined.** It is the displayed consumer price for the offer's declared region: tax inclusion is determined by that region's law (Directive 98/6/EC, Article 2(a), for the meaning) and shipping is excluded (Directive 2011/83/EU, Article 6(1)(e), for the exclusion alone). A producer MUST NOT publish, as `price`, an amount the consumer is never shown. See "Offers."
- **Producers SHOULD state the tax basis.** Schema.org's `valueAddedTaxIncluded` goes on a `UnitPriceSpecification` entry: on each existing `priceSpecification` entry, or on one mirroring entry added to an Offer that carries only `price`. The tax basis is a property of the (offer, region) pair; the section also gives the order of signals for establishing it and what to publish when it cannot be established. See "Tax inclusion."
- **Variant render hints and configurator prices are non-authoritative.** `hasVariant[].price` and `pagefront:configurator` prices carry no region and cannot state a basis; consumers resolve the region-matched Offer for an authoritative amount.
- **Sale-pricing example retyped.** Its entries are `UnitPriceSpecification`, the type Schema.org defines `priceType` on.
- **(linter)** PDP-W-028 warns on an Offer price without a tax-inclusion statement, PDP-W-029 on an Offer price without a declared region, and PDP-E-004 on a mirroring entry whose `price` disagrees with the Offer's `price`.

## Changelog — 2026-09-08: `@context` with `pagefront:` terms

_One prose change, no schema change. The `@context` requirement now says what vocabulary.md has said since the vocabulary was published: a data block that uses any `pagefront:` term declares the `pagefront` prefix in the array form of `@context`, and the bare `"https://schema.org"` string is for a data block that uses none. The two examples in this document that carry `pagefront:` terms (the configurator and related-products examples) now use the array form; the others keep the bare string. Nothing becomes non-conforming under the schema, which accepts both forms; a sheet carrying `pagefront:` keys under the bare string was already detached from the vocabulary in JSON-LD terms, and this revision states it._

## Changelog — 2026-09-08: Schema identifier

_One change: the product schema's identifier is now the URL it is served from, `https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json`, beside the spec page. The previous identifier, `https://themachineweb.org/pagefront/commerce/schemas/product/v0.9.json`, was never served. The schema's `$id`, the envelope `$schema` value, the discovery `profile` parameter and the examples throughout this document use the new identifier; the Organization schema moves the same way. The version segment stays in the URL, so each format version keeps a resolvable schema of its own and PDP-E-002 keeps reading it. The commerce format version is unchanged. Sheets declaring the previous identifier remain in scope for the linter's page-type dispatch and for the hosted validator._

## Changelog — 2026-09-02: Sheet URL convention removed

_One change: the recommended Sheet URL convention is removed. Nothing becomes non-conforming: no rule or schema has ever checked a sheet's URL shape, so no sheet needs to move, and publishers serving sheets on the previously recommended `/pagefront/commerce/{type}/{id}.{lang}.json` shape (or any other) stay where they are. The commerce format version is unchanged: 0.9 is a living draft and absorbs this revision._

- **Sheet URL convention removed.** The spec no longer recommends any URL shape for sheets. The convention had been called a normative pattern since v0.4.1, though nothing enforced it, and its stated purpose included giving consumers "a fallback heuristic when `Link` headers aren't yet honored", an invitation to the path-guessing the discovery rule forbids, and it had already cost churn: the v0.9 segment migration changed nothing normative yet made publishers move files and repoint links. Discovery has one mechanism, the link, and the consumer-side rule is now a standalone normative statement (see "Discovery"). The URL guidance that stood on its own survives, restated without reference to any shape: stable for the life of the resource, renames answered with `301` (see "Sheet filename convention").

## Changelog from v0.8

_All v0.9 changes are additive: a v0.8 Sheet stays valid once its `format_version` is updated to `0.9`. The three changes land together with the Commerce Organization Sheet ([`organization.md`](organization.md)); the v0.9 schema and vocabulary updates (`pagefront:commerceRole`, `pagefront:fulfillmentTerms`, the `organization` certification scope value) are tracked with that sheet's own landing._

- **Sheet URL convention gains a `commerce/` segment.** The normative pattern becomes `/pagefront/commerce/{type}/{id}.{lang}.json`: a commerce domain segment now precedes the resource type for all commerce sheet types (product, organization, and future category/collection), so the `/pagefront/` namespace can host non-commerce content types later. Discovery via `Link: rel="describedby"` remains authoritative; this is a path-shape change and does not break the wire format. Publishers migrate URL shapes and update their `Link` targets. *(The convention itself is removed in the 2026-09-02 revision; see "Sheet filename convention.")*
- **Return policy moves to the seller sheet (default + override).** `hasMerchantReturnPolicy` is no longer a routine Offer field: the store-wide policy lives on the seller block of the seller's Commerce Organization Sheet, and a Product Sheet carries return terms only when the product deviates from the store default (final-sale items; made-to-order returns exceptions already live in `pagefront:madeToOrderTerms` and stay there). Consumers resolve product-else-seller along the existing `Offer.seller` edge, the format's one accepted semantic cross-sheet dependency, scoped to return and shipping. Shipping follows the same pattern: store-wide terms live on the seller sheet as `pagefront:fulfillmentTerms` (an array of Schema.org-native `OfferShippingDetails`), `shippingDetails` likewise leaves the routine Offer list and remains as the per-product deviation override, with the same product-else-seller resolution. Warranty does not move; it stays per-product, and its org-level home is tracked pending a worked example. See "Return policy."
- **(schema) (linter) `pagefront:legalEntity` becomes reference-capable.** When the entry's organization has its own Commerce Organization Sheet (typically `brand_owner`, sometimes `manufacturer`), the `organization` SHOULD be a reference stub (`@type` + `@id`) resolving to that sheet; third-party or market-specific entities (`authorized_representative`, `importer`) stay fully inline, since GPSR wants the responsible entity resolvable at the listing. Roles, required fields, and the compliance rationale are unchanged. The schema tag covers the relaxation the stub form needs (the v0.8 schema requires `organization.name`; the v0.9 schema makes it optional when `@id` is present). The linter tag covers the matching PDP-W-024 exemption: the no-postal-address warning does not fire on a reference stub, whose address lives on the referenced sheet. Both land with the v0.9 cut alongside the Commerce Organization Sheet. See "Legal entities."

## Changelog from v0.7

_All v0.8 changes are additive and backward-compatible: a v0.7 Sheet stays valid once its `format_version` is updated to `0.8`. Entries are documentation-only unless tagged **(schema)**._

- **(schema) `pagefront:featureGroup[]` for grouped technical specifications.** A new typed extension carrying grouped, ordered technical specifications: the "Specifications" table a product page renders as named sections. Extension trigger: Schema.org under-specification. A flat `additionalProperty` list carries the values but has no grouping, no ordering, and no split between the raw comparable value and the merchant's display formatting. Each group carries a required `name`, an optional integer `sortOrder`, and a required `feature[]` array of Schema.org `PropertyValue` entries (`propertyID`, `name`, `value`, `unitCode`, optional `description`). This is composition over inheritance: the entries stay Schema.org-native, only the grouping shell is minted. An entry MAY carry `pagefront:presentationValue` for the merchant's display-formatted rendering when it differs from the raw `value`. See "Feature groups."
- **(schema) `gtin` and `gtin13` accept arrays.** Both fields now accept a single string or an array of strings, on the data block and on `hasVariant` entries; the `gtin13` per-item digit pattern is preserved. Products legitimately carry multiple GTINs (regional packaging variants, re-releases under a new barcode); consumers treat any listed GTIN as identifying the product, and an any-GTIN match is a valid secondary-identifier dedup fallback. The identifier-requirement `anyOf` logic is unchanged. See "Multiple GTINs."
- **(schema) Machine-readable `category`.** `category` keeps its display-string form and now also accepts a Schema.org `CategoryCode` object (`codeValue`, `inCodeSet`, `name`) or an array mixing the string and coded forms. Schema.org-native; no `pagefront:` term is minted. Producers that know a taxonomy code SHOULD emit both the human-readable string and at least one coded entry, with the taxonomy identified by `inCodeSet` URL. See "Machine-readable category."
- **(schema) `pagefront:productHighlights[]` for ranked selling points.** A new field carrying an ordered array of short, publisher-authored selling-point strings: the merchant's own ranked "what matters about this product." Extension trigger: Schema.org gap. No Schema.org property carries an ordered, publisher-curated highlight list (`description` is prose, `additionalProperty` is specification data). Publisher-authored only: auto-generated bullets are excluded, consistent with the spec's existing stance on generated text; 3–10 entries recommended. The JSON-LD context marks the term `@container: @list` so order survives JSON-LD processing. A linter rule (PDP-W-022) warns on empty or whitespace-only entries. See "Product highlights."
- **(schema) `repairability_index` document role.** The `pagefront:Document` role enum gains `repairability_index`, a regulation-driven repairability score document (e.g. the French *indice de réparabilité*, the EU's emerging repairability labels), cross-category and distinct from `certificate`, following the same rationale pattern as v0.7's `environmental_declaration`. A structured repairability *score* field is not added; it is recorded as an open design question.
- **(schema) `pagefront:legalEntity[]` for regulation-driven legal entities.** A new typed extension declaring the legal entities behind a product: EU GPSR responsible persons and similar compliance declarations. Extension trigger: Schema.org under-specification. `manufacturer` exists but carries no role typing for licensees, importers, or authorized representatives, and compliance consumers need to dispatch on the role. Each entry carries a required closed `role` enum (`brand_owner`, `licensee`, `authorized_representative`, `importer`, `manufacturer`) and a required Schema.org `Organization` (`name` required; `address`, `url`, `email` optional). Schema.org's native `manufacturer` remains valid alongside. See "Legal entities."
- **(schema) `pagefront:safetyWarning[]` for typed safety warnings.** A new typed extension carrying product safety warnings: the GPSR (Reg. 2023/988) Art. 19 information distance-selling listings must display. Extension trigger: Schema.org gap. Schema.org has no product-safety-warning vocabulary. Each entry carries a required `text` (in the sheet's `inLanguage`), an optional `pictogram` URL, and an optional open-vocabulary `hazardCategory` (common values: `choking_hazard`, `suffocation`, `fire`, `electrical`, `chemical`, `entanglement`). Warnings are language-scoped like all prose fields; the per-language sibling sheets are what satisfy GPSR's language-of-member-state requirement. See "Safety warnings."
- **(schema) `pagefront:safetyNotice[]` for recall and safety notices.** A new typed extension for products subject to a corrective measure. Extension trigger: Schema.org gap. `availability: Discontinued` means "no longer sold," not "dangerous — return it," and Schema.org has no recall vocabulary. Each entry carries a required closed `noticeType` (`recall`, `warning`), plus optional `hazard`, a closed `remedy` enum (`repair`, `replacement`, `refund`; the GPSR Art. 37 set), `description`, `reference` (the official alert, e.g. an EU Safety Gate entry), `datePublished`, and `url` (the publisher's own notice page). A `recall` notice overrides commercial signals: consumers SHOULD NOT recommend purchase and SHOULD surface the remedy. A linter rule (PDP-W-023) warns when a `recall` notice coexists with an `InStock` offer. See "Safety notices."
- **(schema) `recall_notice` and `declaration_of_conformity` document roles.** The `pagefront:Document` role enum gains `recall_notice`, the human-readable recall-notice artifact, with the same division of labor against `pagefront:safetyNotice` that v0.7 defined for `compatibility` vs `compatible_with` relationships (the structured field is what consumers act on; the document role links the artifact and does not replace it). It also gains `declaration_of_conformity`, the manufacturer's self-issued EU Declaration of Conformity underlying CE marking, distinct from `certificate`, which is third-party-issued.
- **(schema) `service` relationship.** The `pagefront:RelatedProduct` relationship enum gains `service`, a purchasable service attached to the product (installation, extended warranty, maintenance plan). Distinct from `accessory` (a physical add-on) and from warranty *documents* (`pagefront:document` with `role: "warranty"` carries the terms of the warranty included with the product; a `service` relationship targets a separately purchasable service product). Operationally tracked, per the existing operational-vs-marketing guidance.
- **Property Registry published as a machine-readable artifact.** The `propertyID` values used in variant-dimension `additionalProperty` entries and `pagefront:featureGroup` rows are now backed by a published, machine-readable registry, the **Pagefront Property Registry**, at `https://themachineweb.org/pagefront/commerce/registry/properties.json`, superseding the v0.7 inline "suggested registry" list. The eight v0.7 entries (`width`, `capacity`, `finish`, `memory`, `storage`, `display_size`, `power`, `voltage`) carry `status: stable` in the published registry. Documentation-only: `additionalProperty` and `pagefront:featureGroup.feature[].propertyID` already permit any string value, so no schema change is required. See "Variant dimensions," "Registry governance," and "Feature groups."

## Changelog from v0.6

_All v0.7 changes are additive and backward-compatible: a v0.6 Sheet stays valid once its `format_version` is updated to `0.7`. Entries are documentation-only unless tagged **(schema)**._

- **Explicit triggers for `pagefront:` vocabulary.** Documents when Pagefront mints `pagefront:`-prefixed vocabulary (a Schema.org gap, under-specification, or mismatch with Pagefront's contract) versus deferring to Schema.org-native fields; the principle had been operating implicitly. See "When to extend Schema.org with `pagefront:` vocabulary."
- **Product Q&A.** Sheets MAY carry a `question` array on `Product`/`ProductGroup`, using Schema.org's native `Question` and `Answer` linked via `acceptedAnswer`. No `pagefront:` term is minted; Q&A prose is language-scoped to the sheet's `inLanguage`.
- **`pagefront:document[]` for typed product documents.** A new typed extension for manuals, spec sheets, assembly instructions, care guides, warranties, certificates, environmental declarations, audit reports, lab tests, safety data sheets, and similar. Each entry carries a closed `role` enum and a per-document `inLanguage` that MAY differ from the sheet's. The `pagefront:Document` role enum gains `environmental_declaration`, a standardized environmental product declaration (Type III EPD / PEP ecopassport) and a cross-category regulation-driven document distinct from `certificate`. It also gains `brochure`, a marketing/sales overview document, low-authority as a data source but one human-facing consumers explicitly retrieve, and `compatibility`, a document listing products, systems, or standards the product works with, distinct from `spec_sheet` and complementary to `pagefront:relatedProduct` `compatible_with` relationships.
- **`pagefront:relatedProduct[]` for typed product relationships.** A new field with a closed `relationship` enum, targeting another product by `@id` reference (another Pagefront Sheet) or by a Schema.org identifier (`sku`, `gtin`, `gtin13`, `mpn`) for cross-merchant references. Schema.org's loose relations (`isRelatedTo`/`isSimilarTo`/`isAccessoryOrSparePartFor`/`isConsumableFor`) cover only four kinds and lack the typed semantics agents need. The `pagefront:RelatedProduct` relationship enum gains `spare_part`, a replacement for an existing component, ordered on wear or failure; distinct from `required_part` (a component needed for the product to function).
- **Variant dimension guidance.** How to express variant axes on `ProductGroup`: Schema.org-native properties where they exist (`color`, `size`, `material`), otherwise `additionalProperty` with a `propertyID` from a suggested-but-open registry (`width`, `capacity`, `finish`, `memory`, `storage`, `display_size`, `power`, `voltage`).
- **ProductGroup `name` ↔ Google `item_group_title`.** Notes the equivalence for implementers transitioning from Google Merchant Center feeds; Pagefront uses Schema.org's native `name` and mints no attribute.
- **Stable IRIs reaffirmed.** `pagefront:Document` and `pagefront:RelatedProduct` are permanent within this major version; neither is renamed or removed. *(Superseded 2026-09-24 by the deprecation-based stability policy in "Versioning and stability", [`vocabulary.md`](vocabulary.md).)*
- **Common pricing patterns.** Documents sale pricing, price ranges, quantity-tier pricing, and shipping-alongside-price as recommended Schema.org-native patterns.
- **Product dimensions.** Documents `height`/`width`/`depth`/`weight` with `QuantitativeValue` and UN/CEFACT unit codes (`CMT`/`MMT`/`INH` for length; `GRM`/`KGM`/`LBR`/`ONZ` for weight).
- **Image- and video-to-variant association.** Documents the Schema.org-native `about` pattern for tying variant-specific images and videos to their `hasVariant` entries, mirroring `itemOffered` for Offers.
- **Textual framing for media.** Documents `caption` (short, publisher-vetted) and `description` (longer, machine-readable) on `ImageObject`/`VideoObject`; both are already permitted by the `additionalProperties: true` policy.
- **Relationship-modeling guidance.** `recommended_with` is sharpened to mean complementary pairing; generic "You may also like" surfaces go to Schema.org's native `isRelatedTo`. Five patterns are matched to fields by semantics (`pagefront:relatedProduct` typed enum; `isSimilarTo`; `isPartOf`/`hasPart`; `isRelatedTo` with or without `description`), operationally-tracked enum values are distinguished from marketing-curated ones (with algorithmic recommendation output going to `isRelatedTo`), and a structured-identifier requirement separates `pagefront:relatedProduct` (needs one of `@id`/`sku`/`gtin`/`gtin13`/`mpn`, enforced by the schema's `anyOf`) from `isRelatedTo` (a `name` and `url` suffice).
- **Bundles.** Distinguishes a bundle expressed as a relationship (`pagefront:relatedProduct` with `bundle_component`, for separately-sellable products that travel WITH a primary product) from a bundle that is itself a sellable product (Schema.org `ProductCollection` with `includesObject` and `TypeAndQuantityNode`). The previously-deferred bundle-product case is now addressed via Schema.org-native vocabulary.
- **Linter rules PDP-W-019, PDP-W-020, and PDP-W-021.** PDP-W-019 warns when a `pagefront:relatedProduct` identifier passes the schema's presence-only `anyOf` but is empty or non-dereferenceable. PDP-W-020 warns when any relationship entry (`isSimilarTo`, `isRelatedTo`, `isPartOf`, `hasPart`, `pagefront:relatedProduct`) lacks any identifying field, and extends the broken-`@id` check (PDP-E-001) to these fields. PDP-W-021 warns when a cross-Sheet variant link (a `hasVariant` entry or an `isVariantOf` with a full-URL `@id`) omits the recommended `sheet_url` traversal hint; PDP-E-001 is correspondingly extended to treat full-URL `@id`s in `isVariantOf`/`hasVariant` as legitimate cross-Sheet references. See `rules.md`.
- **(schema) `priceSpecification` accepts arrays.** Fixes a bug where `priceSpecification` was a single object only, contradicting the array form shown in "Common pricing patterns." The Offer field now accepts an object or an array of objects. Backward-compatible.
- **(schema) `shippingDetails` accepts a single object.** Parallel fix: `shippingDetails` was array-only, contradicting the single-object example in the shipping pattern. The Offer field now accepts either form. Backward-compatible.
- **Configurator vs. ProductGroup guidance restored and tightened.** The v0.5 normative guidance (referenced by the changelog, the version matrix, and linter rules PDP-W-007/PDP-W-009/PDP-W-010, but missing from the body between v0.5 and v0.7) is restored, with a fourth trigger: products with 4 or more variant axes SHOULD use `pagefront:configurator`. The 3-axis `ProductGroup` ceiling is clarified as a per-Sheet limit; it does not cap the product family, so a 4+ axis family can factor across Sheets or express the full space in one Sheet via configurator. Worked examples cover both, plus a three-axis, 27-combination watch line at the `ProductGroup` boundary.
- **(schema) `offers` accepts `AggregateOffer`.** Fixes a bug where `offers[]` constrained every entry to `@type: "Offer"`, rejecting the `AggregateOffer` shape (`lowPrice`/`highPrice`/`priceCurrency`) used in the price-range pattern. Now accepts `Offer` or `AggregateOffer` via separate `$defs`, with pricing-presence validation still applied to both. Backward-compatible.
- **Prose clarifications reconciling with the schema.** `@context` is now listed as a required `data` field (already required by the schema and JSON-LD); `expires_at` is described as recommended rather than required (matching the schema); and `pagefront:availableLanguages` is described as an array of `{lang, url}` objects, not URL strings (matching the schema shape). No schema changes.
- **`@id` deduplication contract documented.** Documents how consumers recognize the same product across its own Sheet and references to it (`isRelatedTo`, `isSimilarTo`, `isPartOf`/`hasPart`, `pagefront:relatedProduct`): `@id` is the exact-string identity key, JSON-LD does not normalize it before comparison, and producers MUST emit the identical `@id` string for a product across its own Sheet and every reference to it; a locale prefix, trailing slash, or query/`?variant=` suffix breaks dedup. When a consistent `@id` cannot be constructed, references SHOULD carry a stable secondary identifier (`sku`/`gtin`/`gtin13`/`mpn`/`productID`) as a dedup fallback. See "Product identity and deduplication." No schema changes.
- **Multi-Sheet variant family pattern documented.** Documents how a variant family whose variants carry substantial per-variant content (own media, description, offers) is modeled as N+1 Sheets: one parent `ProductGroup` Sheet plus one Product Sheet per variant, linked by `isVariantOf` to the parent. Parent `hasVariant` entries carry `@id` and `url` (required) and `sheet_url` (recommended) so consumers can fetch a variant's Sheet without first loading its page. See "Multi-Sheet variant families." The `@id`, `url`, and `sheet_url` traversal fields on `hasVariant` entries are typed by the schema's `variantEntry` item definition (see the `(schema)` entry below).
- **(schema) `hasVariant` entries are now typed.** Previously `hasVariant` was `{"type": "array"}` with no item schema, so the render-hint and traversal fields the spec describes on each entry (`@id`, `url`, `sheet_url`, `name`, the Schema.org-native axis values (`color`/`size`/`material`), `price`, and the `image` render-hint) were enforced only by convention. A `variantEntry` item definition now types them (plus the `sku`/`gtin`/`gtin13`/`mpn`/`productID` identifiers), requiring only `@type` and, following the Schema.org-block convention, permitting additional properties. Backward-compatible: every existing variant entry across the case studies and spec examples validates unchanged; the definition types fields when present and adds no new requirements.
- **(schema) Data-block `url` is now conditional on `@type`.** `url` is required for `Product` and its subtypes but optional for `ProductGroup`, so a page-less parent `ProductGroup` Sheet (a variant-family parent with no backing human page, located only by `sheet_url`) is valid. Previously `url` was unconditionally required on every data block. Backward-compatible: existing Sheets all carry `url`.
- **Multiple video thumbnails documented.** Documents `thumbnailUrl` for interchangeable previews (same scene, different crops or sizes; the consumer picks any) versus Schema.org's `thumbnail` (an `ImageObject` array) for previews carrying distinct context (different scenes or use-cases, each with its own `description`/`caption`). One video remains one `VideoObject` regardless of preview count; multiple previews of one video do not become multiple `VideoObject`s. See "Multiple thumbnails." No schema changes (`thumbnail` and `thumbnailUrl` are Schema.org-native on `VideoObject`, permitted via `additionalProperties: true`).
- **Mixed cross-Sheet factoring and configurator price bands documented.** A product's axes can partition into page-factored axes (expressed through the variant relationship: a parent `ProductGroup` whose `hasVariant` enumerates the per-page variants, each page carrying `isVariantOf`) and within-page axes (expressed through `pagefront:configurator`), the two sets disjoint so no single Sheet declares any axis in both roles, which keeps the Sheet PDP-W-010-safe. When a configurator's per-combination pricing isn't fully extractable, pair it with an `AggregateOffer` on the same Sheet's `offers`, scoped to that Sheet's configurator axes: the configurator carries the option space, the `AggregateOffer` carries the price band (`lowPrice`/`highPrice`/`priceCurrency`, no `itemOffered`). See "Mixed cross-Sheet factoring" and "Configurator pricing and price bands." No schema changes (`pagefront:configurator` and the `aggregateOffer` `$def` already exist; `offers` already accepts `AggregateOffer`).
- **`pagefront:sizeRecommendation` (with `pagefront:SizeAdjustment`) added.** Typed fit guidance relative to labeled size: a `fitProfile` enum (`runs_small`/`true_to_size`/`runs_large`), a recommended size offset (`pagefront:SizeAdjustment`: `direction`, `magnitude`, optional `sizeSystem`), and prose rationale. Fills the fit-advisory gap in Schema.org's size vocabulary; measurements and size charts continue to use Schema.org `SizeSpecification`/`hasMeasurement`.
- **Product lifecycle documented.** `releaseDate` (Schema.org-native on `Product`) for market availability; end-of-life via Offer `availability: "https://schema.org/Discontinued"` paired with a `pagefront:relatedProduct` `replaced_by` entry pointing at the successor, whose own Sheet carries the inverse `replaces`. Lets agents answer "is this product current?" with Schema.org-native vocabulary plus the existing relationship enum. See "Product lifecycle." No schema changes.
- **Cross-merchant canonical reference via `sameAs` documented.** A reseller's Sheet SHOULD carry Schema.org's `sameAs` pointing at the brand's own canonical product page. `sameAs` is a deduplication hint; `@id` remains the exact-string identity key per "Product identity and deduplication." See "Cross-merchant canonical reference via `sameAs`." No schema changes.
- **EU energy efficiency documented.** `hasEnergyConsumptionDetails` with an `EnergyConsumptionDetails` object whose `hasEnergyEfficiencyCategory` is drawn from `EUEnergyEfficiencyEnumeration`, with scale bounds via `energyEfficiencyScaleMin`/`energyEfficiencyScaleMax`; the label graphic itself rides as an image or a `pagefront:document` entry with `role: "certificate"`. Regulation-driven and fully Schema.org-native. See "Energy efficiency." No schema changes.
- **Age suitability documented.** Age recommendations via `audience` carrying a `PeopleAudience` with `suggestedMinAge`/`suggestedMaxAge` (in years; `suggestedGender` MAY be added where the merchant declares it); regulatory age warnings ("Not suitable for children under 36 months") as an `additionalProperty` convention with `name: "age_warning"`. See "Age suitability." No schema changes.
- **Family/series membership example.** Pattern 3 of the relationship patterns (`isPartOf` → `Collection`/`ProductGroup`) is extended with a named brand → family → series hierarchy expressed by two levels of `isPartOf` nesting; no new vocabulary. See "Five patterns for product-to-product relationships." No schema changes.
- **JSON-LD context fix: `pagefront:sizeChart` and `pagefront:priceOnRequest` term mappings corrected.** Both carried a stray `"@type": "@id"` in the vocabulary's JSON-LD context, which directs a JSON-LD processor to treat the value as an IRI reference. Both values are inline embedded objects (`pagefront:SizeChart`, `pagefront:PriceOnRequest`), and the schema forbids a string value for either, so the mapping is corrected to a plain `@id` alias, matching `gemstone`/`construction`/`configurator` and the newly-added `sizeRecommendation`. Backward-compatible: no Sheet, fixture, or schema relied on IRI resolution.

## Changelog from v0.5

- **`inLanguage` case relaxation.** Earlier drafts and some implementations enforced canonical BCP 47 case via regex on `inLanguage`. v0.6 makes the standard's position explicit: case-insensitive per RFC 5646. The validator's linter (rule PDP-W-017) warns when non-canonical case is used. Real-world merchants (Amazon, others) commonly emit non-canonical case; the implicit constraint over-constrained valid input.
- **`pagefront:priceOnRequest` for Offers without published price.** Offers MAY now declare `pagefront:priceOnRequest` to explicitly signal that no price is published (for authorized-retailer models, quote-based pricing, or regional-reseller routing). This relaxes the v0.5 constraint that every Offer carry `price` or `priceSpecification`: an Offer carrying `pagefront:priceOnRequest` is exempt. The validator's linter (rule PDP-W-016) warns when an Offer has commercial structure but lacks both a price and a `pagefront:priceOnRequest` declaration, catching extraction failures while letting intentional omissions through. Detailed below under "Price-on-request offers."
- **Video support added.** Pagefront Sheets may now carry a top-level `video` array of `VideoObject` entries, sibling to `image`. A closed enumeration of video roles is defined (`overview`, `tutorial`, `lifestyle`, `construction`, `demonstration`, `comparison`, `unboxing`, `spin`). Both self-hosted (`contentUrl`) and embedded (`embedUrl`) videos are supported. Detailed below under "Video roles."
- **Accessibility recommendation for video.** Publishers SHOULD include `caption` or `transcript` on every `VideoObject`. This is a recommendation; the validator's linter (PDP-W-012) warns when accessibility metadata is absent, particularly on `overview` and `tutorial` roles where consumer comprehension matters most.
- **`itemOffered` `@id` reference pattern is now recommended.** In multi-Offer sheets (typically `ProductGroup` with `hasVariant`), each `Offer` SHOULD reference its target variant via `itemOffered: { "@id": "..." }` rather than duplicating the variant's identifiers inline. Resolves open question #2; the AFS Whitebird v0.5 revision demonstrated the pattern works.
- **Video is language-scoped.** Following the v0.5 internationalization model, the `video` array's contents are language-specific to the sheet's `inLanguage`. A French-language sheet carries French-language videos; an English-language sheet carries English-language videos. The same underlying video file MAY appear in multiple language sheets when its content is language-agnostic (instrumental demonstration, silent construction footage, etc.).
- **HTTP and HTTPS Schema.org URIs are both accepted.** Sheets carrying `http://schema.org/InStock` or `http://schema.org/NewCondition` are valid under v0.6, matching how every major Schema.org consumer (Google Rich Results, schema.org's own validator) treats the two scheme variants as semantically equivalent. The validator's linter (rule PDP-W-013) warns publishers still emitting HTTP URIs and recommends migrating to HTTPS as the canonical form. This relaxes the v0.5 regex, which over-constrained valid input.
- **ProductGroup variant completeness recommendation.** ProductGroup Sheets SHOULD declare all variants in the family; `hasVariant` is intended to be exhaustive at the moment of emission. When some variants cannot be discovered, producers should emit per-variant Product Sheets without a wrapping ProductGroup rather than a partial ProductGroup Sheet. Detailed below under "Required and recommended core fields."
- **Per-variant `url` field on `hasVariant` entries.** Each entry in `hasVariant` MAY declare a `url` carrying addressability information for the variant. Per-variant `url` SHOULD be populated when each variant has a meaningfully distinct addressable URL, whether via platform-specific query parameters on a shared page (e.g., `?variant={id}`) or its own distinct page, and MAY be omitted only when variants share the exact same URL with no parameter-based differentiation. The variant's `@id` remains the primary identifier; `url` is supplementary metadata. The ProductGroup's top-level `url` remains the canonical URL of the product family.

## Changelog from v0.4.1

- **Vocabulary settled.** The published Sheet is named the **Pagefront Sheet**. The collective layer of all Sheets published across the web is the **Machine Web**. The specification document is the **Pagefront Spec**.
- **Envelope field rename: `artifact_url` → `sheet_url`.** Breaking wire-format change in v0.5.
- **Internationalization model defined.** Pagefront Sheets are language-scoped: one `inLanguage` per sheet, multi-currency handled inline via multiple `Offer` entries with `areaServed`.
- **Sheet URL convention promoted from recommendation to normative pattern.** `/pagefront/{type}/{id}.{lang}.json`.
- **Conditional identifier requirement** based on `@type`.
- **Configurator vs. ProductGroup guidance is now normative.**

## Changelog from v0.4

- **Completeness block removed from the envelope.** Computed by the validator; the sheet does not embed it.

## Changelog from v0.3

- **Provenance metadata removed from the envelope.** Audit lives in the producing pipeline; the published sheet does not carry it.
