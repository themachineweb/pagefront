# Commerce Organization Sheet

Status: normative spec. Ratified 2026-08-14 from the initial sketch, in legacy format version 0.9.
Organization Sheet spec version: 0.5.0
Commerce release: 0.5.0
Schema.org version targeted: 30.0 (2026-03-19)

The Commerce Organization Sheet is the Pagefront Sheet that describes the entity *behind* products: the brand that owns them, the company that makes them, the store that sells them. The Product Sheet describes an individual product. The organization sheet is the dereference target of the `brand` and `Offer.seller` links every Product Sheet already carries.

## One sheet type, three shapes

There are two commercially distinct entities behind a product: the manufacturer or brand-of-record (the target of Schema.org `Product.brand`) and the retailer or merchant (the target of Schema.org `Offer.seller`). Schema.org already keeps these on separate link targets in every Product Sheet. They collapse into a single sheet type because the entity's role is a property of the entity:

- **DTC**: manufacturer and merchant are one entity playing both roles (Nitto, Kimaï, AFS: the corpus's founding shape).
- **Pure retailer**: a multi-brand seller, the target of `Offer.seller`. It is never the target of `Product.brand`.
- **Pure manufacturer**: wholesale, no direct sales, the target of `Product.brand`, with no storefront.

One sheet type carries all three because the sheet MUST declare its role(s) explicitly and all role-specific content is optional and role-scoped. A consumer that dereferenced `Product.brand` can confirm the sheet claims `brand_owner`; one that dereferenced `Offer.seller` can confirm it claims `seller`.

## The envelope

Identical to every Pagefront Sheet. `canonical_url` is the human-facing brand, company, or store page the sheet describes. `sheet_url` is optional since 2026-10-13: an address the sheet is served from, as known to the publisher at generation time, and informational; the page's `alternate` declaration is what locates the sheet, and a publisher whose platform assigns or changes the address after generation MAY omit it (see "The envelope" in the Pagefront Spec).

```json
{
  "$schema": "https://themachineweb.org/pagefront/spec/commerce/organization/v0.5.0.json",
  "release": "0.5.0",
  "schema_org_version": "30.0",
  "canonical_url": "https://www.nittoknitwear.com/pages/atelier",
  "sheet_url": "https://www.nittoknitwear.com/pagefront/commerce/organization/nitto-knitwear.fr.json",
  "generated_at": "2026-08-14T11:00:00Z",
  "expires_at": "2026-08-21T11:00:00Z",
  "data": { "...": "..." }
}
```

`release` is the commerce release the sheet is written against, as a full semver; it replaces `format_version`, the field of the legacy draft line. `$schema` names this sheet spec's own version, with the full semver in its last segment: `organization/v0.4.0.json` for Organization Sheet spec 0.4.0. `$schema` is REQUIRED on every sheet carrying `release`, and optional only on the legacy draft line. The release and the sheet type resolve to exactly one sheet-spec version through the release table in [`releases.md`](releases.md), and `$schema` MUST name it (linter rule ORG-E-003). A sheet carrying both `format_version` and `release` is invalid (ORG-E-002). A sheet carrying `format_version` alone belongs to the legacy draft line and validates against the legacy schema, which stays served at `https://themachineweb.org/pagefront/spec/commerce/organization/v0.9.json`. The full rules are in "The envelope" in the Pagefront Spec ([`product.md`](product.md)).

Organization data changes slowly. `expires_at` MAY sit days out, unlike a product sheet carrying live price.

## Sheet URL and stability

The sheet URL is the publisher's choice: any URL on the publisher's domain that the described page's `Link: rel="alternate"` header points to. Consumers MUST follow the link and never parse the path (see Pagefront Discovery, [`../../core/spec/discovery.md`](../../core/spec/discovery.md)). The page is the identity, and the sheet lives wherever the page's link says today. A stable URL is desirable: consumers that cached the address keep finding the sheet, and the `pagefront:sheetUrl` hints that product sheets carry stay correct for longer. A publisher that can keep the URL for the life of the resource SHOULD do so, and SHOULD answer a rename with an updated `Link` target and, where possible, a `301` redirect from the old address. The organization's domain, a registration number, or a stable slug all make good identifier material for whatever shape the publisher chooses; none is prescribed.

## data — Schema.org JSON-LD

### Base type and the Brand node

The `data` block roots on Schema.org **`Organization`**. Recognized subtypes are permitted where they fit: `OnlineStore` / `OnlineBusiness` for a retailer, an ordinary `Organization` for a manufacturer.

The brand an entity owns is a nested Schema.org `Brand`, attached via `Organization.brand`. Rooting on `Brand` instead would fail twice over. A brand is a trading name; the company identity block (legal name, registration, address) belongs to an `Organization`, and conflating the two collapses the trading-name/legal-name distinction real merchants rely on. And a pure retailer is nobody's `Product.brand`, so a `Brand`-rooted sheet type could not describe it at all.

- A brand-owner sheet is *"an Organization that owns a Brand."*
- A retailer sheet is *"an Organization that sells."*
- A DTC sheet is both, on one node.

```json
"brand": {
  "@type": "Brand",
  "@id": "https://www.nittoknitwear.com/#brand",
  "name": "Nitto Knitwear",
  "logo": "https://www.nittoknitwear.com/cdn/shop/t/12/assets/logo_header.png",
  "slogan": "Tricoteurs depuis 1972"
}
```

The `Brand.@id` is the identity Product Sheets point at (see "Linking contract"). Brand-level provenance and maker facts (a brand-wide manufacturing story, a sourcing philosophy) attach to the `Brand` or to the owning `Organization`. Per-product manufacturing detail stays on the Product Sheet's `pagefront:manufacturingChain`.

### Required core fields

- `@context`: the array form `["https://schema.org", {"pagefront": "https://themachineweb.org/pagefront/vocabulary/"}]`. Every organization sheet uses `pagefront:` terms, since `pagefront:commerceRole` is required, so the bare `"https://schema.org"` string is never sufficient here; see [vocabulary.md, "How to use this vocabulary"](vocabulary.md#how-to-use-this-vocabulary).
- `@type`: `"Organization"` (or a recognized subtype)
- `@id`: stable URL-shaped identifier for the organization
- `name`: the organization's name as displayed to humans
- `inLanguage`: BCP 47 tag for the sheet's prose
- `pagefront:commerceRole`: array of one or more role values (see "Role discriminator")

There is no GTIN-equivalent identifier requirement. Brands and companies have no universal product-style ID, so the identifier rule for this sheet type is `@id` + `name` only. A `sameAs` authority record SHOULD be declared where one exists (see below; omission is the normal small-brand case). The registration-identity ladder (see "Company identity") adds machine keys where they exist, and none is required.

### Recommended core fields

- `url`: canonical human page (brand, company, or store)
- `sameAs`: an identity equivalence claim, a reference page that unambiguously indicates the entity's identity. Valid entries are a Wikidata or comparable public-authority record, or another official web property of the same entity. Social profiles are NOT `sameAs` entries: a handle is platform presence, and it belongs in `pagefront:socialAccount`. Omission is the normal small-brand case: identity then rests on the publisher's domain, the format's primary trust anchor, and no linter rule may warn on absence.
- `pagefront:socialAccount`: the official social accounts the organization operates, as an array of `pagefront:SocialAccount` entries. Publisher-stated only: entries MUST be accounts the publisher links from its own pages; guessed or searched-up handles are non-conformant. These are not automatically contact channels: an account also offered for support additionally appears in `contactPoint`.

```json
"pagefront:socialAccount": [
  {
    "@type": "pagefront:SocialAccount",
    "platform": "instagram",
    "url": "https://www.instagram.com/nittoknitwear/",
    "handle": "nittoknitwear"
  },
  {
    "@type": "pagefront:SocialAccount",
    "platform": "facebook",
    "url": "https://www.facebook.com/nittoknitwear",
    "handle": "nittoknitwear"
  }
]
```

- `logo`, `description`, `slogan`
- `brand`: the `Brand` node, when `commerceRole` includes `brand_owner`

## Role discriminator — `pagefront:commerceRole`

Explicit, required, array-valued. The closed enum:

- `brand_owner`: owns the brand under which products are sold. The entity a `Product.brand` link resolves to.
- `manufacturer`: makes the products.
- `seller`: sells products directly to end customers. The entity an `Offer.seller` link resolves to.

The values reuse the role names minted for `pagefront:legalEntity`, adding `seller`, which the product-scoped legalEntity enum lacks. `licensee`, `importer`, and `authorized_representative` remain legalEntity-only: they are per-product compliance declarations. Additional values require a spec amendment.

Each declared role SHOULD have its corresponding content present (a `brand_owner` SHOULD carry a `Brand` node, a `seller` SHOULD carry the seller block), and content SHOULD NOT appear without its role declared. The organization rule catalogue enforces both directions: ORG-W-001/ORG-W-002 warn on a declared role with no backing content, ORG-W-003/ORG-W-004 on the inverse, and ORG-W-006 on `pagefront:authorizedResellers` appearing without `brand_owner` (see `rules.md`, "Commerce Organization Sheet rules").

## Cardinality — one sheet per brand

Each **Brand** gets exactly one Commerce Organization Sheet, keyed by the Brand's `@id` and anchored on the brand's own page (its `canonical_url`). A company that owns several brands emits one sheet per brand. This keeps `Product.brand.@id` → sheet resolution deterministic: a brand identity resolves to exactly one sheet. There is no such thing as "the sheet that happens to contain this brand among several."

A **private-label brand with no domain of its own** anchors on the owner's storefront: its sheet lives under the owner's domain (its `canonical_url` the brand's page there, its `Brand.@id` minted on that domain), because that storefront is the only web presence the brand has. The sheet is still one-sheet-per-brand; anchoring changes where the sheet lives, and the count stays one.

The owning `Organization` (shared company identity: legal entity, address, founding) repeats across that company's brand sheets, carrying the same `Organization.@id` in each, so consumers deduplicate the company by identity while keeping brands distinct. An entity playing only the `seller` role with no owned brand gets one sheet keyed by the `Organization.@id`. The DTC single-brand case stays one sheet: one entity, both roles, one brand.

A multi-brand company that sells all its brands through one storefront emits a **separate seller sheet**: its own Commerce Organization Sheet with `commerceRole: ["seller"]`, keyed by the store's `Organization.@id`. The brand sheets stay brand-only; each brand's products reference the store via `Offer.seller`. Store-wide terms are stated once, on the store's sheet, the same de-duplication the return-policy move buys at product level, applied one level up.

On brand rename, the `Brand.@id` is held and `name` updated, matching the Product `{id}` stability contract.

## Role-scoped content

### Company identity (any role)

Schema.org-native `Organization` fields, populated when the page supports them: `legalName`, `foundingDate`, `foundingLocation`, `founder`, `address` (a `PostalAddress`), `contactPoint`, `email`, `numberOfEmployees`, `parentOrganization` / `subOrganization` for ownership structure, `hasCertification` (see "Certifications"), and `vatID` where applicable.

#### Company registration identity

Schema.org has no dedicated property for a company registration number and its register, and machine-key coverage of national registers is uneven. A Commerce Organization Sheet therefore carries registration identity as a **ladder** of machine keys plus a display form, every rung conditional on the data existing:

- `leiCode`, when the entity has an LEI (ISO 17442; native Schema.org). Global and register-independent; common for large or listed entities.
- `iso6523Code`, where the national register has an ISO 6523 ICD: an ICD prefix plus the register number (e.g. `"0002:808641435"` for a French SIREN; SIRENE is ICD 0002). Coverage is uneven: the German Handelsregister has no ICD, and US state corporate registries have none.
- Alongside whichever machine keys exist, a generic `identifier` `PropertyValue` carrying the jurisdiction-flavored display form SHOULD always accompany them:

```json
"identifier": {
  "@type": "PropertyValue",
  "propertyID": "RCS",
  "value": "808 641 435 R.C.S. Nanterre"
}
```

or, for a register with no machine key of its own:

```json
"identifier": {
  "@type": "PropertyValue",
  "propertyID": "Handelsregister",
  "value": "HRB 158855 B, Amtsgericht Charlottenburg Berlin"
}
```

The sheet is for machines, but consumers present results to humans, and the display form carries the register court a local reader recognizes.

The normative rules:

1. When more than one is present, authority order is `leiCode`, then `iso6523Code`, then `identifier`. The display form is presentation; it is never the identity key.
2. The ladder has a **floor**: every rung is conditional on the data existing. A typical private US company has no LEI, no ISO 6523-covered register (US incorporation is state-level), and publishes no registration number at all. For such a company, `legalName` plus an address is a complete, conformant registration declaration. The US d/b/a construct maps onto the existing `name`/`legalName` split.
3. No linter rule may warn on absent registration identifiers. Absence is jurisdiction-dependent and carries no quality signal. (Present but malformed machine keys are a different matter: ORG-W-005 warns when an `iso6523Code` or `leiCode` value does not match its shape.)
4. Jurisdiction of incorporation gets no field of its own. Where the publisher states it, it rides inside the display-form `identifier` value; Schema.org offers nothing better.
5. Publisher-stated only: registry-verifiable facts absent from the publisher's own pages (a US company's state of incorporation known only from court or registry records, say) MUST NOT be added to the sheet. The sheet is the publisher's authoritative statement.

No `pagefront:` term is minted; this is normative guidance over Schema.org-native properties.

### Brand-owner block (`brand_owner`)

The nested `Brand` node attached via `Organization.brand`, as in "Base type and the Brand node" above, and, optionally, the brand's authorized-reseller statement (next section).

### Authorized resellers

`pagefront:authorizedResellers` is the brand's statement of which sellers it authorizes to sell its products. It is an **authorization claim**. It is admitted on this sheet, which otherwise enumerates neither products nor carried brands (see "What this spec does not address"), on two grounds. First, it is the brand exercising authority over its own distribution: a statement only the brand can make, for which the brand is the sole source. Second, brands already publish and maintain this list (a "Revendeurs" page, a stockists page, a where-to-buy page), so the sheet types an existing publisher statement and imposes no new maintenance burden. It is the one outbound organization→organization edge on the sheet, and it sets no precedent for enumeration: still no products and no carried brands. The sheet's other outbound edge, `hasOfferCatalog`, points at the storefront's root collections and is admitted on its own grounds (see "Catalogue entry point").

The field answers two consumer questions, and each kind of entry serves one of them:

1. **The online authorization check**: "is this listing grey-market or counterfeit?" An `Offer.seller` is matched against the `reseller` entries by `@id` when the reseller has its own sheet, or by `url` domain when it does not. Entries carrying a `url` (or an `@id`) answer this question.
2. **The physical-stockist question**: "is this shop an authorized stockist?", "where can I buy this near X?" Entries carrying an `address` answer this question. Brands' published stockist lists are commonly of this kind, a store locator of physical shops with no web store to name.

An address-only entry never matches an online `Offer.seller`: it yields *no conclusion* about an online listing. The `exhaustive` flag applies across both kinds of entry; it is a claim about the list as a whole, online and physical alike.

Schema.org has no authorization relation between a brand and a seller (`member` / `memberOf` is membership, `seller` / `offeredBy` are offer-level, and `availableAtOrFrom` is a place), which is the extension trigger for the `pagefront:` term (see `pagefront:AuthorizedResellers` in the Pagefront Vocabulary).

**Shape.** Valid only where `commerceRole` includes `brand_owner` (ORG-W-006 warns otherwise; no rule warns on absence). The value is one `pagefront:AuthorizedResellers` object:

- `exhaustive` *(optional boolean, default `false`)*: see "Exhaustive" below.
- `reseller` *(required, one or more entries)*. Each entry carries `organization` *(required)*, in one of two forms: a reference stub `{"@type": "Organization", "@id": "…"}` resolving to the reseller's own Commerce Organization Sheet, or an inline `Organization` for a reseller without a sheet, carrying `name` plus `url` and/or `address`. `url` is the key an online seller is matched on; `address` (a `PostalAddress`) identifies a physical point of sale; a reseller that has a shop and a web store carries both. An inline entry with neither does not validate. Optionally, the entry carries `areaServed` (Schema.org-native `Country` / `DefinedRegion` / `AdministrativeArea`) for territory-scoped authorization. A physical reseller's location is its `address`; `areaServed` is a different fact and is stated only when the brand states it.

The brand does NOT list itself: its own selling is declared via the `seller` commerce role, and its own boutiques via the seller block's `location` (see "Store locations"). Publisher-stated only: entries MUST come from the brand's own published reseller / where-to-buy pages, taken as published. A seller known to stock the brand but absent from the brand's page is not added.

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
      "organization": {
        "@type": "Organization",
        "name": "Boutique en Ligne Example",
        "url": "https://www.boutique-en-ligne.example"
      }
    },
    {
      "organization": {
        "@type": "Organization",
        "name": "Comptoir de la Gare",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "12 place de la Gare",
          "postalCode": "69002",
          "addressLocality": "Lyon",
          "addressCountry": "FR"
        }
      }
    }
  ]
}
```

The example shows the three entry forms: a department store with its own organization sheet, referenced by `@id` and authorized for France only; an online boutique without a sheet, inline with its `url`; a physical shop without a sheet or a web store, inline with its address.

**Exhaustive.** When `exhaustive` is `true`, the list is complete: a seller absent from it is NOT authorized by the brand. When `false` or absent, absence is no statement; the brand names some authorized resellers without claiming to name all. The flag covers the whole list, online and physical entries alike, so a brand cannot declare its web resellers complete and its stockists open-ended with one flag. Publishers set `true` only when the brand's page presents the list as complete; a store locator or a "selected stockists" page is not a completeness claim.

**Direction of trust.** Only the brand's sheet is authoritative for whom the brand authorizes. A reseller's own claim of authorization, on its sheet, in its listing, or anywhere else, carries no weight, and no reciprocal field exists: there is no `authorizedBy` on a seller sheet, and one will not be added.

**Consumer resolution.** For an `Offer` whose `seller` is not the brand:

1. Follow `Product.brand` (`@id`) to the brand's Commerce Organization Sheet, located by the reference's `pagefront:sheetUrl` and checked per "Linking contract", and read `pagefront:authorizedResellers`. If the sheet declares none, or cannot be resolved: no conclusion.
2. Match `Offer.seller` against the `reseller` entries: by exact-string `@id` when the entry is a reference stub (the reseller has a sheet); otherwise by domain, the registrable domain of the entry's `url` against that of `Offer.seller.url` (or of `Offer.seller.@id` when that is a URL on the seller's own domain). An entry carrying only an `address` identifies a physical point of sale and never matches an online offer; such entries contribute nothing to this step, in either direction.
3. On a match, the seller is authorized (within `areaServed`, when stated). If `exhaustive` is `true` and nothing matches, the seller is NOT authorized. If `exhaustive` is `false` or absent and nothing matches: no conclusion.

This read rides the existing `Product.brand` edge and stays `@id`-keyed, adding no graph structure. It is a read a consumer makes of the brand's sheet in its own right, scoped to this one question. It is not a cross-sheet dependency in the return-policy sense, because no Product Sheet field defers to it.

### Seller block (`seller`)

Store-wide commercial terms an agent needs to reason about *before* it reaches a specific offer:

- the store-wide return / exchange policy: `hasMerchantReturnPolicy` (see "Return policy")
- the store-wide shipping terms: `pagefront:fulfillmentTerms` (see "Fulfillment terms")
- `paymentAccepted`
- the seller's own physical stores: Schema.org-native `location` (see "Store locations")
- seller reputation (`aggregateRating`, where the publisher asserts it)

A retailer's sheet does not enumerate the brands it carries; see "What this spec does not address."

### Return policy

A store's return policy is a property of the store. It lives here, on the seller block, as `hasMerchantReturnPolicy`, the **store-wide default**, stated once. Restating it on every Product Sheet would duplicate it and let the copies drift.

Product-specific policies survive as overrides: a Product Sheet carries return terms only when the product deviates from the store default, such as final-sale items, and made-to-order products whose returns exceptions live in `pagefront:madeToOrderTerms` and stay there. The resolution rule for consumers: read the product's own return terms if present, otherwise follow `Offer.seller` to the seller's sheet, located by the reference's `pagefront:sheetUrl` and checked per "Linking contract", and use its store-wide policy. That sheet is on the product sheet's own host. When it cannot be resolved, the inherited terms are unknown.

This is the format's one semantic cross-sheet dependency, and its cost is accepted. "Can I return this product" is not answerable from the Product Sheet alone when the product is silent; the consumer must also fetch the seller sheet. The read rides the *existing* `Offer.seller` edge and stays `@id`-keyed for identity; `pagefront:sheetUrl` on the reference says where the seller sheet is. It is the one exception to each-sheet-is-self-contained. It is scoped to return and shipping terms and MUST NOT be generalized to other fields.

### Fulfillment terms

Store-wide shipping follows the same default-plus-override pattern as returns, via `pagefront:fulfillmentTerms` on the seller block: an array of Schema.org-native `OfferShippingDetails` objects carrying the store's shipping defaults (destinations, rates, and delivery timeframes), with free-shipping thresholds via the existing `pagefront:appliesWhen` / `pagefront:PricingCondition` machinery, as on an Offer.

The term is composition over inheritance. Schema.org scopes `OfferShippingDetails` to the Offer, so the Pagefront term is only the org-level attachment point Schema.org lacks; the payload stays plain Schema.org, and no parallel shipping vocabulary is minted. An Offer carries `shippingDetails` only when the product deviates from the store defaults (bulky items with their own rates, made-to-order lead times), with the same product-else-seller resolution as returns.

```json
"pagefront:fulfillmentTerms": [
  {
    "@type": "OfferShippingDetails",
    "name": "France métropolitaine et Belgique — livraison offerte dès 200 € d'achat",
    "shippingRate": { "@type": "MonetaryAmount", "value": "0", "currency": "EUR" },
    "shippingDestination": [
      { "@type": "DefinedRegion", "addressCountry": "FR", "name": "France métropolitaine" },
      { "@type": "DefinedRegion", "addressCountry": "BE", "name": "Belgique" }
    ],
    "pagefront:appliesWhen": {
      "@type": "pagefront:PricingCondition",
      "minimumOrderValue": { "@type": "MonetaryAmount", "value": "200", "currency": "EUR" }
    }
  }
]
```

Warranty does not participate in seller defaults: a warranty the product page states lives on its Offer as `warranty`, a manufacturer's warranty lives on the Product as `pagefront:manufacturerWarranty` (`product.md` § Warranty), and a warranty document stays a `pagefront:document` entry with `role: "warranty"`. An org-level home for store-wide warranty terms is tracked pending a worked example.

### Store locations

A seller's own physical stores are self-description, expressed with Schema.org's native `Organization.location`. No `pagefront:` term is minted, because Schema.org already carries it. The value is an array of `Place` (or `LocalBusiness` subtype) entries, each carrying `name` and an `address` (a `PostalAddress`, required per entry), and, where the retailer publishes them: `openingHoursSpecification`, `telephone`, `url` (the store's page on the retailer's own site), and `geo`. Publisher-stated only: entries come from the retailer's own store-locator pages, never compiled from third-party directories.

The consumer question served: "does this retailer have a store near me — where is it, when is it open."

The boundary against `pagefront:authorizedResellers` is the direction of the statement. `location` is the **seller's** statement about its own stores, self-description in Schema.org-native terms. `pagefront:authorizedResellers` is the **brand's** statement about third parties, an authorization relation Schema.org lacks, hence the minted term. A DTC merchant with a boutique declares it in `location`; it does not list itself in `authorizedResellers`, since its own selling is the `seller` role (see "Authorized resellers").

There is no per-store sheet: stores are inline entries on the seller's sheet, and a large chain's list is bounded by what the retailer already publishes in its store locator.

```json
"location": [
  {
    "@type": "Place",
    "name": "Maison Example — Marais",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "12 rue des Archives",
      "postalCode": "75004",
      "addressLocality": "Paris",
      "addressCountry": "FR"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "10:00",
        "closes": "19:00"
      }
    ]
  }
]
```

### Catalogue entry point (any role)

`hasOfferCatalog`, Schema.org's own property, is where the storefront's catalogue begins: the roots of the collection tree the Commerce Collection Sheets ([`collection.md`](collection.md)) describe. A consumer holding a product sheet or a listing page can enter the tree from there, and nothing else gives it the roots. The value is one flat `OfferCatalog`:

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
      "@id": "https://merchant.com/collections/new-in#collection",
      "url": "https://merchant.com/collections/new-in",
      "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/collection/new-in.en.json",
      "name": "New in",
      "pagefront:collectionKind": "collection"
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

The rules, as "Entry point" in the Commerce Collection Sheet spec states them:

- `itemListElement` holds `Collection` entries in the member entry shape of that spec (`@type`, `@id` and `url` required; `pagefront:sheetUrl`, `name` and `pagefront:collectionKind` recommended), in display order. Every root category (a `category` sheet with no `isPartOf`) appears here, every top-level collection (a `collection` sheet with no `isPartOf`) SHOULD, and every `brand` collection SHOULD. A nested `OfferCatalog` is not permitted; the list is flat.
- Any `pagefront:commerceRole` may carry it. A manufacturer's range is organised in categories as a retailer's is.
- The referenced sheets are on this sheet's host, in this sheet's `inLanguage`. A root in another language is reached through `pagefront:availableLanguages` on the root sheet. Linter rule ORG-W-007 warns on an entry whose `pagefront:sheetUrl` is on another host.
- The field is this sheet's second admitted outbound edge, after `pagefront:authorizedResellers` (see "Linking contract"). The freshness objection that keeps enumeration off this sheet does not apply to it: roots are few and change rarely, and what changes daily, membership, lives in the collection sheets. Each `pagefront:sheetUrl` is a traversal hint under "Traversal hints" in Pagefront Discovery: it MAY be stale, and a consumer reaches the root through the entry's `url` and the Sheet that page declares when it does not resolve.

No separate catalog sheet exists and none is planned. A Sheet describes a page, a catalog has no page, and the enumeration a catalog sheet would have carried is `hasOfferCatalog` plus the tree below it.

### Entry point (commerce binding)

In the commerce vertical, the root Sheet reached through the entry point of Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md#entry-point)) is the Commerce Organization Sheet. From it, `hasOfferCatalog` leads to the root collections, their `hasPart` to the members, and `pagefront:availableLanguages` to the same root in other languages. A consumer can traverse an origin's commerce Sheets from here without fetching a page. A multi-language origin points the entry point at one root. An organization sheet reached by DNS delegation ("Delegation by DNS" in Pagefront Discovery) is authoritative for the domain that published the record even when it is served from another host; the host checks of PDP-E-005 and PDP-E-006 apply to the organization references a product sheet carries, and the root sheet's own location is outside their scope.

## Certifications

Certifications reuse the Product Sheet pattern: Schema.org `hasCertification` with a `scope` `PropertyValue`. Org-level certifications (B-Corp, ISO 14001, company-wide Fair Trade) carry the scope value **`organization`**: the certification attaches to the entity.

The boundary holds in both directions. Product- and material-scoped certifications (`yarn`, `fabric`, `diamond`, `finished_product`, and the rest) never migrate to the organization sheet: a yarn certification is a fact about a product's yarn and belongs on the Product Sheet even when every product in the catalog carries it. An entity-level certification is stated once here and is not restated on each Product Sheet.

## Legal entities — reference or inline

`pagefront:legalEntity` on the Product Sheet (role-typed accountable entities) partially overlaps this sheet. The overlap is real for `brand_owner` and `manufacturer`, which are stable, catalog-wide facts a Commerce Organization Sheet already states. For the other roles there is no overlap. The relationship is reference-capable; the organization sheet does not replace the product-level entry:

- When a `legalEntity` entry's organization *has* a Commerce Organization Sheet (typically the `brand_owner`, sometimes the `manufacturer`), the Product Sheet SHOULD express it as a reference stub, without restating name and address:

```json
{
  "@type": "pagefront:LegalEntity",
  "role": "brand_owner",
  "organization": { "@type": "Organization", "@id": "https://www.nittoknitwear.com/#org" }
}
```

  The `@id` resolves to the organization sheet the same identity way as `Product.brand` and `Offer.seller`, removing the drift-prone duplication of stable org data across every product. As facts of legacy format 0.9: the product schema accepts the stub form (`organization.name` is optional when `@id` is present), and linter rule PDP-W-024, the no-postal-address warning, exempts reference stubs, whose address lives on the referenced sheet.

- When the entity is a third party with no sheet (`authorized_representative`, `importer`: the GPSR responsible person, the importer of record), or varies by product or market, it stays fully inline with name and address. There is nothing to reference, and GPSR Art. 19 wants the responsible entity resolvable at the listing itself; compliance-grade data does not move off the product.

`legalEntity` is therefore not redundant with this sheet and is not folded into it: `authorized_representative` and `importer` are per-product, per-market facts about third parties, and `manufacturer` ≠ `brand_owner` for licensed goods, where the manufacturing licensee is named only at the product. Mechanically, a Schema.org `Organization` reduced to `@type` + `@id` is already a reference stub, and the linter's existing stub-vs-inline distinction (PDP-E-001 / PDP-W-020) applies unchanged. A `brand_owner` or `manufacturer` stub SHOULD resolve to a sheet declaring the matching `commerceRole`.

## Linking contract (identity only)

The whole cross-sheet story is identity resolution by exact-string `@id` match. There is no structured traversal:

- `Product.brand.@id` resolves to the `Brand` node inside a Commerce Organization Sheet whose `commerceRole` includes `brand_owner`.
- `Offer.seller.@id` resolves to the top-level `Organization` `@id` of a Commerce Organization Sheet whose `commerceRole` includes `seller`.

A reference to an organization (`Offer.seller`, `Product.brand`, or a reference-form `pagefront:legalEntity`) carries `@id` as its identity and SHOULD carry `pagefront:sheetUrl`, the URL of the organization sheet describing that entity. Producers that publish the organization sheet SHOULD set it on every reference. The reference MAY also carry `url`, the entity's own page, from which a consumer reaches the organization sheet through that page's `alternate` declaration. `@id` identifies the entity, `pagefront:sheetUrl` locates its sheet, and `url` locates its page: the same split as `@id`, `sheet_url` and `url` on variant entries in the Pagefront Spec.

`pagefront:sheetUrl` is a traversal hint under "Traversal hints" in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md#traversal-hints-normative)). It MAY be stale: the organization sheet's address can change between updates of the product sheet that carries the reference. A consumer MUST be able to reach the organization sheet through the entity's page, the reference's `url` and then the Sheet that page declares, and SHOULD treat the hint as an optimisation over that path. A consumer MUST NOT cache an organization sheet's URL across the entity's page changes. The host check and the identity check below apply to whichever URL the consumer follows.

```json
"brand": {
  "@type": "Brand",
  "@id": "https://www.nittoknitwear.com/#brand",
  "name": "Nitto Knitwear",
  "pagefront:sheetUrl": "https://www.nittoknitwear.com/pagefront/commerce/organization/nitto-knitwear.fr.json"
}
```

A consumer resolving a reference:

1. Reads `pagefront:sheetUrl`. When it is absent or does not resolve, the consumer reaches the organization sheet through the entity's page when the reference carries a `url`: it fetches that page and follows the Sheet it declares. With neither a hint nor a page, the organization sheet is not discoverable from this reference; the consumer MUST NOT construct a URL from the `@id` or from any pattern, and treats terms it would have inherited as unknown.
2. Checks the host of the sheet URL it follows, the hint or the one the page declares, according to the edge:
   - `Offer.seller`: the host of the product sheet's canonical page (the envelope `canonical_url`). The seller is the publisher of the offer, so its terms come from where it publishes. The seller's `@id` may be minted on another domain the organization controls.
   - `Product.brand`: the host of the reference's `@id`. The brand may be a third party, and its statements, `pagefront:authorizedResellers` among them, count only when served from its own origin.
   - `pagefront:legalEntity` (reference form): either of the above. It is the product publisher's own declaration; resolving it grants no inherited trust.

   A URL failing its edge's check is rejected, and the consumer treats inherited terms as unknown.
3. Fetches the sheet and confirms the reference's `@id` matches, by exact string, the node the edge points at:
   - `Offer.seller`, and a reference-form `pagefront:legalEntity`: the data block's `@id` (the Organization).
   - `Product.brand`: the `@id` of the Brand node at `data.brand`.

   The match is checked at these positions only. An `@id` appearing elsewhere in the sheet (for example in `parentOrganization`, `subOrganization`, or `pagefront:authorizedResellers`) does not satisfy it: a sheet vouches only for itself and its own brand. The consumer also confirms the organization's `pagefront:commerceRole` fits the edge: a seller role for `Offer.seller`, the brand-owner role for `Product.brand`. On any mismatch, the consumer discards the sheet and treats inherited terms as unknown.

Because a seller sheet always resolves on the product sheet's host, return and shipping terms inherited along `Offer.seller` are always the publisher's own statement.

When a seller's `@id` host differs from its sheet's host, the organization's identity is asserted by the publisher, and the identity domain has not confirmed it. Consumers MUST NOT treat such a seller identity as origin-verified. A domain-association mechanism, by which an identity domain confirms the storefront domains it controls, is deferred; no catalog sheet is planned, and the catalogue entry point is `hasOfferCatalog` on this sheet (see "Catalogue entry point"). `pagefront:sheetUrl` remains the direct path from a reference.

Brand `@id`s SHOULD be minted on the host that serves the brand's organization sheet, since brand references are checked against the `@id`'s host.

Step 3 relies on one brand per organization sheet (see "Cardinality"), so `data.brand` is a single node. If multi-brand organization sheets are ever permitted, this rule must be revisited.

The organization sheet's own anchor, its `canonical_url` and the `alternate` link on that page, is unchanged. `pagefront:sheetUrl` is how a sheet is reached by reference; page-based discovery continues to find it from its own page.

**Worked example: a retailer and a brand on two hosts.** A department store on `www.grand-magasin.example` sells a headlamp made by Meridian Gear, whose own site is `meridiangear.com`. The store's product sheet carries:

```json
"brand": {
  "@type": "Brand",
  "@id": "https://meridiangear.com/#brand",
  "name": "Meridian Gear",
  "pagefront:sheetUrl": "https://meridiangear.com/pagefront/commerce/organization/meridian-gear.en.json"
},
"offers": [
  {
    "@type": "Offer",
    "price": "89.00",
    "priceCurrency": "EUR",
    "seller": {
      "@type": "Organization",
      "@id": "https://www.grand-magasin.example/#org",
      "pagefront:sheetUrl": "https://www.grand-magasin.example/pagefront/commerce/organization/grand-magasin.fr.json"
    }
  }
]
```

- The brand reference passes step 2 because its sheet URL's host, `meridiangear.com`, is the host of its `@id`. In step 3 the consumer finds `https://meridiangear.com/#brand` at `data.brand` in Meridian Gear's sheet, whose `commerceRole` includes `brand_owner`. The consumer can then read that sheet's `pagefront:authorizedResellers` and look for the store (see "Authorized resellers").
- The seller reference passes step 2 because its sheet URL's host, `www.grand-magasin.example`, is the product sheet's own host. In step 3 the consumer finds `https://www.grand-magasin.example/#org` as the data block's `@id` in the store's sheet, whose `commerceRole` includes `seller`. The store's return and shipping terms apply to the offer where it is silent.

