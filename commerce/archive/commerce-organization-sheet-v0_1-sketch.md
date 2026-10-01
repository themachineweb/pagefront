# Commerce Organization Sheet — v0.1 Sketch

Status: draft / sketch, not yet a spec.
Targets: commerce format version 0.9 (additive — new `pagefront:commerceRole` term; see Versioning).
Schema.org version targeted: 30.0.

The Commerce Organization Sheet is the Pagefront Sheet that describes the entity *behind* products — the brand that owns them, the company that makes them, the store that sells them — as distinct from the Product Sheet that describes an individual product. It is the dereference target of the `brand` and `Offer.seller` links every Product Sheet already carries.

## Why one sheet type for two things

There are two commercially distinct entities behind a product: the **manufacturer / brand-of-record** (the target of Schema.org `Product.brand`) and the **retailer / merchant** (the target of Schema.org `Offer.seller`). Schema.org already keeps these on separate link targets in every Product Sheet.

They collapse into a single sheet type because the entity's role is a property of the entity, not of the format:

- **DTC** (Nitto, Kimaï, AFS) — manufacturer and merchant are one entity playing both roles. The whole existing case-study set is this shape.
- **Pure retailer** — a multi-brand seller. Target of `Offer.seller`, never of `Product.brand`.
- **Pure manufacturer** — wholesale, no direct sales. Target of `Product.brand`, no storefront.

One sheet type carries all three, provided the entity **declares its role(s) explicitly** and the role-specific content is optional and role-scoped. A consumer that dereferenced `Product.brand` can confirm the sheet claims `brand_owner`; one that dereferenced `Offer.seller` can confirm it claims `seller`.

## Sheet URL

```
/pagefront/commerce/organization/{id}.{lang}.json
```

`{id}` is URL-safe and stable for the life of the resource (same stability contract as the Product Sheet `{id}`). The organization's domain, a registration number, or a stable slug are all acceptable. Discovery via `Link: rel="describedby"` remains authoritative; the URL convention is a recommendation.

> **Convention change — commerce-wide.** A `commerce/` domain segment now sits ahead of the resource type for **all** commerce sheet types, not just this one. The Product Sheet convention migrates in parallel: `/pagefront/commerce/product/{id}`, and likewise for future `category` / `collection` types. Because discovery is authoritative via the `Link` header, this is not a wire-breaking change; publishers migrate URL shapes and update their `Link` targets. The Product Sheet spec's "Sheet URL convention" section needs the matching edit.

## Envelope

Identical to every Pagefront Sheet. `canonical_url` is the human-facing brand / company / store page the sheet describes.

```json
{
  "$schema": "https://themachineweb.org/pagefront/commerce/schemas/organization/v0.9.json",
  "format_version": "0.9",
  "schema_org_version": "30.0",
  "canonical_url": "https://www.nittoknitwear.com/pages/about",
  "sheet_url": "https://www.nittoknitwear.com/pagefront/commerce/organization/nitto-knitwear.json",
  "generated_at": "2026-08-12T10:00:00Z",
  "expires_at": "2026-08-19T10:00:00Z",
  "data": { ... }
}
```

Organization data changes slowly; `expires_at` can sit days out, unlike a product sheet carrying live price.

## Base type

The `data` block roots on Schema.org **`Organization`** — general enough to carry any role. Recognized subtypes are permitted where they fit: `OnlineStore` / `OnlineBusiness` for a retailer, an ordinary `Organization` for a manufacturer.

The **brand** an entity owns is a nested Schema.org `Brand` attached via `Organization.brand`. This is the Schema.org-correct direction (organizations own brands; brands do not own organizations) and it produces the identity the Product Sheet needs (see Linking contract).

- A brand-owner sheet is *"an Organization that owns a Brand."*
- A retailer sheet is *"an Organization that sells."*
- A DTC sheet is both, on one node.

### Cardinality — one sheet per brand

Each **Brand** gets exactly one Commerce Organization Sheet, keyed by the Brand's `@id` and located at the brand's own `canonical_url`. A company that owns several brands emits one sheet per brand, not one sheet listing them all. This keeps `Product.brand.@id` → sheet resolution deterministic: a brand identity resolves to exactly one sheet, never to "the sheet that happens to contain this brand among several."

The owning `Organization` (shared company identity — legal entity, address, founding) repeats across that company's brand sheets, carrying the same `Organization.@id` in each so consumers dedup by identity. An entity playing only the `seller` role with no owned brand gets one sheet keyed by the `Organization.@id`. The DTC single-brand case stays one sheet: one entity, both roles, one brand.

