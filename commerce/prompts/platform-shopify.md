### Shopify

- Documentation: https://shopify.dev/docs/api/ajax/reference/product
- Serve prompt, the next phase: https://themachineweb.org/pagefront/publish/serve/shopify
- **How it shows itself**: Shopify documents no marker for its storefront
  pages. Its product pages live at `/products/<handle>`, and the documented
  Ajax API answers `<origin>/products/<handle>.js` with that product as JSON
  ("an unauthenticated API. It doesn't require access tokens"); a page whose
  product address answers so is a Shopify storefront. A store whose pages all
  show a password page ("all of your online store's pages are hidden from
  visitors"), every address redirecting to `/password`, is closed: read it
  as "A closed shop" says. A store on its own front (a custom
  storefront, built with Hydrogen or another framework) does not answer the
  Ajax API, which "can only be used by themes that are hosted by Shopify";
  a shop whose product address does not answer `.js` but whose images are
  served from `cdn.shopify.com` is a Shopify store on its own front.
  Read it as "On its own front" below says.
- **Sheet path**: `/apps/pagefront`.
- **Ids**: a product's `handle` from the Ajax API and a collection's from
  the collections feed. A page's handle is the last segment of its address,
  `/pages/<handle>`, the URL structure Shopify documents; this is the one
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
  listing, and most shops answer two feeds it does not document, which a
  shop can switch off and the storefront's rate limit applies to:
  `<origin>/collections.json?limit=250&page=<n>`, every collection
  published to the online store, each with its `handle`, `title`,
  `description`, `image` and `products_count`, 250 a page until a page
  comes back empty; and
  `<origin>/collections/<handle>/products.json?limit=250&page=<n>`, that
  collection's products in its own order, each with its `handle` and
  `variants`. Read the catalogue from them: the collections from the
  first, each one's members from the second, one request per collection,
  spaced. The main navigation on the homepage gives the tree alone, as the
  next bullet says. Where the feeds do not answer, read the catalogue
  from the shop's pages instead, the main navigation's links to
  `/collections/<handle>` pages and those pages' links to products, and
  say so in the report.
- **The sets**: every collection the collections feed lists. Its kind
  comes from the main navigation: a collection the navigation links to is
  a `category`, nested as the navigation nests it (up to three levels),
  its parent the collection of the menu entry above it; a menu entry that
  links to no collection has no page, and its children attach to the
  nearest collection above it; a collection the navigation does not link
  to is a `collection`, top-level. The listing of every product at
  `/collections/all` is no collection: the feed does not list it, and a
  menu entry pointing at it is an entry with no collection behind it.
  Shopify's default collection, handle `frontpage` whatever its title
  (every store starts with it, "a collection of products that are shown
  on the front page of the online store"), holds the products the theme
  shows on the homepage: no set, left out of the sets and of the
  organization sheet's catalogue, and the report says so.
  Which collections hold a product: every collection whose feed lists it,
  at any depth; a product no feed lists has no set, and the report says
  so. The product's own `isPartOf` follows the core rule: every set whose
  sheet exists, written in this run or found online, and whose listing
  shows the product among its direct members. Members: the collection's
  feed, in its order, which is the collection's own. A parent collection
  often holds its subcategories' products too, added by the merchant so
  its page shows them all: its direct members are the products in its
  feed that are in none of its subcategories' feeds, at any depth. The
  member is `<origin>/products/<product handle>`, and its type is the
  product's own: more than one entry in `variants` is `ProductGroup`, one
  is `Product`. The collection's `name` is its `title`, its `description`
  the plain text of the feed's `description`, its `image` the feed's where
  there is one, its page `<origin>/collections/<handle>`. Where the feeds
  do not answer: the collection's page and every page its pagination
  links to, the product tiles in the order shown, a tile's product read
  from its `.js`, member by member, and a member whose data is refused
  said so in the report. Whether a collection is filled by a rule is an
  admin setting that public data does not show: the Collection spec's
  default applies, assembled by hand, and the report says so.
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
  listing pages are its own too: read the sets from them as "The sets" says
  where the feeds do not answer, a member's url as its tile links it, its type from its page's script data or
  structured data (several variants: `ProductGroup`). Prices: the one the
  page displays, as rule 4 requires; a price shown only after options are
  chosen is read by choosing each combination where your browser can, and
  otherwise left out, saying so; the script data's amounts only check it.