**Worked example: identity domain and storefront on two hosts.** A company whose legal identity lives on `boardco.example` sells its board brand from the storefront `boards.example`. Product sheet and organization sheet are both served from `boards.example`; the organization `@id` is minted on the company domain so a second brand's sheet can share it:

```json
"brand": {
  "@type": "Brand",
  "@id": "https://boards.example/#brand",
  "pagefront:sheetUrl": "https://boards.example/pagefront/commerce/organization/boardco.en.json"
},
"offers": [
  {
    "@type": "Offer",
    "seller": {
      "@type": "Organization",
      "@id": "https://boardco.example/#org",
      "pagefront:sheetUrl": "https://boards.example/pagefront/commerce/organization/boardco.en.json"
    }
  }
]
```

The seller reference passes step 2 on the product sheet's host, `boards.example`; the brand reference passes on its `@id`'s host, also `boards.example`. The sheet declares `https://boardco.example/#org` as its data block `@id` and `https://boards.example/#brand` at `data.brand`. The seller's return and shipping terms are inherited; the seller identity on `boardco.example` is publisher-asserted, and the consumer does not treat it as origin-verified. The AFS Blackbird case study has this shape.

The organization sheet does not list its products or its carried brands: the graph closes on the identifiers products already emit. It carries two outbound edges, each admitted on its own grounds. `pagefront:authorizedResellers` is a brand's sheet naming the seller organizations it authorizes (see "Authorized resellers"); where a named reseller has its own sheet, the edge resolves by the same exact-string `@id` match. `hasOfferCatalog` is the catalogue entry point (see "Catalogue entry point"): the storefront's root collections, each a Commerce Collection Sheet reached by `pagefront:sheetUrl` and confirmed by exact-string `@id` match at the data block of the fetched sheet.

