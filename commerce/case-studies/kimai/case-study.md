# Kimaï — Case Study

Commerce release 0.5.0. Sheets derived from the live site and verified against
it on 2026-09-04; the product sheet re-derived on 2026-10-01. The offer's
starting price is the one the page displays; the options and their price
differences come from Kimaï's store data.

## The merchant and the product

Kimaï is a lab-grown-diamond jewellery brand founded in 2019 by two friends
from Antwerp. The company is British, Kimaï Ltd, with its registered office
at its London boutique; the pieces are made to order in Antwerp with partner
goldsmiths and setters; it sells online in several editions and through
boutiques in Paris and London.

The product is the Jackie Pear Ring, an engagement ring configured by
carat, band style, metal, size and an optional engraving, from £3,140:
https://kimai.com/uk/engagement-rings/jackie/

The case follows the UK English edition, the company's home market.

## What the page says today, and what the sheet adds

The page carries OpenGraph tags and a site-level structured-data block, but
nothing that describes the ring as a product. The store sells the ring as
two parts, a diamond and a band. The page text lists the diamond prices by
carat; the band prices sit in the store data the page loads, and the total
is computed in the browser. The terms that matter to a buyer, made-to-order
lead time, no cancellation, a free resize, a lifetime warranty, are prose in
accordion panels.

The sheet gives an agent the full price list and the whole set of terms:

| Question an agent might be asked | From the page | From the sheet |
|---|---|---|
| What does a 1 ct pear cost? | Reads £2,025 in a list, which is the diamond alone | £4,370 on a plain yellow gold band: a stated base total plus the carat modifier |
| How much more is platinum, or the pavé band? | Selects it and watches the total | £200 and £830 |
| What does the ring cost at most? | Tries every combination | £11,040, the top of the offer's price band |
| What can I choose? | Drives a configurator | Thirteen carats, two band styles, four metals, twenty-one UK sizes, an engraving of up to 20 characters |
| Does engraving cost extra? | Types one and watches the total | No: the dimension is declared as not affecting the price |
| Which size should I order? | Reads a paragraph | The merchant's advice as written: half a European size down, with its reason |
| When will it ship, can I cancel, can I return it? | Reads three panels | 6 to 8 weeks, no, only if faulty or not as described |
| Is shipping charged, are duties included? | Reads the FAQ | Free for engagement rings; duties included for the UK, US, EU and UAE |
| What wedding band goes with it? | Scrolls a carousel | Eight matching bands, named and linked |
| Where can I try it on? | Finds the store pages | Two boutiques with hours, phone and email |

## Where it came from

- **The rendered page** gave the price: with the base configuration
  selected it displays "Price £3,140", read again on 2026-10-02. The page
  carries no structured data describing the ring, so there was no second
  figure to check it against.
- **Kimaï's store data** gave the options and their price differences. Each ring page
  ships its store products as a data file. The ring is two products: a
  diamond, one product per carat, and a band, one product per band style
  with a variant per size and metal. Carats, band styles, metals and sizes
  are the store's; the sheet gives each an identifier and keeps the
  store's label beside it.
- **The page copy**, which travels in the same file, gave everything else
  on the product: the description, the pictured ring's size and weight,
  the fit advice and the resize terms, quoted as written, and the free
  ring sizer and the engraving, restated as facts in the dimension notes. The made-to-order terms, the warranty, the certification
  statement and the matching bands are quoted from the page.
- **The page in a browser** confirmed what the data cannot show: the total
  it displays, and the engraving field on the band step.
- **The terms of sale** gave the legal name, company number, registered
  office and VAT number in one sentence.
- **The FAQ and the about page** gave the return policy, the shipping
  regimes, the payment methods and the brand story.
- **The two store pages** gave addresses, opening hours, phones and emails.

The human decisions: which edition to follow, how to state a price for a
ring that has 104 of them, and what to do where the site disagrees with
itself.

## The price, and what the previous sheet got wrong

Every earlier version of this sheet gave the ring a starting price of £795.
That is the price of the 0.5 ct diamond. The band is a second store product,
and the cheapest one costs £2,345. The ring starts at £3,140.

The error came from reading the rendered page: its first step lists the
thirteen diamonds with their prices, and the old format had a `basePrice`
on the configurator with nothing saying which configuration it priced. A
component price fitted there without any rule objecting.

The current format closes that in three places. The base price sits in the
offer's pricing block next to a `baseConfiguration` that must name one
option for every priced dimension, so it is the price of an orderable
ring. The offer's own price fields must agree with the block. And the
linter flags a base price that is lower than every non-zero modifier of
a dimension (PDP-W-035), which is what a stone price beside band
modifiers looks like.

