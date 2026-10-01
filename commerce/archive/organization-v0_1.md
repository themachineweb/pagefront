# Commerce Organization Sheet

Status: normative spec. Ratified 2026-08-14 from the v0.1 sketch (archived at [`../archive/commerce-organization-sheet-v0_1-sketch.md`](../archive/commerce-organization-sheet-v0_1-sketch.md)).
Organization Sheet spec version: 0.1
Commerce format version: 0.9
Schema.org version targeted: 30.0 (2026-03-19)

The Commerce Organization Sheet is the Pagefront Sheet that describes the entity *behind* products — the brand that owns them, the company that makes them, the store that sells them — as distinct from the Product Sheet that describes an individual product. It is the dereference target of the `brand` and `Offer.seller` links every Product Sheet already carries.

## Changelog

_This document is at Organization Sheet spec version 0.1 — its first, ratified from the v0.1 sketch — landing in the commerce format 0.9 cut alongside the Product Sheet's companion changes. Sheets carry only the format version (`format_version: "0.9"`); the format version plus the sheet type resolves to this document's version via the cut table (see "Versioning"). All items are additive to the commerce format: existing v0.8 Product Sheets stay valid._

- **New sheet type.** The Commerce Organization Sheet, with its own JSON Schema (`https://themachineweb.org/pagefront/commerce/schemas/organization/v0.9.json`).
- **(schema) `pagefront:commerceRole`.** The sheet's required role discriminator — an array over the closed enum `brand_owner` / `manufacturer` / `seller`. See "Role discriminator."
- **(schema) `pagefront:fulfillmentTerms`.** The org-level home for store-wide shipping defaults, an array of Schema.org-native `OfferShippingDetails`. See "Fulfillment terms."
- **Certification scope value `organization`.** For certifications that attach to the entity rather than to a product. See "Certifications."
- **(schema) (linter) Reference-capable `pagefront:legalEntity`.** The v0.9 product schema makes `organization.name` optional when `@id` is present, so a Product Sheet's legal-entity entry can be a reference stub resolving here; linter rule PDP-W-024 (no postal address) exempts reference stubs, whose address lives on the referenced sheet. See "Legal entities" here and in the Pagefront Spec.
- **(schema) `pagefront:socialAccount`; `sameAs` tightened** *(in-cut amendment, 2026-08-14)*. `sameAs` carries identity authority records only — social profiles are excluded and get a typed home: `pagefront:socialAccount`, an array of `pagefront:SocialAccount` entries (`platform` / `url` / `handle`; publisher-stated only). One coherent move: handles leave `sameAs`. See "Recommended core fields."

## One sheet type, three shapes

There are two commercially distinct entities behind a product: the manufacturer or brand-of-record (the target of Schema.org `Product.brand`) and the retailer or merchant (the target of Schema.org `Offer.seller`). Schema.org already keeps these on separate link targets in every Product Sheet, and they collapse into a single sheet type because the entity's role is a property of the entity, not of the format:

- **DTC** — manufacturer and merchant are one entity playing both roles (Nitto, Kimaï, AFS: the corpus's founding shape).
- **Pure retailer** — a multi-brand seller: the target of `Offer.seller`, never of `Product.brand`.
- **Pure manufacturer** — wholesale, no direct sales: the target of `Product.brand`, with no storefront.

One sheet type carries all three because the sheet MUST declare its role(s) explicitly and all role-specific content is optional and role-scoped. A consumer that dereferenced `Product.brand` can confirm the sheet claims `brand_owner`; one that dereferenced `Offer.seller` can confirm it claims `seller`.

## The envelope

Identical to every Pagefront Sheet. `canonical_url` is the human-facing brand, company, or store page the sheet describes.

```json
{
  "$schema": "https://themachineweb.org/pagefront/commerce/schemas/organization/v0.9.json",
  "format_version": "0.9",
  "schema_org_version": "30.0",
  "canonical_url": "https://www.nittoknitwear.com/pages/atelier",
  "sheet_url": "https://www.nittoknitwear.com/pagefront/commerce/organization/nitto-knitwear.fr.json",
  "generated_at": "2026-08-14T11:00:00Z",
  "expires_at": "2026-08-21T11:00:00Z",
  "data": { "...": "..." }
}
```

Organization data changes slowly. `expires_at` MAY sit days out, unlike a product sheet carrying live price.

## Sheet URL convention

```
/pagefront/commerce/organization/{id}.{lang}.json
```

`{id}` is URL-safe and stable for the life of the resource — the same stability contract as the Product Sheet `{id}`. The organization's domain, a registration number, or a stable slug are all acceptable. The `commerce/` domain segment precedes the resource type for all commerce sheet types (`product`, `organization`, and future `category` / `collection`), so the `/pagefront/` namespace can host non-commerce content types later. Discovery via `Link: rel="describedby"` remains authoritative; the URL convention is a recommendation for predictability.

## data — Schema.org JSON-LD

### Base type and the Brand node

The `data` block roots on Schema.org **`Organization`**. Recognized subtypes are permitted where they fit: `OnlineStore` / `OnlineBusiness` for a retailer, an ordinary `Organization` for a manufacturer.

The brand an entity owns is a nested Schema.org `Brand`, attached via `Organization.brand`. Rooting on `Brand` instead would fail twice over: a brand is a trading name, not a legal entity — the company identity block (legal name, registration, address) belongs to an `Organization`, and conflating the two collapses the trading-name/legal-name distinction real merchants rely on — and a pure retailer is nobody's `Product.brand`, so a `Brand`-rooted sheet type could not describe it at all. Organizations own brands; brands do not own organizations.

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

The `Brand.@id` is the identity Product Sheets point at (see "Linking contract"). Brand-level provenance and maker facts — a brand-wide manufacturing story, a sourcing philosophy — attach to the `Brand` or to the owning `Organization`; per-product manufacturing detail stays on the Product Sheet's `pagefront:manufacturingChain`.

### Required core fields

- `@context`: `"https://schema.org"` (with the `pagefront` prefix mapping where `pagefront:` terms are used)
- `@type`: `"Organization"` (or a recognized subtype)
- `@id`: stable URL-shaped identifier for the organization
- `name`: the organization's name as displayed to humans
- `inLanguage`: BCP 47 tag for the sheet's prose
- `pagefront:commerceRole`: array of one or more role values (see "Role discriminator")

There is no GTIN-equivalent identifier requirement. Brands and companies have no universal product-style ID, so the identifier rule for this sheet type is `@id` + `name` only. A `sameAs` authority record SHOULD be declared where one exists (see below; omission is the normal small-brand case); the registration-identity ladder (see "Company identity") adds machine keys where they exist, but none is required.

### Recommended core fields

- `url`: canonical human page (brand, company, or store)
- `sameAs`: an identity equivalence claim — a reference page that unambiguously indicates the entity's identity. Valid entries are a Wikidata or comparable public-authority record, or another official web property of the same entity. Social profiles are NOT `sameAs` entries — a handle is platform presence, not an identity reference; they belong in `pagefront:socialAccount`. Omission is the normal small-brand case: identity then rests on the publisher's domain, the format's primary trust anchor, and no linter rule may warn on absence.
- `pagefront:socialAccount`: the official social accounts the organization operates, as an array of `pagefront:SocialAccount` entries. Publisher-stated only — entries MUST be accounts the publisher links from its own pages; guessed or searched-up handles are non-conformant. Not automatically contact channels: an account also offered for support additionally appears in `contactPoint`.

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

- `brand_owner` — owns the brand under which products are sold. The entity a `Product.brand` link resolves to.
- `manufacturer` — makes the products.
- `seller` — sells products directly to end customers. The entity an `Offer.seller` link resolves to.

The values reuse the role names minted for `pagefront:legalEntity` rather than a parallel vocabulary, adding `seller`, which the product-scoped legalEntity enum lacks. `licensee`, `importer`, and `authorized_representative` remain legalEntity-only: they are per-product compliance declarations, not organization-scope roles. Additional values require a spec amendment.

Each declared role SHOULD have its corresponding content present — a `brand_owner` SHOULD carry a `Brand` node, a `seller` SHOULD carry the seller block — and content SHOULD NOT appear without its role declared. The organization rule catalogue enforces both directions: ORG-W-001/ORG-W-002 warn on a declared role with no backing content, ORG-W-003/ORG-W-004 on the inverse (see `rules.md`, "Commerce Organization Sheet rules").

## Cardinality — one sheet per brand

Each **Brand** gets exactly one Commerce Organization Sheet, keyed by the Brand's `@id` and located at the brand's own `canonical_url`. A company that owns several brands emits one sheet per brand, not one sheet listing them all. This keeps `Product.brand.@id` → sheet resolution deterministic: a brand identity resolves to exactly one sheet, never to "the sheet that happens to contain this brand among several."

A **private-label brand with no domain of its own** anchors on the owner's storefront: its sheet lives under the owner's domain (its `canonical_url` the brand's page there, its `Brand.@id` minted on that domain), because that storefront is the only web presence the brand has. The sheet is still one-sheet-per-brand — anchoring changes where the sheet lives, not how many there are.

The owning `Organization` — shared company identity: legal entity, address, founding — repeats across that company's brand sheets, carrying the same `Organization.@id` in each, so consumers deduplicate the company by identity while keeping brands distinct. An entity playing only the `seller` role with no owned brand gets one sheet keyed by the `Organization.@id`. The DTC single-brand case stays one sheet: one entity, both roles, one brand.

A multi-brand company that sells all its brands through one storefront emits a **separate seller sheet**: its own Commerce Organization Sheet with `commerceRole: ["seller"]`, keyed by the store's `Organization.@id`. The brand sheets stay brand-only; each brand's products reference the store via `Offer.seller`. Store-wide terms are stated once, on the store's sheet — the same de-duplication the return-policy move buys at product level, applied one level up.

On brand rename, the `Brand.@id` is held and `name` updated, matching the Product `{id}` stability contract.

## Role-scoped content

### Company identity (any role)

Schema.org-native `Organization` fields, populated when the page supports them: `legalName`, `foundingDate`, `foundingLocation`, `founder`, `address` (a `PostalAddress`), `contactPoint`, `email`, `numberOfEmployees`, `parentOrganization` / `subOrganization` for ownership structure, `hasCertification` (see "Certifications"), and `vatID` where applicable.

#### Company registration identity

Schema.org has no dedicated property for a company registration number and its register, and machine-key coverage of national registers is uneven. A Commerce Organization Sheet therefore carries registration identity as a **ladder** of machine keys plus a display form, every rung conditional on the data existing:

- `leiCode`, when the entity has an LEI (ISO 17442; native Schema.org). Global and register-independent; common for large or listed entities.
- `iso6523Code`, where the national register has an ISO 6523 ICD — an ICD prefix plus the register number (e.g. `"0002:808641435"` for a French SIREN; SIRENE is ICD 0002). Coverage is uneven: the German Handelsregister has no ICD, and US state corporate registries have none.
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

1. When more than one is present, authority order is `leiCode`, then `iso6523Code`, then `identifier`. The display form is presentation, never the identity key.
2. The ladder has a **floor**: every rung is conditional on the data existing. A typical private US company has no LEI, no ISO 6523-covered register (US incorporation is state-level), and publishes no registration number at all — `legalName` plus an address alone is a complete, conformant registration declaration. The US d/b/a construct maps onto the existing `name`/`legalName` split.
3. No linter rule may warn on absent registration identifiers. Absence is jurisdiction-dependent, not a quality signal. (Present but malformed machine keys are a different matter: ORG-W-005 warns when an `iso6523Code` or `leiCode` value does not match its shape.)
4. Jurisdiction of incorporation gets no field of its own. Where the publisher states it, it rides inside the display-form `identifier` value; Schema.org offers nothing better.
5. Publisher-stated only: registry-verifiable facts absent from the publisher's own pages — a US company's state of incorporation known only from court or registry records, say — MUST NOT be added to the sheet. The sheet is the publisher's authoritative statement, not an enriched dossier.

No `pagefront:` term is minted; this is normative guidance over Schema.org-native properties.

### Brand-owner block (`brand_owner`)

The nested `Brand` node attached via `Organization.brand`, as in "Base type and the Brand node" above.

### Seller block (`seller`)

Store-wide commercial terms an agent needs to reason about *before* it reaches a specific offer:

- the store-wide return / exchange policy — `hasMerchantReturnPolicy` (see "Return policy")
- the store-wide shipping terms — `pagefront:fulfillmentTerms` (see "Fulfillment terms")
- `paymentAccepted`
- physical locations (`location` / `Place`)
- seller reputation (`aggregateRating`, where the publisher asserts it)

A retailer's sheet does not enumerate the brands it carries; see "What this spec does not address."

### Return policy

A store's return policy is a property of the store, not of each product. It lives here, on the seller block, as `hasMerchantReturnPolicy` — the **store-wide default**, stated once rather than restated on every Product Sheet where it duplicates and drifts.

Product-specific policies survive as overrides: a Product Sheet carries return terms only when the product deviates from the store default — final-sale items, and made-to-order products whose returns exceptions live in `pagefront:madeToOrderTerms` and stay there. The resolution rule for consumers: read the product's own return terms if present, otherwise follow `Offer.seller` (`@id`) to the seller's sheet and use its store-wide policy.

The cost, stated once and accepted: this is the format's one semantic cross-sheet dependency. "Can I return this product" is not answerable from the Product Sheet alone when the product is silent — the consumer must also fetch the seller sheet. The read rides the *existing* `Offer.seller` edge and stays `@id`-keyed, so it adds no graph structure, but it is the deliberate exception to each-sheet-is-self-contained. It is scoped to return and shipping terms and MUST NOT be generalized to other fields.

### Fulfillment terms

Store-wide shipping follows the same default-plus-override pattern as returns, via `pagefront:fulfillmentTerms` on the seller block: an array of Schema.org-native `OfferShippingDetails` objects carrying the store's shipping defaults — destinations, rates, and delivery timeframes, with free-shipping thresholds via the existing `pagefront:appliesWhen` / `pagefront:PricingCondition` machinery, exactly as on an Offer.

The term is composition over inheritance: Schema.org scopes `OfferShippingDetails` to the Offer, so the Pagefront term is only the org-level attachment point Schema.org lacks — the payload stays plain Schema.org, and no parallel shipping vocabulary is minted. An Offer carries `shippingDetails` only when the product deviates from the store defaults (bulky items with their own rates, made-to-order lead times), with the same product-else-seller resolution as returns.

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

Warranty does not participate: the terms of a product's included warranty stay per-product (a `pagefront:document` entry with `role: "warranty"`); an org-level home for store-wide warranty terms is tracked pending a worked example.

## Certifications

Certifications reuse the Product Sheet pattern: Schema.org `hasCertification` with a `scope` `PropertyValue`. Org-level certifications — B-Corp, ISO 14001, company-wide Fair Trade — carry the scope value **`organization`**: the certification attaches to the entity rather than to a product.

The boundary is strict in both directions. Product- and material-scoped certifications (`yarn`, `fabric`, `diamond`, `finished_product`, and the rest) never migrate to the organization sheet — a yarn certification is a fact about a product's yarn and belongs on the Product Sheet even when every product in the catalog carries it — and an entity-level certification is not restated on each Product Sheet.

## Legal entities — reference or inline

`pagefront:legalEntity` on the Product Sheet (role-typed accountable entities) partially overlaps this sheet. The overlap is real for `brand_owner` and `manufacturer` — stable, catalog-wide facts a Commerce Organization Sheet already states — and not real for the rest. The relationship is reference-capable, not replacement:

- When a `legalEntity` entry's organization *has* a Commerce Organization Sheet — typically the `brand_owner`, sometimes the `manufacturer` — the Product Sheet SHOULD express it as a reference stub rather than restating name and address:

```json
{
  "@type": "pagefront:LegalEntity",
  "role": "brand_owner",
  "organization": { "@type": "Organization", "@id": "https://www.nittoknitwear.com/#org" }
}
```

  The `@id` resolves to the organization sheet the same identity way as `Product.brand` and `Offer.seller`, removing the drift-prone duplication of stable org data across every product. As facts of the v0.9 cut: the product schema accepts the stub form (`organization.name` is optional when `@id` is present), and linter rule PDP-W-024 — the no-postal-address warning — exempts reference stubs, whose address lives on the referenced sheet.

- When the entity is a third party with no sheet (`authorized_representative`, `importer` — the GPSR responsible person, the importer of record), or varies by product or market, it stays fully inline with name and address. There is nothing to reference, and GPSR Art. 19 wants the responsible entity resolvable at the listing itself; compliance-grade data does not move off the product.

`legalEntity` is therefore not redundant with this sheet and is not folded into it: `authorized_representative` and `importer` are per-product, per-market facts about third parties, and `manufacturer` ≠ `brand_owner` for licensed goods — the manufacturing licensee is named only at the product. Mechanically, a Schema.org `Organization` reduced to `@type` + `@id` is already a reference stub, and the linter's existing stub-vs-inline distinction (PDP-E-001 / PDP-W-020) applies unchanged. A `brand_owner` or `manufacturer` stub SHOULD resolve to a sheet declaring the matching `commerceRole`.

## Linking contract (identity only)

The whole cross-sheet story is identity resolution by exact-string `@id` match, not structured traversal:

- `Product.brand.@id` resolves to the `Brand` node inside a Commerce Organization Sheet whose `commerceRole` includes `brand_owner`.
- `Offer.seller.@id` resolves to the top-level `Organization` `@id` of a Commerce Organization Sheet whose `commerceRole` includes `seller`.

A consumer holding a Product Sheet can dereference either link, fetch the organization sheet, and confirm the role. Nothing points *down*: the organization sheet does not list its products or its carried brands. The graph closes on the identifiers products already emit.

One semantic read travels this edge beyond identity confirmation: return- and shipping-policy resolution (product-else-seller) walks the `Offer.seller` link when a product is silent. It reuses the existing edge and stays `@id`-keyed — no new structure — and is the one accepted exception to self-containment (see "Return policy").

## Worked examples

- **DTC, all three roles**: the Nitto organization sheet ([`../case-studies/nitto/nitto-organization-v0_9.json`](../case-studies/nitto/nitto-organization-v0_9.json)) — MBTJM SAS behind the Nitto Knitwear brand, with the full ten-entry `pagefront:fulfillmentTerms` store policy, the store return policy, and registration identity on the `iso6523Code` rung plus the RCS display form.
- **Seller-only**: the Zalando organization sheet ([`../case-studies/zalando/zalando-organization-v0_9.json`](../case-studies/zalando/zalando-organization-v0_9.json)) — a pure-retailer sheet with `commerceRole: ["seller"]`, registration identity on the `leiCode` rung (`529900YRFFGH5AXU4S86`) plus the Handelsregister display form, that register having no ISO 6523 ICD.
- **Private-label brand sheet**: the Friboo sheet ([`../case-studies/zalando/zalando-friboo-organization-v0_9.json`](../case-studies/zalando/zalando-friboo-organization-v0_9.json)) — a brand with no domain of its own, anchored on the owner's storefront per the cardinality rule.

## What this spec does not address

- **Catalog and carried-brand enumeration.** No `hasPart`, no product list, no brand list on the organization sheet. "What does this store sell" is a catalog-enumeration query; it belongs to the deferred catalog work (Pagefront Spec open question #11), which also carries the freshness burden a maintained list would impose here.
- **Policy inheritance beyond return and shipping.** Return and shipping inheritance is in scope (default + override, above). Broader inheritance of arbitrary fields from org to product is not — org-level and product-level statements are otherwise independent.
- **Ownership and governance beyond Schema.org.** `parentOrganization` / `subOrganization` and `ownershipFundingInfo` cover the common cases. A typed `pagefront:` ownership-structure extension (independent / PE-owned / public / cooperative) is a candidate only if real consumer demand surfaces.
- **Marketplace partner-seller modeling.** A marketplace listing where a third-party partner is the `Offer.seller` needs no new vocabulary — the partner is simply another organization, referenced by `@id` like any seller and eligible for its own sheet — but no case study has exercised the shape yet; the gap is noted, not a design question.

## Versioning

Versioning is two-level. The commerce **format** version (0.9) is the wire number: envelopes' `format_version`, schema URLs, and cross-sheet contracts are cut against it, and consumers see only it. Each subspec document additionally carries its own **document** version tracking that document's revision history — this one is at 0.1. A format cut is a named set of subspec versions; the current cut is commerce 0.9 = Product Sheet spec 0.9 + Organization Sheet spec 0.1 + vocabulary 0.9 (the rule catalogue keeps its own independent semver). A subspec bumps only when its own normative content changes; the format bumps when any subspec changes within a coordinated cut. Sheets never carry a subspec version — `format_version` plus the sheet type resolves to the governing subspec version via the cut table in the vocabulary's "Versioning and stability."

The commerce format 0.9 cut lands, for this sheet type and its Product Sheet companions: `pagefront:commerceRole`, `pagefront:fulfillmentTerms`, `pagefront:socialAccount` with the `sameAs` tightening (an in-cut amendment, permitted in the pre-1.0 draft phase), the `organization` certification scope value, the product-schema relaxation making `legalEntity` `organization.name` optional when `@id` is present, and the PDP-W-024 exemption for reference stubs. All are additive within the major version — no term renamed or removed — and existing v0.8 sheets stay valid. `pagefront:commerceRole`, `pagefront:fulfillmentTerms`, and `pagefront:socialAccount` are permanent identifiers within this major version, under the Pagefront Vocabulary's versioning-and-stability rules.

## References

- Organization schema: `https://themachineweb.org/pagefront/commerce/schemas/organization/v0.9.json` (source: [`organization.json`](organization.json))
- Pagefront Spec (Product Sheet): [`product.md`](product.md)
- Pagefront Vocabulary: [`vocabulary.md`](vocabulary.md)
- Schema.org vocabulary: `https://schema.org/`