A multi-brand company that sells all its brands through one storefront gets a **separate seller sheet**: its own Commerce Organization Sheet with `commerceRole: ["seller"]`, keyed by the store's `Organization.@id`. The brand sheets stay brand-only; each brand's products reference the store via `Offer.seller`. Store-wide terms are stated once, on the store's sheet — the same de-duplication the return-policy move buys at product level, applied one level up.

### Required core fields

- `@context`: `"https://schema.org"`
- `@type`: `"Organization"` (or a recognized subtype)
- `@id`: stable URL-shaped identifier for the organization
- `name`: the organization's name as displayed to humans
- `inLanguage`: BCP 47 tag for the sheet's prose
- `pagefront:commerceRole`: array of one or more role values (see below)

There is **no GTIN-equivalent identifier requirement.** Brands and companies have no universal product-style ID, so the identifier rule for this sheet is `@id` + `name` only. `sameAs` is strongly recommended for disambiguation.

### Recommended core fields

- `url`: canonical human page (brand / company / store)
- `sameAs`: array of disambiguating authorities — Wikidata entity, official domain, verified social profiles. This is how a consumer distinguishes this "Nitto" from any other.
- `logo`, `description`, `slogan`
- `brand`: the `Brand` node, when `commerceRole` includes `brand_owner` (see Brand-owner block)

## Role discriminator — `pagefront:commerceRole`

Explicit, required, array-valued. Reuses the role names already minted for `pagefront:legalEntity` rather than inventing a parallel vocabulary, adding `seller` (which the product-scoped legalEntity enum lacks).

Closed enum (v0.9):

- `brand_owner` — owns the brand under which products are sold. The entity a `Product.brand` link resolves to.
- `manufacturer` — makes the products.
- `seller` — sells products directly to end customers. The entity an `Offer.seller` link resolves to.

`licensee`, `importer`, and `authorized_representative` remain defined on `pagefront:legalEntity` for per-product compliance declarations; they are not org-scope roles and are not part of this enum. Additional values require a spec amendment.

Each declared role SHOULD have its corresponding block present (a `brand_owner` SHOULD carry a `Brand`; a `seller` SHOULD carry the seller block). The linter should warn on a declared role with no backing content, and on backing content with no declared role.

## Role-scoped content

### Shared block (any role) — company identity

Schema.org-native `Organization` fields, populated when the page supports them:

- `legalName`, `foundingDate`, `foundingLocation`, `founder`
- `address` (`PostalAddress`), `contactPoint`, `email`
- `numberOfEmployees`
- `parentOrganization` / `subOrganization` for ownership structure
- `hasCertification` (see Certifications)
- `vatID`, where applicable
- **Company registration identity**, as a ladder of machine keys plus a display form. Schema.org has no dedicated registration-number property, and machine-key coverage of national registers is uneven:
  - `leiCode` when the entity has an LEI (native Schema.org, ISO 17442, global; common for large or listed entities);
  - `iso6523Code` where the national register has an ISO 6523 ICD (e.g. `"0002:808641435"` for a French SIREN — SIRENE is ICD 0002). Coverage is uneven: the German Handelsregister has no ICD; US state corporate registries have none;
  - alongside whichever machine keys exist, always a generic `identifier` `PropertyValue` carrying the jurisdiction-flavored display form (e.g. `{"propertyID": "RCS", "value": "808 641 435 R.C.S. Nanterre"}`, `{"propertyID": "Handelsregister", "value": "HRB 158855 B, Amtsgericht Charlottenburg Berlin"}`). The sheet is for machines, but consumers present results to humans; the display form carries the register court a local reader recognizes.

  Normative rules:

  1. Authority order when multiple are present: `leiCode`, then `iso6523Code`, then `identifier`. The display form is presentation, never the identity key.
  2. The ladder has a **floor**: every rung is conditional on the data existing. A typical private US company has no LEI, no ISO 6523-covered register, and publishes no registration number — `legalName` + `address` alone is a complete, conformant declaration. The US d/b/a construct maps to the existing `name`/`legalName` split (observed three-for-three: MBTJM/Nitto, Zalando SE/Zalando, LYMI/Reformation).
  3. No linter rule may warn on absent registration identifiers; absence is jurisdiction-dependent, not a quality signal.
  4. Jurisdiction of incorporation gets no field; where publisher-stated it rides inside the display-form `identifier` value.
  5. Publisher-stated only: registry-verifiable facts absent from the publisher's own pages (e.g. a US state of incorporation known only from court records) MUST NOT be added. The sheet is the publisher's authoritative statement, not an enriched dossier.

  No `pagefront:` term is minted; this is normative guidance over Schema.org-native properties. Worked examples across the rungs: Nitto (`iso6523Code` + RCS display form — the corpus artifact, [`../case-studies/nitto/nitto-organization-v0_9.json`](../case-studies/nitto/nitto-organization-v0_9.json)), Zalando SE (`leiCode` `529900YRFFGH5AXU4S86` + Handelsregister display form; that register has no ICD), Reformation (LYMI Inc. — the floor case: `legalName` and address only).

