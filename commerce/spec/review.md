# Commerce Review Sheet

Status: DRAFT, not ratified. Target: Review Sheet spec 0.1.0, a member of commerce release 0.6.0.
Schema.org version targeted: 30.0 (2026-03-19)

The Commerce Review Sheet is the Pagefront Sheet that carries the consumer reviews a publisher shows for one subject: a product, a variant family, or the seller itself. The Product Sheet carries the summary (`aggregateRating`); this sheet carries the reviews behind it, each with a declaration of where it came from, how it is tied to a purchase, what the author was given, and what the author is writing about.

## The two problems this sheet exists to solve

Consumer reviews fail agents in two ways, and the format answers each with a declaration the publisher makes: did a real customer write it, which the three provenance declarations answer, each with `undisclosed` for what the publisher cannot say, as the subject declaration has `unclassified` for what no one has read [why](review-notes.md#why-undisclosed-is-a-statement); and what are they writing about, which `pagefront:reviewSubject` and the aspects answer [why](review-notes.md#why-every-review-declares-its-subject).

## The envelope

Identical to every Pagefront Sheet; the full rules are in "The envelope" in the Pagefront Spec ([`product.md`](product.md)).

```json
{
  "$schema": "https://themachineweb.org/pagefront/spec/commerce/review/v0.1.0.json",
  "release": "0.6.0",
  "schema_org_version": "30.0",
  "canonical_url": "https://merchant.com/products/aurora-jumper",
  "sheet_url": "https://merchant.com/pagefront/commerce/review/aurora-jumper.en.json",
  "generated_at": "2026-11-17T08:00:00Z",
  "expires_at": "2026-11-18T08:00:00Z",
  "data": { "...": "..." }
}
```

- **`canonical_url`** *(required)*: the page where the reviews are shown to humans. On most storefronts this is the product page, which is then also the Product Sheet's `canonical_url`; a dedicated reviews page uses its own URL. Two Sheets with one `canonical_url` is the case "Several Sheets for one page" in Pagefront Discovery covers; see "Discovery" below.
- **`expires_at`**: reviews accrue daily; a window within a day is RECOMMENDED.

## data — Schema.org JSON-LD

### Base type

The `data` block roots on Schema.org **`ItemList`** whose `itemListElement` entries are Schema.org **`Review`** objects, and whose `about` names the subject. `Review` is the base object of every entry; Pagefront adds properties to it and mints no wrapper type. The extension trigger is under-specification: Schema.org `Review` has author, rating, body and date, and nothing for provenance, purchase linkage, compensation or subject split. `reviewAspect` exists but is one free-text string.

### Required core fields

- `@context`: the array form `["https://schema.org", {"pagefront": "https://themachineweb.org/pagefront/vocabulary/"}]`. Every review sheet uses `pagefront:` terms.
- `@type`: `"ItemList"`
- `@id`: stable URL-shaped identifier for the review set. By convention the page URL with `#reviews`, as the other sheet types use `#product`, `#collection` and `#organization`.
- `inLanguage`: BCP 47 tag for the sheet's own prose (the list's `name`, policy text). Individual reviews carry their own `inLanguage`; see "Language".
- `about`: the subject, one reference in the member entry shape of the Collection Sheet: `@type` (`Product`, or one of the Product subtypes the linter recognises (listed under REV-E-001 in [`rules.md`](rules.md)), `ProductGroup`, or `Organization`), `@id`, `url`, `pagefront:sheetUrl` *(recommended)*. One sheet, one subject. Where the product belongs to a variant family, the subject is the **`ProductGroup`**, and a variant is no subject (see "Subject granularity"). Check: REV-E-001.
- `pagefront:reviewPolicy`: the publisher's statement about the set (see "The set: policy").
- `itemListElement`: the reviews, as an array. MAY be empty. Check: REV-W-001.

### Recommended core fields

- `name`: the list's display title, in `inLanguage`.
- `numberOfItems`: the number of reviews carried, equal to the array length (see "Size and ordering"). Check: REV-W-011.
- `url`: the human page, when distinct from `canonical_url`.
- `pagefront:availableLanguages`: sibling sheets in other languages, as in the Pagefront Spec.

## The set: `pagefront:reviewPolicy`

