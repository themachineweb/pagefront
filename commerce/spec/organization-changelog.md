# Changelog: Organization Sheet spec

The history of [`organization.md`](organization.md). Changes land under "Unreleased" and are versioned at the next release, when the heading becomes `### <version> — <date>`; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

_Entries dated before 2026-10-01 were written under the legacy scheme, in which sheets carried `format_version: "0.9"`. Each of them is additive._

### Unreleased

- **Editorial: the changelog moves to this file.** `organization.md` keeps a one-line Changelog section that points here; the entries are unchanged.
- **Editorial: the document becomes a field reference; its rationale moves to design notes.** Every section is restyled into one entry per field, with its meaning, shape, source and linter check, and the reasoning behind the fields moves verbatim to [`organization-notes.md`](organization-notes.md), non-normative, one note per heading, each linked from the field it explains with a `why` link; the site renders the notes as footnotes under the spec. The version history under "Versioning" and the ratification clause of the status line move to the notes as well; the reference keeps an example only where a shape is hard to picture. Every heading, every requirement, every rule ID and every anchor the rule catalogue, the linter and the Product Sheet spec link are kept. No rule, field, shape or source changes; no schema change. The notes carry this document's version line and log their changes here.
- **Editorial: case-study sheet links.** The worked examples link the case-study sheets under their new filenames, which follow the recommended `{id}.{lang}.json` shape (`nitto-knitwear.fr.json`, `zalando.de.json`, `friboo.de.json`); the files carried a `-v0_9` suffix from the legacy format line.

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