### Brand-owner block (`brand_owner`)

The nested `Brand` node, attached via `Organization.brand`:

```json
"brand": {
  "@type": "Brand",
  "@id": "https://www.nittoknitwear.com/#brand",
  "name": "Nitto Knitwear",
  "logo": "https://www.nittoknitwear.com/logo.svg",
  "slogan": "Knitwear made in France",
  "sameAs": ["https://www.wikidata.org/wiki/…"]
}
```

The `Brand.@id` is the identity Product Sheets point at. Brand-level provenance and maker facts (a brand-wide manufacturing story, sourcing philosophy) attach here or to the owning Organization; per-product manufacturing detail stays on the Product Sheet's `pagefront:manufacturingChain`.

### Seller block (`seller`)

Store-wide commercial terms an agent needs to reason about *before* it reaches a specific offer:

- Store-wide return / exchange policy — `hasMerchantReturnPolicy` (see "Return policy" below; this is its new home)
- Store-wide shipping / fulfillment terms
- `paymentAccepted`
- Physical locations (`location` / `Place`)
- Seller reputation (`aggregateRating`, where the publisher asserts it)

A retailer's sheet **does not enumerate the brands it carries.** "What does this store sell" is a catalog-enumeration query; it collides with the deferred cross-sheet reference question and the freshness burden of a maintained list. Deferred to the catalog/collection work, out of scope here.

### Return policy — moved off the Product Sheet

A store's return policy is a property of the store, not of each product. Duplicating `hasMerchantReturnPolicy` onto every Product Sheet is redundant and drifts out of sync. It moves to the `seller` block here as the **store-wide default**.

The refinement on a literal "move it": product-specific policies still exist and must survive — final-sale items, and Kimaï's made-to-order rings that are non-returnable with named exceptions. So the model is **default + override**, not org-only:

- The `seller` block carries the store-wide `hasMerchantReturnPolicy`.
- A Product Sheet drops `hasMerchantReturnPolicy` as a routine field. It carries return terms **only when the product deviates** from the store default (final sale, made-to-order). The made-to-order returns exceptions already live in `pagefront:madeToOrderTerms` and stay there.
- Resolution: a consumer answering "can I return this product" reads the product's own return terms if present, else the seller sheet's default.

The cost, accepted: this is the **first semantic cross-sheet dependency** in the format. "Can I return this product" is no longer answerable from the Product Sheet alone when the product is silent — the consumer must also fetch the seller sheet. The read is upward along the *existing* `Offer.seller` edge (no new edge type, still `@id`-keyed), so it doesn't add graph structure, but it does cross the "each sheet is self-contained" principle for this one question. This tradeoff is a settled decision, not an open item; it is the deliberate exception to self-containment, scoped to return/shipping/warranty and not generalized.

Shipping and warranty terms follow the same default-plus-override pattern by analogy; return policy is the one explicitly decided here.

## Certifications

Reuse the Product Sheet pattern: Schema.org `hasCertification` with a `scope` `PropertyValue`. The existing scope vocabulary (`yarn`, `fabric`, `diamond`, `finished_product`) is all product-level; org-level certifications (B-Corp, ISO 14001, company-wide Fair Trade) need a new scope value: **`organization`**, for certifications that attach to the entity rather than to a product. Small amendment to an existing convention, flagged for the vocabulary doc.

## Linking contract (identity only)

This is the whole cross-sheet story for v0.1, and it stays inside the "URL references now, structured cross-sheet relationships are v1.0" line — it is identity resolution by `@id` match, not structured traversal:

- `Product.brand.@id` resolves to the `Brand` node inside a Commerce Organization Sheet whose `commerceRole` includes `brand_owner`.
- `Offer.seller.@id` resolves to the top-level `Organization` `@id` of a Commerce Organization Sheet whose `commerceRole` includes `seller`.

A consumer that already holds a Product Sheet can dereference either link, fetch the organization sheet, and confirm the role. Nothing points *down*: the organization sheet does not list its products or its carried brands. The graph closes on the identifiers products already emit.

One semantic read now travels this edge, not just identity confirmation: return-policy resolution (product-else-seller) walks the `Offer.seller` link when a product is silent. It reuses the existing edge and stays `@id`-keyed — no new structure — and is the one accepted exception to self-containment (see "Return policy").