One read travels the product-to-organization links beyond identity confirmation: return- and shipping-policy resolution (product-else-seller) walks the `Offer.seller` link when a product is silent. It reuses that existing link, locates the seller sheet by the reference's `pagefront:sheetUrl` under the steps above, and is the one accepted exception to self-containment (see "Return policy").

## Worked examples

- **DTC, all three roles**: the Nitto organization sheet ([`../case-studies/nitto/nitto-organization-v0_9.json`](../case-studies/nitto/nitto-organization-v0_9.json)). MBTJM SAS behind the Nitto Knitwear brand, with the full ten-entry `pagefront:fulfillmentTerms` store policy, the store return policy, registration identity on the `iso6523Code` rung plus the RCS display form, and, since 2026-08-31, a `pagefront:authorizedResellers` statement transcribed from the brand's Revendeurs page: 148 physical stockists across eighteen countries, each an inline `Organization` keyed by name and postal address (the page publishes no websites), with no `exhaustive` claim because a store locator makes none.
- **Seller-only**: the Zalando organization sheet ([`../case-studies/zalando/zalando-organization-v0_9.json`](../case-studies/zalando/zalando-organization-v0_9.json)). A pure-retailer sheet with `commerceRole: ["seller"]`, registration identity on the `leiCode` rung (`529900YRFFGH5AXU4S86`) plus the Handelsregister display form, that register having no ISO 6523 ICD.
- **Private-label brand sheet**: the Friboo sheet ([`../case-studies/zalando/zalando-friboo-organization-v0_9.json`](../case-studies/zalando/zalando-friboo-organization-v0_9.json)). A brand with no domain of its own, anchored on the owner's storefront per the cardinality rule.

