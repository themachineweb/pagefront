# Pagefront Commerce Linter — Rule Catalogue

Status: draft / design document, not yet a published normative artifact.
Catalogue version: 0.16.0
Supports: commerce releases 0.4.0 (Product Sheet spec 0.10.0, Organization Sheet spec 0.4.0) and 0.3.0 (Product Sheet spec 0.9.0, Organization Sheet spec 0.3.0), and the legacy draft line (format 0.9)

This document is the normative linter rule catalogue for Pagefront commerce Sheets. Its version is a semver of its own, independent of the commerce release and of the sheet specs ([`releases.md`](releases.md)); the "Supports" line above states which releases this catalogue version applies to. It implements the rule structure, severity levels, and output format defined in the vertical-agnostic linter design at [`../../core/spec/linter.md`](../../core/spec/linter.md).

Within the commerce vertical, this document carries two page-type rule sets: the **product catalogue** (the `PDP-` rules below) and the **Commerce Organization Sheet catalogue** (the `ORG-` rules, in their own section). Rule IDs follow the namespace convention `{sheet-type prefix}-{severity}-{number}`, so future page types (`catalog`, `article`, …) get their own prefixes without colliding with existing IDs. The product rules originally carried unprefixed `E-`/`W-`/`I-` IDs from the era when this was the only catalogue. They were renamed to `PDP-` in one pre-1.0, pre-publication move (catalogue 0.4.0), taken while no published consumer depended on the old IDs. That rename is the single sanctioned exception to ID permanence; the unprefixed IDs are retired and will not be reassigned. The linter dispatches by sheet type: a sheet is an organization sheet when its envelope `$schema` path contains `/spec/commerce/organization/` (or the `/schemas/organization/` path schemas were identified by before 2026-09-08), falling back (when `$schema` names neither type) to a data block whose `@type` is `Organization` / `OnlineStore` / `OnlineBusiness` with `pagefront:commerceRole` present. Product rules do not run on organization sheets, and organization rules do not run on product sheets. The linter also places each sheet on a line: a sheet carrying `release` is on the release line and a sheet carrying `format_version` and no `release` is on the legacy draft line. A sheet is judged by the release it declares. On the release line, Layer 1 validates it against the published schema of the sheet-spec version its `release` bundles for its type, from the frozen store [`../schemas/`](../schemas/), whatever `$schema` says; a `release` the release manifest does not list fails Layer 1. On the legacy line, Layer 1 validates against the schema `$schema` names (the legacy schema when `$schema` is absent). Layer 2 then runs the rules that apply to that release; see "Which rules apply to a Sheet" below.

## Rule catalogue

The catalogue began with Pagefront v0.6 and grows as case studies and real-merchant validation surface new well-formedness concerns. Each rule's **Introduced** field records what it was added in: a commerce release for rules added from 2026-10-01 (`release 0.3.0`), and a legacy format version for earlier rules (`v0.6`, `v0.9`), kept as history. The catalogue's own version above is its independent semver. Once added, rule IDs are stable (the `PDP-` rename above is the one exception). A subset of this catalogue, the envelope and generic-content rules, is expected to be re-homed as commerce-common rules shared across page-type catalogues; rule IDs will not change when that happens.

### Which rules apply to a Sheet

Every rule has an **Applies from** release. The linter skips a rule on a Sheet whose declared `release` is lower, and on a Sheet of the legacy draft line unless the rule is marked as applying to it (the structure and the gating are defined in "Release gating" in the linter design).

- Every rule in this catalogue applies from release 0.3.0 and to the legacy line, unless its entry carries an **Applies from** line saying otherwise.
- An error rule added after release 0.3.0 applies only from the release that introduces its requirement: that release's sheet spec states the requirement and its release notes list it. A Sheet declaring an earlier release is not judged by it.
- Warning and info rules may apply to every release, since they never change whether a Sheet conforms.

Rules that do not follow the default:

| Rule | Applies from | Legacy line |
|---|---|---|
| PDP-E-017 | release 0.4.0 | no |
| PDP-E-018, ORG-E-004 | every declared release (they judge the declared release itself) | no (a legacy Sheet declares no release) |

### Definitions

Terms shared across rules; where a rule uses one of these phrases, the definition here governs:

- **full absolute URL**: an absolute-URI per RFC 3986: scheme-qualified, e.g. `https://merchant.example/p/anorak`. Fragments, bare tokens, and relative paths are not full absolute URLs.
- **same-document @id**: an `@id` naming an entity in this Sheet: either (a) a bare fragment or token (any `@id` that is not a full absolute URL) or (b) a full absolute URL whose base (the URL with any fragment removed) equals the Sheet's `canonical_url` or the base of the data block's own top-level `@id`. Real producers routinely mint full-URL `@id`s for in-Sheet entities by appending a fragment to the canonical URL (`…#group`, `…#size-58`); these are same-document.
- **reference form**: an `@id` usage that points at an entity declared elsewhere: a bare token or string value, or an object whose only keys are `@id`, or `@id` and `@type` (a typed pointer is still a pointer).
- **inline declaration**: an object carrying `@id` plus at least one substantive property beyond `@id`/`@type` (`name`, `offers`, `url`, …). An inline declaration *declares* its `@id` at the position where it appears, regardless of that position being reference-carrying.
- **empty or whitespace-only**: absent, an empty string, a string containing only whitespace, an empty array, or an object with no members.
- **whole token**: a value appearing in a string delimited on both sides by one of `/`, `-`, `_`, `.`, `?`, `=`, `&`, `#`, or by the start or end of the string (per PDP-W-014).
- **host**: the host component of a full absolute URL as a WHATWG URL parser yields it: lowercased, with its port unless the port is the scheme's default (`https://Merchant.example:443/x` and `https://merchant.example/y` share the host `merchant.example`). A value that is not a full absolute URL, or that parses with an empty host (`urn:…`), has no host. The *Sheet's host* is the host of the envelope `sheet_url`.
- **time of linting**: the report's `checked_at` value, per PDP-W-008. Implementations do not use their own wall clock.
- **resolves**: a same-document `@id` reference resolves when the same `@id` is declared somewhere in the Sheet, by exact string match: a reference and its declaration must agree on the exact string. The candidate set for resolution is every *declaration* of the `@id`: entities in non-reference positions and inline declarations anywhere, including at reference-carrying positions. A reference-form entry never declares and never resolves anything. So an inline declaration at a reference position counts, and a reference-form entry never does (per PDP-E-001 and PDP-W-020).
- **amount**: a currency amount, carried as a JSON number or as a decimal string matching `^-?\d+(\.\d+)?$`. The *amount fields* of a product Sheet are, within `data`: `price`, `lowPrice` and `highPrice` on an `offers` entry; `price`, `minPrice` and `maxPrice` on a `priceSpecification` entry; `value`, `minValue` and `maxValue` on any object whose `@type` is `MonetaryAmount`, wherever it appears; `price` on a `hasVariant` entry; `discountAmount` on a `pagefront:promotions` entry; and `basePrice`, every value in `modifiers` and every `adjustments[].priceModifier` in a pricing block. The linter compares all amounts numerically whatever the carrier: `349`, `349.0` and `"349.00"` are equal.
- **release line** and **legacy line**: a Sheet carrying the envelope field `release` is on the release line. A Sheet carrying `format_version` and no `release` is on the legacy draft line (format versions 0.9 and earlier). The **release manifest** is [`releases.json`](releases.json): it maps a release and a sheet type to the one sheet-spec version that release bundles.
- **schema version segment**: the trailing `v<version>.json` of the `$schema` URL, a full semver on the release line (`v0.10.0.json`) and a two-part version on the legacy line (`v0.9.json`).
- **pricing block**: the value of `pagefront:configuratorPricing` on an `offers` entry (an `Offer` or an `AggregateOffer`). An offer *prices* the configurator its pricing block's `configurator.@id` names.
- **priced dimension**: an entry of `pagefront:configurator.dimensions` whose `affectsPrice` is not `false`.
- **text dimension**: an entry of `pagefront:configurator.dimensions` whose `inputType` is `text`. Every other dimension is a *select dimension*. A text dimension takes part in a configuration as an input that is empty or non-empty; its one modifier is keyed `*` and applies to any non-empty input.
- **sizing dimension**: an entry of `pagefront:configurator.dimensions` that declares a `system`.
- **corresponding size system**: the `sizeSystem` value of a `pagefront:SizeAdjustment` that names the same system as a sizing dimension's `system`: `WearableSizeSystemUK` for `UK`, `WearableSizeSystemEU` for `EU`, `WearableSizeSystemUS` for `US`, `WearableSizeSystemJP` for `JP`, with or without the `https://schema.org/` prefix. Other `system` values have no corresponding size system.
- **option key**: the string form of an option value, used wherever a pricing block or an exclusion names an option: a string value is its own key, and a number or boolean value is keyed by its JSON serialization (`0.5`, `1`, `true`). Two option values are the same option when their option keys are equal, by exact string match.
- **computed total**: for a configuration (one option for each select dimension that enumerates `options`, and an empty or a non-empty input for each priced text dimension), the pricing block's `basePrice`, plus `modifiers[dimension][option key]` for each selected option of a priced dimension, plus `modifiers[dimension]['*']` for each priced text dimension given a non-empty input, plus the `priceModifier` of each `adjustments` entry whose `when` pairs all match the configuration. A configuration that matches every pair of an entry in the configurator's `exclusions` is *excluded* and has no computed total. Amounts are read whatever their carrier (see *amount*): a decimal string as the decimal it writes, a JSON number as the decimal its shortest JSON serialization denotes (`349`, `0.1`). Amounts are summed and compared in exact decimal arithmetic on those values, so `0.1` plus `0.2` is `0.3`. The *computed band* is the minimum and the maximum computed total over all non-excluded configurations. Dimensions named in no modifier, adjustment or exclusion cannot change a total, so an implementation may leave them out of the enumeration.

The Product Sheet JSON Schema of the latest supported release (`../schemas/product/v0.10.0.json`; `product.json` is its editable head) is the normative property inventory for PDP-E-001 and PDP-I-001. The Property Registry is the propertyID vocabulary for variant dimensions and feature rows; it is not a field inventory.

When a placeholder's source field is absent from the matched content, the rendered fallback is a fixed literal specified in the rule's definition.

### Errors

#### PDP-E-001 — Broken @id reference