## Legal entities — reference or inline

`pagefront:legalEntity` on the Product Sheet (role-typed accountable entities: `brand_owner`, `licensee`, `authorized_representative`, `importer`, `manufacturer`) partially overlaps this sheet. The overlap is real for `brand_owner` and `manufacturer` — stable, catalog-wide facts that a Commerce Organization Sheet already states. It is not real for the rest.

The relationship is **reference-capable, not replacement**:

- When a `legalEntity` entry's organization *has* a Commerce Organization Sheet — typically the `brand_owner`, sometimes the `manufacturer` — the Product Sheet SHOULD express it as a reference stub rather than restating name and address:

  ```json
  { "@type": "pagefront:LegalEntity", "role": "brand_owner",
    "organization": { "@type": "Organization", "@id": "https://www.nittoknitwear.com/#org" } }
  ```

  The `@id` resolves to the organization sheet the same identity way as `Product.brand` and `Offer.seller`. This removes the drift-prone duplication of stable org data across every product.

- When the entity is a third party with no sheet (`authorized_representative`, `importer` — the GPSR responsible person, the importer of record) or varies by product/market, it stays **fully inline** with name and address. There is nothing to reference, and GPSR Art. 19 wants the responsible entity resolvable at the listing itself. Compliance-grade data does not move off the product.

This is why `legalEntity` is not redundant with this sheet and is not folded into it: `authorized_representative` and `importer` are per-product, per-market facts about third parties, and `manufacturer` ≠ `brand_owner` for licensed goods — the manufacturing licensee is named only at the product.

Mechanically this needs no new machinery: a Schema.org `Organization` reduced to `@type` + `@id` is already a reference stub, and the linter's existing stub-vs-inline distinction (E-001 / W-020) applies unchanged. The spec change is guidance on *when* to reference versus inline, plus a linter note that a `brand_owner`/`manufacturer` stub SHOULD resolve to a sheet declaring the matching `commerceRole`.

## What v0.1 deliberately does not address

- **Catalog / carried-brand enumeration.** No `hasPart`, no product list, no brand list on the organization sheet. Belongs to the deferred catalog work (open question #11).
- **Policy inheritance beyond return/shipping/warranty.** Return policy inheritance is now *in* scope (default + override, above); shipping and warranty follow by analogy. Any broader inheritance of arbitrary fields from org to product is not — org-level and product-level statements are otherwise independent.
- **Ownership/governance beyond Schema.org.** `parentOrganization`/`subOrganization` and `ownershipFundingInfo` cover the common cases. A typed `pagefront:` ownership-structure extension (independent / PE-owned / public / cooperative) is a candidate only if real consumer demand surfaces.

## Versioning

Adds one new closed-enum term (`pagefront:commerceRole`) and one new scope value (`company`). Under the vocabulary's additive-within-major-version rule, this is a minor bump to commerce format version **0.9**. No breaking changes to Product Sheets. Existing v0.8 sheets remain valid; the new sheet type is purely additive.

## Decisions locked

- URL convention: `/pagefront/commerce/{type}/{id}` across all commerce sheet types, including Product.
- Cardinality: one sheet per brand.
- Certification scope value: `organization`.
- Return policy: store-wide default on the seller block, per-product override retained; removed as a routine Product Sheet field. Consumer resolves product-else-seller — the accepted first semantic cross-sheet read, scoped to return/shipping/warranty.
- Multi-brand shared storefront: a separate seller sheet for the store, keyed by the store's `Organization.@id`; brand sheets stay brand-only; products reference the store via `Offer.seller`.
- `Brand.@id` stability: on rename the `@id` is held and `name` updated, matching the Product `{id}` stability contract.
- `pagefront:legalEntity` is reference-capable, not replaced: reference the org sheet by `@id` when the entity has one (`brand_owner`/`manufacturer`); stay inline for third-party or market-specific entities (`authorized_representative`/`importer`).

## Open questions

None blocking. Remaining work is the companion spec edits below and worked examples.

## Companion changes to the Product Sheet spec

This sketch implies edits to `commerce/spec/product.md`, not just a new document:

1. Migrate the Sheet URL convention to `/pagefront/commerce/product/{id}`.
2. Remove `hasMerchantReturnPolicy` as a routine field; document it as a per-product override of the seller sheet's store-wide default, with the resolution rule.
3. Document `pagefront:legalEntity` as reference-capable: reference the org sheet by `@id` for `brand_owner`/`manufacturer` when a sheet exists, inline otherwise — with the when-to-reference guidance and the `commerceRole`-match linter note.
```