## What this spec does not address

- **Product and carried-brand enumeration.** No product list and no brand list on the organization sheet: "what does this store sell" is answered by `hasOfferCatalog` and the Commerce Collection Sheets below it, where membership lives and carries its own freshness, and that a retailer is authorized is stated on each brand's sheet only.
- **Policy inheritance beyond return and shipping.** Return and shipping inheritance is in scope (default + override, above). Broader inheritance of arbitrary fields from org to product is out of scope; org-level and product-level statements are otherwise independent.
- **Ownership and governance beyond Schema.org.** `parentOrganization` / `subOrganization` and `ownershipFundingInfo` cover the common cases. A typed `pagefront:` ownership-structure extension (independent / PE-owned / public / cooperative) is a candidate only if real consumer demand surfaces.
- **Marketplace partner-seller modeling.** A marketplace listing where a third-party partner is the `Offer.seller` needs no new vocabulary: the partner is another organization, referenced by `@id` like any seller and eligible for its own sheet. No case study has exercised the shape yet, so the gap is noted here as a gap rather than as a design question.

## Versioning

This sheet spec has its own semver, 0.5.0, and is a member of commerce release 0.5.0. It reached 0.3.0 in three minors: the ratified text of 2026-08-14 (0.1.0), `pagefront:authorizedResellers` on 2026-08-31 (0.2.0) and `pagefront:sheetUrl` on 2026-09-30 (0.3.0). 0.4.0, on 2026-10-02, makes `$schema` required; 0.5.0, on 2026-10-18, admits `hasOfferCatalog` as the catalogue entry point and makes `sheet_url` optional. A sheet declares the release in its envelope (`release`) and names this spec version in `$schema`. Before 1.0 a breaking or an additive change bumps the minor and a fix or clarification bumps the patch; the release bumps with its members. The scheme, the release table and the legacy draft line are in [`releases.md`](releases.md); the stability policy that applies from release 1.0.0 is in "Versioning and stability" in [`vocabulary.md`](vocabulary.md). The rule catalogue keeps its own semver.