**Severity:** error
**Target:** `$..['@id']` (every `@id` in the data block; the Check narrows to the reference-carrying fields)
**Description:** When a Sheet uses `itemOffered: { "@id": "..." }` to reference a variant, `configurator: { "@id": "..." }` in a pricing block to name the configurator an offer prices, or any other internal `@id` cross-reference, the referenced `@id` must resolve to an entity defined elsewhere in the same Sheet. Broken references indicate either a typo, a renamed entity that wasn't propagated, or a stale variant that should have been removed.
**Check:** Every *reference-form* `@id` usage (see Definitions) in the reference-carrying fields, `itemOffered` (on `offers` entries), `isVariantOf`, and `configurator` (in a pricing block, see Definitions), resolves to a matching `@id` declaration somewhere in the data block. This list is derived from the JSON Schema of the supported Product Sheet spec version (`itemOffered` at `product.json#/$defs/offer/properties/itemOffered`, `isVariantOf` at `product.json#/$defs/dataBlock/properties/isVariantOf`, `configurator` at `product.json#/$defs/configuratorPricing/properties/configurator`); schema changes that add or remove reference-carrying fields update this rule in the same catalogue change. The five PDP-W-020 relationship fields (`isSimilarTo`, `isRelatedTo`, `isPartOf`, `hasPart`, `pagefront:relatedProduct`) are governed by PDP-W-020's semantics and excluded from PDP-E-001, even though the schema types them as reference-shaped. The rule applies to reference-form entries only. An *inline declaration* at `itemOffered` or `isVariantOf` (an object with substantive properties beyond `@id`/`@type`, e.g. a fully-inlined parent `ProductGroup` under `isVariantOf`) is a declaration, so it cannot fire this rule; its `@id` instead joins the resolution candidate set, per the **resolves** definition. For a reference-form entry, a same-document `@id` (see Definitions), whether a bare fragment or token or a full absolute URL on this Sheet's own base, must resolve within this Sheet; resolution is exact string match, so a full-URL reference resolves only against a full-URL declaration of the same string. Only a full absolute URL that is *not* same-document is a cross-Sheet reference, exempt from internal resolution and checked for URL shape only: an `isVariantOf.@id` pointing at another document's base is a legitimate reference to a separate parent Sheet (the multi-Sheet variant family pattern). `hasVariant` entries are outside this rule's fields: a variant entry's `@id` on another document's base is likewise a legitimate cross-Sheet reference, and the traversal hint that should accompany it is PDP-W-021's concern. This mirrors the carve-out PDP-W-020 applies to relationship fields. A pricing block's `configurator` reference has no such carve-out: an offer prices a configurator declared in its own Sheet, so the reference, whatever its form, resolves only against the `@id` of the data block's `pagefront:configurator`, by exact string match, and fires when that configurator is absent, declares no `@id`, or declares a different one. `format: "uri"` on the `variantEntry` and data-block `@id` is a schema annotation that JSON Schema does not assert, so a non-URL-shaped `@id` still passes Layer 1; this rule performs the URL-shape check the schema cannot.
**Message:** Reference `{value}` at `{path}` does not resolve to any entity in this Sheet.
**Remediation:** Either correct the reference to match an existing `@id`, or add the referenced entity to the Sheet. Same-document references (fragments, bare tokens, or full URLs on this Sheet's own base) must resolve within the Sheet, by exact string match. A pricing block's `configurator.@id` must equal the `@id` declared on the Sheet's `pagefront:configurator`. A full-URL `@id` on another document's base in `isVariantOf` or a `hasVariant` entry is a legitimate cross-Sheet reference (multi-Sheet variant family) and is validated for URL shape only — see PDP-W-021 for the traversal-hint recommendation that accompanies it.
**Introduced:** v0.6
**Spec reference:** `product.md#itemoffered-references`

#### PDP-E-002 — Release / schema mismatch

**Severity:** error
**Target:** `$` (the Sheet; the finding sits at the envelope field it reads)
**Description:** A Sheet states its version twice: `release` names the commerce release it is written against, and `$schema` names the version of its own sheet spec. The release manifest maps a release and a sheet type to exactly one sheet-spec version, so the two statements either agree or contradict each other. A Product Sheet declaring release 0.3.0 while pointing `$schema` at another Product Sheet spec version is internally inconsistent: a consumer routing on `release` and a consumer routing on `$schema` validate it against different schemas. On the legacy line the same check compares `format_version` with the `$schema` version, as this rule did before releases existed. Until catalogue 0.15.0 the rule was titled "Format version / schema mismatch".
**Check:** The rule reads `$schema` and is silent whenever it is absent, on both lines: whether `$schema` is required is stated by the schema of the sheet spec (Product Sheet spec 0.10.0 onward requires it), and enforced at Layer 1. On the release line, fires when `$schema` is not the URL of the Product Sheet schema the release manifest maps the declared `release` to (`…/product/v0.10.0.json` for release `0.4.0`, `…/product/v0.9.0.json` for release `0.3.0`); the finding sits at `$['release']`. On the legacy line, fires when the schema version segment of `$schema` (see Definitions) differs from the value of `format_version`, at `$['format_version']`, and is silent when `$schema` carries no schema version segment. Silent when the declared `release` is not in the release manifest (PDP-E-018 reports that) and when the Sheet carries both `release` and `format_version` (PDP-E-016 reports that).
**Message:** {declared} but {found}.
The placeholders carry: on the release line, `` `release` `{release}` bundles Product Sheet spec `{expected}` `` and, when the `$schema` URL names another version, `` `$schema` URL declares version `{schema_version}` ``, otherwise `` `$schema` is not that schema's URL, `{expected_url}` ``; on the legacy line, `` `format_version` is `{format_version}` `` and `` `$schema` URL declares version `{schema_version}` ``.
**Remediation:** Point `$schema` at the sheet-spec version the declared release bundles (see releases.md), or declare the release that bundles the schema the sheet was written against. On a legacy sheet, align `format_version` and the `$schema` version.
**Introduced:** v0.6
**Spec reference:** `product.md#the-envelope`

#### PDP-E-003 — `pagefront:` term without the vocabulary prefix in `@context`

**Severity:** error
**Target:** `$.data`
**Description:** A `pagefront:` term is a compact IRI. It expands to the Pagefront vocabulary only when the `pagefront` prefix is declared in the active JSON-LD context, which is what the array form of `@context` in [`vocabulary.md#how-to-use-this-vocabulary`](vocabulary.md#how-to-use-this-vocabulary) does. Under the bare `"https://schema.org"` string, or an array that carries no such mapping, a `pagefront:` key is an opaque IRI with scheme `pagefront`: a consumer that processes JSON-LD never reaches the vocabulary, and the context's `@container` declarations never apply. The schema accepts both forms of `@context`; this rule carries the requirement until a schema revision enforces it.
**Check:** Any property name, or any `@type` value, anywhere in `data` begins with `pagefront:`, and `data.@context` is not an array containing an object whose `pagefront` member is `https://themachineweb.org/pagefront/vocabulary/`. Fires once per Sheet, naming the first such term in document order.
**Message:** The Sheet uses `{term}` but `@context` at `{path}` does not declare the `pagefront` prefix, so the term does not resolve to the Pagefront vocabulary.
**Remediation:** Declare the prefix: `"@context": ["https://schema.org", {"pagefront": "https://themachineweb.org/pagefront/vocabulary/"}]`.
**Introduced:** v0.9 (2026-09-08 revision)
**Spec reference:** `vocabulary.md#how-to-use-this-vocabulary`

#### PDP-E-004 — Offer price disagrees with its mirroring price specification

**Severity:** error
**Target:** `$.data.offers[*]`
**Description:** "Tax inclusion" in `product.md` has an Offer that carries only `price` add one `UnitPriceSpecification` entry mirroring it, so that `valueAddedTaxIncluded` has a place to live. The Offer's `price` is authoritative. A mirroring entry that states a different amount in the same currency is an authoring error: a consumer reading the entry for its tax basis and a consumer reading `price` see two prices for one offer.
**Check:** A *mirroring entry* is a `priceSpecification` entry (the field is an object or an array; an object is one entry) that carries a numeric `price`, whose `priceCurrency` equals the Offer's `priceCurrency`, and that carries none of `priceType`, `eligibleQuantity`, `validFrom`, `validThrough`. The rule fires when the Offer has a numeric `price` and a mirroring entry's `price` differs from it as a number (`"2299.00"` and `"2299"` are equal). Entries with `priceType` belong to the sale-pricing pattern, entries with `eligibleQuantity` to quantity tiers, and entries with a validity window to scheduled prices; each of these legitimately differs from `price`, and none is a mirroring entry. Entries whose `priceCurrency` is absent or differs from the Offer's are out of scope, as are non-numeric amounts. One finding per disagreeing entry, at the entry's path.
**Message:** Price specification at `{path}` states `{specPrice}` but its Offer's `price` is `{price}`.
**Remediation:** Make the two amounts equal, or remove the duplicated amount from the specification entry and keep `valueAddedTaxIncluded` (and `priceCurrency`) on it.
**Introduced:** v0.9
**Spec reference:** `product.md#tax-inclusion`

#### PDP-E-005 — Seller sheet URL off the product sheet's host

**Severity:** error
**Target:** `$.data.offers[*]`
**Description:** A seller reference locates the seller's Commerce Organization Sheet by `pagefront:sheetUrl`. The seller is the publisher of the offer, so the linking contract in `organization.md` accepts a seller sheet only on the product sheet's own host; return and shipping terms are inherited from that sheet alone. A seller sheet URL on another host is rejected by every consumer, so the reference locates nothing and the terms it would supply are unknown.
**Check:** An Offer's `seller` is an object carrying `pagefront:sheetUrl`, and the *host* of that value differs from the *host* of the Sheet's `sheet_url` (see Definitions). A value that is not a full absolute URL has no host and fires. The seller's `@id` plays no part: it may be minted on another domain the organization controls. One finding per Offer, at the `pagefront:sheetUrl` path.
**Message:** Seller sheet URL at `{path}` is on host `{sheetUrlHost}`; the product sheet is on `{sheetHost}`.
The `{sheetUrlHost}` placeholder renders `(none)` when the value has no host; `{sheetHost}` renders `(none)` when `sheet_url` has none, which is unreachable on Layer-1-valid input.
**Remediation:** Publish the seller's organization sheet on the storefront host.
**Introduced:** v0.9
**Spec reference:** `organization.md#linking-contract-identity-only`

#### PDP-E-006 — Brand sheet URL off the brand's host

**Severity:** error
**Target:** `$.data.brand`
**Description:** A brand reference locates the brand's Commerce Organization Sheet by `pagefront:sheetUrl`. The brand may be a third party whose statements, `pagefront:authorizedResellers` among them, count only when served from its own origin, so the linking contract accepts a brand sheet only on the host of the brand's `@id`. A brand sheet URL on another host is rejected by every consumer.
**Check:** The data block's `brand` is an object carrying `pagefront:sheetUrl`, and the *host* of that value differs from the *host* of the brand's `@id` (see Definitions). The rule also fires when the brand carries no `@id` or an `@id` that is not a full absolute URL: there is no host for the URL to match. A `pagefront:sheetUrl` value that is not a full absolute URL has no host and fires.
**Message:** Brand sheet URL at `{path}` is on host `{sheetUrlHost}`; the brand's `@id` is on `{idHost}`.
The `{sheetUrlHost}` and `{idHost}` placeholders render `(none)` when the value has no host.
**Remediation:** Point `pagefront:sheetUrl` at the sheet the brand publishes on its own host, or remove it.
**Introduced:** v0.9
**Spec reference:** `organization.md#linking-contract-identity-only`

#### PDP-E-007 — Base configuration incomplete

**Severity:** error
**Target:** `$.data.offers[*]['pagefront:configuratorPricing']`
**Description:** `basePrice` is the total of the configuration named in `baseConfiguration`, and that configuration has to be one a buyer can order: exactly one option for every priced dimension. A base configuration that leaves a priced dimension open prices no configuration in particular, and one that names a value the dimension does not offer prices a configuration that does not exist. Either way a consumer cannot say what `basePrice` buys, and every total computed from it is unanchored.
**Check:** Applies to a pricing block whose `configurator` reference resolves (see PDP-E-001; an unresolved reference is that rule's finding and this rule is silent). Fires once for each priced dimension that enumerates `options` and has no key in `baseConfiguration`; once for each `baseConfiguration` key that names no dimension of the configurator; and once for each pair whose value is not one of that dimension's options, compared by option key (see Definitions). A priced dimension with no `options`, a text dimension included, has no value to name: a key naming it fires as a value that is not one of its options, and its missing modifier is PDP-W-032's concern. A key naming a dimension declared `affectsPrice: false` does not fire: the pair is redundant and changes no total. Findings sit at the `baseConfiguration` path: omitted dimensions first, in dimension order, then the pairs in document order.
**Message:** Base configuration at `{path}` {problem}.
The `{problem}` placeholder carries one of: `omits priced dimension `{dimension}``; `names `{dimension}`, which is not a dimension of the configurator`; or `names `{value}` for `{dimension}`, which is not one of its options`.
**Remediation:** Name exactly one option for every priced dimension, spelled as the configurator's `options` spell it. If a dimension never changes the price, declare `affectsPrice: false` on it and leave it out.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-E-008 — Base option modifier is not zero

**Severity:** error
**Target:** `$.data.offers[*]['pagefront:configuratorPricing']`
**Description:** `basePrice` already includes the options named in `baseConfiguration`. A non-zero modifier on one of them makes the base configuration's computed total differ from `basePrice`, so the block states two prices for the same configuration.
**Check:** For each pair in `baseConfiguration`, `modifiers[dimension][option key]` is present and differs from zero as a number (`0`, `0.0`, `"0"` and `"0.00"` are zero). A base option with no modifier at all is PDP-W-032's concern. One finding per pair, at the modifier's path.
**Message:** Modifier for base option `{option}` of `{dimension}` at `{path}` is `{modifier}`; the base option's modifier is `0`.
**Remediation:** Set the base option's modifier to zero and express the other options of the dimension as differences from it. If the modifier is right, `basePrice` is the total of another configuration: correct `baseConfiguration` or `basePrice`.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-E-009 — Modifier for an unknown dimension or option

**Severity:** error
**Target:** `$.data.offers[*]['pagefront:configuratorPricing']`
**Description:** `modifiers` is keyed by priced dimension name, then by option. A key that names nothing in the configurator prices an option no buyer can select: usually a renamed dimension, a re-spelled option, or a price list copied from another product. A modifier under a dimension declared `affectsPrice: false` contradicts the configurator's own statement that the dimension never changes the price.
**Check:** Applies to a pricing block whose `configurator` reference resolves. Fires once for each `modifiers` key that names no dimension of the configurator; once for each `modifiers` key that names a dimension declared `affectsPrice: false`; and, under a key naming a priced dimension, once for each option key that equals no option key of that dimension's `options` (every option key fires when a select dimension enumerates no `options`). Under a key naming a priced text dimension, `*` is the one valid key and every other key fires. A dimension-level finding sits at the `modifiers` key, an option-level finding at the option's own path.
**Message:** Modifier at `{path}` {problem}.
The `{problem}` placeholder carries one of: `names `{dimension}`, which is not a dimension of the configurator`; `names `{dimension}`, which is declared `affectsPrice: false``; or `names `{option}`, which is not an option of `{dimension}``.
**Remediation:** Spell dimension names and option values as the configurator spells them. Remove modifiers for dimensions that do not change the price, or remove `affectsPrice: false` from a dimension that does.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-E-010 — Offer price disagrees with base price

**Severity:** error
**Target:** `$.data.offers[*]`
**Description:** An `Offer` carrying a pricing block states its price twice: as `price`, which every Schema.org consumer reads, and as `basePrice`, the total of the named base configuration. "Configurator pricing and price bands" in `product.md` requires the two to be equal, which is what makes the Offer's `price` the price of a stated configuration. A sibling of PDP-E-004, which checks `price` against its mirroring price specification; the two rules read different fields and each keeps one message.
**Check:** An `offers` entry of `@type` `Offer` carries a pricing block, and its `price` differs from the block's `basePrice` as a number (`"349.00"` and `"349"` are equal, as are `349` and `349.0`). Applies whatever the block's `pricing` value: `basePrice` is a configured total in a `partial` block too. Non-numeric amounts are out of scope. The finding sits at the Offer's `price`.
**Message:** Offer `price` at `{path}` is `{price}` but its pricing block's `basePrice` is `{basePrice}`.
**Remediation:** Make the two amounts equal. If `price` is the amount the page shows on load, set `baseConfiguration` to the configuration the page preselects and `basePrice` to its total.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-E-011 — AggregateOffer band disagrees with computed band

**Severity:** error
**Target:** `$.data.offers[*]`
**Description:** An `AggregateOffer` carrying a complete pricing block states its band twice: as `lowPrice` and `highPrice`, and as the price list the band can be computed from. `product.md` requires the bounds to equal the totals of the cheapest and the dearest configurations that can be ordered. A band that disagrees with its own price list tells a consumer reading the bounds and a consumer computing a total two different things.
**Check:** An `offers` entry of `@type` `AggregateOffer` carries a pricing block whose `pricing` is absent or `complete`, and `lowPrice` differs from the minimum of the computed band, or `highPrice` from its maximum, as numbers (see Definitions: *computed total*). The rule is silent when the band cannot be computed: the `configurator` reference does not resolve, the block fires PDP-E-007 or PDP-W-032, or every configuration is excluded. One finding per disagreeing bound, at the bound.
**Message:** `{bound}` at `{path}` is `{stated}` but the {extreme} non-excluded configuration computed from the pricing block totals `{computed}`.
The `{bound}` placeholder carries `lowPrice` or `highPrice`; `{extreme}` carries `cheapest` or `dearest` respectively. `{stated}` renders the bound as the Sheet writes it (`859` for a number, `859.00` for the string `"859.00"`); `{computed}` renders with as many decimal places as the most precise amount in the sum (`859`, or `859.5` when an amount has one decimal place).
**Remediation:** Correct the bound, or correct the price list: a missing adjustment, a missing exclusion and a wrong modifier each move the computed band. If the price list is known to have gaps, declare `pricing: "partial"`.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-E-012 — Configurator priced by more than one offer

**Severity:** error
**Target:** `$.data.offers[*]`
**Description:** A configurator is priced by at most one offer per Sheet. Two pricing blocks naming the same configurator give one option space two price lists, and nothing tells a consumer which one applies. A merchant with a price list per market publishes one Sheet per market.
**Check:** Two or more `offers` entries carry a pricing block whose `configurator.@id` values are equal by exact string match. Fires on each such entry after the first in document order; `{firstPath}` is the path of the first.
**Message:** Offer at `{path}` prices configurator `{value}`, which the offer at `{firstPath}` already prices.
**Remediation:** Keep one pricing block per configurator. Publish each further market's price list in that market's own Sheet.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-E-013 — Text dimension with options

**Severity:** error
**Target:** `$.data['pagefront:configurator'].dimensions[*]`
**Description:** A dimension declared `inputType: "text"` takes free input: an engraving, a monogram, an inscription. Enumerated `options` on it contradict that declaration, and a consumer cannot tell whether the buyer types a value or picks one. The pricing block prices a text dimension with the single key `*`, which has no meaning beside enumerated options.
**Check:** A dimension's `inputType` is `text` and its `options` is an array with at least one entry.
**Message:** Dimension `{dimension}` at `{path}` declares `inputType: "text"` and enumerates options.
The `{dimension}` placeholder renders the dimension's `name`; when absent, the fixed fallback `(unnamed)`.
**Remediation:** Remove `options` from a free-text dimension, or remove `inputType: "text"` from a dimension the buyer picks a value in.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-E-014 — Size advice in another system than the sizing dimension

**Severity:** error
**Target:** `$.data['pagefront:sizeRecommendation'].sizeAdjustment`
**Description:** A size adjustment is an offset a consumer applies to the buyer's usual size, and the result is a size the buyer orders from the Sheet's sizing dimension. An adjustment stated in one system beside options in another cannot be applied: half a European size is not half a UK size, and converting between systems is an inference neither the producer nor the consumer may make. `vocabulary.md` requires the two to be the same system; advice the merchant states in another system stays in `description`, with no `sizeAdjustment`.
**Check:** The adjustment carries a `sizeSystem`, the configurator has at least one sizing dimension whose `system` has a corresponding size system (see Definitions), and the adjustment's `sizeSystem` is the corresponding size system of none of them. Silent when the adjustment omits `sizeSystem` (it is then read in the sizing dimension's system), when the Sheet has no configurator, and when no sizing dimension declares `UK`, `EU`, `US` or `JP`. `{dimensionSystem}` is the `system` of the first such sizing dimension.
**Message:** Size adjustment at `{path}` is in `{sizeSystem}` but the Sheet's sizing dimension is in `{dimensionSystem}`.
**Remediation:** State the adjustment in the sizing dimension's system if the merchant states it there. If the merchant's advice is in another system, remove `sizeAdjustment` and keep the merchant's wording in `description`.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#size-guidance-pagefrontsizechart-and-pagefrontsizerecommendation`

#### PDP-E-015 — Amounts mix numbers and strings

**Severity:** error
**Target:** `$.data`
**Description:** An amount is carried as a JSON number or as a decimal string, and a Sheet uses one carrier for all its amounts. A Sheet that mixes the two forces every consumer to handle both in one document, and usually records two code paths in the producer: a price lifted as a string from one source beside a band or a modifier computed as a number. The linter compares amounts numerically whatever the carrier, so the other pricing rules are unaffected by the mix; this rule reports the mix itself.
**Check:** Among the amount fields of the Sheet, at least one value is a JSON number and at least one is a string. Values of any other JSON type are Layer 1's concern and are ignored. Fires once per Sheet. `{numberPath}` and `{stringPath}` are the paths of the first number-carried and the first string-carried amount, in document order. The amount fields are this closed list, all within `data`:

- `price`, `lowPrice` and `highPrice` on an `offers` entry;
- `price`, `minPrice` and `maxPrice` on a `priceSpecification` entry;
- `value`, `minValue` and `maxValue` on any object whose `@type` is `MonetaryAmount`, wherever it appears;
- `price` on a `hasVariant` entry;
- `discountAmount` on a `pagefront:promotions` entry;
- `basePrice`, every value in `modifiers`, and every `adjustments[].priceModifier` in a pricing block.

The schema types the amounts of the first, fourth, fifth and sixth items; `priceSpecification` entries and `MonetaryAmount` objects sit in blocks the schema does not model, so this rule is the only check on their carrier.
**Message:** Amounts mix numbers and strings; use one carrier throughout the Sheet.
The paths of the first field of each type are carried in the finding's values, as `numberPath` and `stringPath`.
**Remediation:** Carry every amount the same way. Decimal strings are recommended when amounts have fractional parts.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#amounts`

#### PDP-E-016 — Sheet carries both format_version and release

**Severity:** error
**Target:** `$`
**Description:** `release` replaces `format_version`: a Sheet on the release line carries `release`, a Sheet on the legacy draft line carries `format_version`, and no Sheet carries both. A Sheet with both fields gives a consumer two answers to which line it is on. The release-line schemas reject `format_version` at Layer 1; this rule reports the same condition for callers that lint without validating.
**Check:** The envelope carries both `format_version` and `release`, whatever their values. The linter places such a Sheet on the release line.
**Message:** Sheet carries both `format_version` and `release`; a sheet declares one.
**Remediation:** Keep `release` and remove `format_version`. A sheet on the legacy draft line keeps `format_version` alone and its legacy `$schema`.
**Introduced:** release 0.3.0
**Spec reference:** `product.md#the-envelope`

#### PDP-E-017 — Configurator reference does not resolve

**Severity:** error
**Target:** `$.data` (the findings sit at each unresolved pair)
**Description:** An exclusion and an adjustment's `when` are partial configurations: each pair names a dimension of the configurator and one of its options. A pair that names a dimension the configurator does not declare, or an option the dimension does not list, refers to nothing a buyer can select. The exclusion then excludes no configuration and the adjustment never applies, silently: the computed band and every computed total come out as if the entry were absent. The usual causes are a renamed dimension, a re-spelled option, an option removed from the product, or a value written with another JSON type than the option's.
**Check:** Reads every pair of every entry of `pagefront:configurator.exclusions`, and every pair of the `when` of every `adjustments` entry of a pricing block whose `configurator.@id` equals the configurator's `@id` (a block naming another `@id` is PDP-E-001's finding, and its references are not checked). A pair fires when its key equals the `name` of no entry of the configurator's `dimensions`. Otherwise, when that dimension enumerates `options`, it fires when its value equals the `value` of none of them. Values are compared by strict equality, with no type coercion: the number `1` and the string `"1"` are different values. This is stricter than the option-key matching the totals use (see Definitions): a reference is written exactly as the option's `value` is written. When the dimension declares no `options` (continuous, system-defined or free text; an empty array counts), the value is not checked. One finding per unresolved pair, at the pair's path.
**Message:** Configuration reference at `{path}` (dimension `{dimension}`, option `{option}`) does not resolve: {problem}.
The `{option}` placeholder renders the pair's value as JSON, so a string shows its quotes (`"walnut"`) and a number does not (`1`). The `{problem}` placeholder carries either ``the configurator declares no dimension `{dimension}` `` or `` `{dimension}` lists no option `{option}` ``.
**Remediation:** Name a dimension the configurator declares, and write the option exactly as its `value` is written in that dimension's `options`, including its JSON type. Remove an exclusion or adjustment that refers to an option the product no longer offers.
**Introduced:** release 0.4.0
**Applies from:** release 0.4.0. Product Sheet spec 0.10.0 introduces the requirement ("Configurator pricing and price bands"); a Sheet declaring release 0.3.0, or a legacy Sheet, is not judged by this rule.
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-E-018 — Unknown release

**Severity:** error
**Target:** `$` (the finding sits at `$['release']`)
**Description:** A Sheet is judged by the release it declares: the release selects the schema it is validated against and the rules that apply to it. A `release` that the release manifest does not list selects nothing. The usual causes are a typo, a release number confused with a sheet-spec version (`0.10.0` is a Product Sheet spec version; the release that bundles it is `0.4.0`), or a Sheet written against a release newer than the linter. At Layer 1 the same condition is reported as a single error at `/release`; this rule reports it for callers that lint without validating.
**Check:** The envelope's `release` is a string and equals no release in the release manifest. A `release` of another JSON type is Layer 1's concern. `{known}` lists the manifest's releases.
**Message:** `release` at `{path}` is `{release}`, which is not a release this catalogue knows ({known}).
**Remediation:** Declare a published commerce release (see releases.md). If the release is newer than this linter, update the linter.
**Introduced:** release 0.4.0
**Applies from:** every declared release. The rule judges the declared release itself, so it is not gated by it; it never fires on a Sheet of a published release, and so changes the conformance of none. It does not run on legacy Sheets, which declare no release.
**Spec reference:** `product.md#the-envelope`

### Warnings

#### PDP-W-001 — Recommended field absent: image

**Severity:** warning
**Target:** `$.data`
**Description:** The `image` array is a recommended field. Sheets without any imagery are usable but much less helpful to consumers presenting product information to humans. Even product types where imagery is secondary (technical reference products, services) typically benefit from at least one identifying image.
**Check:** `data.image` is absent, or is an empty array.
**Message:** No images declared at `{path}`.
**Remediation:** Add at least one `ImageObject` to the `data.image` array. The primary image should typically declare role `hero` or `packshot`.
**Introduced:** v0.6
**Spec reference:** `product.md#image-roles`

#### PDP-W-002 — Recommended field absent: description

**Severity:** warning
**Target:** `$.data`
**Description:** The `description` field is a recommended prose description in the Sheet's declared `inLanguage`. Consumers querying the Sheet for product information almost always want a description; its absence forces consumers to fall back on `name` alone.
**Check:** `data.description` is absent, empty, or whitespace-only.
**Message:** No description at `{path}`.
**Remediation:** Add a `description` field with a 1–3 paragraph prose description of the product. The description should match the Sheet's `inLanguage`.
**Introduced:** v0.6
**Spec reference:** `product.md#required-and-recommended-core-fields`

#### PDP-W-003 — Recommended field absent: brand

**Severity:** warning
**Target:** `$.data`
**Description:** The `brand` field identifies the brand offering the product. While not all products carry a distinct brand (white-label goods, generic commodities), most do. The absence of `brand` on a recognizable branded product is typically an omission.
**Check:** `data.brand` is absent.
**Message:** No brand declared at `{path}`.
**Remediation:** Add a `brand` field with a typed `Brand` or `Organization` value, including at minimum `name` and optionally `url`.
**Introduced:** v0.6
**Spec reference:** `product.md#required-and-recommended-core-fields`

#### PDP-W-004 — Offer price without currency

**Severity:** warning
**Target:** `$.data.offers[*]`
**Description:** An `Offer` carrying `price` should also carry `priceCurrency`. A bare price without currency is ambiguous: consumers reading the Sheet have no way to know whether 1299.00 is euros, dollars, yen, or something else. The schema accepts price-without-currency for compatibility with Sheets that use `priceSpecification` instead, but a plain `price` should be paired with `priceCurrency`.
**Check:** An `Offer` has `price` defined but lacks `priceCurrency`, and does not use `priceSpecification`.
**Message:** Offer at `{path}` has `price` but no `priceCurrency`.
**Remediation:** Add a `priceCurrency` field with the ISO 4217 currency code matching the offer's currency.
**Introduced:** v0.6
**Spec reference:** `product.md#offers`

#### PDP-W-005 — Material composition percentages don't sum to 100

**Severity:** warning
**Target:** `$.data['pagefront:materialComposition','pagefront:fabricComposition']`
**Description:** When `pagefront:materialComposition` (or its textile alias `pagefront:fabricComposition`) declares percentages, the percentages across all entries should sum to approximately 100 (allowing for ±0.5 tolerance due to rounding). A sum well off 100 indicates either missing materials, a transcription error, or use of percentage as something other than a material fraction.
**Check:** All entries in the material composition array declare a `percentage` field, and the sum of those percentages is not in the range [99.5, 100.5]. Rule does not fire if any entry omits `percentage` (mixed-completeness arrays are common and acceptable), and does not fire when the composition array is empty: an empty array has no entries declaring percentages, and absence of composition is not this rule's concern.
**Message:** Material composition percentages at `{path}` sum to `{sum}`, not approximately 100.
The `{sum}` placeholder is rendered with at most two decimal places, rounded half away from zero, so conforming implementations agree on rendered output when floating-point summation produces noise. Because the tolerance check runs on the raw sum and `{sum}` renders the rounded value, a raw sum just outside the acceptable band can render at the band boundary (e.g. raw `100.504` fires and renders `100.5`). The raw sum is what is tested, so the finding is correct.
**Remediation:** Verify the composition data. If a material is missing, add it. If the values are correct but the publisher's source data uses percentages for a different denominator, omit `percentage` rather than use a value that doesn't represent a fraction of total composition.
**Introduced:** v0.6
**Spec reference:** `product.md#materials-material-and-pagefrontmaterialcomposition`

#### PDP-W-006 — Certification missing scope

**Severity:** warning
**Target:** `$.data.hasCertification[*]`
**Description:** Certifications carry different meaning depending on scope: OEKO-TEX on yarn and OEKO-TEX on finished product, for instance, indicate different supply-chain commitments. The `scope` PropertyValue disambiguates. Without it, consumers cannot tell what the certification certifies.
**Check:** A `Certification` entry has no `additionalProperty` with name `scope`.
**Message:** Certification `{name}` at `{path}` has no scope declared.
**Remediation:** Add a `PropertyValue` to `additionalProperty` with name `scope` and a value drawn from the conventional vocabulary (`yarn`, `fabric`, `finished_product`, `diamond`, `gemstone`, etc.).
**Introduced:** v0.6
**Spec reference:** `vocabulary.md#certification-scope`

#### PDP-W-007 — ProductGroup with single variant

**Severity:** warning
**Target:** `$.data`
**Description:** A `ProductGroup` with only one entry in `hasVariant` is structurally suspicious: the parent-child relationship adds no information beyond what a plain `Product` would express. Either the variant family is incomplete (other sizes/colors not yet modeled) or the wrong type was chosen.
**Check:** `data.@type` is `ProductGroup` and `data.hasVariant` has exactly one entry.
**Message:** ProductGroup at `{path}` has only one variant.
**Remediation:** Either add the missing variants to `hasVariant`, or change `@type` to `Product` and model the single variant directly. The `productGroupID` field should be replaced with `productID` or `sku` if switching to Product.
**Introduced:** v0.6
**Spec reference:** `product.md#configurator-vs-productgroup-guidance`

#### PDP-W-008 — Sheet expires_at is past or trivially close to generated_at

**Severity:** warning
**Target:** `$.expires_at`
**Description:** The `expires_at` envelope field signals how long consumers should consider the Sheet valid. An `expires_at` in the past indicates a stale Sheet that consumers should refetch. An `expires_at` less than a minute after `generated_at` indicates either misuse (the publisher meant to set a longer window) or an unusable cache hint. Non-normative note: archived or stored Sheets with short freshness windows will fire this rule permanently once their window lapses; consumers linting archives should expect and discount it.
**Check:** `expires_at` is in the past relative to the time of linting, or `expires_at - generated_at` is less than 60 seconds. `generated_at` is read from the Sheet via the rule context. The time of linting is the report's `checked_at` value (see Definitions), so time-dependent evaluation is deterministic and reproducible from the report itself.
**Message:** Sheet `expires_at` is `{expires_at}`, which is {reason}.
The `{reason}` placeholder carries either `past` or `trivially close to generated_at`; when both conditions hold, `past` wins.
**Remediation:** Set `expires_at` to a sensible window after `generated_at`. For static product catalogs, hours to days; for sheets with live pricing or inventory signals, minutes.
**Introduced:** v0.6
**Spec reference:** `product.md#the-envelope`

#### PDP-W-009 — Empty hasVariant

**Severity:** warning
**Target:** `$.data`
**Description:** A `ProductGroup` with no `hasVariant` array, or an empty one, is structurally incomplete. The whole purpose of `ProductGroup` is to express variant relationships.
**Check:** `data.@type` is `ProductGroup` and `data.hasVariant` is absent or an empty array.
**Message:** ProductGroup at `{path}` has no variants.
**Remediation:** Add variant entries to `hasVariant`. If the product genuinely has no variants, change `@type` to `Product`.
**Introduced:** v0.6
**Spec reference:** `product.md#configurator-vs-productgroup-guidance`

#### PDP-W-010 — Configurator and isVariantOf both populated for same dimension

**Severity:** warning
**Target:** `$.data['pagefront:configurator'].dimensions[*]` (per-dimension, matching the message's per-dimension granularity)
**Description:** A product can use either `pagefront:configurator` (combinatorial dimensions) or `isVariantOf.hasVariant` (enumerable SKU variants), but using both for the same dimension creates ambiguity about which model is authoritative. The v0.5 normative guidance recommends configurator for combinatorial spaces and ProductGroup+Offers for discrete SKU families.
**Check:** Both `pagefront:configurator.dimensions` and `isVariantOf.hasVariant` (or `data.hasVariant` if `@type` is `ProductGroup`) are populated, and at least one configurator dimension shares a name with a property declared on a variant. A property is declared on a variant when it is a direct property of the variant entry, or an `additionalProperty` entry whose `propertyID` matches the dimension. When no `propertyID` is present on the entry, a matching `name` counts instead, as a lenient fallback for content predating the convention; this follows the variant-axis convention in product.md's variant section. `{variant_path}` is the path of the first matching variant.
**Message:** Dimension `{dimension}` is declared in both `pagefront:configurator` at `{configurator_path}` and as a variant property at `{variant_path}`.
**Remediation:** Choose one representation. Use the configurator for combinatorial spaces, made-to-order products, or continuous dimensions. Use `ProductGroup` + `hasVariant` for discrete SKU families that ship from inventory.
**Introduced:** v0.6
**Spec reference:** `product.md#configurator-vs-productgroup-guidance`

#### PDP-W-011 — Multi-language reference without availableLanguages

**Severity:** warning
**Target:** `$.data`
**Description:** When a Sheet's canonical URL is part of a multi-language site (typically indicated by language-specific URL segments in the page URL or the Sheet URL, or by the merchant publishing parallel sheets in other languages), the Sheet should declare `pagefront:availableLanguages` listing the sibling sheets. Consumers reading one language variant should be able to discover the others without separate crawling.
**Check:** The canonical URL or the Sheet's `sheet_url` contains a language segment (a lowercase two-letter language path segment with optional region subtag, e.g. `/fr/`, `/en-GB/`, or a two-letter dotted label, e.g. `.fr.`; the dotted-label form covers language-suffixed Sheet names such as `….en.json`) but the Sheet does not declare `pagefront:availableLanguages`. "Does not declare" covers both an absent field and an empty array. This check is heuristic; false positives are acceptable.
**Message:** Sheet at `{canonical_url}` appears to be part of a multi-language site but does not declare `pagefront:availableLanguages`.
**Remediation:** Add a `pagefront:availableLanguages` array listing the URLs of sibling sheets in other languages, with their BCP 47 language tags.
**Introduced:** v0.6
**Spec reference:** `product.md#internationalization`

#### PDP-W-012 — Video missing accessibility metadata

**Severity:** warning for videos with role `overview` or `tutorial`; info for other roles
**Target:** `$.data.video[*]`
**Description:** Videos should carry either `caption` (a short summary) or `transcript` (the full spoken content) for consumers in audio-restricted contexts, consumers using accessibility tools, and consumers parsing the Sheet without rendering the video. Pagefront does not require captions or transcripts, but their absence on overview and tutorial videos limits the Sheet's usefulness.
**Check:** A `VideoObject` has neither `caption` nor `transcript`. The video's role is read from its `additionalProperty` entry with name `role`, per product.md's video-roles convention. A `VideoObject` with no declared role takes the `info` severity (it is not `overview` or `tutorial`), and `{role}` renders as `none` in that case.
**Message:** Video at `{path}` with role `{role}` has no caption or transcript.
**Remediation:** Add a `caption` field with a 1–3 sentence summary of the video's content, or a `transcript` field with the full spoken content. For overview and tutorial videos, at least one is strongly recommended.
**Introduced:** v0.6
**Spec reference:** `product.md#accessibility`

#### PDP-W-013 — Legacy HTTP Schema.org URI

**Severity:** warning
**Target:** any string value in the data block beginning with `http://schema.org/`: a value-defined target covering every Schema.org URI field exactly
**Description:** Schema.org canonicalized on HTTPS URIs years ago. HTTP URIs (`http://schema.org/InStock`) remain semantically valid and Pagefront accepts them, but publishers should migrate to HTTPS form for canonical compliance with modern Schema.org tooling.
**Check:** A field value matches the pattern `http://schema.org/...`.
**Message:** Legacy HTTP Schema.org URI `{value}` at `{path}`.
**Remediation:** Change `http://schema.org/...` to `https://schema.org/...`. The value is otherwise unchanged.
**Introduced:** v0.6
**Spec reference:** `product.md#offers`

#### PDP-W-014 — ProductGroup variant URL absent on distinctly-addressable variants

**Severity:** warning
**Target:** `$.data` (group-level: one finding per sheet, matching the group-level check and message)
**Description:** A variant is individually addressable when it has its own page (case 3) or shares the parent page but carries a variant-selecting query parameter such as `?variant={id}` (case 2). In both cases its `hasVariant` entry SHOULD declare a `url`; only when all variants share the exact same URL with no parameter differentiation (case 1) is omission correct. When *none* of a ProductGroup's variants declare a `url`, that is either correct (case 1) or an extraction gap in which the addressable URLs weren't discovered or were dropped, and the gap reduces the Sheet's usefulness for consumers building direct variant links. Variants may carry same-document full-URL fragment `@id`s (see Definitions), `…#size-58`-style identifiers on the Sheet's own base. These identify the variant but are not declared addresses: the `url` field is the only form that carries the addressability promise, so fragment `@id`s do not suppress this rule.
**Check:** A ProductGroup Sheet has multiple `hasVariant` entries, no variant identifier is contained in the group's top-level `url`, and *none* of the entries declare a `url`. A variant identifier is contained in the `url` when a variant's `sku` or bare `@id` token appears in it as a whole token, delimited on both sides by one of `/`, `-`, `_`, `.`, `?`, `=`, `&`, `#`, or by the start or end of the string; an identifier appearing only as part of a longer alphanumeric run (e.g. sku `12` inside `product-12345`) does not count. The rule does not fire when the ProductGroup has no top-level `url` to inspect, that is, a page-less parent located only by `sheet_url` (see `product.md#multi-sheet-variant-families`); the heuristic needs a group URL to inspect, so it is skipped as a whole, though the per-variant-`url` recommendation still applies to those variant entries. The check is heuristic and false positives are acceptable: it cannot detect case 2 on its own, since a variant-selecting query parameter is not visible from the Sheet. The partial case (some entries carry a `url`, others not) is PDP-W-018's domain.
**Message:** ProductGroup at `{path}` has `{count}` variants with no declared per-variant `url`s. If each variant is genuinely reachable at its own address — its own page or a variant-selecting parameter — declare it in the variant's `url` field; a fragment `@id` identifies the variant but does not promise it is addressable.
One message covers both the variants-carry-`@id`s case and the no-identifiers-at-all case; the final clause is guidance and applies whether or not the matched variants declare `@id`s.
**Remediation:** For each variant entry in `hasVariant`, add a `url` field with the variant's addressable URL — its own page (case 3) or the shared page with its variant-selecting query parameter (case 2). If all variants share the exact same URL with no parameter-based differentiation (case 1), the per-variant `url` field can be omitted.
**Introduced:** v0.6
**Spec reference:** `product.md#per-variant-urls`

#### PDP-W-015 — Price-on-request without contact channel

**Severity:** warning
**Target:** `$.data.offers[*]['pagefront:priceOnRequest']`
**Description:** A `pagefront:priceOnRequest` block whose `method` names a specific channel (`authorized_retailer`, `dealer_network`, `quote_form`, `email`, `phone`) should also declare the channel itself via `contactUrl`, `contactEmail`, or `contactPhone`. Without a contact channel, a buyer reading the Sheet has no path forward; the declaration signals "price is on request" without saying where to request it. The `unspecified` method exists for the case where no structured channel is available and is exempt from this rule.
**Check:** A `pagefront:priceOnRequest` block has `method` set to a value other than `unspecified` and declares none of `contactUrl`, `contactEmail`, `contactPhone`.
**Message:** Price-on-request at `{path}` declares method `{method}` but no contact channel (`contactUrl`, `contactEmail`, or `contactPhone`).
**Remediation:** Add the contact channel matching the declared method (e.g., `contactUrl` for `authorized_retailer` and `dealer_network`, `contactEmail` for `email`, `contactPhone` for `phone`, `contactUrl` for `quote_form`). If no such channel exists, change `method` to `unspecified`.
**Introduced:** v0.6
**Spec reference:** `product.md#price-on-request-offers`

#### PDP-W-016 — Possibly-missed price

**Severity:** warning
**Target:** `$.data.offers[*]`
**Description:** An `Offer` that carries commercial structure (`availability` and `priceCurrency`) but no `price`, no `priceSpecification`, and no `pagefront:priceOnRequest` declaration is most likely the result of an extraction failure: the merchant's page probably shows a price that the production pipeline did not capture. Intentional omissions should be declared via `pagefront:priceOnRequest` so the linter can distinguish "deliberately unpriced" from "we missed it."
**Check:** An `Offer` has `availability` and `priceCurrency` defined, but no `price`, no `priceSpecification`, and no `pagefront:priceOnRequest`.
**Message:** Offer at `{path}` has commercial structure (availability, priceCurrency) but no price declaration (no `price`, no `priceSpecification`, no `pagefront:priceOnRequest`).
**Remediation:** Add `price` (and confirm `priceCurrency`) if the price was missed during extraction. If the merchant intentionally publishes no price, declare `pagefront:priceOnRequest` with an appropriate `method` and contact channel.
**Introduced:** v0.6
**Spec reference:** `product.md#price-on-request-offers`

#### PDP-W-017 — Non-canonical BCP 47 language tag

**Severity:** warning
**Target:** `$..inLanguage`
**Description:** BCP 47 language tags are case-insensitive for comparison per RFC 5646, but canonical form (lowercase language subtag, title-case four-letter script subtag, uppercase two-letter region subtag, applying only to subtags before the first singleton) is recommended for readability and cross-Sheet consistency. A singleton is a single-character subtag: an extension singleton (e.g. `u`, `t`) or private-use `x`. Every subtag from the first singleton onward, inclusive, is lowercase in canonical form (RFC 5646 §2.1.1). Pagefront accepts non-canonical case but recommends normalization to canonical form.
**Check:** The `inLanguage` value, when compared to its canonical-case form, differs. Examples: `"en-us"` fires (canonical `"en-US"`), `"FR"` fires (canonical `"fr"`), `"en-US"` does not fire, `"fr"` does not fire, `"de-DE-u-co-phonebk"` does not fire (subtags after the singleton `u` are canonically lowercase). This rule checks case conventions only. It does not perform IANA-registry canonicalization (preferred-value substitution such as `iw`→`he`, extlang reduction): a tag can be case-canonical yet not fully canonical per the registry, and this rule does not fire on it.
**Message:** Language tag at `{path}` uses non-canonical case: `"{value}"`. Canonical form is `"{canonical}"`.
**Remediation:** Normalize the tag to canonical BCP 47 case. The semantic meaning is unchanged; only the case differs.
**Introduced:** v0.6
**Spec reference:** `product.md#upstream-equivalent-forms`

#### PDP-W-018 — Inconsistent per-variant URL presence

**Severity:** warning
**Target:** `$.data.hasVariant[*]`
**Description:** Within a single ProductGroup, per-variant `url` presence should be uniform: every variant or none. A mix is almost always an extraction gap: if the variants that carry a `url` have meaningfully distinct addressable URLs, their url-less siblings almost certainly do too and were missed during production. (The complementary all-absent case is PDP-W-014's; this rule targets the partial-population case PDP-W-014 does not catch.)
**Check:** `data.@type` is `ProductGroup` (or `data.hasVariant` is present) with two or more entries, at least one entry declares a non-empty `url`, and at least one other entry does not. The rule fires on each entry lacking a `url`.
**Message:** Variant at `{path}` has no `url`, but other variants in the same ProductGroup declare one.
**Remediation:** Add a `url` to this variant matching its distinct addressable page state, consistent with its siblings. If this variant genuinely shares the exact same URL as the others with no parameter-based differentiation (case 1 in the spec), the per-variant `url` should instead be omitted from *all* entries so presence is uniform.
**Introduced:** v0.7
**Spec reference:** `product.md#per-variant-urls`

#### PDP-W-019 — relatedProduct identifier present but unusable

**Severity:** warning
**Target:** `$.data['pagefront:relatedProduct'][*]`
**Description:** Every `pagefront:relatedProduct` entry must carry at least one structured identifier (`@id`, `sku`, `gtin`, `gtin13`, or `mpn`), which the schema enforces via `anyOf`. But the schema checks only that an identifier *key is present*, and does not check that its *value is usable*: `"sku": ""` or `"@id": ""` satisfies the `anyOf` and passes Layer 1 while giving the consumer nothing to act on. `format: "uri"` on `@id` does not close the gap, because in JSON Schema draft 2020-12 `format` is an annotation that is not asserted, so a non-URL-shaped `@id` also passes. This rule catches the present-but-empty identifier the schema's presence-only check cannot.
**Check:** A `pagefront:relatedProduct` entry's structured identifiers are all unusable: every present value among `sku`, `gtin`, `gtin13`, `mpn` is empty or whitespace-only, and any present `@id` is empty, whitespace-only, or not URL-shaped. (Entries that fail the schema's `anyOf` outright, with no identifier key at all, never reach the linter; this rule targets entries that pass Layer 1 with a present-but-empty identifier.)
**Message:** `pagefront:relatedProduct` entry `{name}` at `{path}` carries an identifier field that is present but empty or non-dereferenceable, so it has no usable structured identifier.
The `{name}` placeholder renders the entry's `name`; when absent, the fixed fallback `(unnamed)`.
**Remediation:** Supply a real, dereferenceable identifier — a URL-shaped `@id`, or a non-empty `sku`, `gtin`, `gtin13`, or `mpn`. If no structured identifier is available for this reference, it does not meet `pagefront:relatedProduct`'s requirement: move it to Schema.org's native `isRelatedTo` (which carries no identifier requirement) and drop the `relationship` typing.
**Introduced:** v0.7
**Spec reference:** `product.md#the-structured-identifier-requirement`

#### PDP-W-020 — Relationship reference lacks any identifying field

**Severity:** warning
**Target:** `$.data['isSimilarTo','isRelatedTo','isPartOf','hasPart','pagefront:relatedProduct']` (one match per present relationship field; each reference entry within a matched field value is checked)
**Description:** A product-relationship entry exists so a consumer can act on the referenced product: dereference, display, or match it. An entry carrying none of the actionable fields is inert. Each entry in `isSimilarTo`, `isRelatedTo`, `isPartOf`, `hasPart`, or `pagefront:relatedProduct` SHOULD therefore carry at least one of `@id`, `url`, `name`, `sku`, `gtin`, `gtin13`, or `mpn`. This is the referential-integrity check shared across all five fields, at a lower bar than PDP-W-019: PDP-W-020 asks only whether *any* usable field is present, while PDP-W-019 enforces `pagefront:relatedProduct`'s stricter structured-identifier requirement and catches present-but-empty identifiers. A `pagefront:relatedProduct` entry with none of the seven fields fails Layer 1 (the schema requires one of `@id`, `sku`, `gtin`, `gtin13`, `mpn`) and never reaches either rule; an entry whose identifier keys are present but empty, and which carries no `name` or `url` either, fires both.

It also extends PDP-E-001's broken-`@id` check to these five fields, with one difference: relationship references routinely point at *other* products, so an entry's `@id` may legitimately be a full URL to an external or cross-Sheet target. The resolution arm applies to *reference-form* entries only (see Definitions). An inline declaration satisfies its own resolvability: it declares what it names, so its `@id` never needs external resolution and joins the candidate set for other references. For a reference-form entry, the exemption is scoped by the same-document test. Only a full-URL `@id` that is *not* same-document is checked for URL shape alone. A same-document `@id` (a fragment such as `#size-58`, a bare token, or a full URL on this Sheet's own base) must resolve against the form-based candidate set per the **resolves** definition (exact string match).
**Check:** The `isPartOf` and `hasPart` fields may appear as a single object or as an array; the shape variance is handled in the Check: a single object is treated as a one-entry list, and each entry is one reference. A reference entry fires this rule when either condition holds. (a) The entry carries none of `@id`, `url`, `name`, `sku`, `gtin`, `gtin13`, `mpn` with a present, non-empty (non-whitespace) value. (b) The entry is in reference form (an inline declaration never triggers this condition, since it declares its own `@id`), and its `@id` is a same-document `@id` (as defined in Definitions: a fragment such as `#size-58`, a bare token, or a full absolute URL on this Sheet's own base) that does not match any declared `@id` in the data block per the **resolves** definition (exact string match, form-based candidate set); only a full-URL `@id` that is not same-document is exempt from this resolution check and is validated only for URL shape.
**Message:** Relationship reference `{name}` at `{path}` in `{field}` {problem}.
The `{problem}` placeholder carries either `has no identifying field (`@id`, `url`, `name`, `sku`, `gtin`, `gtin13`, `mpn`)` (condition a) or `declares internal `@id` `{value}` that does not resolve to any declared `@id` in this Sheet` with `{value}` being the entry's `@id` (condition b); when both conditions hold, condition (a) wins. The `{name}` placeholder renders the entry's `name`; when absent, the fixed fallback `(unnamed)`.
**Remediation:** Add at least one identifying field — `@id`, `url`, `name`, `sku`, `gtin`, `gtin13`, or `mpn` — so the reference is dereferenceable, displayable, or matchable. If the `@id` was meant to name an entity in this Sheet, correct it to match a declared `@id` or add that entity; if it was meant to point at another product, use the target's full URL.
**Introduced:** v0.7
**Spec reference:** `product.md#five-patterns-for-product-to-product-relationships`

#### PDP-W-021 — Cross-Sheet variant link missing `sheet_url` traversal hint

**Severity:** warning
**Target:** `$.data['hasVariant','isVariantOf']` (one match per present field, covering both traversal directions: a parent ProductGroup's `hasVariant` entries, forward from parent to variant, and a variant Product Sheet's `isVariantOf` object, backward from variant to parent)
**Description:** In the multi-Sheet variant family pattern, a variant family is split across N+1 Sheets, one parent `ProductGroup` Sheet plus one Product Sheet per variant, and traversal between them runs over `@id` references. The `sheet_url` field is the recommended traversal hint: it carries the *Sheet* URL of the link's target (distinct from `url`, the target's *page*), so a consumer can fetch the target Sheet directly instead of loading the target page and resolving its `Link: rel="describedby"`. A producer that emits both the parent and the variant Sheets knows both Sheet URLs and SHOULD populate `sheet_url`; when it is absent, traversal still works but costs an extra page fetch plus `describedby` resolution.

The schema types the *shape* of these fields but not the *recommendation* to populate them. The `variantEntry` item definition (`product.json#/$defs/variantEntry`) types `sheet_url`, `url`, and `@id` on each `hasVariant` entry as string URIs, so a non-string value fails Layer 1 before this rule runs (the `format: "uri"` shape check is annotation-only; see PDP-E-001). What the schema cannot express is that a *cross-Sheet* link (recognized by reference form and a non-same-document full-URL `@id`, as described below) SHOULD carry the traversal hint. That conditional recommendation is this rule's job.

This rule fires when a cross-Sheet variant link omits `sheet_url`. A link is recognized as cross-Sheet by *form and base together*: the entry is in reference form (see Definitions), and its `@id` is a full absolute URL that is not a same-document `@id`, the same signal that exempts it from PDP-E-001's internal-resolution check. An inline declaration never fires, whatever its `@id`'s base: a fully-inlined parent `ProductGroup` under `isVariantOf`, or a fully-inlined variant entry, *declares* its entity in this document, even when its `@id` is based on another page's URL (a parent group minting its `@id` from the parent's own page while living inline in a variant's Sheet). A same-document `@id` never fires either: real producers routinely model a variant family inline in one Sheet while minting full-URL `@id`s on the Sheet's own base (`…#group`, `…#size-58`). An entry carrying inline `offers` is an inline declaration by the form test, since `offers` is a substantive property. False positives are acceptable: a consumer can always fall back to `url` + `describedby`, so the cost of a spurious warning is low.
**Check:** The matched `hasVariant` value is an array of entries and the matched `isVariantOf` value is a single object; the shape variance is handled in the Check. Fires on (a) an `isVariantOf` object in reference form whose `@id` is a full absolute URL that is not a same-document `@id`, and whose `sheet_url` is absent, empty, or whitespace-only; or (b) a `hasVariant` entry in reference form whose `@id` is a full absolute URL that is not a same-document `@id`, and whose `sheet_url` is absent, empty, or whitespace-only. An inline declaration (see Definitions) never fires, whatever its `@id`'s base. An entry whose `@id` is a same-document `@id` (a fragment, a bare token, or a full URL on this Sheet's own base) never fires either, since it is not a separate Sheet.
**Message:** Variant link `{name}` at `{path}` appears to reference a separate Sheet by `@id` but omits the recommended `sheet_url`; consumers must reach the target Sheet via `url` + `describedby`.
The `{name}` placeholder renders the entry's `name`; when absent, the fixed fallback `(unnamed)`.
**Remediation:** Add `sheet_url` with the target's Sheet URL — the variant's Sheet URL on a parent `hasVariant` entry, or the parent's Sheet URL on a variant's `isVariantOf`. If you do not emit a separate Sheet for the target (the family is modeled inline in one ProductGroup Sheet), no cross-Sheet link exists and `sheet_url` does not apply.
**Introduced:** v0.7
**Spec reference:** `product.md#multi-sheet-variant-families`

#### PDP-W-022 — Empty product highlight entry

**Severity:** warning
**Target:** `$.data['pagefront:productHighlights'][*]`
**Description:** `pagefront:productHighlights` carries the merchant's ranked selling points as an ordered array of short, publisher-authored strings. The schema (Layer 1) types entries as strings but does not constrain their content, so an empty string or a whitespace-only string passes structural validation while carrying nothing. In practice such entries indicate an extraction failure (a highlight bullet whose text the pipeline failed to capture) or template noise from the merchant's page. An empty entry also corrupts the field's ordering semantics: the array's positions are the merchant's ranking, and a blank position is a rank pointing at nothing.
**Check:** Fires on any `pagefront:productHighlights` entry that is empty or consists only of whitespace characters.
**Message:** `pagefront:productHighlights[{index}]` is empty or whitespace-only; highlights must carry the publisher's selling-point text.
**Remediation:** Populate the entry with the highlight text from the merchant's page, or remove the entry. If the pipeline cannot recover the text, drop the entry rather than emitting a placeholder — a shorter honest list beats a ranked list with blanks.
**Introduced:** v0.8
**Spec reference:** `product.md#product-highlights`

#### PDP-W-023 — Recall notice coexists with InStock offer

**Severity:** warning
**Target:** `$.data['pagefront:safetyNotice'][?@.noticeType == 'recall']` (one match per recall notice; `offers` is read from the Sheet via the rule context)
**Description:** A `pagefront:safetyNotice` entry with `noticeType: "recall"` declares the product subject to a recall: owners should stop using it and pursue the remedy, and consumers SHOULD NOT recommend it for purchase. An Offer simultaneously declaring `availability: InStock` sends the opposite commercial signal. The combination is structurally valid, since the schema checks each field independently, and occasionally genuine for a brief window (a recall published before the merchant's commerce backend catches up). Usually, though, it means the page's offer data has not been updated to reflect the recall, or the recall was extracted from a stale notice page for a product that has since been remedied and relisted. Either way the Sheet is telling consumers two incompatible things, and under the spec's precedence rule (the recall overrides commercial signals) the offer data is misleading.
**Check:** Fires once per recall notice when any entry in `offers` declares `availability` of `InStock` (either scheme variant, per PDP-W-013's equivalence). `{offerPath}` is the path of the first offer declaring `InStock`.
**Message:** Recall safety notice at `{path}` coexists with offer at `{offerPath}` declaring `InStock`; the recall overrides commercial signals and the offer data likely needs updating.
**Remediation:** Update the offer's `availability` to reflect the corrective measure (typically `Discontinued` or `OutOfStock`). If the recall has been resolved and the product legitimately relisted, remove the stale `pagefront:safetyNotice` entry instead.
**Introduced:** v0.8
**Spec reference:** `product.md#safety-notices`

#### PDP-W-024 — Legal entity organization lacks an address

**Severity:** warning
**Target:** `$.data['pagefront:legalEntity'][*]`
**Description:** `pagefront:legalEntity` carries role-typed legal entities behind a product (`brand_owner`, `licensee`, `authorized_representative`, `importer`, `manufacturer`): the EU GPSR responsible-person block and similar. The regulatory value of such a declaration hinges on the entity being reachable: GPSR-style obligations name a postal address as the contact anchor. The schema types the `organization` but cannot require an `address` without rejecting legitimate non-regulated uses, so an entry whose organization omits it passes Layer 1 while being weak as a compliance declaration. From v0.9 an `organization` may instead be a reference to a Commerce Organization Sheet, which carries the address itself; such an entry declares no address and is exempt.
**Check:** Fires on any `pagefront:legalEntity` entry whose `organization` lacks an `address`, or whose `address` is empty or whitespace-only. An `organization` in *reference form* (see Definitions: an `@id` with no members beyond `@id`/`@type`) is exempt: its address lives on the referenced Commerce Organization Sheet, and this catalogue's checks read one Sheet in isolation, so a missing address on an explicit pointer is not a finding. An `organization` carrying `@id` alongside substantive content is an *inline declaration* and fires normally when its address is absent.
**Message:** `pagefront:legalEntity` entry with role `{role}` at `{path}` declares an organization without an `address`.
**Remediation:** Add the entity's postal address to the `organization`. If no address is available, the entry still identifies the organization but should not be relied on as a regulatory responsible-person declaration.
**Introduced:** v0.8
**Spec reference:** `product.md#legal-entities`

#### PDP-W-025 — Feature value embeds a unit in a string

**Severity:** warning
**Target:** `$.data['pagefront:featureGroup'][*].feature[*]`
**Description:** Feature rows split the raw comparable `value` from the merchant's display formatting: numeric `value` plus `unitCode`, with `pagefront:presentationValue` carrying the display form when it differs. A string `value` that parses as a number followed by a unit (e.g. `"220 g"`, `"1.5 m"`) indicates raw-value extraction likely failed: the display string landed in the comparable-value slot, defeating cross-sheet comparison on that row.
**Check:** Fires when a feature entry's `value` is a string matching a number-then-unit pattern (optional sign, digits with optional decimal separator, optional whitespace, then any alphabetic unit token or unit symbol, e.g. `"220 g"`, `"220 grams"`, `"1.5 m"`, `"12″"`), and no `unitCode` is present on the entry.
**Message:** Feature `{name}` at `{path}` carries value `{value}`, which parses as a number plus a unit.
**Remediation:** Move the numeric part into `value`, express the unit as a `unitCode`, and if the merchant's display formatting matters, carry the original string in `pagefront:presentationValue`.
**Introduced:** v0.8
**Spec reference:** `product.md#feature-groups`

#### PDP-W-026 — Safety data sheet without a language declaration

**Severity:** warning
**Target:** `$.data['pagefront:document'][*]`
**Description:** `pagefront:document` entries carry a per-document `inLanguage` that may differ from the sheet's, and safety data sheets are the canonical case: SDS documents are frequently published in a different language than the merchant page, and regulation-driven consumers need the language to route the document. An SDS entry without `inLanguage` forces the consumer to fetch and inspect the PDF to learn what language it is in.
**Check:** Fires on any `pagefront:document` entry with `role: "safety_data_sheet"` that lacks `inLanguage`, or whose `inLanguage` is empty or whitespace-only.
**Message:** Safety data sheet at `{path}` declares no `inLanguage`.
**Remediation:** Add the document's BCP 47 language tag as `inLanguage`. If the document is multilingual, declare the primary language.
**Introduced:** v0.8
**Spec reference:** `product.md#documents`

#### PDP-W-027 — Empty accepted answer

**Severity:** warning
**Target:** `$.data.question[*].acceptedAnswer`
**Description:** Product Q&A uses Schema.org's `Question` linked to an `Answer` via `acceptedAnswer`. An `acceptedAnswer` whose `text` is absent, empty, or whitespace-only passes structural validation while carrying no answer: typically an extraction failure or a question published before its answer. A question with an empty accepted answer misleads consumers into treating the pair as answered.
**Check:** Fires on any `question` entry whose `acceptedAnswer` is present but whose `acceptedAnswer.text` is absent, empty, or whitespace-only.
**Message:** Question `{name}` at `{path}` has an `acceptedAnswer` with no text.
The `{name}` placeholder renders the parent question's `name`; the defensive fallback `(unnamed)` is unreachable on Layer-1-valid input (the schema requires `name`).
**Remediation:** Populate `acceptedAnswer.text` with the answer prose, or remove the `acceptedAnswer` (and consider whether an unanswered question belongs in the sheet at all).
**Introduced:** v0.8
**Spec reference:** `product.md#product-qa`

#### PDP-W-028 — Offer price without a tax-inclusion statement

**Severity:** warning
**Target:** `$.data.offers[*]`
**Description:** An Offer carries `price` (or `priceSpecification` entries) but no entry states `valueAddedTaxIncluded`. Consumers must then assume the displayed-consumer-price rule without confirmation, and a producer that lifted a tax-exclusive amount from a platform API cannot be told apart from one that lifted the displayed price. The rule detects missing disclosure; an Offer whose stated basis is wrong lints clean.
**Check:** An Offer has `price` or a non-empty `priceSpecification` (an object with members, or an array with at least one entry), and no `priceSpecification` entry has a boolean `valueAddedTaxIncluded`. Offers carrying `pagefront:priceOnRequest` are exempt.
**Message:** Offer at `{path}` states a price but not whether value-added tax is included.
**Remediation:** Add a `UnitPriceSpecification` entry mirroring `price` with `valueAddedTaxIncluded` set to `true` or `false`; on an Offer that already uses `priceSpecification`, set the flag on each entry.
**Introduced:** v0.9
**Spec reference:** `product.md#tax-inclusion`

#### PDP-W-029 — Offer price without a declared region

**Severity:** warning
**Target:** `$.data.offers[*]`
**Description:** An Offer carries `price` but declares no `areaServed` or `eligibleRegion`. Both the tax basis and the rate that produced the amount depend on the consumer's jurisdiction, so an unregioned price cannot be confirmed as applicable to any given consumer. Multiple region-scoped Offers are the spec's only mechanism for multi-currency and multi-region pricing, so an unregioned Offer sitting among regioned siblings breaks that pattern.
**Check:** An Offer has `price` or a non-empty `priceSpecification`, and neither `areaServed` nor `eligibleRegion` is present. `ineligibleRegion` alone does not satisfy the check: an exclusion does not state which market the price is for. Offers carrying `pagefront:priceOnRequest` are exempt.
**Message:** Offer at `{path}` states a price but no region it applies to.
**Remediation:** Declare `areaServed` (or `eligibleRegion`) for the market whose displayed price this is. Where the market cannot be determined from the storefront, stating the tax basis via `valueAddedTaxIncluded` is the higher priority; see "Tax inclusion."
**Introduced:** v0.9
**Spec reference:** `product.md#tax-inclusion`

#### PDP-W-030 — Offer or product warranty with no content

**Severity:** warning
**Target:** `$.data.offers[*].warranty` and `$.data['pagefront:manufacturerWarranty']`
**Description:** A `warranty` on an Offer, or a `pagefront:manufacturerWarranty` on a Product, is a `WarrantyPromise` whose content is the stated length (`durationOfWarranty`) and the statement as written (`description`). An entry carrying neither passes structural validation while telling a consumer nothing beyond "a warranty exists": typically an extraction that captured the strip's label and lost its text. A `name` alone ("Warranty") is a label, not content.
**Check:** Fires on any `warranty` entry on an `offers` element, and on the data block's `pagefront:manufacturerWarranty`, that is an object carrying neither `durationOfWarranty` nor a non-empty `description` (see Definitions: *empty or whitespace-only*). Absent entries never fire; the rule is present-but-empty, in the family of PDP-W-022 and PDP-W-027.
**Message:** Warranty at `{path}` states neither a duration nor a description.
**Remediation:** State the warranty as written in `description`, and add `durationOfWarranty` where a finite length is stated. A lifetime warranty carries `description` (and optionally `name`) with no `durationOfWarranty`.
**Introduced:** v0.9
**Spec reference:** `product.md#warranty`

#### PDP-W-031 — Seller reference not locatable

**Severity:** warning
**Target:** `$.data.offers[*]`
**Description:** An Offer that states no return or shipping terms of its own inherits them from its seller's Commerce Organization Sheet (product-else-seller resolution, "Return policy" in `product.md`). A consumer finds that sheet only through `pagefront:sheetUrl` on the seller reference and never constructs a URL from the `@id`, so a seller reference without it leaves the return and shipping terms unknown to every consumer, even when the seller publishes a sheet.
**Check:** An Offer's `seller` is an object carrying `@id` and no `pagefront:sheetUrl`, and the Offer carries neither `hasMerchantReturnPolicy` nor `shippingDetails`. One finding per Offer, at the `seller` path.
**Message:** Seller at `{path}` has an `@id` but no `pagefront:sheetUrl`, and the Offer states no return or shipping terms of its own.
**Remediation:** Add `pagefront:sheetUrl` to the seller reference, or state the terms on the Offer.
**Introduced:** v0.9
**Spec reference:** `organization.md#linking-contract-identity-only`

#### PDP-W-032 — Priced option without a modifier

**Severity:** warning
**Target:** `$.data.offers[*]['pagefront:configuratorPricing']`
**Description:** Covers the options of select dimensions and the `*` key of text dimensions. A missing modifier and a modifier of zero are different facts: the first says the option's price is not stated, the second says the option costs nothing extra. A block that leaves a priced option without a modifier and does not declare `pricing: "partial"` presents a price list with a gap as complete, and a consumer computing a total across the gap would be treating "not stated" as free.
**Check:** Applies to a pricing block whose `configurator` reference resolves and whose `pricing` is absent or `complete`. Fires once for each option of a priced dimension whose option key has no entry in `modifiers[dimension]` (a priced dimension with no `modifiers` entry fires for each of its options), once for each priced text dimension with no `modifiers[dimension]['*']` entry, and once for each priced select dimension that enumerates no `options` (absent, or an empty array), since no modifier can be stated for it. Findings sit at the pricing block, in dimension order.
**Message:** Pricing block at `{path}` {problem}, and `pricing` is not `partial`.
The `{problem}` placeholder carries one of: `states no modifier for option `{option}` of `{dimension}``; `states no `*` modifier for text dimension `{dimension}``; or `cannot state modifiers for `{dimension}`, a priced dimension that enumerates no options`.
**Remediation:** State the modifier, zero included; for a text dimension, state it under the key `"*"`. If the dimension never changes the price, declare `affectsPrice: false` on it. If the price is not known, declare `pricing: "partial"`.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-W-033 — Priced configurator with no offer pricing it

**Severity:** warning
**Target:** `$.data['pagefront:configurator']`
**Description:** A configurator with priced dimensions says that the buyer's choices change the price, and the Sheet then states no price for any of them. A configurator-only Sheet is valid, and for a producer who can read only the option space it is the honest output; the warning records that the option space is published without its price list.
**Check:** The configurator has at least one priced dimension, no `offers` entry carries a pricing block, and no `offers` entry states a price (the case PDP-W-034 reports; the two rules never fire on the same Sheet). An `offers` entry states a price when it is an `AggregateOffer`, or an `Offer` with `price` or a non-empty `priceSpecification`.
**Message:** Configurator at `{path}` has priced dimensions but no offer prices it.
**Remediation:** Add an offer carrying `pagefront:configuratorPricing` for this configurator. If no option changes the price, declare `affectsPrice: false` on each dimension.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-W-034 — Offer beside a configurator with no pricing block

**Severity:** warning
**Target:** `$.data.offers[*]`
**Description:** A Sheet carries a configurator and an offer with a price, and nothing links the two. Sitting on the same Product is not a statement: a consumer can only assume the offer's price is the configurator's starting point, and when it is a component price, or the price of some other configuration, the assumption quotes a wrong amount with no rule able to detect it.
**Check:** The data block carries a `pagefront:configurator` with at least one priced dimension, no `offers` entry carries a pricing block, and at least one `offers` entry states a price (as defined in PDP-W-033). Offers carrying `pagefront:priceOnRequest` state no price. Fires once per Sheet, at the first `offers` entry that states a price. A pricing block whose reference does not resolve is PDP-E-001's finding and silences this rule.
**Message:** Offer price is not linked to the configurator; state which configuration it prices.
**Remediation:** Add `pagefront:configuratorPricing` to the offer: give the configurator an `@id`, reference it, and name the configuration the price is the total of. When only that one total is known, declare `pricing: "partial"`.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-W-035 — `basePrice` may be a component price

**Severity:** warning
**Target:** `$.data.offers[*]['pagefront:configuratorPricing']`
**Description:** `basePrice` is the total of a complete configuration. On a product assembled from several priced parts, a producer can lift the price of one part into `basePrice`, and the block still validates: every total computed from it is then short by the other parts. Two patterns in the price list suggest it. The check is heuristic and false positives are acceptable.
**Check:** Fires when either condition holds, with amounts compared as numbers. (a) `basePrice` equals the largest modifier of one dimension's `modifiers` entry. (b) `basePrice` is below every non-zero modifier of one dimension's `modifiers` entry that has at least one non-zero modifier. One finding per pricing block.
**Message:** basePrice may be a component price, not a configured total.
**Remediation:** Confirm that `basePrice` is what a buyer pays for the whole of `baseConfiguration`. If it is the price of one part, replace it with the configured total and recompute the modifiers as differences from that total.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-W-036 — Option value looks like a display label

**Severity:** warning
**Target:** `$.data['pagefront:configurator'].dimensions[*].options[*]`
**Description:** An option's `value` is a stable identifier, and its label goes in `description`. Values are the keys that `modifiers` and `baseConfiguration` are compared against, literally, and that the Sheets of one product in different languages must share. A display label as a value (`Yellow Gold`, `0.5ct`) ties the price list to one language's wording and one edition's formatting. The check is heuristic and false positives are acceptable.
**Check:** The option's `value` is a string that contains whitespace, or contains an uppercase letter, or is a decimal number followed by one or more letters to the end of the string (a unit suffix: `0.5ct`, `120cm`). Options of a sizing dimension (see Definitions) are exempt: a size is written as its system writes it, which PDP-W-037 checks. Non-string values are out of scope. One finding per option.
**Message:** Option value should be a stable identifier; put the label in description.
**Remediation:** Replace the value with a lowercase identifier without spaces (`yellow_gold`, `0.5`) and move the label to `description`. Put a unit in the dimension's `note`. Update the pricing block's keys, `baseConfiguration`, `when` and `exclusions` to the new value.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-W-037 — Option in a sizing dimension is not a size

**Severity:** warning
**Target:** `$.data['pagefront:configurator'].dimensions[*].options[*]`
**Description:** A dimension's options are the values a product can be ordered in. A sizing kit, a sample or a consultation offered around the order is a service: it MUST NOT appear in `options` and belongs in the dimension's `note` or in `pagefront:madeToOrderTerms.aftermarketServices`. In a sizing dimension such an entry stands out, because it is not written as the declared system writes a size. The same check catches a size that repeats its system's name or carries a label. The check is heuristic and false positives are acceptable.
**Check:** The option belongs to a sizing dimension whose `system` is `UK`, `EU`, `US` or `JP`, its `value` is a string, and the value is not a size in that system. A `UK` size is one letter `A` to `Z`, optionally followed by `½`, with optional whitespace between the two. An `EU`, `US` or `JP` size is a number: digits, optionally followed by a decimal part or by `½`. Any other `system` value is out of scope, as are non-string values. One finding per option.
**Message:** Option does not look like a size in the declared system.
**Remediation:** Remove the entry if it is a service, and describe the service in the dimension's `note` or in `pagefront:madeToOrderTerms.aftermarketServices`. If it is a size, write it as the system writes it, without the system's name.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-W-038 — Configurator note reads as page copy

**Severity:** warning
**Target:** `$.data['pagefront:configurator'].dimensions[*]`
**Description:** A dimension's `note` is a factual statement for a machine: third person, no address to the reader, no call to action. Page copy pasted into a note addresses a buyer ("Not sure about your size? Just select…") and leaves a consumer to extract the fact. Legal and safety statements are quoted verbatim in their own fields; a configurator note is restated. The check is a heuristic on English wording and false positives are acceptable.
**Check:** The Sheet's `inLanguage` is `en` or begins with `en-` (compared case-insensitively), the dimension carries a string `note`, and the note contains one of the words `you`, `your`, `select`, `order`, `contact` as a whole word, compared case-insensitively. A whole word is delimited on both sides by a character that is not a letter, or by the start or end of the string: `ordered` and `selection` do not match. Sheets in other languages are out of scope. One finding per dimension; `{word}` is the first matching word in the note.
**Message:** Note reads as page copy; state the fact.
**Remediation:** Restate the note as a fact in the third person: what the merchant offers or recommends, with no "you" and no instruction.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#configurator-pricing-and-price-bands`

#### PDP-W-039 — Size advice carried as prose only

**Severity:** warning
**Target:** `$.data['pagefront:sizeRecommendation']`
**Description:** A `pagefront:sizeRecommendation` with a `description` and no `sizeAdjustment`, on a Sheet whose configurator has a sizing dimension, is the state `vocabulary.md` prescribes when the merchant states its advice in another system than the one the product is ordered in. It is correct, and it is a loss: a consumer cannot apply the advice to the buyer's size and can only show the prose. The warning records that loss, so that a merchant who can state the advice in the Sheet's sizing system knows to do so.
**Check:** The data block's `pagefront:sizeRecommendation` carries a non-empty `description` (see Definitions: *empty or whitespace-only*) and no `sizeAdjustment`, and the configurator has at least one sizing dimension. Silent on Sheets with no sizing dimension, where there is no system the advice could have been stated in. `{system}` is the `system` of the first sizing dimension.
**Message:** Size advice at `{path}` could not be stated in the Sheet's sizing system (`{system}`); it is carried as prose only.
**Remediation:** If the merchant states the advice in the sizing dimension's system, add a `sizeAdjustment` in that system. If it does not, no action: do not convert between systems.
**Introduced:** v0.9 (2026-10-01 revision)
**Spec reference:** `product.md#size-guidance-pagefrontsizechart-and-pagefrontsizerecommendation`

### Information

#### PDP-I-001 — Property outside Pagefront's modeled set

**Severity:** info
**Target:** `$.data.*`
**Description:** The Sheet uses a Schema.org property that Pagefront does not explicitly model. The property is valid Schema.org and consumers will parse it correctly. Pagefront tracks these uses for vocabulary-evolution signal: properties that appear frequently in real Sheets are candidates for explicit modeling in future versions.
**Check:** A property on the data block does not appear among the properties defined in the Pagefront JSON Schema targeted by *this catalogue version* (currently Product Sheet spec 0.10.0, `product.json`), including the `pagefront:` extension properties it defines, regardless of the release or format version the Sheet declares. Unknown means: not present in that schema. The current catalogue's schema is used whatever the Sheet declares because the linter's operating premise is the current catalogue applied to version-drifted input; the shipped implementation does the same.
**Message:** Property `{property}` at `{path}` is valid Schema.org but is not explicitly modeled by Pagefront.
**Remediation:** No action required. This finding is informational. If you find yourself using a Schema.org property frequently and would value formal Pagefront modeling for it, consider opening a spec proposal.
**Introduced:** v0.6
**Spec reference:** `product.md#data--schemaorg-json-ld`

## Commerce Organization Sheet rules

The organization-sheet catalogue, applying to Commerce Organization Sheets ([`organization.md`](organization.md)) only, per the sheet-type dispatch described at the top of this document. Layer 1 for this sheet type is the published organization JSON Schema the sheet names (`../schemas/organization/`); these rules assume a schema-valid sheet. The six warning rules implement organization.md's role-scoped-content guidance ("each declared role SHOULD have its corresponding content present … and content SHOULD NOT appear without its role declared": ORG-W-001–004, and ORG-W-006 for the brand-owner-only authorized-resellers statement) plus a shape check on the registration machine keys (ORG-W-005). Per the registration-identity rules in organization.md, **no rule in this catalogue warns on absent registration identifiers** (`leiCode`, `iso6523Code`, `identifier`, `sameAs`): absence is jurisdiction-dependent and carries no quality signal. Three further error rules, ORG-E-002, ORG-E-003 and ORG-E-004, check the envelope's version fields and are the counterparts of PDP-E-016, PDP-E-002 and PDP-E-018.

#### ORG-E-001 — `pagefront:` term without the vocabulary prefix in `@context`

**Severity:** error
**Target:** `$.data`
**Description:** The organization-sheet counterpart of PDP-E-003, with the same rationale: a `pagefront:` term resolves to the Pagefront vocabulary only when the `pagefront` prefix is declared in the active JSON-LD context, in the array form of `@context` given in [`vocabulary.md#how-to-use-this-vocabulary`](vocabulary.md#how-to-use-this-vocabulary). Every organization sheet carries `pagefront:commerceRole`, so every organization sheet needs the prefix, and the bare `"https://schema.org"` string is never sufficient for this sheet type ([`organization.md#required-core-fields`](organization.md#required-core-fields)). The schema accepts both forms; this rule carries the requirement until a schema revision enforces it.
**Check:** Any property name, or any `@type` value, anywhere in `data` begins with `pagefront:`, and `data.@context` is not an array containing an object whose `pagefront` member is `https://themachineweb.org/pagefront/vocabulary/`. Fires once per Sheet, naming the first such term in document order.
**Message:** The Sheet uses `{term}` but `@context` at `{path}` does not declare the `pagefront` prefix, so the term does not resolve to the Pagefront vocabulary.
**Remediation:** Declare the prefix: `"@context": ["https://schema.org", {"pagefront": "https://themachineweb.org/pagefront/vocabulary/"}]`.
**Introduced:** v0.9 (2026-09-08 revision)
**Spec reference:** `vocabulary.md#how-to-use-this-vocabulary`

#### ORG-E-002 — Sheet carries both format_version and release

**Severity:** error
**Target:** `$`
**Description:** The organization-sheet counterpart of PDP-E-016, with the same rationale: a Sheet carries `release` on the release line or `format_version` on the legacy draft line, and never both. The release-line schema rejects `format_version` at Layer 1; this rule reports the condition for callers that lint without validating.
**Check:** The envelope carries both `format_version` and `release`, whatever their values.
**Message:** Sheet carries both `format_version` and `release`; a sheet declares one.
**Remediation:** Keep `release` and remove `format_version`. A sheet on the legacy draft line keeps `format_version` alone and its legacy `$schema`.
**Introduced:** release 0.3.0
**Spec reference:** `organization.md#the-envelope`

#### ORG-E-003 — Release / schema mismatch

**Severity:** error
**Target:** `$` (the Sheet; the finding sits at the envelope field it reads)
**Description:** The organization-sheet counterpart of PDP-E-002, with the same rationale: the release manifest maps the declared `release` to exactly one Organization Sheet spec version, and `$schema` must name it. An Organization Sheet declaring release 0.3.0 points `$schema` at `organization/v0.3.0.json`; pointing it at the Product Sheet spec's number, `v0.9.0.json`, is the likely slip, since the two sheet specs version independently.
**Check:** As PDP-E-002, with the Organization Sheet schema the release manifest gives (`…/organization/v0.4.0.json` for release `0.4.0`, `…/organization/v0.3.0.json` for release `0.3.0`). Silent whenever `$schema` is absent. On the release line, fires when `$schema` is not that schema's URL, at `$['release']`. On the legacy line, fires when the schema version segment differs from `format_version`, at `$['format_version']`. Silent when the declared `release` is not in the release manifest (ORG-E-004 reports that) and when the Sheet carries both fields (ORG-E-002 reports that).
**Message:** {declared} but {found}.
The placeholders carry the same texts as in PDP-E-002, with `Organization Sheet spec` in place of `Product Sheet spec`.
**Remediation:** Point `$schema` at the sheet-spec version the declared release bundles (see releases.md), or declare the release that bundles the schema the sheet was written against. On a legacy sheet, align `format_version` and the `$schema` version.
**Introduced:** release 0.3.0
**Spec reference:** `organization.md#the-envelope`

#### ORG-E-004 — Unknown release

**Severity:** error
**Target:** `$` (the finding sits at `$['release']`)
**Description:** The organization-sheet counterpart of PDP-E-018, with the same rationale: a `release` the release manifest does not list selects no schema and no rules.
**Check:** The envelope's `release` is a string and equals no release in the release manifest.
**Message:** `release` at `{path}` is `{release}`, which is not a release this catalogue knows ({known}).
**Remediation:** Declare a published commerce release (see releases.md). If the release is newer than this linter, update the linter.
**Introduced:** release 0.4.0
**Applies from:** every declared release, as PDP-E-018.
**Spec reference:** `organization.md#the-envelope`

#### ORG-W-001 — brand_owner declared without a brand node

**Severity:** warning
**Target:** `$.data`
**Description:** A sheet declaring the `brand_owner` role promises the `Brand` node, whose `@id` is the identity Product Sheets resolve via `Product.brand`; a brand-owner sheet without one cannot be dereferenced from the product side. A declared role with no backing content usually means the emission pipeline dropped the node or the role array was copied from another sheet.
**Check:** Fires when `pagefront:commerceRole` includes `brand_owner` and `brand` is absent, or empty or whitespace-only per the Definitions section.
**Message:** `pagefront:commerceRole` at `{path}` declares `brand_owner`, but the sheet carries no `brand` node.
**Remediation:** Add the `Brand` node with `@id` and `name` — the `Brand.@id` is the identity Product Sheets resolve via `Product.brand`.
**Introduced:** v0.9
**Spec reference:** `organization.md#role-discriminator--pagefrontcommercerole`

#### ORG-W-002 — seller declared without seller content

**Severity:** warning
**Target:** `$.data`
**Description:** A sheet declaring the `seller` role promises the store-wide terms an agent needs to reason about before it reaches a specific offer. A `seller` declaration with none of them present is a promise with no content: a consumer walking `Offer.seller` for product-else-seller resolution finds the role but nothing to resolve against.
**Check:** Fires when `pagefront:commerceRole` includes `seller` and none of `hasMerchantReturnPolicy`, `pagefront:fulfillmentTerms`, `paymentAccepted`, or `location` is present (each judged by the Definitions section's emptiness).
**Message:** `pagefront:commerceRole` at `{path}` declares `seller`, but none of `hasMerchantReturnPolicy`, `pagefront:fulfillmentTerms`, `paymentAccepted`, or `location` is present.
**Remediation:** Add the store-wide terms the seller role promises: the return policy, fulfillment terms, payment methods, or physical locations.
**Introduced:** v0.9
**Spec reference:** `organization.md#seller-block-seller`

#### ORG-W-003 — Brand node without brand_owner role

**Severity:** warning
**Target:** `$.data`
**Description:** The inverse of ORG-W-001: content without its role. A `brand` node on a sheet not claiming `brand_owner` means either the role declaration is incomplete or the node belongs on the brand's own sheet; under the one-sheet-per-brand cardinality rule, a seller sheet does not carry the brands it merely sells.
**Check:** Fires when `brand` is present (per the Definitions section's emptiness) and `pagefront:commerceRole` does not include `brand_owner`.
**Message:** A `brand` node is present at `{path}`, but `pagefront:commerceRole` does not declare `brand_owner`.
**Remediation:** Declare `brand_owner` in `pagefront:commerceRole`, or remove the `brand` node if this sheet is not the brand's sheet.
**Introduced:** v0.9
**Spec reference:** `organization.md#role-discriminator--pagefrontcommercerole`

#### ORG-W-004 — Seller content without seller role

**Severity:** warning
**Target:** `$.data`
**Description:** The inverse of ORG-W-002: store-wide commercial terms on a sheet not claiming `seller`. Either the role declaration is incomplete, or the terms belong on the seller's own sheet; under the multi-brand shared-storefront rule, brand sheets stay brand-only and store-wide terms live once, on the store's sheet. `location` is outside this rule's trigger set because a manufacturer may declare its facilities without being a seller.
**Check:** Fires when any of `hasMerchantReturnPolicy`, `pagefront:fulfillmentTerms`, or `paymentAccepted` is present (per the Definitions section's emptiness) and `pagefront:commerceRole` does not include `seller`. `{fields}` lists the present fields.
**Message:** Seller content (`{fields}`) is present at `{path}`, but `pagefront:commerceRole` does not declare `seller`.
**Remediation:** Declare `seller` in `pagefront:commerceRole`, or move the store-wide terms to the seller's own sheet.
**Introduced:** v0.9
**Spec reference:** `organization.md#seller-block-seller`

#### ORG-W-005 — Malformed registration machine key

**Severity:** warning
**Target:** `$.data`
**Description:** The registration-identity ladder's machine keys have fixed shapes: `iso6523Code` is an ISO 6523 ICD prefix (four digits), a colon, and the register number; `leiCode` is a 20-character ISO 17442 LEI (18 alphanumerics plus 2 check digits). A present value in neither shape defeats the machine key's purpose, since consumers match on it, and usually means the display form landed in the machine-key slot. This rule checks **present values only**: organization.md's registration-identity rules forbid warning on absent registration identifiers, and no presence rule exists for `leiCode`, `iso6523Code`, `identifier`, or `sameAs`.
**Check:** Fires once per malformed key: when `iso6523Code` is present and does not match `^\d{4}:.+$`, and/or when `leiCode` is present and does not match `^[A-Z0-9]{18}[0-9]{2}$`. `{field}` names the key; `{form}` renders `ISO 6523 shape (four-digit ICD, colon, register number)` for `iso6523Code` and `ISO 17442 shape (18 alphanumerics plus 2 check digits)` for `leiCode`; the finding's path points at the field. Non-string values are Layer 1's concern and are skipped.
**Message:** `{field}` at `{path}` carries `{value}`, which does not match the {form}.
**Remediation:** Correct the machine key: `iso6523Code` is `NNNN:register-number` (e.g. `0002:808641435` for a SIREN), `leiCode` is a 20-character ISO 17442 LEI. If no well-formed machine key exists for this register, drop the field and keep the display-form `identifier` — absence is conformant.
**Introduced:** v0.9
**Spec reference:** `organization.md#company-registration-identity`

#### ORG-W-006 — Authorized resellers without brand_owner role

**Severity:** warning
**Target:** `$.data`
**Description:** Content without its role, in the ORG-W-003/ORG-W-004 family. `pagefront:authorizedResellers` is the brand exercising authority over its own distribution, a statement only the brand can make, so organization.md admits it only on a sheet whose `commerceRole` includes `brand_owner`. On any other sheet it is either an incomplete role declaration or a claim the publisher has no standing to make: under the direction-of-trust rule a reseller's own assertion of authorization carries no weight, and the statement belongs on the brand's sheet or nowhere. No rule warns on the field's absence, since most brands publish no reseller list and absence is no statement. Added 2026-08-31 in catalogue 0.5.0.
**Check:** Fires when `pagefront:authorizedResellers` is present (per the Definitions section's emptiness) and `pagefront:commerceRole` does not include `brand_owner`.
**Message:** `pagefront:authorizedResellers` is present at `{path}`, but `pagefront:commerceRole` does not declare `brand_owner`.
**Remediation:** Declare `brand_owner` in `pagefront:commerceRole` if this is the brand's own sheet; otherwise remove the field — only the brand's sheet can state whom the brand authorizes.
**Introduced:** v0.9
**Spec reference:** `organization.md#authorized-resellers`

## Status

1. **Scoring rubric integration.** Resolved: [`scoring.md`](scoring.md) (in this directory) is the non-normative dimension taxonomy. Weighted rubrics are consumer-side and reference rule IDs at their own discretion; no catalogue work is pending on scoring.
2. **Case study validation.** The three case studies (Nitto, Kimaï, AFS Blackbird) are at release 0.4.0, re-derived from the live sites on 2026-09-04, and each writeup records its linter result. Linting the case studies on every catalogue change is the loop that surfaces missing rules.

## Changelog

### Unreleased

_Nothing yet. Changes land here and are versioned at the next release; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)._

### 0.16.0 — 2026-10-02

Minor. Released with commerce release 0.4.0; the catalogue supports releases 0.4.0 and 0.3.0 and the legacy draft line.

- **Release gating.** Every rule has an "Applies from" release, and a Sheet is judged only by the rules of the release it declares. Every existing rule applies from release 0.3.0 and to the legacy line. An error rule added after release 0.3.0 applies only from the release that introduces its requirement; warning and info rules may apply to every release. See "Which rules apply to a Sheet".
- **Layer 1 by release.** The schema a Sheet is validated against is the one its declared `release` bundles for its type; legacy Sheets keep resolving through `$schema`.
- **PDP-E-002 and ORG-E-003** are silent whenever `$schema` is absent, on both lines: requiring `$schema` is the schema's statement, from Product Sheet spec 0.10.0 and Organization Sheet spec 0.4.0. On the release line they compare `$schema` with the URL of the schema the release bundles. Their message template becomes `{declared} but {found}`; the rendered text of the version-mismatch cases is unchanged.
- **PDP-E-017** is new and applies from release 0.4.0: a pair in an exclusion or in an adjustment's `when` that names a dimension the configurator does not declare, or an option the dimension does not list, compared by strict equality.
- **PDP-E-018 and ORG-E-004** are new: a `release` the release manifest does not list.

### 2026-10-01 — Versioning scheme replaced

Each sheet spec now has its own semver, and a commerce release bundles the sheet specs and the vocabulary; the scheme and the release table are in [`releases.md`](releases.md). In the sheet envelope `release` replaces `format_version` (breaking, release 0.3.0), and `$schema` names the sheet-spec version. This catalogue keeps its own semver, continuing from 0.14.0, and states the releases it supports in place of a targeted format version: catalogue 0.15.0 supports release 0.3.0 and the legacy draft line. PDP-E-002 becomes "Release / schema mismatch", checked against the release manifest, and keeps its earlier behaviour on legacy sheets; ORG-E-003 is its organization-sheet counterpart; PDP-E-016 and ORG-E-002 flag a sheet carrying both `format_version` and `release`. The report carries `release` and `sheet_spec_version` in place of `spec_version`.
