# AFS Blackbird V3 — Case Study

Commerce release 0.5.0. Sheets derived from the live site and verified against
it on 2026-09-04; the product sheet re-verified on 2026-09-30, and its
prices read again from the rendered page on 2026-10-02 and on 2026-10-26;
both sheets re-verified on 2026-10-27.

## The merchant and the product

AFS is the foil, board and wing brand of Foil And Co, a Breton manufacturer
that designs and builds its products in Pencran, Finistère, with a team of
forty. It sells direct from afs-foiling.com, in English with a French
edition, and through a network of dealers it maps on its own site.

The product is the Blackbird V3, a downwind foil board sold bare in ten
sizes, 2 299 € to 2 349 € at their regular price:
https://afs-foiling.com/product/blackbird-v3

## What the page says today, and what the sheet adds

The page has no product structured data. The price shows "Loading…" until
the browser fetches it, and the per-size stock is a dropdown state. Yet the
storefront ships the shop's full product record inside the page, and the
shop's public API returns each size's price and stock. The spec table and
the rider-weight guide are plain text. The return and warranty terms are a
strip in the buy drawer and a separate terms page.

The sheet makes all of that answerable in one read:

| Question an agent might be asked | From the page | From the sheet |
|---|---|---|
| Is the 8'0 × 19½ in stock? | Selects it and waits for a script | One unit left; nine other sizes on back order |
| What does it cost? | Waits for the price to load | 1 637,30 € to 2 349 € including VAT, per size; one size on sale with its regular price |
| Which size for an 85 kg rider? | Reads the size guide | Four sizes carry that limit, as a value on each |
| How long, how wide, how heavy? | Reads a ten-row table | Numbers with units on every size, display strings kept |
| What is the warranty, can I return it? | Reads the strip and the terms | Two years and fourteen days on the offer; the legal terms, with the return costs, on the seller |
| What goes with it? | Scrolls "Recommended products" | Five merchant-chosen upsells |
| Where can I buy it in person? | Opens a map | 95 dealers with addresses and phones |

## Where it came from

- **The shop's product record**, as the page ships it, gave the name, the
  ten sizes, the images, the gallery video, the categories, the rating and
  the upsell products.
- **The shop's public API** gave each size's price, stock and backorder
  state.
- **The product page** gave the description, the spec table and the rider
  weights, quoted as written.
- **The legal notice, the terms of sale and the team page** gave the
  company identity, the withdrawal and delivery terms, the payment methods
  and the head count.
- **The dealer map's own records** gave the 97 resellers.

The human decisions: whether to declare per-size addresses, and how to
treat statements that disagree. The prices follow the specification's
"Tax inclusion" rule.

## What AFS would decide

- **Prices.** The sheet carries, for each size, the price the page
  displays once that size is selected. One size was on sale on
  2026-10-26; its offer carries the sale price, with the regular price
  beside it. AFS's terms of sale state that prices are in euros inclusive
  of all taxes, and the record the page embeds names the displayed amount
  as its tax-inclusive price. The offers say so with
  `valueAddedTaxIncluded`. The sheet declares France as the market: the storefront shows one euro price
  to every visitor, and that price is the French consumer price. A producer
  running inside the shop would take the displayed price directly.
- **Per-size addresses.** The shop's own per-size links point at the
  backend host, not the storefront, so the sheet declares none. The public
  linter flags this as a warning, correctly: an agent cannot link a buyer to
  a size.
- **The category.** The page files the board under "Good deals / End of
  line", a merchandising bucket, and the sheet follows the page. A
  merchant would likely prefer "downwind boards".
- **Store-wide terms live once.** The legal withdrawal terms and delivery
  clauses sit on the organization sheet.

Where the site contradicts itself:

- In September the page said "Free returns within 15 days" while the terms
  of sale gave the legal fourteen days with return costs on the buyer, and
  the footer said "2 to 3 years warranty" while the page said two years. By
  2026-10-27 the strip says "Returns within 14 days", the footer strip is
  gone, and the statements agree. The sheet carries the page's statements
  on the offers and the terms on the seller.
- The description lists volumes for three 8'8 sizes that differ from the
  spec table. The sheet follows the table.
- The legal notice gave Pencran as head office and Le Tréhou as registered
  office, and a different share capital from the terms. Since the terms were
  rewritten, both name one office and one capital.
- The dealer map's addresses are free text in a dozen formats; twenty name
  no country.

## What publishing would take

A WooCommerce plugin on the backend would have every product value the
sheet needs, including the tax-inclusive price, and could serve the sheet
next to the product, served as `application/pagefront+json`. The storefront
would add one link tag, `rel="alternate"` with
`type="application/pagefront+json"`. The organization sheet is one file,
refreshed when dealers change. The
organization sheet validates clean; the product sheet carries the one
expected warning above.

## Weight

What a reader downloads to get the product data, measured on 2026-09-04
with one request each:

| | On the wire | Uncompressed |
|---|---|---|
| Product page, HTML document only | 80 KB | 358 KB |
| Product sheet | 3.5 KB | 39.3 KB |
| Organization sheet | 6.8 KB | 46.8 KB |