The arithmetic, from the store data fetched on 2026-10-01:

| | Store price |
|---|---|
| Diamond, pear, 0.5 ct | £795 |
| Jackie Plain Band, yellow gold | £2,345 |
| **Base configuration** | **£3,140** |

`basePrice` is the sum of two store products. The page confirms it: opened
in a browser with 0.5 ct, plain band and yellow gold selected, it displays
"Price £3,140", and the listing page shows "Starting from £3,140".

The modifiers are each option's store price minus the base option's:

- Carat: from 0 for 0.5 ct to £6,870 for 2.5 ct (£7,665 less £795).
- Band style: pavé adds £830 (£3,175 less £2,345).
- Metal: platinum adds £200; rose and white gold add nothing.

The dearest ring is 2.5 ct on a platinum pavé band: £3,140 + £6,870 + £830
+ £200 = £11,040, which is the store's £7,665 diamond plus its £3,375 band.
The offer's band is £3,140 to £11,040.

The prices are additive, and that was checked before leaving out
adjustments: the platinum uplift is £200 on both band styles, the diamond
price is a separate product and so cannot depend on band or metal, and all
104 combinations of carat, band style and metal equal the base plus their
three modifiers. No band price varies with size. Selecting the pavé band
in the browser displays £3,970, the base plus £830, and a 20-character
engraving leaves the price unchanged.

## What Kimaï would decide

- **One sheet per market.** The same ring is sold on a UK, a French and a
  US edition, and on a Spanish storefront. The French edition has its own
  page, its own language, euro prices and European sizes: its base ring is
  €3,660 and its pavé band adds €980, where the UK's is £3,140 and £830,
  while platinum adds 200 in both currencies. The two lists are separate
  price lists and neither converts into the other. The alternative, one
  sheet carrying an offer per market, would need one configurator priced
  by two offers and one set of size options in two systems. The format
  gives each sheet one canonical URL and lets one offer price a
  configurator, and each edition is its own page, so the UK page gets this
  sheet and the French page gets its own. This sheet declares the French
  one as a language sibling.
- **A price band, with the base stated.** The offer is an `AggregateOffer`
  from £3,140 to £11,040. A single price would be the base
  configuration's, the smallest diamond on the plainest band, and a
  consumer that reads only Schema.org would take it for the price of the
  ring. The pricing block still names that configuration and its total.
- **Identifiers for options.** The store calls the bands "Jackie Plain
  Band" and "Jackie Pavé", the metals "Yellow Gold", the carats "0.5ct".
  The sheet uses `plain`, `three_quarter_pave`, `yellow_gold` and `0.5` as
  values and keeps the labels in `description`, so the French sheet can
  share the keys.
- **The ring sizer is a service.** The store lists "Ring sizer" among the
  band's sizes so that it can be put in the basket. It is a free sizing
  kit sent by post. The sheet leaves it out of the size options and states
  it as a fact in the dimension's note.
- **Engraving.** The band step offers a free engraving of up to 20
  characters. The sheet declares it as a free-text dimension that does not
  affect the price.
- **The warranty.** "Lifetime Warranty" and the repair-or-replace promise
  are on the page three times. The sheet carries them on the offer.
- **The price states its basis.** The page says that all import taxes
  and duties are included in the final price for UK orders, and its
  country selector shows "United Kingdom (GBP£)".
  The offer carries `valueAddedTaxIncluded` and declares the United
  Kingdom with `areaServed`.
- **The category is the site's own word.** "Engagement rings".

Where the site contradicts itself, a merchant would want to know:

- The fit advice and the resize terms speak in European sizes; the UK
  store sells the band in UK letter sizes. The sheet carries the store's
  sizes as the options and the page's wording as the advice, with no
  structured adjustment: half a European size is not half a UK size, and
  converting between the two is an inference the sheet does not make. The
  linter records this as a warning (PDP-W-039). Kimaï stating the advice
  in UK sizes on the UK edition would remove it.
- The product panel promises one free resize of up to two sizes. The strip
  at the foot of the same page says three sizes with shipping included.
  The FAQ says two for engagement rings in one answer and 1.5 in another.
  The sheet carries the product panel.
- The engraving field accepts 20 characters; the site's interface strings
  also carry "Max 15 characters". The sheet carries the field's limit.
- The UK FAQ gives one contact address, the French legal notice another.
- The shipping-cost range in the FAQ names no currency.
- The terms name a second company at the same address as a joint
  contracting party. The sheet carries Kimaï Ltd alone.

## What publishing would take