A single review can be transcribed faithfully while the set lies by omission. The policy is the publisher's statement about the set and is sheet-level, required, single-valued:

- `@type: pagefront:ReviewPolicy` *(required)*. Check: REV-E-013.
- `collection` *(required)*: how reviews reach the published set.
  - `all`: every review received is published, subject only to legal removal.
  - `moderated`: reviews are screened against stated criteria (abuse, off-topic, personal data) and otherwise published regardless of rating.
  - `curated`: the publisher selects which reviews to show. Rating-based selection is curation.
  - `undisclosed`: the publisher does not state its practice.
- `url` *(recommended)*: the human-readable policy page. A `curated` policy SHOULD carry it. Check: REV-W-002.
- `solicitation` *(optional)*: how reviews are invited.
  - `post_purchase`: invited after a completed order.
  - `on_page`: a form on the product page, open to anyone.
  - `third_party_program`: a platform's own invitation scheme.
  - `none`: reviews are not invited.
  - `undisclosed`: the publisher does not state its practice.

Checks: REV-E-002 (absent, or `collection` outside the enum).

## The review entry

Each entry is a Schema.org `Review` carrying:

### Schema.org-native

- `@type` *(required)*: `Review`.
- `@id` *(required)*: a stable URL-shaped identifier for the review. A consumer deduplicates on it across fetches, across language sheets, and against the source platform when `pagefront:reviewSource.url` is present. Check: REV-E-003 (absent), REV-W-003 (duplicate in one sheet).
- `datePublished` *(required)*: an ISO 8601 calendar date (`YYYY-MM-DD`), optionally extended with a time and offset; the date the review was published on the publisher's surface; the date of purchase is a different fact and does not go here.
- `reviewRating` *(required)*: a `Rating` with `ratingValue`; `bestRating`/`worstRating` REQUIRED when the scale is not 1–5. Check: REV-E-004, REV-E-015. A review with no rating is not carried; a rating with no text is.
- `reviewBody` *(optional)*: the review text as written: unedited, untranslated (see "Language"), untruncated. A publisher that shortens text for display carries the full text here.
- `name` *(optional)*: the review's title, as written.
- `inLanguage` *(recommended)*: the language of the text as written. An entry carrying `reviewBody` or `name` SHOULD carry it. Check: REV-W-008.
- `author` *(recommended)*: a `Person` with `name` as displayed. No other personal data. A publisher that shows reviews anonymously omits `author`. Check: REV-W-004 (`author` carrying `email`, `telephone`, `address`).
- `itemReviewed` *(optional)*: on a sheet whose `about` is a `ProductGroup`, the variant the author **bought**, as a `Product` reference with `@id`. It is purchase data the publisher holds: it MAY be present only when `pagefront:purchaseVerification` is `order_matched` or `post_purchase_invitation`, where the publisher knows the order line. It does not narrow the review's subject, which stays the group; it gives `fit`, `size`-shaped and `appearance` aspects the context they need ("runs small" means nothing without the size bought). Otherwise omitted. Check: REV-W-010.
- `associatedMedia` *(optional)*: author-submitted photos and videos, as `ImageObject`/`VideoObject`. This closes open question #18 of the Product Sheet spec: user-generated media rides on the review that carries its trust declarations; the Product Sheet's `image` and `video` carry the publisher's media alone.
- `comment` *(optional)*: the publisher's reply, as a `Comment` with `text`, `dateCreated`, and `author` an `Organization`. One reply per review in this version.
- `interactionStatistic` *(optional)*: helpfulness counts as `InteractionCounter` (`interactionType: LikeAction`, `userInteractionCount`). A declared count; a consumer ranks nothing on it.

### Pagefront declarations

Four declarations, each REQUIRED on every entry. The rationale is in "Undisclosed and unclassified are statements".

**`pagefront:reviewSubject`**: what the author is writing about. One of:
- `product`: the product's intrinsic qualities.
- `seller`: the transaction: delivery, service, returns, packaging, payment.
- `mixed`: both, in one text.
- `unclassified`: the publisher has not determined the subject. Distinct from `undisclosed`: the text is in the publisher's hands and the fact is knowable; `unclassified` says no one, human or classifier, has read it for this purpose. A consumer treats it as `mixed` for every aggregate. A producer MUST NOT emit it on a review it has classified, and MUST NOT emit it alongside `pagefront:aspect` entries (aspects are a classification). Check: REV-W-012. [why](review-notes.md#why-the-word-is-unclassified)

