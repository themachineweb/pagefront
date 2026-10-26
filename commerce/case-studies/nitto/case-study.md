# Nitto Knitwear — Case Study

Commerce release 0.5.0. Sheets derived from the live site and verified against
it on 2026-09-30.

## The merchant and the product

Nitto Knitwear is a French men's knitwear brand launched in 2022 by a family
workshop in Clamart, near Paris, that has been knitting since 1972. It
designs, makes and sells its own garments on a Shopify store, in French with
an English edition, and through 148 stockists it lists on its own site.

The product is the Youri turtleneck in orange, a 195 € extra-fine merino
jumper sold in five sizes. It is one of eight colours, and the page also
links the crew-neck and cardigan versions of the Youri:
https://www.nittoknitwear.com/products/pull-col-roule-youri-orange

## What the page says today, and what the sheet adds

The page carries Schema.org markup: a product group with the five sizes,
their SKUs, price and stock, and an organization block with a return policy
and shipping rates. That covers what the shop's database holds. What makes
the jumper worth buying is prose in accordion panels and a size-guide
pop-up: the yarn and where it was spun, two wool certifications, the size
table, the fit advice, the stitch, the care, the delivery date.

The markup and the page also disagree in three places. The markup lists S
to XL in stock, and the page's size selector marks each of them "Peu
d'unités", few units left. The markup gives every size a weight of 0.77 kg;
the description says 850 grams in size L. The markup's category is "Col
roulé", the shop's product type, and the navigation files the jumper under
"Pulls".

The sheet turns the prose into answers an agent can act on, and follows the
page where the two disagree:

| Question an agent might be asked | From the page and its markup | From the sheet |
|---|---|---|
| Is a size M in stock? | In stock in the markup, few units on a badge | Limited availability, with the SKU; XXL out of stock |
| Will it fit me? | Reads a table in a pop-up | Three measurements for five sizes, two model references, "choisir votre taille habituelle" |
| What is it made of, and where? | "Laine mérinos" and France in the markup, the rest in a panel | 100 % extra-fine merino, RWS and Woolmark yarn, spun in Italy, knitted and made up in the Clamart workshop |
| When would it arrive? | Reads a line in the cart | 3 October 2026 |
| How do I return it? | 14 days, free, in France, from the markup | The same, with the conditions and the prepaid label, on the seller's own sheet |
| Where can I see it in a shop? | Opens a map widget | 148 stockists with addresses, on the seller's sheet |
| What other colours and models are there? | Reads the swatches and the model switch | Ten pages declared as one family, by colour and model |
| Is there an English version? | Reads hreflang | Declared as a sibling |

Two sheets carry this. The product sheet describes the jumper; the
organization sheet describes Nitto Knitwear as brand, maker and seller, with
its legal identity, shipping tariff, return policy and stockist list, and
every product sheet points at it.

## Where it came from

Nothing in either sheet was written for it. Every value is on the site or
in the shop's own data:

- **Shopify product data** gave the five sizes, their SKUs and which can be
  ordered, the price, the images, the description and the season.
- **The product page** gave the size table, the model references, the
  certifications, the spinning country, the construction, the care
  instructions, the highlights, the stock badges, the delivery date and the
  fit advice, all quoted as written.
- **The legal notice, shipping page and terms of sale** gave the company
  identity, the tariff table and the return terms.
- **The stockist map's own data feed** gave the 148 shops.

The human decisions were small: which statement wins when two disagree,
which words become the category, and how to name identifiers.

## What Nitto would decide

- **Sizes as variants.** The markup already declares them. The sheet keeps
  the same SKUs and gives each size the stock level the page shows.
- **Colours and models as a family.** Each colour and each model
  (turtleneck, crew-neck, cardigan) is its own page. The sheet declares the
  ten pages the product page links as one family, so an agent can offer the
  navy turtleneck or the orange cardigan from this page.
- **One language per sheet.** The French edition is the default, so the
  sheet is French; the English edition would be a second file.