This spec plans no breaking change of its own. The `@context` prefix constraint listed under "Planned breaking changes" in the Pagefront Spec will apply to the organization schema as well.

The next paragraph is history, in legacy format versions. Commerce format 0.9 brings, for this sheet type and its Product Sheet companions: `pagefront:commerceRole`, `pagefront:fulfillmentTerms`, `pagefront:socialAccount` with the `sameAs` tightening (a 2026-08-14 revision, permitted in the pre-1.0 draft phase), `pagefront:authorizedResellers` (added 2026-08-31), the `organization` certification scope value, the product-schema relaxation making `legalEntity` `organization.name` optional when `@id` is present, and the PDP-W-024 exemption for reference stubs. All are additive, with no term renamed or removed, and existing v0.8 sheets stay valid. `pagefront:commerceRole`, `pagefront:fulfillmentTerms`, `pagefront:socialAccount`, and `pagefront:authorizedResellers` are covered by the stability policy from 1.0, under the Pagefront Vocabulary's "Versioning and stability".

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

_Entries dated before 2026-10-01 were written under the legacy scheme, in which sheets carried `format_version: "0.9"`. Each of them is additive._

### Unreleased

Changes land here and are versioned at the next release; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

### 0.5.0 — 2026-10-18

Released in commerce release 0.5.0. A minor: `hasOfferCatalog` is admitted and `sheet_url` becomes optional; a sheet valid at 0.4.0 stays valid.

