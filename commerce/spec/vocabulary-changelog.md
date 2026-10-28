# Changelog: Pagefront Vocabulary

The history of [`vocabulary.md`](vocabulary.md). Changes land under "Unreleased" and are versioned at the next release, when the heading becomes `### <version> — <date>`; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

### Unreleased

- **Editorial: the changelog moves to this file.** `vocabulary.md` keeps a one-line Changelog section that points here; the entries are unchanged.
- **Editorial: link to the Product Sheet design notes.** The relationships paragraph pointed at the Product Sheet spec's open design questions; those moved to [`product-notes.md`](product-notes.md), and the link now names the note. No term changes.
- **Editorial: case-study sheet link.** The registration-identity paragraph links the Nitto organization sheet under its new filename, `nitto-knitwear.fr.json`; the file carried a `-v0_9` suffix from the legacy format line.
- **Fix: `collectionKind` in the context block.** The 0.5.0 entry said the JSON-LD context block gains its `collectionKind` mapping at the release. The mapping was missing and is added.
- **Editorial: no context file.** The two sentences saying a context file is available at `https://themachineweb.org/pagefront/vocabulary/context.jsonld` are removed; that address was never served, and no sheet or consumer in the corpus references it. The context is the block under "JSON-LD Context". Serving the vocabulary namespace, the term IRIs and a context file together, is future work.
- **Clarification: the `collection` kind.** The enum entry says the kind covers sets assembled by hand and that a set filled by a rule has no sheet, following the amendment to [`collection.md`](collection.md). No term changes.

### 0.5.0 — 2026-10-18

The vocabulary of commerce release 0.5.0. One term is added, `pagefront:collectionKind`, with the Commerce Collection Sheet; nothing is renamed or removed.

- **Editorial: traversal-hint pointers.** The notes on `pagefront:sheetUrl` and `pagefront:availableLanguages` point at "Traversal hints" in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md)), where the rule now lives.
Changes land here and are versioned at the next release; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

- **Addition (release 0.5.0): `pagefront:collectionKind`.** Minted with the Commerce Collection Sheet ([`collection.md`](collection.md)): the kind discriminator on that sheet's `Collection` data block and on `Collection` member entries, with the closed Collection kinds enum `category`, `collection`, `brand` (see "Enumerated values"). `pagefront:sheetUrl` extends to collection references: the member entries of `hasPart`, `isPartOf` and `hasOfferCatalog`, checked against the referencing sheet's canonical host, and the `brand` reference of a brand collection, checked under the brand edge. No other term changes; the JSON-LD context block gains its `collectionKind` mapping at the release.
- **Clarification: `pagefront:availableLanguages` is the language-variant mechanism.** `hreflang` is removed from the discovery link in the Pagefront Spec, and the property's entry says a publisher with more than one language variant of a sheet SHOULD declare it. The fallback path for a stale entry is the sibling's own page and the sheet it declares with `alternate`. Shape and values are unchanged.
- **Clarification: traversal hints.** `pagefront:sheetUrl` and the `url` of each `pagefront:availableLanguages` entry are traversal hints that MAY be stale. A consumer MUST be able to reach the target through its page, SHOULD treat the hint as an optimisation over that path, and MUST NOT cache a sheet URL across the page's changes. The general rule is stated under "Traversal hints" in the Pagefront Spec; the two term entries refer to it. No term is added, renamed or removed.

### 0.4.0 — 2026-10-02

The vocabulary of commerce release 0.4.0. No term is added, renamed or removed. The release makes `$schema` required on sheets carrying `release`, in the Product Sheet spec (0.10.0) and the Organization Sheet spec (0.4.0), and requires the pairs of a configurator's `exclusions` and of an adjustment's `when` to resolve to a declared dimension and option. The vocabulary takes the release version.

### 2026-10-01 — Versioning scheme replaced

Each sheet spec now has its own semver, and a commerce release bundles the sheet specs and this vocabulary; the scheme and the release table are in [`releases.md`](releases.md). In the sheet envelope `release` replaces `format_version` (breaking, release 0.3.0), and `$schema` names the sheet-spec version. Sheets carrying `format_version` form the legacy draft line and stay valid against the legacy schemas. Breaking changes follow semver; the "held for 1.0" rule and the "Path to 1.0" plan are withdrawn, and the stability policy applies from release 1.0.0. This document is vocabulary 0.3.0. No term changes.

### 2026-10-01 — One amount carrier per Sheet

Replaces the amount typing of the entry below: `basePrice`, modifiers and adjustment amounts in `pagefront:ConfiguratorPricing` are amounts, each a JSON number or a decimal string, and a Sheet uses one carrier for all its amounts. No term changes.