- **The category is the shop's own word.** "Pulls", from the navigation.
- **Prices state their basis.** The price is the one the page displays,
  195 €, and the page's structured data gives the same figure. The terms
  of sale say prices are shown including VAT ("les prix sont indiqués
  ttc"), and the page's market selector shows "France - EUR €". Each offer
  says so with `valueAddedTaxIncluded` and declares France with
  `areaServed`. The shop
  also runs an EU storefront, which showed the same 195 € on 2026-09-30.
- **Store-wide terms live once.** Return policy and shipping tariff sit on
  the organization sheet; the product sheet inherits them.

Three statements on the site do not match the shop's state or each other:

- A banner under the add-to-cart button says the product "est en train
  d'être fabriqué et sera disponible à la vente fin septembre 2026". It
  shows on every size, and S to XL can be added to the cart. The sheet
  follows the cart: S to XL on sale, XXL out of stock with the page's
  back-in-stock alert.
- The weight, 0.77 kg in the markup and 850 grams in the description. The
  sheet follows the description.
- The street number. The legal notice gives 45-47 and the terms of sale
  45/47; the markup gives 45. The sheet follows the legal notice.

## What publishing would take

The markup the page carries today is a starting point: the sheet adds the
panels' content and takes stock and weight from what the page states. A
Shopify app or a small script that reads the product, writes the sheet,
serves it at a stable URL on nittoknitwear.com, and adds one link tag to the
product template: `rel="alternate"` with `type="application/pagefront+json"`,
the type being what tells the sheet apart from the page's other alternates. The organization sheet is one file, updated when the
tariff or the stockists change. Both sheets validate clean against the
public rule catalogue.

## Weight

What a reader downloads to get the product data, measured on 2026-09-30
with one request each:

| | On the wire | Uncompressed |
|---|---|---|
| Product page, HTML document only | 67 KB | 498 KB |
| Product sheet | 3.7 KB | 23.1 KB |
| Organization sheet | 7.5 KB | 68.7 KB |

The document alone is eighteen times the sheet, and it is the small part:
it goes on to reference 14 scripts, 2 stylesheets and 32 images before the
page is what a person sees. The sheet is one request, and it needs no
script to be read.

## For implementers

The product sheet is a `ProductGroup` varying by size, with five variants
carrying SKU, per-variant offers linked by `itemOffered`, and the
colour-and-model family carried inline in `isVariantOf` since no family
page exists. It exercises the size chart, size recommendation,
construction, material composition, a manufacturing chain with a stage
abroad, two yarn-scoped certifications and product highlights, and legal
entities as reference stubs to the organization sheet. The organization
sheet exercises all three commerce roles, the registration identifier
ladder at the SIREN rung, store-wide fulfilment terms with conditional
pricing, and an authorized-reseller list of physical shops with addresses
and no websites.

## Method

Sources read on 2026-09-30: the product page, its Shopify product data and
its Schema.org markup, the Shopify data of the nine sibling pages, the
English edition, the home page, the legal notice, the shipping and returns
page, the terms of sale, the workshop page, and the stockist widget's data
feed. Every value in both sheets was checked against those sources by a
script that accepts a value only if it is quoted from a page, matched
against the shop's data, or derived from either by a stated rule. Values
that are the editor's reading of the page: image
roles, the "true to size" reading of the fit sentence, the certification
issuers' names, the new-condition flag, and the Clamart workshop as the
place of knitting and making up, which the product page states as "notre
atelier" in France and the site banner places in Clamart. The delivery date
is the one the page's cart summary shows.

## History

- **v0.1 to v0.4.1** — first worked example; drove five additions to the
  format. Scored against a rubric later retired.
- **2026-08-11 to 08-31** — re-emitted at 0.8 and 0.9; organization sheet
  added; stockist list added.
- **2026-09-04** — both sheets re-derived from the live site; sizes modeled
  as variants; all prose in French as written.
- **2026-09-18** — offers state their tax basis and market.
- **2026-09-30** — the Vahé long-sleeve in indigo left the catalogue; the
  case moved to the Youri turtleneck in orange and both sheets were
  re-derived; the stockist list grew to 148. The Vahé sheet is archived.
- **2026-10-02** — sheets moved to commerce release 0.4.0 (`release` and
  `$schema` only); no other value changed.
- **2026-10-18** — each offer states the page where it is bought (`url`,
  the size's own page); no other value changed. The page's structured data
  states no checkout template; its `buy` link element names a single-unit
  cart URL under a separate protocol, and is not carried.
- **2026-10-18** — sheets moved to commerce release 0.5.0 (`release` and
  `$schema` only); no other value changed.
