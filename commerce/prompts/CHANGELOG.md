# Changelog: Pagefront prompts

The prompt set's own semver; see "Versioning" in [`README.md`](README.md).

## Unreleased

## 1.13.0 — 2026-11-09

For commerce release 0.5.0.

- Each chat prompt asks for its input one question at a time, and gives an
  instruction only when an answer calls for it. Write phase: the first
  reply asks for the product addresses alone; with them in hand, the
  assistant asks whether the shop has sheets already; a merchant who says
  no is on a first run and the run starts, one who says yes is asked
  whether those sheets are online or written and waiting, and only one
  with sheets waiting is told to attach the archives. Serve and link
  phases: the archive is asked for alone, then whether this is a first
  setup (first linking) or an addition. Until now each prompt's first
  reply asked for everything in one message, with the archive instruction
  in it, which a merchant on a first run had no use for. The code route is
  unchanged.
- WooCommerce section: the Store API's `weight` and `dimensions` are the
  measurements the merchant publishes on the product page's Additional
  information table, written as the product's `weight`, `depth`, `width`
  and `height` in the store's units. The section had called them the
  fields WooCommerce uses for shipping rates, and a run left a product's
  published weight and dimensions out of its sheet on the spec's rule that
  a shipping weight or a parcel size is never the product's own.
- Serve phase: the closing message, after the last step, ends with what
  comes next, as the write phase's handover does: the sheets answer and no
  page points at them yet, and the link phase, with its own prompt, makes
  each sheet findable from its page. Each platform's section carries the
  address of its link prompt. A run had closed on the checks alone.
- Write phase, chat route: the handover's lines on what comes next point at
  the serve prompt's address, which each platform's section carries; the
  generic section says no serve prompt exists for other platforms yet and
  points at the publishing page.

## 1.12.1 — 2026-11-09

For commerce release 0.5.0.

- Write phase, chat route, two gaps in the Step 1 rule on the sheets that
  exist. The top-level sets the organization sheet lists in
  `hasOfferCatalog` are fetched too, so a run under one root keeps the
  hints on the roots of earlier runs when it rewrites the organization
  sheet; until now only the sets of the run's own chain were fetched and
  the other roots lost their hint. And a merchant with more than one run
  written and not yet online attaches every archive, one per run, since
  each holds its own run's sheets alone.

## 1.12.0 — 2026-11-09

For commerce release 0.5.0.