Check: REV-E-005 (absent or outside the enum).

**`pagefront:reviewSource`**: where the review entered the publisher's possession. One `pagefront:ReviewSource`:
- `@type: pagefront:ReviewSource` *(required)*. Check: REV-E-013.
- `kind` *(required)*: one of:
  - `first_party`: collected by the publisher on its own surface.
  - `third_party`: a review platform the publisher uses: collection and hosting by another party.
  - `marketplace`: collected on a marketplace listing of the same product.
  - `imported`: origin not retained.
  - `undisclosed`.
- `name` *(recommended for `third_party` and `marketplace`)*: the platform's name; a source of those two kinds SHOULD carry it. Check: REV-W-005.
- `url` *(recommended for `third_party` and `marketplace`)*: the review on the source platform. This is the one field a consumer can follow to check the review exists outside the publisher's control.

Checks: REV-E-006 (absent, or `kind` outside the enum), REV-W-005 (`third_party`/`marketplace` without `name`).

**`pagefront:purchaseVerification`**: how the review was tied to a transaction. One of:
- `none`: no link to a purchase was established.
- `order_matched`: the publisher matched the author to an order for the subject in its own records.
- `post_purchase_invitation`: the review was written in response to an invitation sent after a purchase; the invitation establishes the purchase.
- `platform_verified`: a third-party platform asserts the purchase under its own scheme; `pagefront:reviewSource.kind` is then `third_party` or `marketplace`.
- `undisclosed`.

Checks: REV-E-007 (absent or outside the enum), REV-W-006 (`platform_verified` with a `first_party` or `imported` source).

**`pagefront:reviewIncentive`**: what the author received for the review. One of:
- `none`
- `discount`: a voucher, coupon or future credit.
- `free_product`: the subject, or another product, at no charge.
- `sample_program`: membership of a scheme that supplies products for review.
- `undisclosed`.

Check: REV-E-008 (absent or outside the enum).

### Aspects: `pagefront:aspect`

OPTIONAL, repeatable. Each entry says one thing the review addresses, and optionally how the author rated it:

- `@type: pagefront:ReviewAspect` *(required)*
- `aspect` *(required)*, one of a closed list split along the subject line:
  - product: `quality`, `fit`, `durability`, `value`, `ease_of_use`, `appearance`, `as_described`, `performance`, `comfort`, `taste`
  - seller: `delivery`, `customer_service`, `returns`, `packaging`, `payment`, `communication`
- `ratingValue` *(optional)*: the author's rating of that aspect alone, on the same scale as `reviewRating`.

The list is closed and final for this version. A publisher with finer aspects (`scent`, `battery_life`, `noise`) carries them in Schema.org's free-text `reviewAspect` beside the closed list, and a consumer treats those as opaque strings. Additional values require a spec amendment. [why](review-notes.md#why-the-aspect-list-is-closed)

Alongside the array, **`pagefront:aspectSource`** *(required when `pagefront:aspect` is present)* says who assigned the aspects: `author` (the author chose or rated them on a form), `publisher` (the publisher tagged them by hand), `inferred` (a classifier). Check: REV-E-014.

Consistency: a review whose `pagefront:reviewSubject` is `product` and whose aspects are all seller-side, or the reverse, is flagged. Check: REV-W-007.

## Undisclosed and unclassified are statements

Each of the three provenance declarations (`pagefront:reviewSource.kind`, `pagefront:purchaseVerification`, `pagefront:reviewIncentive`), and `pagefront:reviewPolicy`'s `collection` and `solicitation`, has three states: [why](review-notes.md#why-undisclosed-is-a-statement)

| State | Meaning | Linter |
|---|---|---|
| A value other than `undisclosed` / `unclassified` | The publisher asserts this. | — |
| `undisclosed` (provenance) or `unclassified` (subject) | The publisher states it does not know, will not say, or has not looked. | — |
| Absent | The publisher said nothing. | Error |