- **Addition: commerce binding of the entry point.** The Commerce Organization Sheet is the root Sheet reached through the carriers in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md#entry-point)), `/.well-known/pagefront` and the `Pagefront:` line in `/robots.txt`; "Entry point (commerce binding)" under "Catalogue entry point" states the traversal from it. Pointers to "Discovery" and "Traversal hints" now name that document.
- **Addition: DNS-delegated root.** An organization sheet reached by DNS delegation ("Delegation by DNS" in Pagefront Discovery) is authoritative for the domain that published the record even when it is served from another host; the host checks of PDP-E-005 and PDP-E-006 apply to the organization references a product sheet carries, and the root sheet's own location is outside their scope.
- **Addition (minor): catalogue entry point.** `hasOfferCatalog` is admitted on the sheet, for any commerce role, as the catalogue entry point: one flat `OfferCatalog` whose `itemListElement` lists the storefront's root collections as `Collection` member entries in display order, each on this sheet's host and in its `inLanguage`, referencing Commerce Collection Sheets ([`collection.md`](collection.md)). It is the sheet's second admitted outbound edge after `pagefront:authorizedResellers`; the linking contract names both, "Authorized resellers" no longer calls that field the one exception, the catalog-enumeration item leaves "What this spec does not address" (enumeration lives in `hasOfferCatalog` and the collection sheets), and the sentence deferring domain association no longer promises a catalog sheet. **(schema)** `hasOfferCatalog` added as an optional property with the member entry shape (`memberEntry` in `$defs`); the editable head already named 0.5.0 and keeps it. **(linter)** ORG-W-007 warns on an entry whose `pagefront:sheetUrl` is on another host than the canonical host.
- **Correction (minor): discovery link relation.** Discovery link relation corrected from `describedby` to `alternate` to match the first-party model adopted at v0.4, as in the Pagefront Spec. "Sheet URL and stability" and the linking contract name the `alternate` link. No sheet changes shape.
- **Relaxation (minor, compatible).** `sheet_url` is optional, with the definition the Pagefront Spec gives it: an address the sheet is served from as known at generation time, informational, omittable by a publisher whose platform assigns or changes the address after generation. Every sheet that was valid stays valid. **(schema)** `sheet_url` leaves the envelope's required list; the editable head names 0.5.0. "Sheet URL and stability" now states that the page is the identity and that a stable sheet URL is desirable; it no longer requires one.
- **Clarification (patch): seller references.** An organization reference MAY carry `url`, the entity's own page, beside `@id` and `pagefront:sheetUrl`; a consumer reaches the organization sheet from it through the page's `alternate` declaration. The seller edge's host check names the product sheet's canonical page (`canonical_url`) as the host a seller sheet must be on. Linter rule PDP-W-031 now accepts a seller reference carrying `url`, and PDP-E-005 compares the seller sheet URL with the canonical page's host.
- **Clarification (patch): traversal hints.** `pagefront:sheetUrl` on an organization reference is a traversal hint that MAY be stale. A consumer MUST be able to reach the organization sheet through the entity's page (the reference's `url`, then the Sheet that page declares), SHOULD treat the hint as an optimisation over that path, and MUST NOT cache the sheet's URL across the page's changes. The linking contract's step 1 follows the page when the hint is absent or does not resolve, and the host check of step 2 applies to whichever URL is followed. The general rule is stated under "Traversal hints" in the Pagefront Spec.

