# Commerce Organization Sheet

Status: normative spec.
Organization Sheet spec version: 0.5.0
Commerce release: 0.5.0
Schema.org version targeted: 30.0 (2026-03-19)

The Commerce Organization Sheet is the Pagefront Sheet that describes the entity *behind* products: the brand that owns them, the company that makes them, the store that sells them. The Product Sheet describes an individual product. The organization sheet is the dereference target of the `brand` and `Offer.seller` links every Product Sheet already carries.

## One sheet type, three shapes

An organization sheet describes one of three entities behind a product. The sheet MUST declare its role or roles explicitly, and all role-specific content is optional and role-scoped:

- **DTC**: manufacturer and merchant are one entity playing both roles.
- **Pure retailer**: a multi-brand seller, the target of `Offer.seller`. It is never the target of `Product.brand`.
- **Pure manufacturer**: wholesale, no direct sales, the target of `Product.brand`, with no storefront.

A consumer that dereferenced `Product.brand` confirms the sheet claims `brand_owner`; one that dereferenced `Offer.seller` confirms it claims `seller`. [why](organization-notes.md#why-one-sheet-type-carries-three-shapes)

## The envelope

The envelope is the one every Pagefront Sheet carries; the full rules are in "The envelope" in the Pagefront Spec ([`product.md`](product.md)).

```json
{
  "$schema": "https://themachineweb.org/pagefront/spec/commerce/organization/v0.5.0.json",
  "release": "0.5.0",
  "schema_org_version": "30.0",
  "canonical_url": "https://merchant.com/pages/about",
  "generated_at": "2026-08-14T11:00:00Z",
  "expires_at": "2026-08-21T11:00:00Z",
  "data": { "...": "..." }
}
```

- **`$schema`** *(required)*: the URL of this sheet spec's own version, with the full semver in its last segment: `organization/v0.5.0.json` for Organization Sheet spec 0.5.0. The release and the sheet type resolve to exactly one sheet-spec version through the release table in [`releases.md`](releases.md), and `$schema` MUST name it. REQUIRED on every sheet carrying `release`, optional only on the legacy draft line. Check: ORG-E-003.
- **`release`** *(required)*: the commerce release the sheet is written against, as a full semver. It replaces `format_version`, the field of the legacy draft line, and a sheet carrying both is invalid. Checks: ORG-E-002 (both fields), ORG-E-004 (a release the table does not list).
- **`canonical_url`** *(required)*: the human-facing brand, company or store page the sheet describes.
- **`sheet_url`** *(optional)*: an address the sheet is served from, as known to the publisher at generation time; informational. The page's `alternate` declaration locates the sheet, and a publisher whose platform assigns or changes the address after generation MAY omit it.
- **`generated_at`** *(required)* and **`expires_at`**: as in the Pagefront Spec. Organization data changes slowly, so `expires_at` MAY sit days out.
- **`data`** *(required)*: the Schema.org JSON-LD data block.

A sheet carrying `format_version` alone belongs to the legacy draft line and validates against the legacy schema, which stays served at `https://themachineweb.org/pagefront/spec/commerce/organization/v0.9.json`.

## Sheet URL and stability

The sheet URL is the publisher's choice: any URL on the publisher's domain that the described page's `Link: rel="alternate"` header points to. Consumers MUST follow the link and never parse the path (Pagefront Discovery, [`../../core/spec/discovery.md`](../../core/spec/discovery.md)); the page is the identity, and the sheet lives wherever the page's link says today. A publisher that can keep the URL for the life of the resource SHOULD do so, and SHOULD answer a rename with an updated `Link` target and, where possible, a `301` redirect from the old address. [why](organization-notes.md#why-a-stable-sheet-url-is-desirable)

## data — Schema.org JSON-LD

### Base type and the Brand node

- **`@type`**: Schema.org `Organization`, or a recognized subtype where it fits: `OnlineStore` / `OnlineBusiness` for a retailer, an ordinary `Organization` for a manufacturer. A brand-owner sheet is an Organization that owns a Brand; a retailer sheet is an Organization that sells; a DTC sheet is both, on one node. [why](organization-notes.md#why-the-sheet-roots-on-organization-and-nests-the-brand)
- **`brand`**: the brand the entity owns, as a nested Schema.org `Brand` attached via `Organization.brand`, with `@id` and `name`, and optionally `logo` and `slogan`. `Brand.@id` is the identity Product Sheets point at ("Linking contract"). Brand-level provenance and maker facts (a brand-wide manufacturing story, a sourcing philosophy) attach to the `Brand` or to the owning `Organization`; per-product manufacturing detail stays on the Product Sheet's `pagefront:manufacturingChain`.

```json
"brand": {
  "@type": "Brand",
  "@id": "https://merchant.com/#brand",
  "name": "Merchant",
  "logo": "https://merchant.com/assets/logo.png",
  "slogan": "Knitters since 1972"
}
```

### Required core fields

- **`@context`**: the array form `["https://schema.org", {"pagefront": "https://themachineweb.org/pagefront/vocabulary/"}]`. Every organization sheet uses `pagefront:` terms, since `pagefront:commerceRole` is required, so the bare `"https://schema.org"` string is never sufficient here; see [vocabulary.md, "How to use this vocabulary"](vocabulary.md#how-to-use-this-vocabulary).
- **`@type`**: `"Organization"` (or a recognized subtype).
- **`@id`**: a stable URL-shaped identifier for the organization.
- **`name`**: the organization's name as displayed to humans.
- **`inLanguage`**: the BCP 47 tag of the sheet's prose.
- **`pagefront:commerceRole`**: an array of one or more role values ("Role discriminator").

The identifier rule for this sheet type is `@id` plus `name`; there is no GTIN-equivalent requirement. A `sameAs` authority record SHOULD be declared where one exists, and the registration-identity ladder ("Company registration identity") adds machine keys where they exist; none is required. [why](organization-notes.md#why-id-and-name-are-the-only-identifier-requirement)

### Recommended core fields

- **`url`**: the canonical human page (brand, company or store).
- **`sameAs`**: an identity equivalence claim: a reference page that unambiguously indicates the entity's identity, either a Wikidata or comparable public-authority record, or another official web property of the same entity. A social profile is platform presence and belongs in `pagefront:socialAccount`. Omission is the normal small-brand case, and no linter rule may warn on absence. [why](organization-notes.md#why-sameas-excludes-social-profiles)
- **`pagefront:socialAccount`**: the official social accounts the organization operates, as an array of `pagefront:SocialAccount` entries carrying `platform`, `url` and `handle`. Source: entries MUST be accounts the publisher links from its own pages; guessed or searched-up handles are non-conformant. An account also offered for support additionally appears in `contactPoint`.
- **`logo`**, **`description`**, **`slogan`**.
- **`brand`**: the `Brand` node, when `commerceRole` includes `brand_owner`.

## Role discriminator — `pagefront:commerceRole`

- **`pagefront:commerceRole`** *(required)*: an array of one or more values of the closed enum; additional values require a spec amendment.
  - `brand_owner`: owns the brand under which products are sold; the entity a `Product.brand` link resolves to.
  - `manufacturer`: makes the products.
  - `seller`: sells products directly to end customers; the entity an `Offer.seller` link resolves to.
  - `licensee`, `importer` and `authorized_representative` are `pagefront:legalEntity` values only: per-product compliance declarations. [why](organization-notes.md#why-the-role-values-reuse-the-legal-entity-names)
- Each declared role SHOULD have its content present (a `brand_owner` a `Brand` node, a `seller` the seller block), and content SHOULD NOT appear without its role declared. Checks: ORG-W-001 and ORG-W-002 (a declared role with no backing content), ORG-W-003 and ORG-W-004 (content without its role), ORG-W-006 (`pagefront:authorizedResellers` without `brand_owner`); see "Commerce Organization Sheet rules" in `rules.md`.

## Cardinality — one sheet per brand

- Each **Brand** gets exactly one Commerce Organization Sheet, keyed by the Brand's `@id` and anchored on the brand's own page (its `canonical_url`). A company that owns several brands emits one sheet per brand, and a brand identity resolves to exactly one sheet.
- A **private-label brand with no domain of its own** anchors on the owner's storefront: its `canonical_url` is the brand's page there and its `Brand.@id` is minted on that domain. The count stays one sheet per brand.
- The owning `Organization` (legal entity, address, founding) repeats across that company's brand sheets, carrying the same `Organization.@id` in each.
- An entity playing only the `seller` role with no owned brand gets one sheet keyed by the `Organization.@id`. The DTC single-brand case is one sheet: one entity, both roles, one brand.
- A multi-brand company that sells all its brands through one storefront emits a **separate seller sheet** with `commerceRole: ["seller"]`, keyed by the store's `Organization.@id`; the brand sheets stay brand-only, and each brand's products reference the store via `Offer.seller`. Store-wide terms are stated once, on the store's sheet.
- On brand rename, the `Brand.@id` is held and `name` updated, matching the Product `{id}` stability contract. [why](organization-notes.md#why-each-brand-gets-one-sheet)

## Role-scoped content

### Company identity (any role)

Schema.org-native `Organization` fields, populated when the page supports them: `legalName`, `foundingDate`, `foundingLocation`, `founder`, `address` (a `PostalAddress`), `contactPoint`, `email`, `numberOfEmployees`, `parentOrganization` / `subOrganization` for ownership structure, `hasCertification` ("Certifications"), and `vatID` where applicable.

#### Company registration identity

Registration identity is a ladder of machine keys plus a display form, every rung conditional on the data existing. No `pagefront:` term is minted. [why](organization-notes.md#why-registration-identity-is-a-ladder)

- **`leiCode`**: when the entity has an LEI (ISO 17442; native Schema.org).
- **`iso6523Code`**: where the national register has an ISO 6523 ICD, the ICD prefix plus the register number (`"0002:808641435"` for a French SIREN; SIRENE is ICD 0002). The German Handelsregister and US state corporate registries have no ICD.
- **`identifier`**: a `PropertyValue` whose `propertyID` names the register and whose `value` is the jurisdiction-flavored display form (`"RCS"` with `"808 641 435 R.C.S. Nanterre"`; `"Handelsregister"` with `"HRB 158855 B, Amtsgericht Charlottenburg Berlin"`). It SHOULD always accompany whichever machine keys exist, and it stands alone for a register with no machine key of its own.

The rules:

1. When more than one is present, authority order is `leiCode`, then `iso6523Code`, then `identifier`. The display form is presentation; it is never the identity key.
2. The ladder has a floor: every rung is conditional on the data existing. For a company with no LEI, no ISO 6523-covered register and no published registration number (a typical private US company), `legalName` plus an address is a complete, conformant registration declaration. The US d/b/a construct maps onto the `name`/`legalName` split.
3. No linter rule may warn on absent registration identifiers; absence is jurisdiction-dependent and carries no quality signal. Check: ORG-W-005 (an `iso6523Code` or `leiCode` value that does not match its shape).
4. Jurisdiction of incorporation gets no field of its own. Where the publisher states it, it rides inside the display-form `identifier` value.
5. Publisher-stated only: registry-verifiable facts absent from the publisher's own pages (a state of incorporation known only from court or registry records) MUST NOT be added to the sheet.

### Brand-owner block (`brand_owner`)

The nested `Brand` node attached via `Organization.brand` ("Base type and the Brand node") and, optionally, the brand's authorized-reseller statement (next section).

### Authorized resellers

- **`pagefront:authorizedResellers`**: the brand's statement of which sellers it authorizes to sell its products, an authorization claim. Valid only where `commerceRole` includes `brand_owner`; no rule warns on absence. Source: entries MUST come from the brand's own published reseller or where-to-buy pages, taken as published; a seller known to stock the brand but absent from the brand's page is not added. The brand does NOT list itself: its own selling is the `seller` role, and its own boutiques are the seller block's `location` ("Store locations"). Check: ORG-W-006 (present without `brand_owner`). [why](organization-notes.md#why-authorized-resellers-are-admitted-on-this-sheet) The value is one `pagefront:AuthorizedResellers` object:
  - `exhaustive` *(optional boolean, default `false`)*: `true` means the list is complete, and a seller absent from it is NOT authorized by the brand; `false` or absent means absence is no statement. The flag covers the whole list, online and physical entries alike. Publishers set `true` only when the brand's page presents the list as complete; a store locator or a "selected stockists" page is not a completeness claim.
  - `reseller` *(required, one or more entries)*: each carries `organization` *(required)* in one of two forms: a reference stub `{"@type": "Organization", "@id": "…"}` resolving to the reseller's own Commerce Organization Sheet, or an inline `Organization` for a reseller without a sheet, carrying `name` plus `url` and/or `address`. `url` is the key an online seller is matched on; `address` (a `PostalAddress`) identifies a physical point of sale; a reseller with a shop and a web store carries both; an inline entry with neither does not validate. Optionally `areaServed` (Schema.org `Country` / `DefinedRegion` / `AdministrativeArea`) for territory-scoped authorization, stated only when the brand states it; a physical reseller's location is its `address`.

```json
"pagefront:authorizedResellers": {
  "@type": "pagefront:AuthorizedResellers",
  "exhaustive": false,
  "reseller": [
    {
      "organization": { "@type": "Organization", "@id": "https://www.grand-magasin.example/#org" },
      "areaServed": { "@type": "Country", "name": "FR" }
    },
    {
      "organization": { "@type": "Organization", "name": "Boutique en Ligne Example", "url": "https://www.boutique-en-ligne.example" }
    },
    {
      "organization": {
        "@type": "Organization",
        "name": "Comptoir de la Gare",
        "address": { "@type": "PostalAddress", "streetAddress": "12 place de la Gare", "postalCode": "69002", "addressLocality": "Lyon", "addressCountry": "FR" }
      }
    }
  ]
}
```

- **Two questions, two kinds of entry.** An entry carrying a `url` or an `@id` answers the online authorization check ("is this listing grey-market or counterfeit?"). An entry carrying an `address` answers the physical-stockist question ("is this shop an authorized stockist?", "where can I buy this near X?"). An address-only entry never matches an online `Offer.seller` and yields no conclusion about an online listing.
- **Direction of trust.** Only the brand's sheet is authoritative for whom the brand authorizes. A reseller's own claim of authorization, on its sheet, in its listing or anywhere else, carries no weight; there is no `authorizedBy` on a seller sheet, and one will not be added.
- **Consumer resolution**, for an `Offer` whose `seller` is not the brand:
  1. Follow `Product.brand` (`@id`) to the brand's Commerce Organization Sheet, located by the reference's `pagefront:sheetUrl` and checked per "Linking contract", and read `pagefront:authorizedResellers`. If the sheet declares none, or cannot be resolved: no conclusion.
  2. Match `Offer.seller` against the `reseller` entries: by exact-string `@id` when the entry is a reference stub; otherwise by domain, the registrable domain of the entry's `url` against that of `Offer.seller.url` (or of `Offer.seller.@id` when that is a URL on the seller's own domain). An address-only entry contributes nothing to this step, in either direction.
  3. On a match, the seller is authorized (within `areaServed`, when stated). If `exhaustive` is `true` and nothing matches, the seller is NOT authorized. If `exhaustive` is `false` or absent and nothing matches: no conclusion.

### Seller block (`seller`)

Store-wide commercial terms an agent needs before it reaches a specific offer. A retailer's sheet does not enumerate the brands it carries ("What this spec does not address").

- **`hasMerchantReturnPolicy`**: the store-wide return and exchange policy ("Return policy").
- **`pagefront:fulfillmentTerms`**: the store-wide shipping terms ("Fulfillment terms").
- **`paymentAccepted`**.
- **`location`**: the seller's own physical stores ("Store locations").
- **`aggregateRating`**: seller reputation, where the publisher asserts it.

### Return policy

- **`hasMerchantReturnPolicy`** on the seller block: the store-wide default, stated once. A Product Sheet carries return terms only when the product deviates from the store default, such as a final-sale item, or a made-to-order product, whose returns exceptions live in `pagefront:madeToOrderTerms` and stay there.
- **Resolution.** A consumer reads the product's own return terms if present; otherwise it follows `Offer.seller` to the seller's sheet, located by the reference's `pagefront:sheetUrl` and checked per "Linking contract", on the product sheet's own host, and uses its store-wide policy. When the sheet cannot be resolved, the inherited terms are unknown. The read is scoped to return and shipping terms and MUST NOT be generalized to other fields. [why](organization-notes.md#why-the-return-policy-lives-on-the-seller-sheet)

### Fulfillment terms

- **`pagefront:fulfillmentTerms`** on the seller block: an array of Schema.org-native `OfferShippingDetails` objects carrying the store's shipping defaults (destinations, rates, delivery timeframes), with free-shipping thresholds via `pagefront:appliesWhen` / `pagefront:PricingCondition`, as on an Offer. An Offer carries `shippingDetails` only when the product deviates from the store defaults (bulky items with their own rates, made-to-order lead times), with the same product-else-seller resolution as returns. [why](organization-notes.md#why-fulfillment-terms-reuse-offershippingdetails)

```json
"pagefront:fulfillmentTerms": [
  {
    "@type": "OfferShippingDetails",
    "name": "France and Belgium, free from 200 €",
    "shippingRate": { "@type": "MonetaryAmount", "value": "0", "currency": "EUR" },
    "shippingDestination": [
      { "@type": "DefinedRegion", "addressCountry": "FR" },
      { "@type": "DefinedRegion", "addressCountry": "BE" }
    ],
    "pagefront:appliesWhen": {
      "@type": "pagefront:PricingCondition",
      "minimumOrderValue": { "@type": "MonetaryAmount", "value": "200", "currency": "EUR" }
    }
  }
]
```

- **Warranty** does not participate in seller defaults: a warranty the product page states lives on its Offer as `warranty`, a manufacturer's warranty lives on the Product as `pagefront:manufacturerWarranty` ("Warranty" in `product.md`), and a warranty document is a `pagefront:document` entry with `role: "warranty"`.

### Store locations

- **`location`**: the seller's own physical stores, as Schema.org's native `Organization.location`: an array of `Place` (or `LocalBusiness` subtype) entries, each carrying `name` and `address` (a `PostalAddress`, required per entry), and, where the retailer publishes them, `openingHoursSpecification`, `telephone`, `url` (the store's page on the retailer's own site) and `geo`. Source: the retailer's own store-locator pages, never third-party directories. A DTC merchant with a boutique declares it here and does not list itself in `pagefront:authorizedResellers`. There is no per-store sheet: stores are inline entries, bounded by what the retailer publishes in its store locator. [why](organization-notes.md#why-store-locations-use-schemaorgs-location)

### Catalogue entry point (any role)

- **`hasOfferCatalog`**: Schema.org's own property, where the storefront's catalogue begins: the roots of the collection tree the Commerce Collection Sheets ([`collection.md`](collection.md)) describe. The value is one flat `OfferCatalog`; a nested `OfferCatalog` is not permitted. [why](organization-notes.md#why-the-catalogue-entry-point-is-admitted)
  - `itemListElement`: `Collection` entries in the member entry shape of the Collection Sheet spec (`@type`, `@id` and `url` required; `pagefront:sheetUrl`, `name` and `pagefront:collectionKind` recommended), in display order. Every root category (a `category` sheet with no `isPartOf`) appears here; every top-level collection (a `collection` sheet with no `isPartOf`) SHOULD, and every `brand` collection SHOULD.
  - Any `pagefront:commerceRole` may carry it.
  - The referenced sheets are on this sheet's host, in this sheet's `inLanguage`; a root in another language is reached through `pagefront:availableLanguages` on the root sheet. Check: ORG-W-007 (an entry whose `pagefront:sheetUrl` is on another host).
  - Each `pagefront:sheetUrl` is a traversal hint under "Traversal hints" in Pagefront Discovery: it MAY be stale, and a consumer reaches the root through the entry's `url` and the Sheet that page declares when it does not resolve.
  - No separate catalog sheet exists and none is planned.

```json
"hasOfferCatalog": {
  "@type": "OfferCatalog",
  "name": "Merchant catalogue",
  "itemListElement": [
    {
      "@type": "Collection",
      "@id": "https://merchant.com/collections/women#collection",
      "url": "https://merchant.com/collections/women",
      "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/collection/women.en.json",
      "name": "Women",
      "pagefront:collectionKind": "category"
    },
    {
      "@type": "Collection",
      "@id": "https://merchant.com/collections/meridian-gear#collection",
      "url": "https://merchant.com/collections/meridian-gear",
      "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/collection/meridian-gear.en.json",
      "name": "Meridian Gear",
      "pagefront:collectionKind": "brand"
    }
  ]
}
```

### Entry point (commerce binding)

In the commerce vertical, the root Sheet reached through the entry point of Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md#entry-point)) is the Commerce Organization Sheet. From it, `hasOfferCatalog` leads to the root collections, their `hasPart` to the members, and `pagefront:availableLanguages` to the same root in other languages; a consumer traverses an origin's commerce Sheets from here without fetching a page. A multi-language origin points the entry point at one root. An organization sheet reached by DNS delegation ("Delegation by DNS" in Pagefront Discovery) is authoritative for the domain that published the record even when it is served from another host; the host checks of PDP-E-005 and PDP-E-006 apply to the organization references a product sheet carries, and the root sheet's own location is outside their scope.

## Certifications

- **`hasCertification`**: Schema.org `hasCertification` with a `scope` `PropertyValue`, the Product Sheet pattern. Org-level certifications (B-Corp, ISO 14001, company-wide Fair Trade) carry the scope value `organization`: the certification attaches to the entity. Product- and material-scoped certifications (`yarn`, `fabric`, `diamond`, `finished_product`, and the rest) never migrate to the organization sheet, even when every product in the catalog carries them; an entity-level certification is stated once here and is not restated on each Product Sheet.

## Legal entities — reference or inline

`pagefront:legalEntity` on the Product Sheet overlaps this sheet for `brand_owner` and `manufacturer`, and for no other role. The relationship is reference-capable, and the organization sheet does not replace the product-level entry. [why](organization-notes.md#why-pagefrontlegalentity-stays-on-the-product)

- When a `legalEntity` entry's organization has a Commerce Organization Sheet (typically the `brand_owner`, sometimes the `manufacturer`), the Product Sheet SHOULD express it as a reference stub, `{"@type": "Organization", "@id": "…"}`, without restating name and address. The `@id` resolves to the organization sheet the same identity way as `Product.brand` and `Offer.seller`. The product schema accepts the stub form (`organization.name` is optional when `@id` is present), and PDP-W-024, the no-postal-address warning, exempts reference stubs. A `brand_owner` or `manufacturer` stub SHOULD resolve to a sheet declaring the matching `commerceRole`.
- When the entity is a third party with no sheet (`authorized_representative`, `importer`: the GPSR responsible person, the importer of record), or varies by product or market, it stays fully inline with name and address. The linter's stub-vs-inline distinction (PDP-E-001 / PDP-W-020) applies unchanged.

## Linking contract (identity only)

Cross-sheet links resolve by exact-string `@id` match. There is no structured traversal. [why](organization-notes.md#why-the-linking-contract-is-identity-only)

- **`Product.brand.@id`** resolves to the `Brand` node inside a Commerce Organization Sheet whose `commerceRole` includes `brand_owner`.
- **`Offer.seller.@id`** resolves to the top-level `Organization` `@id` of a Commerce Organization Sheet whose `commerceRole` includes `seller`.
- **A reference** to an organization (`Offer.seller`, `Product.brand`, or a reference-form `pagefront:legalEntity`) carries `@id` as its identity, SHOULD carry `pagefront:sheetUrl`, the URL of the organization sheet describing that entity (producers that publish the organization sheet SHOULD set it on every reference), and MAY carry `url`, the entity's own page, from which a consumer reaches the sheet through that page's `alternate` declaration.
- **`pagefront:sheetUrl`** is a traversal hint under "Traversal hints" in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md#traversal-hints-normative)). It MAY be stale. A consumer MUST be able to reach the organization sheet through the entity's page, the reference's `url` and then the Sheet that page declares, SHOULD treat the hint as an optimisation over that path, and MUST NOT cache an organization sheet's URL across the entity's page changes. The host check and the identity check below apply to whichever URL the consumer follows.

```json
"brand": {
  "@type": "Brand",
  "@id": "https://merchant.com/#brand",
  "name": "Merchant",
  "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/organization/merchant.en.json"
}
```

A consumer resolving a reference:

1. Reads `pagefront:sheetUrl`. When it is absent or does not resolve, the consumer fetches the entity's page from the reference's `url` and follows the Sheet it declares. With neither a hint nor a page, the organization sheet is not discoverable from this reference: the consumer MUST NOT construct a URL from the `@id` or from any pattern, and treats terms it would have inherited as unknown.
2. Checks the host of the sheet URL it follows, the hint or the one the page declares, according to the edge:
   - `Offer.seller`: the host of the product sheet's canonical page (the envelope `canonical_url`). The seller's `@id` may be minted on another domain the organization controls.
   - `Product.brand`: the host of the reference's `@id`.
   - `pagefront:legalEntity` (reference form): either of the above. Resolving it grants no inherited trust.

   A URL failing its edge's check is rejected, and the consumer treats inherited terms as unknown.
3. Fetches the sheet and confirms the reference's `@id` matches, by exact string, the node the edge points at: for `Offer.seller` and a reference-form `pagefront:legalEntity`, the data block's `@id` (the Organization); for `Product.brand`, the `@id` of the Brand node at `data.brand`. The match is checked at these positions only; an `@id` elsewhere in the sheet (`parentOrganization`, `subOrganization`, `pagefront:authorizedResellers`) does not satisfy it. The consumer also confirms the organization's `pagefront:commerceRole` fits the edge: a seller role for `Offer.seller`, the brand-owner role for `Product.brand`. On any mismatch, the consumer discards the sheet and treats inherited terms as unknown.

- When a seller's `@id` host differs from its sheet's host, the identity is asserted by the publisher, and consumers MUST NOT treat it as origin-verified. A domain-association mechanism is deferred.
- Brand `@id`s SHOULD be minted on the host that serves the brand's organization sheet, since brand references are checked against the `@id`'s host.
- The organization sheet's own anchor, its `canonical_url` and the `alternate` link on that page, is unchanged; `pagefront:sheetUrl` is how a sheet is reached by reference.
- The sheet lists neither its products nor its carried brands. Its outbound edges are two, `pagefront:authorizedResellers` ("Authorized resellers") and `hasOfferCatalog` ("Catalogue entry point"), each resolved by exact-string `@id` match at the fetched sheet. One read goes beyond identity confirmation: product-else-seller resolution of return and shipping terms along `Offer.seller` ("Return policy"). [why](organization-notes.md#why-the-sheet-enumerates-neither-products-nor-brands) [notes](organization-notes.md#worked-example-two-hosts-for-a-retailer-and-a-brand)

## Worked examples

Three case-study sheets show the shapes: DTC with all three roles, seller-only, and a private-label brand anchored on its owner's storefront. [notes](organization-notes.md#worked-examples-from-the-case-studies)

## What this spec does not address

- **Product and carried-brand enumeration.** No product list and no brand list on the organization sheet: "what does this store sell" is answered by `hasOfferCatalog` and the Commerce Collection Sheets below it, and that a retailer is authorized is stated on each brand's sheet only.
- **Policy inheritance beyond return and shipping.** Return and shipping inheritance is in scope (default plus override, above). Broader inheritance of arbitrary fields from organization to product is out of scope; organization-level and product-level statements are otherwise independent.
- **Ownership and governance beyond Schema.org.** `parentOrganization` / `subOrganization` and `ownershipFundingInfo` cover the common cases; no typed `pagefront:` ownership-structure extension exists.
- **Marketplace partner-seller modeling.** A third-party partner as `Offer.seller` is another organization, referenced by `@id` like any seller and eligible for its own sheet; no new vocabulary. [notes](organization-notes.md#why-these-questions-stay-open)

## Versioning

This sheet spec has its own semver, 0.5.0, and is a member of commerce release 0.5.0. A sheet declares the release in its envelope (`release`) and names this spec version in `$schema`. Before 1.0 a breaking or an additive change bumps the minor and a fix or clarification bumps the patch; the release bumps with its members. The scheme, the release table and the legacy draft line are in [`releases.md`](releases.md); the stability policy that applies from release 1.0.0 is in "Versioning and stability" in [`vocabulary.md`](vocabulary.md). The rule catalogue keeps its own semver.

This spec plans no breaking change of its own. The `@context` prefix constraint listed under "Planned breaking changes" in the Pagefront Spec will apply to the organization schema as well.

The versions this spec grew through are in the design notes. [notes](organization-notes.md#how-this-spec-reached-050)

## References

- Organization schema, spec version 0.5.0: `https://themachineweb.org/pagefront/spec/commerce/organization/v0.5.0.json` (published file: [`../schemas/organization/v0.5.0.json`](../schemas/organization/v0.5.0.json); the editable head for the next version is [`organization.json`](organization.json))
- Organization schema, spec version 0.4.0, for sheets declaring release 0.4.0: `https://themachineweb.org/pagefront/spec/commerce/organization/v0.4.0.json` (published file: [`../schemas/organization/v0.4.0.json`](../schemas/organization/v0.4.0.json))
- Organization schema, spec version 0.3.0, for sheets declaring release 0.3.0: `https://themachineweb.org/pagefront/spec/commerce/organization/v0.3.0.json` (published file: [`../schemas/organization/v0.3.0.json`](../schemas/organization/v0.3.0.json))
- Legacy organization schema, format 0.9: `https://themachineweb.org/pagefront/spec/commerce/organization/v0.9.json` (published file: [`../schemas/organization/v0.9.json`](../schemas/organization/v0.9.json))
- Commerce releases and the versioning scheme: [`releases.md`](releases.md)
- Pagefront Spec (Product Sheet): [`product.md`](product.md)
- Pagefront Vocabulary: [`vocabulary.md`](vocabulary.md)
- Schema.org vocabulary: `https://schema.org/`

## Changelog

The changelog, with its Unreleased entries, is [`organization-changelog.md`](organization-changelog.md).