The site is a static build from a content system, so the sheet is one more
build output per product and per language, served on kimai.com as
`application/pagefront+json`, with a link tag on each page: `rel="alternate"`
with `type="application/pagefront+json"`. The terms already live in the content system and the
prices in the store, as two products per ring; the sheet states their sum
for each configuration, which the page leaves to the browser. The
organization sheet is one file per language. Both sheets validate; the
product sheet lints with one warning, the size advice above, and the
organization sheet with none.

The other Jackie designs are the next sheets to produce. The UK listing
shows two: the Jackie Thin Pear Ring, from £2,595, and the Jackie Galactic
Pear Ring, from £4,260. Each has its own page and its own band products,
and each gets its own sheet built the same way. The pavé band is a band
style of this page and is already in this sheet. The oval and marquise
shapes of the classic Jackie are sibling pages, declared in `isVariantOf`.
When their sheets are produced, the `diamond_carat` note must name their
own shape; this sheet's note names the pear.

## Weight

What a reader downloads to get the product data, with one request each,
measured on 2026-10-01 (the organization sheet on 2026-09-04):

| | On the wire | Uncompressed |
|---|---|---|
| Product page, HTML document only | 51 KB | 347 KB |
| Product sheet | 3.8 KB | 19.4 KB |
| Organization sheet | 2.2 KB | 7.5 KB |

The document alone is thirteen times the sheet, and it holds half of the
price: the band prices arrive in a further data file of 53 KB on the wire,
and the page's scripts compute the total. The sheet carries the full price
list and the terms in one request.

## For implementers

The product sheet is a single `Product` with `MadeToOrder` availability. Its
`pagefront:configurator` has five dimensions and carries no prices: carat,
band style and metal are priced, ring size and the free-text engraving are
declared `affectsPrice: false`. The offer is an `AggregateOffer` whose
`pagefront:configuratorPricing` names the configurator, states the base
configuration and its total, and gives a modifier for every option of the
three priced dimensions; its `lowPrice` and `highPrice` are the band
computed from that block. The sheet also carries a
`pagefront:sizeRecommendation` carrying the merchant's fit advice as prose,
`pagefront:madeToOrderTerms`, an offer-level warranty and free-shipping
override, eight `recommended_with` related products, and the three diamond
shapes as a page-boundary family in `isVariantOf`. The organization sheet
exercises the registration ladder's last rung, the display-form identifier
alone, since Companies House has no ISO 6523 code, plus locations with
hours and contacts and three shipping regimes with duties-included regions.

## Method

Sources read on 2026-09-04: the UK product page, the oval and marquise
sibling pages, the eight matching-band pages, the French edition, the UK
terms of sale, FAQ, about page and the two store pages. Every value in both
sheets was checked against those sources by a script that accepts a value
only if it is quoted from a page, matched against page data, or derived by a
stated rule. Emails on the site are Cloudflare-encoded in the HTML and were
decoded from the page. Values that are the editor's reading: image roles,
the video's caption, the certification issuer's full name and the
new-condition flag.

Options and prices were re-derived on 2026-10-01 from the data file of the
UK product page, fetched at 09:58 UTC. A script built the options, the
base total and the modifiers from the store's diamond and band products,
checked that the platinum uplift is the same on both band styles, that
every one of the 104 combinations equals the base plus its modifiers, and
that no band price varies with size. The carried-over prose was checked
against the page copy in the same file, the page and the FAQ. The page was
then opened in a browser to read the displayed total for the base
configuration and for the pavé band, and to confirm the engraving field
and its limit. The French price list was read from the French page's data
file. The names of the oval and marquise sibling pages were not re-read
that day.

## History

- **v0.3 to v0.4.1** — second worked example, chosen for structural
  awkwardness; drove the configurator, made-to-order, material-provenance
  and gemstone extensions. Followed the French edition.
- **2026-08-11 to 08-14** — re-emitted at 0.8 and 0.9; organization sheet
  added from the French pages.
- **2026-09-04** — case switched to the UK edition; both sheets re-derived.
- **2026-09-18** — the offer states its tax basis and market.
- **2026-09-30** — product sheet re-verified against the UK page and FAQ;
  no value changed.
- **2026-10-01** — options and prices re-derived from the store data for
  the configurator pricing model: a price band of £3,140 to £11,040 where
  the sheet had the diamond's £795 as a starting price; identifier option
  values; UK sizes; the ring sizer out of the options; engraving added;
  the European half-size adjustment dropped beside UK sizes, the advice
  kept as written.
- **2026-10-02** — sheets moved to commerce release 0.4.0 (`release` and
  `$schema` only); no other value changed.
- **2026-10-18** — the offer states the page where it is bought (`url`,
  the UK product page); no other value changed. The page states no
  checkout link, so no checkout template is carried.
- **2026-10-18** — sheets moved to commerce release 0.5.0 (`release` and
  `$schema` only); no other value changed.