Neither word is a default: a producer MUST NOT emit `undisclosed` where it holds the fact, nor `unclassified` on a review it has classified. A publisher that imports a review set without its metadata emits `undisclosed` on the provenance declarations and, until it has read the reviews, `unclassified` on the subject, and is conformant; a consumer reads either as a reason to discount, and reads absence as a broken sheet.

The subject declaration takes `unclassified` where the provenance declarations take `undisclosed`, because the unknown differs: provenance is lost if it was not recorded when the review arrived, and `undisclosed` says so; the subject is recoverable from the text at any time, so a publisher is never unable to classify a review, it has only not done so yet, and `unclassified` says that.

**The minimum entry** is `@id`, `datePublished`, `reviewRating`, and the four declarations as `undisclosed`, `undisclosed`, `undisclosed`, `unclassified`. It is conformant, it contributes to no product aggregate, and it tells a consumer exactly what it is. Messy sets are the common case, and the format carries them without pretending otherwise.

## Scoping the aggregate

A Product Sheet's `aggregateRating` SHOULD be computed over reviews whose `pagefront:reviewSubject` is `product` only. `mixed` reviews are excluded from the product aggregate unless the publisher has a product-side `pagefront:aspect` rating for them, in which case that rating MAY be used. `unclassified` reviews are excluded from the product aggregate. Seller-subject reviews contribute to `aggregateRating` on the Organization Sheet and nowhere else.

The counts follow the same rule. An entry contributes to the product aggregate's `ratingCount` when its `pagefront:reviewSubject` is `product`, or `mixed` with a product-side aspect rating; it contributes to `reviewCount` when, in addition, it carries `reviewBody`. `seller` and `unclassified` entries contribute to neither on the product side.

A publisher that cannot separate the two carries its blended aggregate on the Product Sheet and sets `pagefront:reviewPolicy.collection` honestly; the blend is the known limitation vocabulary.md already names, and a consumer with this sheet can recompute. A publisher that classifies nothing has a product aggregate over nothing, which is the honest result; it MAY still carry a blended `aggregateRating` under the paragraph above, and a consumer holding the review sheet sees that every entry is `unclassified` and discounts accordingly.

## The Organization review sheet

The Organization Sheet has a review sheet of its own, `about` the `Organization`, reached through `subjectOf` on the Organization Sheet. It carries the reviews collected about the seller as a seller: a merchant-reviews platform's set, a store's own post-purchase service survey, a marketplace's seller feedback. Every entry has `pagefront:reviewSubject: seller`; a `product`, `mixed` or `unclassified` entry on an Organization review sheet is an error: a review collected about the seller as a seller is classified by where it was collected. Check: REV-E-012. Aspects on it are seller-side.

The Organization Sheet's `aggregateRating` is computed over its own review sheet. Seller-subject reviews that were posted on a product page stay in the product group's review sheet, where they were published, with `reviewSubject: seller` or `mixed`; they are excluded from the product aggregate (above) and a publisher MAY additionally carry them in the Organization review sheet under the same `@id`. A consumer merging the two deduplicates on `@id`.

`pagefront:reviewPolicy` applies to the Organization review sheet as to any other. Where the set is a third-party platform's, `collection` states the platform's practice as the publisher understands it, or `undisclosed`.

Check, on the Product Sheet: PDP-W-044 (reserved) when `aggregateRating.ratingCount` exceeds the review sheet's `numberOfItems` for the same subject; `ratingCount` counts the `product`-subject reviews and `numberOfItems` every review, so a smaller count is legitimate. Cross-sheet; awaits a multi-sheet linter.

## The product side

A Product Sheet (or ProductGroup, or Organization Sheet) points at its review sheet through Schema.org's `subjectOf`, in the member entry shape:

```json
"subjectOf": [
  {
    "@type": "ItemList",
    "@id": "https://merchant.com/products/aurora-jumper#reviews",
    "url": "https://merchant.com/products/aurora-jumper",
    "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/review/aurora-jumper.en.json",
    "name": "Customer reviews"
  }
]
```

A Product Sheet SHOULD NOT carry inline `review[]`: the entries would lack the policy statement, the four declarations double per-review size, and a product sheet is the publisher's statement about the product, where a review is a customer's. Check, on the Product Sheet: PDP-W-042 (reserved), inline `review` present.

