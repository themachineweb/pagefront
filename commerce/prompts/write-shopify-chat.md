# Pagefront — write your shop's sheets

- Prompt set 1.6.0, for commerce release 0.5.0.
- Writes Product sheets (spec 0.11.0), Collection sheets (spec 0.1.0) and the Organization sheet (spec 0.5.0), commerce release 0.5.0.
- Product spec: https://themachineweb.org/pagefront/spec/commerce/product.md (page: https://themachineweb.org/pagefront/spec/commerce/product)
- Product schema: https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json
- Organization spec: https://themachineweb.org/pagefront/spec/commerce/organization.md (page: https://themachineweb.org/pagefront/spec/commerce/organization)
- Organization schema: https://themachineweb.org/pagefront/spec/commerce/organization/v0.5.0.json
- Collection spec: https://themachineweb.org/pagefront/spec/commerce/collection.md (page: https://themachineweb.org/pagefront/spec/commerce/collection)
- Collection schema: https://themachineweb.org/pagefront/spec/commerce/collection/v0.1.0.json
- Check: https://themachineweb.org/pagefront/commerce/validate
- The spec links are plain text, the form a reader opens. The product spec is a field reference: for each field, what it means, its shape, where its value comes from and what checks it; read the entries for the fields your sheet uses. Its design notes are not needed to write a sheet. The schema links are JSON files, to download.

You are writing Pagefront sheets for a shop. Your input is a list of its
product pages' addresses; the shop itself you find from them (rule 1). A
Pagefront sheet is a small JSON document that states what a
product, or the business that sells it, is, in the merchant's own words, for
machines to read. Your output is the sheets, as files in a folder, and a report. Serving
them, linking them from the shop's pages and checking them end to end are
later phases, with their own instructions; this one only writes.

The rules, the procedure and what to write hold for any shop. How to read a
given platform's data is in its own section under PLATFORMS; a shop on a
platform with no section there is outside this version.

## RULES — not negotiable

1. **Ask for the product addresses, and nothing else.** Your one input is
   the list of product pages to write sheets for, as addresses. If it came
   with this prompt, start. If it did not, your first reply is one question,
   which product pages to write sheets for, and you wait for the list.
   Everything else, the shop included, you find out from those pages and
   the shop. Where your sources do not settle a value, leave it out and say
   so in the report; never ask again, never guess.
2. **Read before you write.** Read the specs above before writing a sheet:
   the Product spec's entries for the fields your sheet uses and its schema, the
   Organization spec (its "Catalogue entry point" in full), and the
   Collection spec in full. Read the platform's own documentation for
   each API you use. If a page cannot be read, say which and stop; never
   write from memory.
3. **Never write a value you did not read** in the shop's data or on its
   pages. Absolute for: price, priceCurrency, availability, sku, gtin,
   gtin13, mpn, productID, brand, shipping cost, delivery times, return
   terms, certifications, safety warnings, material percentages, country of
   origin. Do not infer, do not use what you know of the brand from
   elsewhere, do not copy a value from a similar product. A missing field
   costs a little completeness; an invented one is worse than publishing
   nothing, because an agent will act on it. inLanguage (the page's declared
   language) and generated_at (the time you write) are exempt.
   Text taken from structured data or from HTML is decoded: an entity such
   as `&#39;` becomes its character, and markup whitespace is dropped, so
   the value reads as the page shows it.
4. **The platform's data comes first, except for the price and the
   availability.** Where the platform's data states a value, use it; take a
   value from the page only where the data does not hold it. The price is
   the one the page displays, checked against the platform's data; if they
   differ, leave that offer out. The availability is the one the page shows
   (in stock, out of stock, on backorder), checked against the platform's
   data; if they differ, the page's stands: say so in the report, and never
   leave out a price the page shows because the data says the item is
   unavailable. Where the page contradicts the data on anything else, leave the
   field out.
5. **Plain words** in the report. The merchant is not a developer.