- Each chat prompt asks the merchant one more thing with its input: whether
  this is the shop's first run or an addition. Write phase: with the
  product addresses, whether sheets exist already, online or written and
  not yet online (then the earlier run's `commerce.zip` is attached). Step 1
  finds the sheets that exist, by fetching the address of each sheet the
  run's sheets reference or by reading the attached archive, and the
  merchant sees in the Step 1 summary which of them the run will rewrite.
  A sheet points at another's address when that sheet exists, written in
  this run or found in Step 1, so a later run keeps the hints of earlier
  ones instead of dropping them when a shared parent or the organization
  sheet is rewritten. The archive holds the sheets of this run alone, new
  and rewritten, uploaded over what is there; the report lists which is
  which. Serve phase: on an addition, the steps are the kit and the upload
  into the merchant's existing bucket, then the checks on the sheets of
  this run. Link phase: on an addition the code step is left out, its
  check run before the first field step and the step given if the check
  fails. The code route is unchanged.

## 1.11.0 — 2026-11-09

For commerce release 0.5.0.

- Write phase, chat route: the assistant writes a sheet for the set that
  holds each product directly and for each of its parents up to the top
  level of the tree, the sets the organization sheet lists in
  `hasOfferCatalog`, each with its direct members read as the platform's
  section says. Every `isPartOf` entry of a category sheet then names a
  sheet written in the run, as the Collection spec's kind rule requires of
  a category's parents. Until now the route wrote the direct set alone and
  named its parents by page address with no sheet, which left those
  entries resolving to nothing. Step 1 shows the merchant each product's
  set and the sets above it; the report's line on sheetless parents goes.
  The code route and the platform sections are unchanged.

## 1.10.0 — 2026-11-06

For commerce release 0.5.0.

- The link phase joins the set: `link-core.md`, `link-platform-shopify.md`
  and `link-platform-woocommerce.md`, built as `link-shopify-chat.md` and
  `link-woocommerce-chat.md`, chat route only. The prompt takes the
  `commerce.zip` the write phase handed over and the serve phase put online,
  lists each sheet's page from its `canonical_url`, and walks the merchant
  through one piece of code pasted once (a block in the theme on Shopify,
  a Code Snippets snippet on WooCommerce) and one field per page holding
  the sheet's `sheet_url`, one step per message, each step's pages checked
  before the next. The code prints the declaration only where a field holds
  an address under the shop's sheet path. On WooCommerce the snippet also
  carries the `Link` header and the entry point (`/.well-known/pagefront`
  and the `Pagefront:` line in `robots.txt`); Shopify has neither, by
  decision, and the report says so once. The WooCommerce path was walked
  end to end on 2026-11-05; the Shopify path on 2026-11-06 for one product
  on a password-protected development store, so its collection and page
  definitions and the public checks on an open store are untested. The
  admin screens are described as seen on those dates.
- Serve phase, Step 3: each message opens by naming what the merchant is
  about to make or change, as their dashboard calls it, and what it does
  for the shop; and each step carries its check, run before the next
  step: none for the first six, one sheet fetched at the Worker's address
  after the seventh, the full checks after the eighth.
- `build.py` builds the link phase too; ten outputs.

## 1.9.0 — 2026-11-05

For commerce release 0.5.0.

- Chat route of the write phase: the assistant says, before each step,
  what it is about to do and what it gives the merchant, and after it what
  came out. At the end of Step 1 it shows what it found (the shop and its
  platform, the language, each product's set, the organization page) and
  waits for the merchant to confirm or correct it before writing a sheet;
  rule 1 names this one pause. A correction names a page or a set the
  assistant missed; a value the merchant states is still no source. The
  handover ends with what comes next.
- Serve phase: the eight setup steps go one per message. Each opens with
  what the step is for, says what to do and what the merchant should see,
  and waits for the merchant's word that it is done before the next. The
  first message says how many steps follow and what they lead to.

## 1.8.0 — 2026-11-02

For commerce release 0.5.0.

- The serve phase joins the set: `serve-core.md`, `serve-platform-shopify.md`
  and `serve-platform-woocommerce.md`, built as `serve-shopify-chat.md` and
  `serve-woocommerce-chat.md`, chat route only. The prompt takes the
  `commerce.zip` the write phase handed over and walks the merchant through
  Cloudflare R2, a Worker that serves the sheets (`pagefront-worker.js`) and
  the platform's forwarding of the sheet path (`/pagefront` on WooCommerce
  through a Code Snippets snippet, `/apps/pagefront` on Shopify through an
  app proxy on a custom app), then checks every sheet at its address. The
  WooCommerce path was walked end to end on 2026-10-29; the Shopify path on
  a password-protected development store on 2026-10-30, so serving on an
  open store and installing the app on a live store are untested. The
  dashboard screens are described as seen on those dates.
- `build.py` builds the write and the serve phase, together or one at a time.

## 1.7.0 — 2026-10-29

For commerce release 0.5.0.

- Chat route, Step 7: the handover is one file, `commerce.zip`, a zip
  archive with the `commerce` folder at its root and nothing else in it.
  The merchant unpacks it and uploads the folder as it is. Beside it,
  `report.md` (the report) and `checks.json` (the Check's final report per
  sheet, keyed by the sheet's path in the archive), and nothing else: three
  files in all. Code blocks with paths remain the fallback only where the
  assistant cannot make files at all, and it says so.
- Chat route, rule 6: the assistant uses nothing it remembers from other
  conversations, with the merchant or with anyone; every value comes from
  what it reads in this conversation. What a merchant discussed earlier is
  not a source, and a value or decision carried over would corrupt the run.

## 1.6.0 — 2026-10-29

For commerce release 0.5.0.

- Chat route, Step 7: the sheets are handed over as one folder named
  `commerce`, laid out as the addresses are (`commerce/<kind>/<id>.<lang>.json`),
  as an archive where the assistant can make files and otherwise as code
  blocks with their path above them. The merchant uploads the folder as it
  is to the storage behind their sheet path, so the serve step needs no
  renaming or placing; ADDRESSES states that the path after the sheet path
  is the file's path in the folder. The code route's folder is unchanged
  for now.
- One-product prompt: the placeholder `sheet_url` takes the same shape,
  `<origin>/pagefront/commerce/product/<id>.<lang>.json`, and the merchant
  is told where the file goes.

## 1.5.1 — 2026-10-29

For commerce release 0.5.0.

- How to call the Check: POST the sheet as the request body where the tool
  allows it; the URL form takes a sheet up to about 60 KB once encoded and
  a longer one is refused at the edge before the checker sees it, so the
  JSON is serialized compactly. A Shopify run had its first Check of an
  indented collection sheet fail at the edge and pass once compact; the
  core prompt's chat route offered only the URL form.

## 1.5.0 — 2026-10-29

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