### 0.4.0 — 2026-10-02

Released in commerce release 0.4.0. `$schema` is required on sheets carrying `release` (breaking: a release-line sheet without `$schema` no longer validates); it stays optional on the legacy draft line. The schema's `$id` is `https://themachineweb.org/pagefront/spec/commerce/organization/v0.4.0.json`, and the 0.3.0 schema stays published, unchanged, for sheets declaring release 0.3.0. A sheet is judged by the release it declares: one declaring release 0.3.0 keeps validating without `$schema`. Linter rule ORG-E-003 compares a present `$schema` with the schema the release bundles, and ORG-E-004 flags a `release` the release manifest does not list. See "The envelope."

### 2026-10-01 — Versioning scheme replaced

Each sheet spec now has its own semver, and a commerce release bundles the sheet specs and the vocabulary; the scheme and the release table are in [`releases.md`](releases.md). In the envelope `release` replaces `format_version` (breaking, release 0.3.0), and `$schema` names the sheet-spec version, `https://themachineweb.org/pagefront/spec/commerce/organization/v0.3.0.json`. Sheets carrying `format_version` form the legacy draft line and stay valid against the legacy schema at `.../organization/v0.9.json`. This document is Organization Sheet spec 0.3.0, in commerce release 0.3.0: the 2026-08-14, 2026-08-31 and 2026-09-30 entries below each count as a minor. Linter rules ORG-E-002 (both fields) and ORG-E-003 (release / schema mismatch) are added; catalogue 0.15.0.