Your fetch tool may refuse an address you built yourself and open only
addresses that appeared in the conversation or in a page you fetched. Reach
API addresses by following links from responses you already have (an API's
index, a listing's links to its items). If an address you need is refused
and no fetched response carries it, say which in the report and go on with
what you have.

## PROCEDURE

### Step 1 — Find out what the shop is
If no product addresses came with this prompt, ask for them first (rule 1)
and go on once you have them. The shop's homepage is the root of the
product addresses' origin (their scheme and host), followed through
redirects. Addresses on more than one host are more than one shop: say so
and stop. From the homepage:

- **The origin**: the homepage address after redirects.
- **The platform**: each section under PLATFORMS says how its platform
  shows itself. None matches: say so and stop.
- **The language**: the homepage's `<html lang>`, in canonical case.
- **The catalogue**: the product categories and the products, from the
  platform's data. The products to write sheets for are the ones the
  merchant listed.
- **The sets**: the category or collection that holds each of those
  products directly, and the parents it names (COLLECTION SHEETS).
- **The organization page**: the page that describes the shop as a
  business (who runs it, since when, where), an About page linked from the
  homepage. A page that presents a product line, a team or a campaign is not
  it. If no linked page plainly describes the business, the homepage itself.

### Step 2 — Read
The specs and the platform's documentation, per rule 2.

### Step 3 — Write the collection sheets
Per COLLECTION SHEETS, reading the platform as its section says.

### Step 4 — Write each product sheet
Per PRODUCT SHEETS, reading the platform as its section says.

### Step 5 — Write the organization sheet
Per ORGANIZATION SHEET.

### Step 6 — Check what you can
If your fetch tool will open it, check each sheet at
`https://themachineweb.org/pagefront/commerce/validate.json`: POST the sheet
JSON as the request body where the tool allows it; otherwise fetch the URL
with `?sheet=<the sheet, URL-encoded>`. The URL form takes a sheet up to
about 60 KB once encoded, and a longer one is refused at the edge before the
checker sees it, so serialize the JSON compactly, without indentation.
Correct every schema error and every finding of severity
`error` using only what the sources state, and check again. Never add a value
no source states to satisfy the Check: rule 3 outranks it. If the address is
refused, say so in the report.

### Step 7 — Hand them over
The sheets as one folder the merchant can download, named `commerce`, laid
out as their addresses are (ADDRESSES): one subfolder per kind, each sheet
named `<id>.<lang>.json` inside it.

```
commerce/
  product/<id>.<lang>.json
  organization/<id>.<lang>.json
  collection/<id>.<lang>.json
```

Hand it over as one archive of that folder where you can make files, with
the folder at its root. If you cannot make files, give each sheet as one
JSON code block with its path from `commerce/` above it
(`commerce/product/<id>.<lang>.json`). The merchant uploads the folder as it
is to the storage behind their sheet path (serve step); every address then
resolves. Then the report (OUTPUT).

## ADDRESSES

Every sheet's address is `<origin><sheet path>/commerce/<kind>/<id>.<lang>.json`:

- `<sheet path>` is the path the platform forwards to the sheet server; its
  section under PLATFORMS gives it;
- `<kind>` is `product`, `organization` or `collection`;
- `<id>` is the platform's own handle for the thing the sheet describes, as
  the platform's data states it (never cut from a URL);
- `<lang>` is the sheet's `inLanguage`.

The part after `<sheet path>`, `commerce/<kind>/<id>.<lang>.json`, is the
sheet's path in the folder you hand over (Step 7): the folder mirrors the
addresses, so the two cannot differ.

A sheet's own `sheet_url` is its address. The same scheme gives the
addresses the sheets point at: the organization sheet's (from each product
sheet's `seller`), a collection sheet's (from `isPartOf`, `hasPart` and the
organization sheet's `hasOfferCatalog`) and a product sheet's (from
`hasPart`). A sheet points at another sheet's address only when you write
that sheet in this run; a reference to a product or set without one carries
no `pagefront:sheetUrl`.

## IDENTITIES

An `@id` must be the same every time the same thing is written, by you or
by anyone following these instructions: other sheets and agents refer to it.
So it is built by fixed rules, from values the shop states, never chosen:

- a product or product group: its canonical_url plus `#product`;
- a variant: the group's canonical_url plus `#` and the variant's SKU; a
  variant with no SKU, plus `#` and its dimension values in the order
  variesBy lists them, lower case, joined by `-`;
- the organization: its page's canonical_url plus `#organization`;
- a category or collection: its page address plus `#collection`.

## COLLECTION SHEETS

A collection sheet describes a listing page: a category, or a collection the
shop arranges products in. Write one for each set Step 1 found, to the
Collection spec.

Which sets:

- the set that holds a product you write a sheet for directly, the one its
  page names as holding it (the platform's section says where). Its
  parents, up to the top level of the tree, get no sheet in this run: the
  sheet names them in `isPartOf` by page address, with no
  `pagefront:sheetUrl`, and a later run or the code route writes them;
- a `collection` filled automatically by a rule (new arrivals, a sale,
  every product with a tag), where the platform's section says how to tell:
  none, and no product's isPartOf names it; say so in the report. A
  `category` keeps its sheet however it is filled;
- a set whose listing you cannot read in full (a page that will not open,
  more products loaded only by scrolling with no link to the next page):
  none, since the spec requires the complete list; say so, and say which.

What to write: the envelope the spec defines, with the collection schema URL
as `$schema`, `release` `0.5.0`, `canonical_url` the listing page (read as
for a product page), `sheet_url` its address, `generated_at` now, and
`expires_at` within a day of `generated_at` for a category the platform's
section says is filled by a rule, none otherwise. The data block:

- `@context` in the spec's array form, `@type` `Collection`, `@id` per
  IDENTITIES, `name` as the page displays it, `inLanguage`, `url` the listing
  page;
- `pagefront:collectionKind`: `category` for a node of the shop's
  navigation tree, `collection` for a set outside it, as the platform's
  section says; no `brand` collections in this version;
- `isPartOf`: the parent sets, each in the spec's member entry shape; a top
  level set has none;
- `hasPart`: the set's direct members, in the order the listing shows them
  when the shopper has not sorted or filtered it, one entry per product tile,
  and every subcategory as a `Collection` entry: in the position the
  listing places it, or, where the listing shows no subcategories, first, in
  the order the navigation lists them. A
  product the listing shows only because one of its subcategories holds it
  is not a direct member (the platform's section says when listings do
  this). Each entry in the spec's member entry shape: `@type` (`Product` or
  `ProductGroup` as the product's own data makes it, `Collection` for a
  set), `@id` per IDENTITIES, `url`, `name`, `pagefront:sheetUrl` per
  ADDRESSES, and `pagefront:collectionKind` on a set;
- `description` (plain text) and `image` only where the listing page shows
  them for the set itself.

## PRODUCT SHEETS

For each product, read its data from the platform, then its page, and for a
product with variants, each variant's own page where the platform gives one.
Read each page for the displayed price, any statement that prices include or
exclude tax, identifiers in its structured data, the breadcrumb, and
`<html lang>`.

What a page opens over its content: a cookie banner, a region or language
chooser, a newsletter or sign-up prompt. Close each without choosing
anything it offers: refuse optional cookies, or close the banner; close a
region or language chooser rather than pick an entry, keeping the region
and language the page opened with; decline sign-ups. Say in the report
which region and currency the page showed its prices in. A sign-in or age
prompt that hides the page is not answered: say so and leave out what it
hides.

What to write: the envelope the spec defines, with the product schema URL as
`$schema`, `release` `0.5.0`, `sheet_url` its address, `generated_at` now,
no `expires_at`. The data block follows the spec and the schema in full.
The spec is a field reference: for each field it states what the field
means, its shape, where its value comes from and what checks it. Follow it
field by field, as written; write a field only where the shop states its
value in the spec's sense, and leave out every field it does not; name each
value's source in the report. The rules below are this prompt's own, where
the spec leaves the choice to the producer or the platform settles it:

- @id per IDENTITIES.
- canonical_url and url per the spec's source rule, the platform's
  permalink being the page's address where the page declares no canonical
  link. Say in the report which it was.
- A product without variants is a Product; one with variants is a
  ProductGroup, with one hasVariant entry per variant. Never blend
  variants' values into one product.
- name and description as the platform's data states them, description as
  plain text, verbatim.
- brand as the platform's data states it; if it states none, the `brand`
  the page's structured data states for this product; if neither does,
  leave brand out.
- On a ProductGroup, the dimensions the variants differ by give variesBy,
  per the spec's variant dimensions. An attribute whose meaning you cannot
  read from its name and values is left out. Each variant's @id per
  IDENTITIES, its url its own page where it has one, its image its own.
  The product's other specifications are additionalProperty entries, as
  the platform states them.
- The identifiers as the platform or the page's structured data states
  them, per the spec; a ProductGroup carries productGroupID and each
  variant its own. If none exists, leave it out and say so: the Check will
  refuse the sheet.
- offers: on a ProductGroup, one Offer per variant in the group's
  `offers`, each naming its variant with `itemOffered: { "@id": "<the
  variant's @id>" }`; on a Product, one Offer. Every Offer field per the
  spec, its `price` as a plain decimal string.
  seller: a reference to the organization, with the organization sheet's
  `@id`, name and url, and `pagefront:sheetUrl` the organization sheet's
  address.
- isPartOf: one entry per set you wrote a sheet for whose direct members
  include the product, in the member entry shape, with that sheet's address
  as `pagefront:sheetUrl`.
- Images as the platform's data lists them, with the roles the spec
  defines where the data states them. An image's alt text is never its
  caption.
- No language siblings (pagefront:availableLanguages) until a second
  language exists.
- A product that is not on sale (not purchasable, password-protected, or
  not shown on its page), or that is a bundle of separate products or sold
  on another site: write no sheet for it, and say so.

## ORGANIZATION SHEET

Written to the Organization spec, from the organization page, the homepage
and the shop's public data, under rule 3: release `0.5.0`, `$schema`
`https://themachineweb.org/pagefront/spec/commerce/organization/v0.5.0.json`,
`canonical_url` and `url` the organization page, read as
for a product page, `sheet_url` its address. Its `@id` is the one each product
sheet's `seller` names (IDENTITIES). Its `hasOfferCatalog` lists the
top-level sets of the shop's tree (categories with no parent; a category the
shop does not show is not listed), and the top-level collections the
platform's section names, as the spec's catalogue entry point gives them:
each in the member entry shape, with `@id` per IDENTITIES, its name, url and
`pagefront:collectionKind`, and `pagefront:sheetUrl` per ADDRESSES (only for
the sets you wrote a sheet for).

## PLATFORMS

### Shopify

- Documentation: https://shopify.dev/docs/api/ajax/reference/product
- **How it shows itself**: Shopify documents no marker for its storefront
  pages. Its product pages live at `/products/<handle>`, and the documented
  Ajax API answers `<origin>/products/<handle>.js` with that product as JSON
  ("an unauthenticated API. It doesn't require access tokens"); a page whose
  product address answers so is a Shopify storefront. A store whose pages all
  show a password page ("all of your online store's pages are hidden from
  visitors") is closed: say so and stop. A store on its own front (a custom
  storefront, built with Hydrogen or another framework) does not answer the
  Ajax API, which "can only be used by themes that are hosted by Shopify";
  a shop whose product address does not answer `.js` but whose images are
  served from `cdn.shopify.com` is a Shopify store on its own front.
  Read it as "On its own front" below says.
- **Sheet path**: `/apps/pagefront`.
- **Ids**: a product's `handle` from the Ajax API. A collection's handle and a
  page's handle are the last segment of their addresses, `/collections/<handle>`
  and `/pages/<handle>`, the URL structure Shopify documents; this is the one
  place an id is read from an address.
- **The family identifier**: a Shopify product has no SKU of its own, only
  its variants do. A ProductGroup's productGroupID is the product's
  `handle`, the merchant's own key for it, the one in its address. Shopify's
  numeric product `id` stays out.
- **Languages**: a store with several languages serves each under its own
  path (`/fr`, `/en-ca`) or subdomain; the Ajax API takes the same locale path
  (`/<locale>/products/<handle>.js`).
- **Checkout links**: Shopify documents cart permalinks
  (`/cart/<variant id>:<quantity>`) for apps to generate; they are the
  platform's pattern, not the merchant's statement: never write one as
  `checkoutPageURLTemplate`.
- **The catalogue**: Shopify documents no public product or collection
  listing. Read the catalogue from the shop's own pages: the main navigation
  on the homepage, its links to `/collections/<handle>` pages, and those
  pages' links to products. The top-level product categories are the
  collections the main navigation links to at its first level.
- **The sets**: the collections the main navigation links to, nested as the
  navigation nests them (up to three levels), kind `category`; a menu entry
  that links to no collection has no page: its children attach to the
  nearest collection above it. A collection the navigation does not link to
  cannot be listed from public data: none; say so. Which collections hold a
  product: its page's breadcrumb, which names the collection that holds it
  last and that collection's ancestors before it, the set's parents for its
  `isPartOf`; a theme that links the
  product under a collection's path (`/collections/<handle>/products/<product
  handle>`) names that collection too. A collection the product page does
  not name is not listed for the product: say so in the report, naming the
  page as the source. Members: the collection's page and every page its
  pagination links to, the product tiles in the order shown. A Shopify
  collection is its own list, and a
  parent collection often holds its subcategories' products too, added by
  the merchant so its page shows them all: its direct members are the
  products on its pages that are on none of its subcategories' pages, at
  any depth, so read those pages too. A tile links to the product's page
  (sometimes under the collection's path, `/collections/<handle>/products/<product
  handle>`); the member is `<origin>/products/<product handle>`, and its type
  is the product's own: more than one variant is `ProductGroup`, one is
  `Product`. Most shops answer
  `<origin>/collections/<handle>/products.json?limit=250&page=<n>` with the
  collection's products, each with its `handle` and `variants`, 250 a page
  until a page comes back empty; Shopify does not document it, a shop can
  switch it off, and the storefront's rate limit applies to it. Where it
  answers, take each member's type from its `variants` there; its order is
  the shop's own and differs from the listing's, so the listing page keeps
  membership and order. Where it does not answer, the product's `.js`,
  member by member; a member whose data is refused: say so in the report.
  Whether a collection is filled by a rule is an admin setting,
  not readable from public data: say so in the report.
- **A product's data**: `<origin>/products/<handle>.js`. A product with more
  than one variant is a ProductGroup, one hasVariant entry per entry of
  `variants` (at most 250 are returned); a product with one variant is a
  Product.
- **A variant's page**: the product page with `?variant=<the variant's id>`,
  the structure Shopify documents for variant links.
- **Values**: name `title`; description the plain text of `description`
  (it is HTML); `options` give the variant dimensions and each variant's
  `options` its values. `vendor` is the store's vendor field, which may or may
  not be the brand: use it as brand only where the page presents it as the
  brand. `type` is merchant free text, not a category. `images` are plain
  addresses with no alt text: no caption.
- **Prices**: the Ajax API returns prices "in the customer's presentment
  currency", as whole numbers in the currency's smallest unit (its example
  `"price": 12900` is 129.00; Shopify's Liquid documentation states the same
  convention and that a currency without subunits, such as JPY, still gets two
  extra digits: 1000 yen is 100000); `compare_at_price` above `price` is the
  former price. Check them against the price the page displays.
