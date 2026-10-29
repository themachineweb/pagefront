# Changelog: Pagefront prompts

The prompt set's own semver; see "Versioning" in [`README.md`](README.md).

## Unreleased

## 1.5.0 — unreleased

For commerce release 0.5.0.

- The prompts point at the product spec as a field reference and stop
  restating its per-field source rules. The spec now states, for each
  field, where its value comes from and what checks it, so the rules on
  the price and its tax basis, the market, the availability, the former
  price, the category, the identifiers, the FAQ questions, the parcel
  weight, the related products and the general "any other field" clause
  leave `core.md` and the one-product prompt; what stays is the procedure
  and what the platform settles (identities, addresses, the platform's
  precedence over the page, the report).
- An image's alt text is never written as its caption; ratings follow the
  spec (`aggregateRating` as the page shows it, no reviews).
- The one-product prompt puts one Offer per variant on a ProductGroup, as
  the core prompt and the spec do; it no longer allows a group-level offer
  for a family with one price. Its trap on the market no longer names a
  country in the URL as a source, which the spec forbids.
- The header describes the spec as a field reference whose design notes
  are not needed to write a sheet.
- Text taken from structured data or from HTML is decoded, so a value
  reads as the page shows it. A Shopify run had copied sixteen FAQ answers
  with `&#39;` where the page shows an apostrophe, and a description with
  the HTML's indentation.

## 1.4.0 — 2026-10-28

For commerce release 0.5.0. One tag for the changes made as 1.2.0, 1.3.0
and 1.4.0.

- Product sheets carry `question` where the page shows a FAQ for the
  product, one entry per pair as the page writes it, from the page's text
  or its `FAQPage` structured data where the two agree; shop-level
  questions and composed pairs are left out (`core.md` and the one-product
  prompt). A Shopify product page with sixteen merchant-written questions
  in a `FAQPage` block had produced a sheet without them because no rule
  asked for them.
- A general clause closes the product field list: any other field the
  spec defines, where the page or the platform's data states the value in
  the spec's sense, as written and with its source in the report; nothing
  composed, nothing the shop does not state. The per-field rules stay for
  the fields whose source is a question of its own.
- Shopify, chat route: which collections hold a product is read from the
  product page's breadcrumb, the last entry the set that holds it and the
  others its ancestors, in place of reading every navigation collection's
  listing. A collection the page does not name is not listed for the
  product, and the report says so. A run on a Shopify shop with 23
  navigation collections had read 300 listing pages to place one product.
- Chat route: a collection sheet is written for the set that holds a
  product directly; its parents, up to the top level, are named in
  `isPartOf` by page address without a sheet, and the report says so. The
  code route keeps writing the parents' sheets. A root category with
  thousands of products no longer means reading its every listing page to
  place one product.
- Shopify: member types in bulk. Where the shop answers
  `/collections/<handle>/products.json`, a listing Shopify does not
  document, each member's type comes from its `variants` there, 250
  products a page, in place of one `.js` request per member; the listing
  page keeps membership and order, since the feed's order is the shop's
  own and differs from the listing's. Where the feed does not answer, the
  `.js` request per member stays. The same run had made 2,297 single
  requests and the storefront's rate limit refused every one.
- The header's spec links point at the specs' plain-text form (`.md`),
  with the page beside each, and a line says the schema links are JSON
  files to download and that the product spec is longer than a reader may
  hold. Chat assistants' page readers failed on the HTML pages and the
  schema files while a direct download succeeded; the text form is what a
  reader opens (`core.md` and the one-product prompt; the six built
  prompts rebuilt).

## 1.1.0 — 2026-10-21

For commerce release 0.5.0.

- The chat-route write prompts take a list of product page addresses as
  their input and find the shop from them. Pasted alone, the prompt's first
  reply asks for that list and nothing else; given the list with the prompt,
  it starts at once (rule 1 and Step 1 of `core.md`; the six built prompts
  rebuilt).
- The code-route prompts keep the homepage address as their input.
- The one-product prompt keeps its behaviour and carries the set's version.

## 1.0.0 — 2026-10-20

First versioned set, for commerce release 0.5.0.

- Write-phase prompts for a whole shop, built from `core.md` and a platform
  section: generic, Shopify and WooCommerce, each on the chat route and the
  code route (`write-<platform>-<route>.md`).
- The one-product page prompt, `draft-product-from-page-chat.md`, which
  drafts a Product sheet from a single product page; it was served from the
  site's own content folder before this set.
