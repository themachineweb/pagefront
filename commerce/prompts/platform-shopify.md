### Shopify

- Documentation: https://shopify.dev/docs/api/ajax/reference/product
- Serve prompt, the next phase: https://themachineweb.org/pagefront/publish/serve/shopify
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
  cannot be listed from public data: none; say so. Which collections a
  product adds to the run: its page's breadcrumb, which names the
  collection that holds it last and that collection's ancestors before it,
  the set's parents for its `isPartOf`; a theme that links the product
  under a collection's path (`/collections/<handle>/products/<product
  handle>`) names that collection too. A product page that names no
  collection adds no set to the run: say so in the report, naming the page
  as the source. The product's own `isPartOf` follows the core rule: every
  set whose sheet exists, written in this run or found online, and whose
  listing shows the product among its direct members, breadcrumb or none.
  Members: the collection's page and every page its
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
  Product. Where the `.js` address cannot be read (a browser that refuses
  an address ending in `.js` as a script), the fallback is
  `<origin>/products/<handle>.json`, which Shopify does not document: the
  same product under a `product` key, with `title`, `body_html` (the
  description, as HTML), `vendor`, `product_type`, `handle`, `options` as
  objects with `name` and `values`, `images` with `src`, `alt`, `width` and
  `height`, and `variants` with `sku`, `barcode`, `option1` to `option3`,
  and `price` and `compare_at_price` as decimal strings in the currency
  `price_currency` names (`"749.95"` is 749.95: written as it is, never
  divided by 100; an empty `compare_at_price` is no former price). It
  carries no `available`: availability comes from the page, as rule 4
  says. Every `id` in it is Shopify's internal number. Say in the report
  which address was read.
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