- **Availability**: the page's, as rule 4 says; `available` checks it
  (true is InStock, false OutOfStock).
- **Identifiers**: each variant's `sku`; its `barcode` carries no type, so use
  it only when it is 8, 12, 13 or 14 digits (13 in gtin13; 8, 12 or 14 in
  gtin). The product's and variants' `id` are Shopify's internal numbers:
  never use them as identifiers.
- **Not readable**: whether prices include tax and which countries the store
  sells to are admin settings; only the shop's pages can state them.
- **On its own front**: the Ajax API does not answer; the product's data is
  the page's script data, in the front framework's own format (React Router
  `window.__reactRouterContext`, Remix `window.__remixContext`, Next.js
  `<script id="__NEXT_DATA__">` or `self.__next_f.push(...)`, Nuxt
  `<script id="__NUXT_DATA__">` or `window.__NUXT__`, or a
  `<script type="application/json">` block), read from the page's raw HTML,
  not a reader view; if your fetch tool does not return the page's scripts,
  say so and write only what the page's structured data and display state.
  That data holds many products (related ones, the menu, recently viewed): use
  only the object for this page's product, its `handle` the last segment of
  the page's address; where several objects carry that handle (the page's
  own product and a card for it elsewhere on the page), they must agree on a
  value, or it is left out. A custom storefront reads its products from the
  Storefront API (https://shopify.dev/docs/api/storefront/latest/objects/Product),
  so read the object by that API's documented fields only: `handle`, `title`,
  `description` (plain text), `vendor` and `productType` as above, `options`,
  `images` or `media` with `url` and `altText` (the caption where it is not
  empty), and `variants` with `sku`, `barcode` (by its digit count as
  above), `selectedOptions`, `availableForSale`, and `price` and
  `compareAtPrice` (each an `amount` in decimal form and a `currencyCode`).
  A field the Storefront API does not document is the front's own: leave it
  out. The front's addresses are its own: a collection's id and a page's are
  the last segment of their addresses on the shop's domain, and a variant
  has a page of its own only where the shop links one. Its navigation and
  listing pages are its own too: read the sets from them as above, a member's
  url as its tile links it, its type from its page's script data or
  structured data (several variants: `ProductGroup`). Prices: the one the
  page displays, as rule 4 requires; a price shown only after options are
  chosen is read by choosing each combination where your browser can, and
  otherwise left out, saying so; the script data's amounts only check it.
## OUTPUT

The folder (Step 7), then the report, in plain words:

- what you found in Step 1;
- for each sheet: what it carries from the platform's data, what from the
  pages, and what was left out and why, including every value a question
  would have settled (the tax basis where no page states it, the selling
  countries, a missing identifier or brand);
- the sets left without a sheet, and why (a collection filled by a rule, a listing not
  read in full, outside what the platform's data lets you list);
- the parents of each product's set, named by page address without a
  sheet, as this route's rule has it;
- what the Check said, or why it could not be run;
- every address your fetch tool refused.
