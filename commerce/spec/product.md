# Pagefront Product Sheet

Status: normative spec.
Product Sheet spec version: 0.11.0
Commerce release: 0.5.0
Schema.org version targeted: 30.0 (2026-03-19)

**Versioning.** This sheet spec has its own semver, 0.11.0, and is a member of commerce release 0.5.0. A sheet declares the release in its envelope (`release`) and names this spec version in `$schema`. Before 1.0 a breaking or an additive change bumps the minor and a fix or clarification bumps the patch; the release bumps with its members. The scheme, the release table and the legacy draft line (sheets carrying `format_version`) are in [`releases.md`](releases.md). The "v0.7", "v0.9" and similar version names throughout this document are legacy format versions, kept as history.

## Design principles

Pagefront defines the structure of the published Sheet; what's inside the Sheet is the publisher's authoritative statement. The Sheet is JSON-LD, served on the publisher's domain at the address the page declares, discoverable via `Link: rel="alternate"`. Schema.org is the data vocabulary; `pagefront:` extensions cover what Schema.org under-specifies for commerce. The format prioritizes Schema.org compatibility: consumers ignoring `pagefront:` extensions parse the Sheet as clean Schema.org JSON-LD. A `pagefront:` term is minted only where Schema.org has a gap, under-specifies the concept, or conflicts with Pagefront's contract; everywhere else the sheet uses Schema.org's own vocabulary. [why](product-notes.md#when-to-extend-schemaorg-with-pagefront-vocabulary) The sheet carries no completeness score; scoring is consumer-side ([`scoring.md`](scoring.md)). [why](product-notes.md#why-completeness-is-not-in-the-sheet)

### What the schema validates