### 2026-09-30 — `pagefront:sheetUrl` on organization references

Additive; no sheet changes conformance. `pagefront:sheetUrl` added: organization references (`Offer.seller`, `Product.brand`, reference-form `pagefront:legalEntity`) declare where the organization sheet is, and `@id` stays the identity. Host checks are edge-typed: seller sheets on the product sheet's host, brand sheets on the brand's `@id` host, legal-entity sheets on either. The `@id` is matched at the node the edge points at (the data block for organization references, `data.brand` for brand references), and the commerce role must fit the edge. Consumers do not construct sheet URLs and treat unresolvable inherited terms as unknown. Seller identity across domains is publisher-asserted pending a domain-association mechanism. See "Linking contract".

### 2026-09-24 — Versioning policy revised

Policy and prose only; no sheet changes conformance. Releases before 1.0 are 0.9.x, one per new sheet type; 1.0 is defined as the complete commerce sheet set (organization, product, category, collection, catalog); breaking changes are held for 1.0; from 1.0, stability is deprecation-based. The "Versioning" section above carries the summary; the policy is in "Versioning and stability" in [`vocabulary.md`](vocabulary.md).

### 2026-09-08 — `@context` prefix

Prose only, no schema change. The `@context` requirement now states the array form with the `pagefront` prefix as the form every organization sheet uses, since `pagefront:commerceRole` is required and a `pagefront:` key under the bare `"https://schema.org"` string does not resolve to the vocabulary. The schema accepts both forms, as before.

### 2026-09-08 — schema identifier

Together with the Pagefront Spec's same-day revision: the organization schema's identifier is now the URL it is served from, `https://themachineweb.org/pagefront/spec/commerce/organization/v0.9.json`, beside the spec page. The previous identifier was never served. Sheets declaring it remain in scope for the linter's page-type dispatch.

### 2026-09-02 — sheet URL convention removed

Together with the Pagefront Spec's same-day revision: the recommended sheet URL shape is removed across the format. Nothing becomes non-conforming and no sheet moves; a publisher on the previously recommended shape stays where it is. The rationale lives with the Pagefront Spec's changelog: the convention's fallback-heuristic purpose invited the path-guessing discovery forbids, and its v0.9 segment migration cost churn without normative effect. See "Sheet URL and stability."

### 2026-08-31 — authorized resellers

An additive revision within the 0.9 draft, with no format bump. The Pagefront Spec is untouched.

- **(schema) (linter) `pagefront:authorizedResellers`.** The brand's statement of which sellers it authorizes: one `pagefront:AuthorizedResellers` object (`exhaustive`, `reseller[]`), valid only where `commerceRole` includes `brand_owner`. This is an **authorization claim**; the sheet's no-enumeration rule (no products, no collections, no carried brands) stands, and the grounds for admitting the field are given in "Authorized resellers." Linter rule ORG-W-006 warns on the field without the role; nothing warns on its absence.

### 2026-08-14 — first release (v0.9), ratified from the initial sketch

_The first version of this document, landing in the commerce format 0.9 cut alongside the Product Sheet's companion changes._

- **New sheet type.** The Commerce Organization Sheet, with its own JSON Schema (`https://themachineweb.org/pagefront/spec/commerce/organization/v0.9.json`).
- **(schema) `pagefront:commerceRole`.** The sheet's required role discriminator, an array over the closed enum `brand_owner` / `manufacturer` / `seller`. See "Role discriminator."
- **(schema) `pagefront:fulfillmentTerms`.** The org-level home for store-wide shipping defaults, an array of Schema.org-native `OfferShippingDetails`. See "Fulfillment terms."
- **Certification scope value `organization`.** For certifications that attach to the entity itself. See "Certifications."
- **(schema) (linter) Reference-capable `pagefront:legalEntity`.** The v0.9 product schema makes `organization.name` optional when `@id` is present, so a Product Sheet's legal-entity entry can be a reference stub resolving here; linter rule PDP-W-024 (no postal address) exempts reference stubs, whose address lives on the referenced sheet. See "Legal entities" here and in the Pagefront Spec.
- **(schema) `pagefront:socialAccount`; `sameAs` tightened** *(2026-08-14 revision)*. `sameAs` carries identity authority records only; social profiles are excluded and get a typed home, `pagefront:socialAccount`, an array of `pagefront:SocialAccount` entries (`platform` / `url` / `handle`; publisher-stated only). Handles leave `sameAs`. See "Recommended core fields."
