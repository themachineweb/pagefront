# Design notes: Review Sheet spec

Status: non-normative. These notes explain the Review Sheet spec, [`review.md`](review.md), which governs; a note adds no requirement.
Design notes for the Review Sheet spec 0.1.0, a member of commerce release 0.6.0.

Each note opens with a link to the field or section it explains. The reference links a note from the field it explains; on the published page the notes render as footnotes under the spec.

## Why undisclosed is a statement

For "Undisclosed and unclassified are statements" in [`review.md`](review.md#undisclosed-and-unclassified-are-statements).

Consumer reviews fail agents in two ways, and the format answers each with a declaration, not a judgment. The first: did a real customer write it? The sheet cannot know. The publisher can state what it knows: the review's source, how (or whether) it was matched to a purchase, and whether the author was compensated. Each of these is a closed enum with an `undisclosed` member, so that "the publisher does not know" is a statement distinct from both "no" and silence. Pagefront certifies nothing; it makes the absence of a declaration the worst state a review can be in.

The distinction is the point: silence can never be mistaken for "none".

## Why every review declares its subject

For `pagefront:reviewSubject` under "Pagefront declarations" in [`review.md`](review.md#pagefront-declarations).

The second way reviews fail agents: what are they writing about? Most reviews on a product page are about the delivery, the returns desk or the support line, not the product. The sheet asks every review to declare its subject (`product`, `seller`, `mixed`, or `unclassified` when no one has looked) and lets it carry the aspects it addresses, from a closed list split the same way. A product's `aggregateRating` is scoped to reviews whose subject is the product; the seller's reputation lives on the Organization Sheet.

## Why the word is `unclassified`

For `pagefront:reviewSubject` under "Pagefront declarations" in [`review.md`](review.md#pagefront-declarations).

The three provenance declarations say `undisclosed` because provenance is lost if it was not recorded when the review arrived: the publisher cannot recover it later. The subject is a different kind of unknown. The text is in the publisher's hands and the fact is knowable at any time, by a person or a classifier, so a publisher is never unable to classify a review; it has only not done so yet. `unclassified` names that state, and keeps it apart from the provenance word so a consumer reads each for what it is: one a gap that stays, the other work not yet done. The minimum entry carries all four, and a set that classifies nothing says so entry by entry.

## Why reviews attach to the variant family

For "Subject granularity" in [`review.md`](review.md#subject-granularity).

A customer reviewing a jumper is reviewing the jumper; which colour and size they own is a fact about the order, and most authors could not say which variant their review is "about" if asked. The format follows the author's mental model: the review sheet's `about` is the group, every variant sheet defers to the group's review sheet, and the variant bought rides on `itemReviewed` as purchase data where the publisher knows the order line.

## Why the list is exhaustive

For "Size and ordering" in [`review.md`](review.md#size-and-ordering).

Size is the accepted cost. A subject with thousands of reviews produces a large sheet; the per-review declarations are short enums, and a consumer that wants a sample truncates on its side, in date order. An exhaustive list reads under one rule with `hasPart` on a Collection Sheet and `hasVariant` on a `ProductGroup`, and `numberOfItems` lets a consumer tell a truncated document from a whole one.

## Why originals only

For "Language" in [`review.md`](review.md#language).

Translation is a consumer's operation on a text whose language it has been told: the sheet carries the author's text and its `inLanguage`, and a consumer translates where it needs to.

## Why the aspect list is closed

For "Aspects" in [`review.md`](review.md#aspects-pagefrontaspect).

The list names the aspects that recur across verticals and nothing vertical-specific, so that a consumer can compare the same aspect across publishers. A publisher with finer aspects carries them in Schema.org's free-text `reviewAspect` beside the closed list, where a consumer treats them as opaque strings. `pagefront:aspectSource` says who assigned the aspects because a consumer weights the author's choice, the publisher's tagging and a classifier's inference differently, and the sheet does not pretend otherwise.