The JSON Schema validates the envelope and `pagefront:`-prefixed extensions strictly. Schema.org-typed content within the data block is permitted by reference and validated upstream by Schema.org-aware consumers. Producers extend the Sheet with Schema.org properties Pagefront doesn't explicitly model; the schema's `additionalProperties: true` policy on Schema.org-typed blocks lets these through without constraint. Pagefront-recommended patterns built on Schema.org vocabulary need no schema change; schema changes are reserved for envelope fields and `pagefront:`-prefixed extension types. [why](product-notes.md#why-the-schema-validates-the-envelope-and-the-extensions-only)

### Upstream-equivalent forms

Where an upstream standard (Schema.org, RFC 5646 for BCP 47, ISO 3166, etc.) treats two or more forms as semantically equivalent, Pagefront accepts all of them. The standard recommends a canonical form via linter warning but does not reject the non-canonical forms as invalid. Producers SHOULD emit canonical forms; consumers MUST treat forms as their upstream standard treats them: case-insensitive comparison for BCP 47 tags, scheme-insensitive comparison for Schema.org URIs, and so on.

Two concrete examples:

- **Schema.org URIs.** `http://schema.org/InStock` and `https://schema.org/InStock` both validate. Schema.org treats the scheme variants as semantically equivalent; the validator's linter (rule PDP-W-013) warns on the legacy HTTP form and recommends migrating to HTTPS as the canonical form.
- **BCP 47 tags.** `en-US` and `en-us` both validate. RFC 5646 declares language tags case-insensitive; the validator's linter (rule PDP-W-017) warns when the case differs from the conventional canonical form (lowercase language subtag, uppercase region subtag).

The schema enforces structural validity; the linter expresses canonical preference.

## The envelope

The envelope is project-defined. It wraps one data block and states which release and sheet spec the sheet is written against, which page it describes and when it was generated.

```json
{
  "$schema": "https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json",
  "release": "0.5.0",
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

- **`$schema`** *(required)*: the URL of the JSON Schema for the sheet's own sheet-spec version, with the full semver in its last segment: `https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json` for Product Sheet spec 0.11.0. It names the sheet spec; the release has no schema of its own. It is what identifies the vertical and the sheet type, and what the release is checked against. The release and the sheet type resolve to exactly one sheet-spec version through the release table in [`releases.md`](releases.md) (machine-readable in [`releases.json`](releases.json)), and `$schema` MUST name that version: a Product Sheet declaring release 0.5.0 points `$schema` at `product/v0.11.0.json`, one declaring release 0.4.0 at `product/v0.10.0.json`, and one declaring release 0.3.0 at `product/v0.9.0.json`. Check: PDP-E-002.
- **`release`** *(required)*: the commerce release the sheet is written against, as a full semver (`"0.5.0"`). It replaces `format_version`, the field of the legacy draft line. A sheet is judged by the release it declares: it is validated against the schema of the sheet-spec version that release bundles, and by the rules that apply from that release. A requirement introduced by a later release does not apply to it. Whether `$schema` is required is itself such a requirement: the schema of Product Sheet spec 0.10.0 requires it, and the schema of 0.9.0 does not. Checks: PDP-E-018 (a release the table does not list), PDP-E-016 (`format_version` beside `release`). [why](product-notes.md#why-release-has-a-generic-name)
- **`schema_org_version`** *(required)*: the Schema.org version the data block targets, as its number (`"30.0"`).
- **`canonical_url`** *(required)*: the canonical URL of the page this sheet describes.
- **`sheet_url`** *(optional)*: an address this Sheet is served from, as known to the publisher at generation time. It is informational. The authoritative location of a Sheet is whatever the canonical page currently declares; a publisher whose platform assigns or changes the address after generation MAY omit this field. Sheets written before 2026-10-13 carry it, and nothing in them changes. [why](product-notes.md#why-sheet_url-is-informational)
- **`generated_at`** *(required)*: when the sheet was generated, an RFC 3339 date-time (the schema's `date-time` format).
- **`expires_at`** *(recommended)*: how long consumers should consider the sheet valid before re-fetching, an RFC 3339 date-time. Publishers SHOULD declare it when they have a meaningful expiry policy, and MAY omit it when the sheet has no defined expiry. Sheets carrying multi-currency `offers`, region-scoped offers or scheduled promotions SHOULD use shorter `expires_at` windows to reflect price volatility. Check: PDP-W-008 (past, or trivially close to `generated_at`).
- **`data`** *(required)*: the Schema.org JSON-LD data block, the next section.

**The legacy draft line.** A sheet carrying `format_version` and no `release` belongs to the legacy draft line, format versions 0.9 and earlier: `format_version` stands in for `release`, `$schema` is optional, the sheet validates against the legacy schema, which stays served at `https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json`, and it gains nothing from later releases. See "The legacy draft line" in [`releases.md`](releases.md).

## data — Schema.org JSON-LD

The data block is a valid Schema.org Product (or `ProductGroup`, or a recognized subtype) document with optional project extensions under the `pagefront:` namespace.

### Required and recommended core fields

Required:

- **`@context`**: `"https://schema.org"` when the data block uses no `pagefront:` term. A data block that uses any `pagefront:` term MUST declare the prefix, in the array form `["https://schema.org", {"pagefront": "https://themachineweb.org/pagefront/vocabulary/"}]`; see [vocabulary.md, "How to use this vocabulary"](vocabulary.md#how-to-use-this-vocabulary). Under the bare string a `pagefront:` key is an opaque IRI with scheme `pagefront`: it does not resolve to the vocabulary, and the vocabulary context's `@container` declarations do not apply to it. Check: PDP-E-003.
- **`@type`**: `"Product"` (or `"ProductGroup"`, or a recognized subtype).
- **`@id`**: a stable URL-shaped identifier. It is the identity key, matched as an exact string (see "Product identity and deduplication").
- **`name`**: the product name as displayed to humans.
- **`inLanguage`**: a BCP 47 language tag (`fr`, `fr-CA`, `en-GB`); the language of all prose fields and language-scoped media in this sheet.
- **`url`**: the canonical URL of the human page. Required for `Product` and subtypes, optional for `ProductGroup`: a parent `ProductGroup` Sheet with no backing family page omits `url` and is reached by the `sheet_url` hint on its variants' `isVariantOf` (see "Multi-Sheet variant families").
- **One identifier**, by `@type`: for `Product` and product subtypes, one of `sku`, `gtin13`, `gtin`, `mpn` or `productID`; for `ProductGroup`, `productGroupID`, and per-variant SKUs SHOULD also be declared on each entry in `hasVariant`. The product *type* identification GPSR Art. 9(5) asks for is covered by `mpn`/`productID`. Batch and serial numbers identify individual units, so they are out of scope for a Sheet and MUST NOT be stuffed into `sku`.

Recommended:

- **`brand`**: a typed `Brand` or `Organization`. Check: PDP-W-003 (absent).
- **`description`**: a prose description in `inLanguage`. Check: PDP-W-002 (absent).
- **`category`**: the hierarchical category string ("Apparel > Knitwear > Sweaters"), optionally beside a coded form (see "Machine-readable category").
- **`isPartOf`**: an array of `Collection` member entries, one per set whose direct members include the product, each in the member entry shape of the Commerce Collection Sheet (`@type`, `@id`, `url`, `pagefront:sheetUrl`, `name`, `pagefront:collectionKind`; see "The product side" in [`collection.md`](collection.md)). The `category` string is unchanged: it is the human path and `isPartOf` is the machine link; the two SHOULD agree where both are present, and the linter does not compare them. A product's `isPartOf` does not list a collection filled by a rule, since that collection has no sheet (see "Listing pages without a Sheet" in [`collection.md`](collection.md)).
- **`image`**: an array of `ImageObject` (see "Image roles").
- **`video`**: an array of `VideoObject` (see "Video roles").
- **`offers`**: an array of `Offer` (see "Offers").
- **`isVariantOf`**: the `ProductGroup`, when the product belongs to a variant family.
- **`pagefront:availableLanguages`**: an array of `{lang, url}` objects pointing at language siblings, when the publisher publishes in multiple languages (see "Internationalization").
- **`question`**: an array of Schema.org `Question` entries with `acceptedAnswer` (see "Product Q&A").
- **`pagefront:document`**: an array of typed product documents (see "Documents").
- **`pagefront:relatedProduct`**: an array of typed product relationships (see "Related products").

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

- **One parent ProductGroup Sheet** at the family's canonical URL. Its `hasVariant` array enumerates every variant, each entry linking to that variant's own Sheet. When the family has no backing page of its own (the variants are the only human-facing pages and there is no family landing page), the parent is page-less: it omits the data-block `url` (there is no family page to point at) and is reached by reference only. Consumers reach a page-less parent by following `isVariantOf.sheet_url` from a variant Sheet.
- **One Product Sheet per variant**, each carrying `isVariantOf` pointing at the parent's `@id`.

This gives bidirectional traversal. A variant Sheet reaches its parent via `isVariantOf`; the parent reaches its variants via `hasVariant`. An agent landing on a variant page reaches that variant's Sheet via `Link: rel="alternate"`, follows `isVariantOf` to the parent Sheet, and reads the parent's `hasVariant` to enumerate sibling variants. An agent landing on the family page reads the parent's `hasVariant` to reach each variant directly.

**Traversal hints.** `sheet_url` on a `hasVariant` entry and on `isVariantOf`, `pagefront:sheetUrl` on an organization reference and on a collection reference (an `isPartOf`, `hasPart` or `hasOfferCatalog` entry), and the `url` of a `pagefront:availableLanguages` entry are traversal hints under "Traversal hints" in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md#traversal-hints-normative)): each MAY be stale, and a consumer reaches the target through its page and the Sheet that page declares. A page-less parent has no page of its own, so the hint on its variants' `isVariantOf` is the only path to it; a publisher that moves a page-less parent re-emits the variant Sheets that point at it.

Each parent `hasVariant` entry carries:

- `@id` *(required)*: matches exactly the `@id` in the variant's own Sheet. The exact-string match is what lets a consumer recognize the parent's reference and the variant's self-description as the same product; see "Product identity and deduplication" for the `@id` contract.
- `url` *(required)*: the variant's page.
- `sheet_url` *(recommended)*: the URL of the variant's Sheet. It lets a consumer fetch the variant Sheet directly without first loading the variant page and reading its `alternate` link. A producer emitting both the parent and the variant Sheets knows this URL and SHOULD populate it. It is a traversal hint under the rule above: it MAY be stale, and when it is absent or does not resolve the consumer reaches the variant Sheet via `url` + `alternate`.
- `name`, the axis value (e.g. `color`), `price`, and an `image` render-hint: *optional*, but enough together to render a family picker without fetching every variant Sheet.

Each variant Sheet carries `isVariantOf` with the parent's `@id`, and SHOULD carry the parent's `sheet_url` so traversal to the parent is symmetric: a consumer on the variant Sheet can fetch the parent directly, without resolving it through the variant page. This `sheet_url` is a traversal hint under the rule above: it MAY be stale, and when the parent has a page the consumer falls back to that page and the Sheet it declares.

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

A **page-less parent** ProductGroup: a family whose variants each have their own page but that has no family landing page of its own. Its data block omits `url` and is reached by the `sheet_url` hint on its variants' `isVariantOf`, as described at the start of this section. The `productGroupID` identifier requirement still holds; only `url` is dropped. Each variant entry still carries its own page `url`:

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

Each entry in `hasVariant` MAY declare a `url`: the variant's own page, or the page state that pre-selects the variant. The ProductGroup's top-level `url` remains the canonical URL of the product family (typically the merchant's primary listing page or the page from which variant discovery began), and the variant's `@id` remains its identifier; the per-variant `url` is what lets a consumer address a variant individually (an agent recommending one variant, link sharing). When the parent has no family page (see "Multi-Sheet variant families"), its top-level `url` is absent and each variant still declares its own page `url` under the same guidance.

- **Shared-URL variants**: variants share the parent product's URL and are distinguished only by `@id`. The per-variant `url` MAY be omitted. Rare in practice.
- **Same-page parameterized variants**: variants share the parent product's page, and each has a distinct addressable URL through platform-specific query parameters (`?variant={id}` on Shopify). Per-variant `url` SHOULD be populated. These URLs are semantically equivalent to the parent product URL, so consumers SHOULD treat them as the same canonical page with a different default state.
- **Distinct-page variants**: each variant has its own page on its own URL (a watch family where each dial color is its own page, though such families are typically modeled as separate Sheets). Per-variant `url` is essential.

Checks: PDP-W-014 (no per-variant `url` where variants are distinctly addressable), PDP-W-018 (`url` on some variants and not others).

#### ProductGroup `name` and Google Merchant Center `item_group_title`

For implementers transitioning from Google Merchant Center feed formats: the `name` field on a `ProductGroup` is the Pagefront equivalent of Google's `item_group_title` attribute. The two carry the same intent: a human-readable title for the variant family that is distinct from any individual variant's `name`. Pagefront expresses it via Schema.org's native `name` on the `ProductGroup`; no dedicated attribute is minted, because the semantic is already covered by Schema.org's existing vocabulary.

#### Variant dimensions

ProductGroup Sheets SHOULD declare the axes along which their variants differ, and each variant in `hasVariant` declares its value on every axis.

- **`variesBy`** on the `ProductGroup`: the axes, one entry each, so consumers discover them without scanning variants. A Schema.org-native axis (`color`, `size`, `material`) is referenced by its full Schema.org URI (`https://schema.org/color`, `https://schema.org/size`, `https://schema.org/material`). A registry entry or a producer-defined axis is referenced by its bare `propertyID` string: `storage` and `width` are registry entries; `packaging_ribbon_color` illustrates a producer-defined axis with no registry entry. Consumers distinguish the two forms by the presence of a URI scheme, and a group that varies along both kinds has mixed entries:

```json
"variesBy": ["https://schema.org/color", "storage"]
```

- **A variant's value on a Schema.org-native axis**: the Schema.org property, `color`, `size` or `material`, directly on the `hasVariant` entry. Preferred whenever Schema.org models the axis.
- **A variant's value on any other axis**: an `additionalProperty` entry whose `propertyID` matches the bare-string axis in `variesBy` and whose `value` is the variant's value on that dimension. `name` is the display label and may be localized; `propertyID` is the language-neutral coordination key.
- **`propertyID`**: drawn from the Pagefront Property Registry, a machine-readable, versioned registry at `https://themachineweb.org/pagefront/commerce/registry/properties.json`, when a matching entry exists. Producers SHOULD use the registry's identifiers and emit values in the entry's recommended unit (`recommendedUnitCode`, or `unitLabel` when no UN/CEFACT code exists), so raw values compare across sheets without conversion. A `propertyID` outside the registry is valid: consumers MUST treat it as an opaque but usable identifier and MUST NOT reject a sheet over it. Consumers MAY ship a pinned snapshot of the registry; fetching it at runtime is not required. [why](product-notes.md#why-examples-use-unregistered-propertyid-values)

A registry entry carries:

- `id`: the `propertyID` value.
- `definition`: a short description of the dimension.
- `valueType`: `string`, `number`, or `boolean`.
- `recommendedUnitCode`: a UN/CEFACT unit code, or `null` when no UN/CEFACT code exists for the concept (in which case a `unitLabel` carries the conventional symbol, e.g. `"MP"` for megapixels).
- `repeatable`: present and `true` for axes that take multiple values per product (e.g. `input_type`, `port`).
- `verticals`: the product categories the entry is used in.
- `status`: `proposed`, `stable`, or `deprecated` (see "Registry governance" below).

#### Registry governance

The Pagefront Property Registry's lifecycle is modeled on IANA's link-relation registry (see RFC 8288 §6.2.1, referenced in Pagefront Discovery): entries move through three states.

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
- **References resolve.** Every pair in an exclusion, and in an adjustment's `when`, MUST name a dimension the configurator declares. Where that dimension lists `options`, the pair's value MUST be the `value` of one of them. The two are compared by JSON value equality, type included, with no conversion: the number `1` and the string `"1"` are different values, and `1` and `1.0` are the same number. A dimension that lists no options takes any value. A pair that resolves to nothing would exclude no configuration, or never apply, without any sign of it. This requirement is new in Product Sheet spec 0.10.0 (linter rule PDP-E-017, which applies from release 0.4.0).
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

Each VideoObject in the `video` array can declare a role via `additionalProperty`, mirroring the image-role pattern. User-generated videos, live streams and advertisements get no role of their own, and `hero` is an image role only. [why](product-notes.md#whats-not-in-video) The closed enumeration:

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

Video is language-scoped. A French-language sheet's `video` array contains French-language videos; an English-language sheet's contains English-language videos. Cross-language navigation between sheets is via `pagefront:availableLanguages` (see "Internationalization"). A single sheet's video array does not mix languages.

When a video is language-agnostic (silent construction footage, instrument demonstrations without spoken content), publishers MAY include the same video file in multiple language sheets. The `caption` and `transcript` fields, if present, SHOULD match the sheet's `inLanguage`.



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

Only the grouping shell is minted; the rows inside it are Schema.org `PropertyValue` objects. [why](product-notes.md#why-feature-groups-are-minted)

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

The raw value goes in Schema.org's `value`, and the display string, when the merchant has one, goes in `pagefront:presentationValue`: a merchant renders "Up to 30 h (ANC on)" where the comparable quantity is `30` `HUR`. When the raw value renders acceptably as-is, omit `pagefront:presentationValue`; most rows need only `value` and `unitCode`. [why](product-notes.md#why-pagefrontpresentationvalue-exists)

The audio example below draws `driver_size` and `active_noise_cancellation` from the Pagefront Property Registry (both `status: proposed`). `earcup_fold_mechanism` has no registry entry and is producer-defined: producers MAY mint IDs like it for facets too idiosyncratic to standardize, and consumers MUST treat them as opaque but usable, the same rule the registry gives any unregistered `propertyID` (see "Variant dimensions"). [why](product-notes.md#why-examples-use-unregistered-propertyid-values)

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

The row vocabulary (`propertyID` values and their units) follows the `propertyID` rule above; see "Variant dimensions" and "Registry governance" for the registry.

### Product highlights

Pagefront Sheets MAY carry `pagefront:productHighlights`, an ordered array of short, publisher-authored selling-point strings: the merchant's own ranked statement of what matters about this product, as rendered in the page's highlight bullets.

The order is part of the value: the term is marked `@container: @list` in the JSON-LD context, so it survives JSON-LD processing as a list. [why](product-notes.md#why-product-highlights-are-minted-and-ordered)

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
- `repairability_index`: a regulation-driven repairability score document (e.g. the French *indice de réparabilité* label, the EU's emerging repairability labels). Cross-category and regulation-driven. Distinct from `certificate`, on the same rationale that separates `environmental_declaration`: a certificate is a conformity attestation, whereas this is a standardized regulatory disclosure. The document carries the score; a structured repairability *score* field (numeric value, scale, jurisdiction) is not modeled. [notes](product-notes.md#new-design-questions-surfaced-in-v08)
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

Pagefront Sheets MAY carry a `pagefront:legalEntity` array declaring the legal entities behind a product and their roles: the responsible economic operator the EU General Product Safety Regulation (GPSR) requires for products sold into the EU, the licensee of licensed goods, the importer. [why](product-notes.md#why-legal-entities-are-role-typed)

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

The `@id` resolves to the organization sheet the same identity way as `Product.brand` and `Offer.seller`: exact-string `@id` match, per "Product identity and deduplication." `pagefront:sheetUrl` states where that sheet is, as a traversal hint that MAY be stale (see "Traversal hints" in Pagefront Discovery); the rules for following it are the linking contract in [`organization.md`](organization.md#linking-contract-identity-only).

When the entity is a third party with no sheet, or varies by product or market, it stays fully inline with `name` and `address`. An `authorized_representative` or `importer` (the GPSR responsible person, the importer of record) is the typical case.

The reference form does not replace the inline form. A `brand_owner` or `manufacturer` reference stub SHOULD resolve to a Commerce Organization Sheet declaring the matching `pagefront:commerceRole`. The linter's stub-vs-inline distinction (PDP-E-001 / PDP-W-020) applies to the stub unchanged, and the stub is exempt from PDP-W-024, the no-postal-address warning. [why](product-notes.md#why-the-reference-form-does-not-replace-the-inline-form)

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

The `age_warning` `additionalProperty` convention (see "Age suitability") predates this field and remains valid for the age case; `pagefront:safetyWarning` is the general, typed form.

Each entry carries:

- `@type: pagefront:SafetyWarning` *(required)*
- `text` *(required)*: the warning, in the sheet's `inLanguage`.
- `pictogram` *(optional)*: URL of the warning pictogram image shown with the warning.
- `hazardCategory` *(optional)*: the hazard class, as an **open vocabulary**. Common values: `choking_hazard`, `suffocation`, `fire`, `electrical`, `chemical`, `entanglement`. Consumers SHOULD treat unknown values as opaque categories, without rejecting them; conventions stabilize through real-merchant use, as with the variant-dimension registry.

Producers SHOULD emit the warnings verbatim as shown on the page.

Warnings are language-scoped like all prose fields: a French-language sheet carries French-language warnings. A producer publishing into multiple EU markets publishes the warning in each language sheet, one language per sheet. [why](product-notes.md#why-safety-warnings-are-verbatim-and-per-language)

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

A recalled product is a different fact from a discontinued one: `availability: "https://schema.org/Discontinued"` means "no longer sold", and the notice says what the owner should do. [why](product-notes.md#why-safety-notices-are-a-field-of-their-own)

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

Pagefront Sheets MAY carry a `pagefront:relatedProduct` array expressing typed relationships between products, in a closed enum a consumer acts on; Schema.org's `isRelatedTo`, `isSimilarTo`, `isAccessoryOrSparePartFor` and `isConsumableFor` stay valid for the untyped cases. [why](product-notes.md#why-related-products-are-typed)

Each entry has the shape:

- `@type: pagefront:RelatedProduct` *(required)*
- `relationship` *(required)*: closed enum (see below).
- A target identifier, in one of two forms:
  - `@id` reference to another Pagefront Sheet (preferred for same-publisher products).
  - A Schema.org identifier on the target object: `sku`, `gtin`, `gtin13`, or `mpn` (for cross-merchant or non-Pagefront-published references).
- `name` *(recommended)*: human-readable name of the related product.
- `url` *(recommended)*: canonical URL of the related product page.
- `image` *(optional)*: a single image URL for rendering the reference in a list without dereferencing. This is a render convenience; it may be stale relative to the target product's own Sheet, which holds the canonical, fully-roled image set. Producers should populate it with the related product's primary identifying image (its hero or packshot). Consumers rendering a related-products carousel may use this image directly; consumers needing current or role-specific imagery should dereference to the target Sheet via `@id` or `url`.

A Schema.org `Product` reference in `isRelatedTo`, `isSimilarTo` or `hasPart` carries the same render hint through its own `image` property. [why](product-notes.md#why-image-on-a-related-product-mirrors-schemaorgs)

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

The typed relationships divide in how publishers declare them. `accessory`, `consumable`, `required_part`, `spare_part`, `replaces`, `replaced_by`, `bundle_component`, `compatible_with` and `service` are **operationally tracked**: they reflect business operations the publisher maintains whatever its catalog size. `often_bought_with` and `recommended_with` are **marketing-declared**: hand-curated at small scales, and at larger scales typically generated by a recommendation engine and displayed without being individually declared by the publisher. [why](product-notes.md#why-typed-relationships-divide-along-operational-and-marketing-lines)

Producers SHOULD use typed enum values for relationships the publisher has declared itself: operationally-tracked data, or hand-curated marketing pairings. Producers SHOULD NOT coerce algorithmic recommendation-engine output into typed enum values; these are publisher-surfaced without being publisher-declared, and belong in Schema.org's native `isRelatedTo` (Pattern 5 in the relationship-patterns guidance below).

For the marketing-shaped values specifically:

- `often_bought_with`: Use when the publisher has explicitly identified a co-purchase pattern (sometimes surfaced as a merchandising rule, sometimes manually curated as "frequently bought together"). Do NOT use for raw recommendation-engine output even when the engine claims to compute co-purchase data; the engine's output goes to `isRelatedTo` unless the publisher has reviewed and endorsed specific pairings.
- `recommended_with`: Use when the publisher has manually curated a pairing in their content management system (a marketing editor selecting "this product pairs with this one"). Storyblok's `linked_products` field with editor-populated values is a representative example. Do NOT use for recommendation-engine output even when displayed in a "Recommended" UI section; the engine's output goes to `isRelatedTo`.

Rule-based generation is an intermediate case. When a publisher defines a rule that produces relationships (e.g., "show all watch straps for any watch product"), the rule itself is a publisher declaration, but each specific pairing is generated by the rule. Producers SHOULD treat these as `isRelatedTo`, since the publisher's declaration is at the rule level and no specific pairing was individually curated.

#### The structured-identifier requirement

Beyond whether the publisher typed the relationship, `pagefront:relatedProduct` has a structural prerequisite: each entry must carry at least one structured identifier: `@id` (URL-shaped), `sku`, `gtin`, `gtin13`, or `mpn`. The JSON Schema enforces this via `anyOf`; a reference with only `name` and `url` does not validate as a `pagefront:relatedProduct` entry. [why](product-notes.md#why-a-typed-relationship-needs-a-structured-identifier)

Schema.org's `isRelatedTo` carries no such requirement. A reference with only `name` and `url` is a valid Schema.org `Product` reference, permitted via the `additionalProperties: true` policy on Schema.org-typed blocks.

A producer should therefore use `pagefront:relatedProduct` only when BOTH conditions are met:

1. **Is the relationship publisher-typed?** (Operational data, manual editor curation, explicit merchant tagging; see the operational-vs-adjacency guidance above.)
2. **Does the source data carry a structured identifier?** (`sku`, `gtin`, `gtin13`, `mpn`, or an `@id` derived from a stable identifier.)

If either fails, the reference belongs in `isRelatedTo`.

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

**Pattern 3: Schema.org `isPartOf` / `hasPart` for family or collection membership.** When the source product belongs to a named collection or family and the relationship being expressed is "siblings within that family," the right model is the family itself as a first-class entity. Use `isPartOf` to declare the source product's membership in the family; the family entity carries `hasPart` pointing at sibling members. These siblings belong to the same family. A plain "related" reference to the source product would lose that membership. The family entity can be modeled as a Schema.org `Collection` or `ProductGroup` with `name`, `url`, and `hasPart` entries. Where the publisher emits Commerce Collection Sheets ([`collection.md`](collection.md)), the family and the series are sheets of their own: the product's `isPartOf` entry references the set in the member entry shape and nests no `isPartOf` of its own, since the hierarchy lives in the sheets. The inline nesting shown here stays valid for a publisher without collection sheets.

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

v0.8 carries qualitative relationships only. Weighted relationships (e.g., `often_bought_with` with a percentage) are not modeled. [notes](product-notes.md#new-design-questions-surfaced-in-v07)

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

An Offer in `offers`: what a shopper in one market is offered. One Offer per variant on a ProductGroup, each naming its variant; one Offer on a Product. Every value is what the merchant's page or data states; a value the page does not state is left out. An offer without a price is a price-on-request offer ("Price-on-request offers") or an unavailable one ("Unavailable offers without a price" under "Tax inclusion").

- **`url`**: the page on which this offer is bought ("Where to buy").
- **`price`**: the displayed consumer price for the offer's declared region: the unit amount a consumer in that region is shown and pays for the item itself, in `priceCurrency`, at the moment the sheet was generated. Where that region's consumer-protection law requires displayed prices to include value-added tax, `price` includes it; where the prevailing convention displays prices before sales tax added at checkout, `price` excludes it. In both cases `price` excludes shipping, which is declared on `shippingDetails` or resolved from the seller sheet's `pagefront:fulfillmentTerms`. Source: the price rendered on the merchant's product page; an amount from the page's structured data or from a platform API is used only to check it, and a producer MUST NOT publish, as `price`, an amount the consumer is never shown. A JSON number or a decimal string, one carrier per sheet ("Amounts"). The tax basis is stated only where the merchant states it, as `valueAddedTaxIncluded` on a `UnitPriceSpecification` that mirrors the price; "Tax inclusion" gives the sources of the price and of its basis. A former price, a range and quantity tiers: "Common pricing patterns". Checks: PDP-W-028 (no basis stated), PDP-W-029 (no region declared). [why](product-notes.md#why-price-is-the-displayed-consumer-price)
- **`priceCurrency`**: the ISO 4217 code of `price`. Check: PDP-W-004 (price without currency).
- **`availability`**: a Schema.org URI: `InStock`, `OutOfStock`, `SoldOut`, `Discontinued`, `PreOrder`, `BackOrder`, `MadeToOrder`, `LimitedAvailability`, `InStoreOnly`. Source: as the page shows it; the merchant's structured data checks it and is never its source. The `https://schema.org/` form is canonical and recommended for new sheets; the `http://` form is accepted and consumers SHOULD treat the two as equivalent. Check: PDP-W-013 (legacy `http` form). [why](product-notes.md#why-both-schemaorg-schemes-are-accepted)
- **`itemCondition`**: a Schema.org URI such as `NewCondition` or `UsedCondition`, in either scheme form. Source: the page.
- **`seller`**: the organization selling: `@id`, `name`, `url`, and `pagefront:sheetUrl` to its Commerce Organization Sheet on this sheet's host, under the linking contract in [`organization.md`](organization.md#linking-contract-identity-only). Returns and shipping not stated on the Offer are read from that sheet ("Return policy").
- **`areaServed` or `eligibleRegion`**: the market the price is for. Source: only where the merchant states it, under the no-inference rule in "Tax inclusion". Required before a checkout template. Check: PDP-W-029 (price without a region).
- **`acceptedPaymentMethod`**: as the page states.
- **`hasMerchantReturnPolicy`**, **`shippingDetails`**: only where this product deviates from the seller's store-wide terms ("Return policy").
- **`availableDeliveryMethod`**, **`availableAtOrFrom`**: the delivery modes the page states ("Delivery").
- **`warranty`**: the commercial warranty the page states for this offer ("Warranty").
- **`checkoutPageURLTemplate`**: a merchant-stated checkout link ("Where to buy").
- **`itemOffered`**: on a sheet with several Offers, the variant this Offer is for ("itemOffered references").
- **`pagefront:priceOnRequest`**: in place of a price, where the merchant intentionally publishes none ("Price-on-request offers").
- **`priceSpecification`**: `UnitPriceSpecification` entries carrying the tax basis, a former price or quantity tiers ("Common pricing patterns").

#### Return policy

The store-wide return policy is a property of the seller. It lives on the seller block of the seller's Commerce Organization Sheet ([`organization.md`](organization.md)) as `hasMerchantReturnPolicy`, stated once. Store-wide shipping terms live there too, as `pagefront:fulfillmentTerms`, an array of Schema.org-native `OfferShippingDetails` objects.

- **`hasMerchantReturnPolicy`** on the Offer: only when the product deviates from the store default: a final-sale item, or a made-to-order product, whose returns exceptions already live in `pagefront:madeToOrderTerms` and stay there. A `MerchantReturnPolicy`, as the page states it.
- **`shippingDetails`** on the Offer: only when the product deviates from the seller's `pagefront:fulfillmentTerms` (bulky items with their own shipping rates, made-to-order lead times). An `OfferShippingDetails`; "Shipping cost declared alongside price" gives the shape.

**Reading the terms.** A consumer reads the product's own terms if present. Otherwise it follows `Offer.seller` to the seller's Commerce Organization Sheet, located by the reference's `pagefront:sheetUrl` and resolved per the linking contract in [`organization.md`](organization.md#linking-contract-identity-only), which places it on the product sheet's own host, and uses its store-wide policy. Terms are inherited only from that sheet. When the seller sheet cannot be resolved (no `pagefront:sheetUrl`, a failed host check, or an `@id` or role mismatch), the inherited terms are unknown, and a consumer draws no conclusion about the product's return policy from its silence. The read is scoped to return and shipping terms; it does NOT generalize to other fields. [why](product-notes.md#why-returns-and-shipping-default-to-the-seller-sheet)

A warranty is a separate matter from returns: see "Warranty".

#### Warranty

A warranty the page **states** ("2-year warranty", "lifetime warranty on manufacturing defects") is a `WarrantyPromise`. A warranty **document** (the terms as a file) is a `pagefront:document` entry with `role: "warranty"` (see "Documents"). A page may carry both.

- **`warranty`** on the Offer: a warranty given by the **seller**, as Schema.org's `warranty`. Also where a warranty statement goes when the page does not say who gives it.
- **`pagefront:manufacturerWarranty`** on the Product: a warranty the page attributes to the **manufacturer**; it follows the product across every retailer and is claimed against the manufacturer. Placed here only when the page names the manufacturer as the guarantor. A retailer's sheet may carry both: the manufacturer's warranty on the Product and its own on the Offer. [why](product-notes.md#why-a-warranty-goes-where-the-guarantor-is)
- **Shape**, a `WarrantyPromise`:
  - `durationOfWarranty`: a `QuantitativeValue` with `value` and a UN/CEFACT `unitCode` (`ANN` years, `MON` months, `DAY` days), when a finite length is stated. A lifetime warranty states no finite length: omit `durationOfWarranty` and carry the statement in `description`; never encode "lifetime" as a large number.
  - `description`: the statement as written on the page.
  - `name` *(optional)*: a short label ("Lifetime Warranty"); `WarrantyPromise` inherits `name` from `Thing`.
  - `warrantyScope` *(optional)*: Schema.org's scope of the promise, where the page states one.
- **Several region-scoped Offers**: each carries its own `warranty`; the entries are identical where the warranty is the same across markets, and each Offer states its own where it differs.
- **Commercial warranty only**: the promise as the page states it. Producers MUST NOT synthesize a warranty from a statutory minimum (such as a legal conformity guarantee) when the page states none.
- **Paid extended warranties** ("add 3-year protection for €49") are a distinct product with its own price: a `service` relationship (see "Related products"), never `warranty`.

Check: PDP-W-030 (a `warranty` or `pagefront:manufacturerWarranty` with neither `durationOfWarranty` nor `description`).

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

#### Trust strips

Product pages often display a strip combining several commitments ("2-year warranty · 30-day returns · free delivery"). Each fact has its own home; producers split the strip rather than storing it as one string:

- Warranty statement → `warranty` on the Offer, or `pagefront:manufacturerWarranty` on the Product (see "Warranty").
- Returns → `hasMerchantReturnPolicy` on the Offer, or the seller sheet's default (see "Return policy").
- Delivery cost, destination and timing → `shippingDetails` on the Offer, or the seller sheet's `pagefront:fulfillmentTerms`.
- Delivery modes → `availableDeliveryMethod` on the Offer (see "Delivery").

A fact the strip states that none of these can hold stays in the product's prose and is left out of the structured fields.

#### Delivery

- **`shippingDetails`**: delivery cost, destination and timing, as Schema.org's `OfferShippingDetails` (`shippingDestination`, `shippingRate`, `deliveryTime` with handling and transit time); only where the product deviates from the seller's terms ("Return policy").
- **`availableDeliveryMethod`**: the delivery modes the page states, as `DeliveryMethod` URIs: `https://schema.org/ParcelService`, `https://schema.org/OnSitePickup` (click-and-collect, in-store pickup), `https://schema.org/LockerDelivery`. Modes are declared here and never approximated in `shippingDetails`.
- **`availableAtOrFrom`**: a pickup location, as a `Place`. [why](product-notes.md#why-delivery-modes-stay-apart-from-shipping-details)

#### Where to buy

Two Schema.org properties on the Offer state where the shopper buys it. Both apply from release 0.5.0.

- **`url`**: the page on which the shopper buys this offer: the product page, or the variant's page for a variant offer (see "Per-variant URLs"). An absolute URL. An Offer without `url` is bought on the product's page, the data block's `url`. A sheet carrying more than one Offer SHOULD give each its `url`, since offers for different markets are often bought on different pages. Checks: PDP-E-021 (not absolute), PDP-W-040 (absent on a sheet carrying several Offers).
- **`checkoutPageURLTemplate`** *(optional)*: an RFC 6570 URL template that takes the shopper directly to the merchant's checkout for this offer; the cart, payment and order confirmation happen on the merchant's site. Its only variable is `quantity`, the number of units, a positive integer: the offer identifies the item, so the template takes no product or variant identifier, and a template with no variable checks out one unit. Expanded with `quantity` set to 1, it MUST yield an absolute `https` URL. Source: only where the merchant states it, in its own structured data on the page or through a checkout-link feature it has enabled on its platform; a producer MUST NOT construct a checkout URL from a platform's URL pattern or from any other pattern the merchant has not stated. Region: each region-scoped Offer carries the template for its own market, and an Offer without a declared region (`areaServed` or `eligibleRegion`) MUST NOT carry one. Checks: PDP-E-019 (not valid RFC 6570, a variable Pagefront does not define, or no expansion to an absolute `https` URL), PDP-E-020 (no region), PDP-E-022 (on an unavailable offer). [why](product-notes.md#why-checkout-is-a-one-variable-template)

```json
{
  "@type": "Offer",
  "url": "https://shop.example/products/aurora-lamp?variant=4521",
  "price": "149.00",
  "priceCurrency": "EUR",
  "areaServed": "FR",
  "checkoutPageURLTemplate": "https://shop.example/cart/4521:{quantity}"
}
```

**Consumers.** A checkout template is a hand-off to the shopper. Following it can create a cart. Consumers MUST NOT follow it to complete a purchase without the shopper's confirmation, and MUST fill `quantity` with the quantity the shopper chose. Programmatic purchase, Schema.org's `potentialAction` with a `BuyAction`, is a transaction protocol Pagefront does not specify; an Offer may carry it, and consumers act on it under that protocol's terms. A page that sells nothing has no Offer and no checkout.

#### itemOffered references

- **`itemOffered`**: on a sheet with several Offers (typically a `ProductGroup` with variants in `hasVariant`), each Offer SHOULD reference its variant as `{ "@id": "..." }`, resolving to an entry in `hasVariant` or to the root product `@id`. MAY be omitted on a single-Offer sheet whose item is the root product. Check: PDP-E-001 (broken `@id` reference). [why](product-notes.md#why-itemoffered-may-be-omitted-on-a-single-offer)

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

Some merchants intentionally publish no price: authorized-retailer models (luxury watches, high-end jewelry), quote-based pricing (industrial equipment, bespoke commissions), regional-reseller routing. The product page is real, the product is real, and the price lives behind a contact channel.

- **`pagefront:priceOnRequest`** on the Offer: SHOULD be declared for such a product. The Offer is then exempt from the otherwise-required `price` or `priceSpecification`; every other Offer field applies normally (`availability`, `itemCondition`, `seller`, `shippingDetails`, `areaServed`, and so on), and `priceCurrency` remains useful since it signals the currency the eventual price will be quoted in. A `pagefront:PriceOnRequest` object:
  - `method` *(required)*: a closed enumeration. `authorized_retailer`: the merchant routes buyers to a curated network of brand-authorized retailers (luxury watches, high-end audio). `dealer_network`: similar in structure, for industrial and commercial products with regional dealer coverage. `quote_form`: a structured intake form that produces a quote (made-to-measure, custom configurations, B2B bulk). `email`, `phone`: the merchant directs buyers to an email address or a phone number for pricing. `unspecified`: no structured inquiry channel; the path to pricing is left to the buyer to discover. Additional values require a spec amendment.
  - `contactUrl`, `contactEmail`, `contactPhone` *(optional)*: the inquiry channel the method names; `contactUrl` for `authorized_retailer`, `dealer_network` and `quote_form`, `contactEmail` for `email`, `contactPhone` for `phone`.
  - `note` *(optional)*: free-text guidance shown to consumers.

Checks: PDP-W-015 (a method other than `unspecified` with no contact channel), PDP-W-016 (an Offer with commercial structure but neither a price nor `pagefront:priceOnRequest`, which catches extraction failures while letting intentional omissions through; silent on an unavailable offer without a price).

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

For made-to-order products, see `pagefront:madeToOrderTerms` below. For configurable products, see `pagefront:configurator` below; an offer states the prices of a configurator through `pagefront:configuratorPricing` ("Configurator pricing and price bands"). For site-level promotions, see `pagefront:promotions` on each Offer.

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

- **`valueAddedTaxIncluded`**: whether `price` includes value-added tax, as Schema.org's `valueAddedTaxIncluded` on a `UnitPriceSpecification` entry in `priceSpecification`. Producers SHOULD state it. An Offer that already carries `priceSpecification` entries sets the flag on each; an Offer carrying only `price` adds one entry mirroring it. An existing plain `PriceSpecification` entry carries the flag as well, and an `AggregateOffer`, with no single `price` to mirror, carries it on an entry of its own. `false` is the correct statement for a trade or B2B sheet quoting net prices, and for regions whose displayed prices exclude sales tax. The flag is a statement about `price`: consumers do not compute tax from it, and do not derive one amount from the other. When the flag is absent, consumers read `price` as the displayed consumer price and cannot tell whether tax was included. Checks: PDP-W-028 (absent), PDP-E-004 (a mirroring entry's `price` disagrees with the Offer's `price`; the Offer's `price` is authoritative). [why](product-notes.md#why-the-tax-basis-belongs-to-the-offer-and-its-region) [why](product-notes.md#why-unitpricespecification-carries-the-flag)

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

**Source of the price.** `price` is taken from the price rendered on the merchant's product page: the amount the shopper pays for the item as presented on the page. When a sale is shown, `price` is the sale price, and the crossed-out price is the regular price (see "Sale pricing"). `price` is the full price of the item: an instalment, a per-unit amount and a "from" amount are other figures and are never published as `price`. Where the page shows the price only after scripts run, the producer renders the page as a browser does; a producer that cannot obtain the rendered price has no price and publishes no offer.

The merchant's structured data on the page and any amount obtained from a platform API are not sources of `price`. They are used only to check it. Where the page carries a structured-data price for the same offer and it differs from the rendered price, the producer does not publish the offer: it SHOULD surface the discrepancy to the merchant or route the offer to review. A rendered price is published only when it agrees with the structured-data price, or when the page carries none.

**Source of the VAT basis.** `valueAddedTaxIncluded` is set only when the merchant states the basis, in one of these forms:

- text on the page stating it, next to the price or applying to the page's prices ("TTC", "incl. VAT", "prices include VAT");
- a statement in the merchant's terms of sale covering the prices shown on its product pages ("prices are indicated inclusive of all taxes");
- the VAT flag in the merchant's own structured data on the page;
- the store's tax-display setting, where the platform exposes it.

Producers MUST NOT infer the VAT basis from the URL, the domain, the currency, the market or the seller's country. When the merchant does not state the basis, the producer publishes the price without `valueAddedTaxIncluded`; the missing flag records that the basis was not stated.

A rendered price is the price for the market the page was served for, and the producer declares a region only where the merchant states it, under the same no-inference rule.

**When a price cannot be published.** A sheet without an offer is a valid state. It is preferable to an offer whose price is not the rendered price, or whose rendered price disagrees with the merchant's structured data: the first is honestly incomplete, the second may be silently wrong. An unstated VAT basis is not a reason to withhold the offer; it is published without the flag.

**Unavailable offers without a price.** An offer the page shows as unavailable (out of stock, sold out or discontinued) and shows no price for is published without a price. `availability` states it (`https://schema.org/OutOfStock`, `https://schema.org/SoldOut` or `https://schema.org/Discontinued`), and `price`, `priceCurrency` and `priceSpecification` are absent. A consumer reads the offer as not purchasable now, at no stated price. Where the page shows a price for an unavailable offer, the offer carries it as usual.

Availability is taken from what the page shows, as the price is. The merchant's structured data checks it and is never its source: a producer does not drop a price the page shows because structured data says the item is unavailable.

Only these three values allow a priceless offer. `PreOrder`, `BackOrder`, `MadeToOrder`, `LimitedAvailability`, `InStoreOnly` and `InStock` describe an item that can still be bought, and an offer carrying them needs a price.

An unavailable offer without a price keeps its other fields: `url` (the page, where a shopper can ask to be notified), `itemOffered`, and `areaServed`, which SHOULD still be declared since availability is per market. It MUST NOT carry `checkoutPageURLTemplate` (rule PDP-E-022, applying from the release that ships this change). The linter's possibly-missed-price warning (PDP-W-016) is silent on such an offer.

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
- **End of life.** A discontinued product's Offer declares `availability: "https://schema.org/Discontinued"`. The Sheet stays published: the page usually outlives the product, and the Sheet is how agents learn that the product is discontinued, as distinct from out of stock. The offer carries a price only if the page shows one; see "Unavailable offers without a price" under "Tax inclusion".
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

Pagefront Sheets are language-scoped: one `inLanguage` per sheet, multi-currency handled inline via multiple `Offer` entries with `areaServed`. Each language variant of a resource is its own sheet, declared by its own page; the discovery link carries no language attribute, and `inLanguage` states the sheet's language.

Cross-language navigation is declared in the sheet. A publisher with more than one language variant of a sheet SHOULD list the siblings in `pagefront:availableLanguages`, one `{lang, url}` entry per sibling (see the vocabulary). Each entry is a traversal hint under "Traversal hints" in Pagefront Discovery: it MAY be stale, and a consumer reaches a sibling through the sibling's own page when the entry does not resolve.

v0.6 extends this to video: the `video` array's contents are language-scoped to the sheet's `inLanguage`. See the "Video and internationalization" subsection above for details.

## Sheet filename convention

The recommended filename shape, `{id}.{lang}.json`, is "Filename convention" in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md#filename-convention)). It is a convenience for publishers; it is not a discovery mechanism, and a Sheet is located by the declaration its page carries.

## Discovery

Discovery is specified in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md)): the discovery principle, the page-based carriers (`Link: rel="alternate"; type="application/pagefront+json"` and the HTML `<link>` element), the entry point, the traversal-hint rule and the filename convention. Product-specific traversal hints are `sheet_url` on `hasVariant` entries and `isVariantOf`, `pagefront:sheetUrl` on organization references (`Offer.seller`, `Product.brand`, a reference-form `pagefront:legalEntity`; see the linking contract in [`organization.md`](organization.md#linking-contract-identity-only)) and on `isPartOf` entries (see [`collection.md`](collection.md)), and the `url` of `pagefront:availableLanguages` entries; the traversal-hint rule in Discovery governs all of them.



## Planned breaking changes

Breaking changes follow semver: each of the changes below would make a conforming sheet non-conforming, and ships in a future minor of this spec under the 0.x rules, with the release bumping accordingly ([`releases.md`](releases.md)). None ships in Product Sheet spec 0.10.0. Planned as of 2026-10-02:

- **`@context` must declare the `pagefront` prefix wherever a `pagefront:` term is used.** Stated as prose in "Required and recommended core fields" and enforced by the linter (PDP-E-003, ORG-E-001); the JSON Schemas still accept the bare `"https://schema.org"` string beside `pagefront:` terms. A future schema version adds the constraint: when any data-block property name begins with `pagefront:`, `@context` is an array containing an object mapping `pagefront` to `https://themachineweb.org/pagefront/vocabulary/`. The top-level form does not see terms nested inside other objects, such as `pagefront:priceOnRequest` in an offer; the linter rules do.

## Status

Normative spec: Product Sheet spec 0.11.0, a member of commerce release 0.5.0. The versioning scheme is in [`releases.md`](releases.md): the spec has its own semver, breaking changes follow it, and the envelope carries `release` in place of `format_version`. The legacy format versions this spec grew through, and the pending work carried from them, are in the design notes. [notes](product-notes.md#the-legacy-format-versions-this-spec-grew-through)

The open design questions are in the design notes too: those carried forward [notes](product-notes.md#open-design-questions-carried-forward) and those surfaced in v0.4 [notes](product-notes.md#open-design-questions-surfaced-in-v04), v0.5 [notes](product-notes.md#open-design-questions-surfaced-in-v05), v0.6 [notes](product-notes.md#new-design-questions-surfaced-in-v06), v0.7 [notes](product-notes.md#new-design-questions-surfaced-in-v07) and v0.8 [notes](product-notes.md#new-design-questions-surfaced-in-v08), with what v0.8 deliberately does not address [notes](product-notes.md#what-v08-deliberately-does-not-address).

## Changelog

The changelog, with its Unreleased entries, is [`product-changelog.md`](product-changelog.md).
