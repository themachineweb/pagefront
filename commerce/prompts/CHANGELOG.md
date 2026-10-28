# Changelog: Pagefront prompts

The prompt set's own semver; see "Versioning" in [`README.md`](README.md).

## Unreleased

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