The document alone is twenty-three times the sheet, and it shows no price:
that arrives after 25 script files load and call the shop's API, alongside 6
stylesheets and the images. The sheet carries all ten sizes, prices and
stock states in one request. The organization sheet is larger than the
product sheet because it carries the dealers.

## For implementers

The product sheet is a `ProductGroup` varying by size with ten variants,
ten offers linked by `itemOffered`, and a `pagefront:featureGroup` per size
carrying the table's rows as numeric values with UN/CEFACT units and the
merchant's display strings as `pagefront:presentationValue`, plus the rider
weight on the registry's `max_rider_weight` id. Offers carry a warranty and
a return-policy override; upsells are `recommended_with`. The shop's
related items are left out: it reshuffles them on every page load, so any
list would be one draw. Brand owner and manufacturer are reference stubs to an
organization identified on the company's own domain so a future AHD sheet
can share it. The organization sheet exercises all three roles, the SIREN
rung of the registration ladder, and a 97-entry reseller list with typed
dealer categories.

## Method

Sources read on 2026-09-04: the product page and the product record it
embeds, the shop's public product API for the ten sizes and the upsell
products, the French edition, the home page, the legal notice, the terms of
sale, the team page, the dealer map and its records, and foilandco.fr.
Every value in both sheets was checked against those sources by a script
that accepts a value only if it is quoted from a page, matched against
shop data, or derived by a stated rule. Prices are the ones the page
renders: on 2026-10-02, and again on 2026-10-26, each of the ten sizes was
selected in a browser and its displayed price read. The page's structured
data gives one figure, a lowest price of 1 637,30 €, which agrees with the
lowest rendered price.
The shop's tax-exclusive amounts were used only to check the rendered
ones. Values that are the editor's reading: image and video roles, the
new-condition flag, the feature-group labels, and the country codes on
dealer addresses.

The organization sheet's sources were read again on 2026-10-27, in a
browser: the legal notice, the terms of sale, the team page, the factory
page, the home page, the product page and the dealer map with its records.
The terms of sale had been rewritten, so the withdrawal, delivery and
payment statements are quoted from the new text. The legal notice now gives
one office and one share capital, the same as the terms. foilandco.fr now
redirects to the shop, so the founding year it stated is no longer carried.
The reassurance strips the home page used to show, among them click and
collect, worldwide delivery and payment in instalments, no longer render on
any page read, so the delivery and payment statements come from the terms
alone. The dealer map held 135 records, 97 of them in the dealer, advanced
dealer and distributor categories the sheet carries; the other 38 are
schools and a test centre, as before.

The product page was read again the same day, size by size in the buy
drawer, and the store's public API beside it: the ten rendered prices and
the stock states were unchanged, one size still on sale and one still with
a single unit. The strip in the drawer now says "Returns within 14 days",
and the offers follow it. The drawer also shows a scheduled departure date
for each size, which the sheet does not carry: it is the date the board
leaves the workshop, and the sheet's delivery estimate names the date the
customer receives it.

## History

- **v0.4.1 to v0.9, Whitebird Mid Length** — the merchant's first worked
  example, a three-size board family; the shape behind the feature-group
  extension.
- **2026-08-14** — organization sheet added from the legal notice, terms
  and foilandco.fr.
- **2026-09-04** — case switched to the Blackbird V3; both sheets derived
  from the live site.
- **2026-09-18** — offers state their tax basis and market.
- **2026-10-02** — prices read from the rendered page, size by size: eight
  unchanged; the 7'6 × 20" and the 8'4 × 19" on sale at 30 % off, carried
  as sale price with the regular price.
- **2026-09-30** — product sheet re-verified: prices and stock unchanged;
  the spec table's construction and box columns follow the page's current
  split; a fifth upsell added; the related items dropped, since the shop
  reshuffles them on every page load.
- **2026-10-02** — sheets moved to commerce release 0.4.0 (`release` and
  `$schema` only); no other value changed.
- **2026-10-18** — each offer states the page where it is bought (`url`,
  the product page, which every size shares); no other value changed. The
  page states no checkout link, so no checkout template is carried.
- **2026-10-18** — sheets moved to commerce release 0.5.0 (`release` and
  `$schema` only); no other value changed.
- **2026-10-26** — prices read from the rendered page, size by size: the
  7'6 × 20" sale has ended and its offer carries the regular price of
  2 299 €; the 8'4 × 19" is still on sale at 30 % off; eight unchanged.
  The product sheet's `generated_at` and `expires_at` moved to the day.
- **2026-10-27** — organization sheet re-verified against the live site.
  The withdrawal, delivery and payment statements follow the rewritten
  terms of sale; the registered office is Espace Joseph Rolland, ZAE de
  Gorrequer, as the legal notice and the terms now both state; the founding
  year and the foilandco.fr link are dropped, that site having become a
  redirect; two dealers added, for 97. The envelope carries the day's
  `generated_at` and a new `expires_at`. The page weights were not
  re-measured.
- **2026-10-27** — product sheet re-verified: prices and stock states
  unchanged; the offers' return statement follows the drawer's strip,
  "Returns within 14 days", where the page used to say fifteen days free.
  The envelope carries the day's `generated_at` and a new `expires_at`.