## Subject granularity

Reviews attach to the **variant family**: [why](review-notes.md#why-reviews-attach-to-the-variant-family)

- Where a `ProductGroup` sheet exists, the review sheet's `about` is the group. A producer MUST NOT emit a review sheet whose `about` is a variant `Product` (one carrying `isVariantOf`).
- Every variant `Product` sheet's `subjectOf` points at the group's review sheet, with the group's review-set `@id`. A consumer landing on a variant reaches the same reviews as one landing on the group.
- A standalone `Product` (no family) is its own subject.
- The group's `aggregateRating` is the family's; a variant sheet that carries `aggregateRating` carries the same values. A per-variant aggregate is not expressed. A consumer wanting per-variant signal filters the review sheet on `itemReviewed`, where present.

Producer obligation; a single-sheet linter cannot see whether the `about` product is a variant. On the product side, a variant sheet whose `subjectOf` review `@id` differs from its group's is a cross-sheet check, reserved.

## Size and ordering

`itemListElement` is **exhaustive**: it carries every review the publisher's set contains for the subject under its declared `pagefront:reviewPolicy`, ordered by `datePublished` descending, as `hasPart` is exhaustive on a Collection Sheet. There is no pagination and no continuation hint; a consumer reads the array as the whole set. A publisher that cannot enumerate its reviews does not emit a sheet. `numberOfItems` equals the array length and exists so a consumer can check it did not receive a truncated document. [why](review-notes.md#why-the-list-is-exhaustive)

**Rating-only entries** (a `reviewRating` and no `reviewBody`) are carried like any other review. They count toward `ratingCount` and are left out of `reviewCount` of whichever aggregate their subject places them in (see "Scoping the aggregate"); a consumer computing either count from this sheet splits on the presence of `reviewBody`.

## Language

A review is in its author's language, declared in its own `inLanguage`. A review sheet in `en` MAY carry reviews in `fr`: the sheet's `inLanguage` scopes the sheet's own prose alone. Sibling sheets across `pagefront:availableLanguages` carry the same review set with the same `@id` per review; what differs between them is the sheet's own prose.

**Originals only.** `reviewBody` and `name` are the text as the author wrote it. A publisher that shows a translation on its page does not carry it: no `workTranslation`, no translated body, no `translator`. [why](review-notes.md#why-originals-only) Check: REV-E-011 (a `workTranslation` or `translationOfWork` on a review entry).

## Discovery

The review sheet is never a root. It is not in `hasOfferCatalog` and no entry-point carrier names it. A consumer reaches it one of two ways:

**By reference.** From the subject's sheet: `subjectOf[].pagefront:sheetUrl` on the Product Group Sheet (or standalone Product Sheet) and on the Organization Sheet, under "Traversal hints" in Pagefront Discovery ([`../../core/spec/discovery.md`](../../core/spec/discovery.md#traversal-hints-normative)). The hint is confirmed by exact `@id` match at the fetched sheet. Attribution chains from the subject's sheet, which the consumer reached by declaration. The `pagefront:sheetUrl` on the `subjectOf` entry MUST be on the canonical host of the referencing sheet, as on every other edge; the fetched sheet's data-block `@id` is confirmed against the entry's `@id` by exact string. Check, on the product and organization side: PDP-W-043 / ORG-W-009 (reserved), a `subjectOf` hint off-host.

**By page.** The page named in `canonical_url` declares the review sheet with its own `Link: rel="alternate"; type="application/pagefront+json"` and HTML `<link>` fallback, with `profile` naming this spec's schema. On a product page that is the second Pagefront link after the Product Sheet's, in that order, under "Several Sheets for one page" in Pagefront Discovery; a consumer picks the review link by `profile` from the header, or by fetching and reading `$schema` from the elements. This is also the fallback path when the hint is stale. A publisher that renders reviews on a dedicated page declares the review sheet there instead, and the product page keeps only the Product Sheet link.

```
Link: <https://merchant.com/pagefront/commerce/product/aurora-jumper.en.json>;
      rel="alternate"; type="application/pagefront+json";
      profile="https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json",
      <https://merchant.com/pagefront/commerce/review/aurora-jumper.en.json>;
      rel="alternate"; type="application/pagefront+json";
      profile="https://themachineweb.org/pagefront/spec/commerce/review/v0.1.0.json"
```

```html
<link rel="alternate" type="application/pagefront+json"
      href="https://merchant.com/pagefront/commerce/product/aurora-jumper.en.json"
      data-profile="https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json">
<link rel="alternate" type="application/pagefront+json"
      href="https://merchant.com/pagefront/commerce/review/aurora-jumper.en.json"
      data-profile="https://themachineweb.org/pagefront/spec/commerce/review/v0.1.0.json">
```

This spec requires the Pagefront Discovery version that introduces "Several Sheets for one page" (Unreleased in [`discovery-changelog.md`](../../core/spec/discovery-changelog.md) at the time of writing).

## Identity

Review `@id` is the exact-string identity key, as everywhere in the format. A producer MUST emit the identical `@id` for a review across fetches and across language sheets. Where `pagefront:reviewSource.kind` is `third_party` or `marketplace`, the `@id` SHOULD be derived from the platform's own review URL where it has one, so that two publishers syndicating the same review emit the same `@id`.

**Host.** The `pagefront:sheetUrl` on the `about` reference MUST be on the canonical host, as a member's or a parent's is in the Collection Sheet; the fetched sheet's data-block `@id` is confirmed against the reference's `@id` by exact string. Check: REV-E-009.

## What this spec does not do

- **Verify anything.** Pagefront does not certify that a review is real, that a purchase occurred or that an incentive was absent. It requires the publisher to declare, and gives a consumer one checkable edge (`pagefront:reviewSource.url`).
- **Score authenticity.** No confidence, trust or authenticity score is minted. Consumer-side, like completeness (see [`scoring.md`](scoring.md)).
- **Sentiment.** No sentiment field. `reviewRating` and per-aspect `ratingValue` are the author's numbers; a derived sentiment is a consumer's.
- **Translate.** Originals only; see "Language".
- **Rank reviews.** Array order is recency. "Most helpful" and "featured" orderings are the publisher's page surface, the same class of signal as merchant-asserted popularity (see the non-goals of the Product Sheet spec).
- **Reviews of reviews.** `interactionStatistic` is a count. Replies to replies, flags and reports are out of scope.
- **Expert and editorial reviews.** `Review` objects whose author is a publication or the merchant are a different trust class and belong elsewhere; this sheet is consumer reviews. A review with `author` an `Organization` is an error. Check: REV-E-010.

## Open questions

1. ~~**Pagination.**~~ Resolved 2026-11-17: none. The sheet is exhaustive. See "Size and ordering".
2. ~~**Translation.**~~ Resolved 2026-11-17: originals only; translations are not carried. See "Language".
3. ~~**Aspect vocabulary.**~~ Resolved 2026-11-17: the closed list stays at the cross-vertical aspects; vertical-specific aspects go in free-text `reviewAspect`. See "Aspects".
4. ~~**Rating-only reviews.**~~ Resolved 2026-11-17: carried; they count toward `ratingCount` and are left out of `reviewCount`. See "Size and ordering".
5. ~~**Variant attribution on a ProductGroup.**~~ Resolved 2026-11-17: reviews attach to the `ProductGroup`; variant sheets defer to the group's review sheet; `itemReviewed` is the variant bought, from order data only. See "Subject granularity".
6. ~~**Seller reviews across products.**~~ Resolved 2026-11-17: the Organization Sheet has its own review sheet; its `aggregateRating` is computed over that sheet; seller-subject reviews on product pages stay where published and MAY be duplicated under the same `@id`. See "The Organization review sheet".

No open questions remain at draft 0.1.0. New ones are added here as they surface.

## Linter rules

Codes are reserved here and defined under "Commerce Review Sheet rules" in [`rules.md`](rules.md), with their fixtures; the two lists are kept identical.

- **REV-E-001** `about` absent, without `@id`, or with a `@type` outside `Product`, the Product subtypes the linter recognises (listed under REV-E-001 in `rules.md`), `ProductGroup`, `Organization`.
- **REV-E-002** `pagefront:reviewPolicy` absent, or `collection` outside the enum.
- **REV-E-003** a review entry without `@id`.
- **REV-E-004** a review entry without `reviewRating`, or `reviewRating` without `ratingValue`.
- **REV-E-005** `pagefront:reviewSubject` absent or outside the enum.
- **REV-E-006** `pagefront:reviewSource` absent, or `kind` outside the enum.
- **REV-E-007** `pagefront:purchaseVerification` absent or outside the enum.
- **REV-E-008** `pagefront:reviewIncentive` absent or outside the enum.
- **REV-E-009** `about.pagefront:sheetUrl` on a host other than the canonical host.
- **REV-E-010** a review entry whose `author` is an `Organization`.
- **REV-E-011** `workTranslation` or `translationOfWork` on a review entry.
- **REV-E-012** `pagefront:reviewSubject` other than `seller` on a sheet whose `about` is an `Organization`.
- **REV-E-013** a `pagefront:reviewPolicy` or `pagefront:reviewSource` value without `@type`, or with an `@type` other than `pagefront:ReviewPolicy` or `pagefront:ReviewSource` respectively.
- **REV-E-014** `pagefront:aspect` present without `pagefront:aspectSource`.
- **REV-E-015** `reviewRating` without `bestRating` or `worstRating` where `ratingValue` exceeds 5.
- **REV-E-016** `$schema` does not name the sheet-spec version the declared release bundles (same logic as COL-E-003).
- **REV-E-017** a release the release manifest does not list (same logic as COL-E-004).
- **REV-W-001** `itemListElement` is empty (review; no failure).
- **REV-W-002** `collection: curated` without `url`.
- **REV-W-003** the same review `@id` twice.
- **REV-W-004** `author` carrying `email`, `telephone` or `address`.
- **REV-W-005** source `kind` `third_party` or `marketplace` without `name`.
- **REV-W-006** `purchaseVerification: platform_verified` with source `kind` `first_party` or `imported`.
- **REV-W-007** `pagefront:reviewSubject` disagrees with every aspect carried (all aspects on the other side of the split).
- **REV-W-008** `reviewBody` or `name` present without `inLanguage` on the entry.
- **REV-W-009** `associatedMedia` on a review whose `pagefront:reviewSource.kind` is `imported` (media provenance is weaker than text provenance).
- **REV-W-010** `itemReviewed` present with `pagefront:purchaseVerification` other than `order_matched` or `post_purchase_invitation`, or present on a sheet whose `about` is not a `ProductGroup`.
- **REV-W-011** `numberOfItems` differs from the length of `itemListElement`.
- **REV-W-012** `pagefront:reviewSubject: unclassified` alongside `pagefront:aspect` entries.

## Worked example

```json
{
  "@context": ["https://schema.org", {"pagefront": "https://themachineweb.org/pagefront/vocabulary/"}],
  "@type": "ItemList",
  "@id": "https://merchant.com/products/aurora-jumper#reviews",
  "name": "Customer reviews",
  "inLanguage": "en",
  "numberOfItems": 3,
  "about": {
    "@type": "ProductGroup",
    "@id": "https://merchant.com/products/aurora-jumper#product",
    "url": "https://merchant.com/products/aurora-jumper",
    "pagefront:sheetUrl": "https://merchant.com/pagefront/commerce/product/aurora-jumper.en.json"
  },
  "pagefront:reviewPolicy": {
    "@type": "pagefront:ReviewPolicy",
    "collection": "moderated",
    "url": "https://merchant.com/help/review-policy",
    "solicitation": "post_purchase"
  },
  "itemListElement": [
    {
      "@type": "Review",
      "@id": "https://merchant.com/reviews/r-88213",
      "datePublished": "2026-11-12",
      "inLanguage": "en",
      "name": "Warm, runs small",
      "reviewBody": "Lovely wool, but order a size up. Took nine days to arrive, which the site didn't warn about.",
      "reviewRating": { "@type": "Rating", "ratingValue": 3 },
      "author": { "@type": "Person", "name": "Mara K." },
      "itemReviewed": { "@type": "Product", "@id": "https://merchant.com/products/aurora-jumper#aurora-jumper-m-oat" },
      "pagefront:reviewSubject": "mixed",
      "pagefront:reviewSource": { "@type": "pagefront:ReviewSource", "kind": "first_party" },
      "pagefront:purchaseVerification": "order_matched",
      "pagefront:reviewIncentive": "none",
      "pagefront:aspectSource": "author",
      "pagefront:aspect": [
        { "@type": "pagefront:ReviewAspect", "aspect": "quality", "ratingValue": 5 },
        { "@type": "pagefront:ReviewAspect", "aspect": "fit", "ratingValue": 2 },
        { "@type": "pagefront:ReviewAspect", "aspect": "delivery", "ratingValue": 2 }
      ],
      "comment": {
        "@type": "Comment",
        "text": "Sorry about the delay, Mara. We've added a shipping estimate to the page.",
        "dateCreated": "2026-11-13",
        "author": { "@type": "Organization", "name": "Merchant" }
      }
    },
    {
      "@type": "Review",
      "@id": "https://reviews.example/r/aurora-jumper/7731902",
      "datePublished": "2026-11-09",
      "inLanguage": "fr",
      "reviewBody": "Très belle maille, conforme à la photo.",
      "reviewRating": { "@type": "Rating", "ratingValue": 5 },
      "author": { "@type": "Person", "name": "Julien" },
      "pagefront:reviewSubject": "product",
      "pagefront:reviewSource": {
        "@type": "pagefront:ReviewSource",
        "kind": "third_party",
        "name": "Verified Opinions",
        "url": "https://reviews.example/r/aurora-jumper/7731902"
      },
      "pagefront:purchaseVerification": "platform_verified",
      "pagefront:reviewIncentive": "undisclosed",
      "pagefront:aspectSource": "inferred",
      "pagefront:aspect": [
        { "@type": "pagefront:ReviewAspect", "aspect": "quality" },
        { "@type": "pagefront:ReviewAspect", "aspect": "as_described" }
      ]
    },
    {
      "@type": "Review",
      "@id": "https://merchant.com/reviews/r-88102",
      "datePublished": "2026-11-02",
      "reviewRating": { "@type": "Rating", "ratingValue": 4 },
      "pagefront:reviewSubject": "unclassified",
      "pagefront:reviewSource": { "@type": "pagefront:ReviewSource", "kind": "imported" },
      "pagefront:purchaseVerification": "undisclosed",
      "pagefront:reviewIncentive": "undisclosed"
    }
  ]
}
```

Three reviews, three trust profiles. The first is a matched order (so the variant bought is known and carried) with a mixed subject and a per-aspect split that lets a consumer keep the 5 for quality and drop the delivery complaint from the product score. The second is syndicated, platform-verified, checkable at its source URL, and the publisher does not know whether the platform paid for it. The third is the minimum entry: an imported star rating, nothing known about its provenance, nothing classified; it is conformant, it enters no aggregate and no count until classified, and an agent knows precisely how little it is worth.

## Vocabulary additions

The types `pagefront:ReviewPolicy`, `pagefront:ReviewSource` and `pagefront:ReviewAspect`, the properties `pagefront:reviewPolicy`, `pagefront:reviewSubject`, `pagefront:reviewSource`, `pagefront:purchaseVerification`, `pagefront:reviewIncentive`, `pagefront:aspect` and `pagefront:aspectSource`, the extension of `pagefront:sheetUrl` to the `subjectOf` edge, the "Consumer reviews" entry under "Schema.org-native patterns" and the sentence added to "Aggregate rating" are in [`vocabulary.md`](vocabulary.md), release 0.6.0. The enum meanings are normative here and mirrored verbatim there; the two are kept identical.

## References

- Pagefront Discovery: [`../../core/spec/discovery.md`](../../core/spec/discovery.md), "Several Sheets for one page"
- Pagefront Spec (Product Sheet): [`product.md`](product.md), open question #18
- Commerce Organization Sheet: [`organization.md`](organization.md), `aggregateRating` as seller reputation
- Commerce Collection Sheet: [`collection.md`](collection.md), the member entry shape
- Schema.org `Review`: `https://schema.org/Review`; `Rating`: `https://schema.org/Rating`; `ItemList`: `https://schema.org/ItemList`; `Comment`: `https://schema.org/Comment`; `InteractionCounter`: `https://schema.org/InteractionCounter`; `subjectOf`: `https://schema.org/subjectOf`