### 2026-10-01 — Numeric configurator amounts, note register, size-system consistency

Second addendum to the configurator pricing change of the same date. `basePrice`, modifiers and adjustment amounts in `pagefront:ConfiguratorPricing` are JSON numbers; they were decimal strings in the first text of that date. A dimension's `note` is defined as a third-person factual statement and an option's `description` as the label a buyer sees. Sizing dimensions follow their system's notation in place of the identifier form. On `pagefront:SizeRecommendation`, `sizeAdjustment.sizeSystem` MUST match the system of the Sheet's sizing dimension, and advice stated in another system stays in `description`. No term is added, renamed or removed.

### 2026-10-01 — Option identifiers, free-text dimensions, order-time services

Addendum to the configurator pricing change of the same date. An option's `value` is defined as a stable identifier (lowercase, no spaces, shared across languages and editions, numbers as strings without a unit), with the label in `description`. `pagefront:ConfiguratorDimension` gains `inputType` (`select` or `text`) and `maxLength`; a priced `text` dimension has one modifier, keyed `"*"`. Services offered around the order are not options and MUST NOT appear in `options`. No term is renamed or removed.

### 2026-10-01 — Configurator pricing moves to the offer

Breaking (pre-1.0), taken within 0.9 as a recorded exception to the held-for-1.0 rule; the format version stays 0.9. `pagefront:Configurator` loses `basePrice`, `basePriceCurrency` and `priceFormula`, and its options lose `priceModifier` and `currency`: a configurator describes the option space and carries no prices. It gains `@id` and `exclusions`, and `pagefront:ConfiguratorDimension` gains `affectsPrice`. `pagefront:ConfiguratorPricing` and the `pagefront:configuratorPricing` property are added: an `Offer` or `AggregateOffer` states a market's prices for the option space and names the configurator it prices. The removed properties were plain members of the type with no term of their own in the JSON-LD context, so no IRI is retired. The four defects that motivated the change are in the Pagefront Spec's changelog entry of the same date.

### 2026-09-30 — `pagefront:sheetUrl`

Additive; no sheet changes conformance. `pagefront:sheetUrl` added: organization references declare where the organization sheet is, and `@id` stays the identity. Host checks are edge-typed (seller sheets on the product sheet's host, brand sheets on the brand's `@id` host, legal-entity sheets on either), and the `@id` must match at the node the edge points at. Consumers do not construct sheet URLs and treat unresolvable inherited terms as unknown; seller identity across domains is publisher-asserted pending a domain-association mechanism. The JSON-LD context maps `sheetUrl` with `"@type": "@id"`, since its value is an IRI reference.

### 2026-09-24 — Versioning policy revised

Policy and prose only; no term, schema or sheet changes conformance. Releases before 1.0 are 0.9.x, one per new sheet type; 1.0 is defined as the complete commerce sheet set; breaking changes are held for 1.0; from 1.0, stability is deprecation-based (a term never changes meaning, removals are deprecated first and stay valid for at least twelve months). The earlier "permanent identifiers within a major version" statements are replaced by that policy.

## References

- Commerce releases and the versioning scheme: [`releases.md`](releases.md)
- Product Sheet schema, spec version 0.11.0: `https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json` (published file: [`../schemas/product/v0.11.0.json`](../schemas/product/v0.11.0.json))
- Organization Sheet schema, spec version 0.5.0: `https://themachineweb.org/pagefront/spec/commerce/organization/v0.5.0.json` (published file: [`../schemas/organization/v0.5.0.json`](../schemas/organization/v0.5.0.json))
- Collection Sheet schema, spec version 0.1.0: `https://themachineweb.org/pagefront/spec/commerce/collection/v0.1.0.json` (published file: [`../schemas/collection/v0.1.0.json`](../schemas/collection/v0.1.0.json))
- Product Sheet schema, spec version 0.10.0, for sheets declaring release 0.4.0: `https://themachineweb.org/pagefront/spec/commerce/product/v0.10.0.json` (published file: [`../schemas/product/v0.10.0.json`](../schemas/product/v0.10.0.json))
- Organization Sheet schema, spec version 0.4.0, for sheets declaring release 0.4.0: `https://themachineweb.org/pagefront/spec/commerce/organization/v0.4.0.json` (published file: [`../schemas/organization/v0.4.0.json`](../schemas/organization/v0.4.0.json))
- Schema.org vocabulary: `https://schema.org/`
- JSON-LD 1.1: `https://www.w3.org/TR/json-ld11/`
- RFC 8288 (Web Linking): `https://www.rfc-editor.org/rfc/rfc8288`
- RFC 9727 (Linkset for Common Web Standards): `https://www.rfc-editor.org/rfc/rfc9727`
