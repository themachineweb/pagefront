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
<!-- route: chat -->
  Read it as "On its own front" below says.
<!-- /route -->
<!-- route: code -->
  The Admin API reads it as any other store; only the page's own reading
  differs (prices and addresses as the shop's pages show them).
<!-- /route -->
<!-- route: code -->
  You can also look up the shop's domain in DNS: Shopify's documentation
  has a connected domain's `A` record point to `23.227.38.65` (another last
  number is allowed by region, such as `23.227.38.32`) and its `www` `CNAME` to
  `shops.myshopify.com.`. These are shared by every Shopify store: they say
  the shop is on Shopify, not which store it is.
<!-- /route -->
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
<!-- route: chat -->
- **The catalogue**: Shopify documents no public product or collection
  listing. Read the catalogue from the shop's own pages: the main navigation
  on the homepage, its links to `/collections/<handle>` pages, and those
  pages' links to products. The top-level product categories are the
  collections the main navigation links to at its first level.
- **The sets**: the collections the main navigation links to, nested as the
  navigation nests them (up to three levels), kind `category`; a menu entry
  that links to no collection has no page: its children attach to the
  nearest collection above it. A collection the navigation does not link to
  cannot be listed from public data: none; say so. Which collections list a
  product: read every navigation collection's listing. Members: the
  collection's page and every page its pagination links to, the product
  tiles in the order shown. A Shopify collection is its own list, and a
  parent collection often holds its subcategories' products too, added by
  the merchant so its page shows them all: its direct members are the
  products on its pages that are on none of its subcategories' pages, at
  any depth, so read those pages too. A tile links to the product's page
  (sometimes under the collection's path, `/collections/<handle>/products/<product
  handle>`); the member is `<origin>/products/<product handle>`, and its type
  is the Ajax API's: more than one variant is `ProductGroup`, one is
  `Product`. Whether a collection is filled by a rule is an admin setting,
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
<!-- /route -->
<!-- route: code -->
- **Access**: no key in `.env` on Shopify. Use the Shopify CLI
  (https://shopify.dev/docs/api/shopify-cli/store): tell the merchant that a
  browser window will open where they approve read-only access, then run
  `shopify store auth --store <store>.myshopify.com --scopes
  read_products,read_markets,read_locales,read_content,read_online_store_navigation`.
  The CLI keeps the token itself. Run every query with `shopify store execute
  --store <store>.myshopify.com --query-file <file>`, which refuses changes
  unless given `--allow-mutations`: never give it. `<store>.myshopify.com` is
  the store's own Shopify address, not its custom domain. Look for it in the
  page's scripts (a `Shopify.shop` value); Shopify does not document that
  value, so say in the report where you found it. If it is not there, give
  the merchant the command with `<store>.myshopify.com` for them to fill in
  with their store's address, which their Shopify admin shows. If they do
  not approve, go on with the Ajax API alone (as below) and say what access
  would have settled.
- **The catalogue**: the Admin API's `products` and `collections`; the
  storefront's main navigation is the menu with handle `main-menu`
  (`menus`, scope `read_online_store_navigation`), whose first-level items
  that link to collections are the top-level product categories.
- **The sets**: a product's collections are its `collections`. A collection
  the main menu links to is a `category`, nested as the menu nests it (up to
  three levels; a menu item that links to no collection has no page: its
  children attach to the nearest collection above it); any other collection
  is a `collection`, top-level, and goes in `hasOfferCatalog`. A collection
  with a `ruleSet` is filled by a rule: a `collection` gets no sheet, a
  `category` keeps its sheet with an `expires_at`. Members: the collection's
  `products` in its own sort order (`sortOrder`), leaving out any whose
  `onlineStoreUrl` is null, each a `ProductGroup` with more than one variant
  and a `Product` otherwise, its url `<origin>/products/<handle>`; a Shopify
  collection is its own list, and a parent collection often holds its
  subcategories' products too: a product that is also in one of its
  subcategories, at any depth, is a direct member of the subcategory only.
  Check the
  order against the collection's page as the shop shows it.
- **A product's data**: `productByIdentifier(identifier: { handle })` with
  `title`, `description` (plain text), `vendor`, `productType`, `status`,
  `onlineStoreUrl`, `options { name values }`, `media` (with `alt`), and
  `variants` with `sku`, `selectedOptions`, `availableForSale`,
  `barcodes { type value }` (`barcode` is deprecated) and
  `contextualPricing(context: { country })` per country the store sells to
  (`price`, `compareAtPrice`: "The final price after all adjustments are
  applied"). `status` other than ACTIVE, or a null `onlineStoreUrl` ("the
  product isn't published to the online store"): no sheet. More than one
  variant: a ProductGroup.
- **Values**: as for the Ajax API, with `media` alt text as the caption where
  it is not empty. `vendor` and `productType` as above: not a brand unless the
  page presents it as one, never a category.
- **Prices**: Admin amounts are decimal strings ("100.57"). Each country's
  `contextualPricing.price`, checked against the price the page displays for
  that country.
- **Availability**: the page's, as rule 4 says; `availableForSale` checks it.
- **Identifiers**: `barcodes` carry a type: EAN, and GTIN with 13 digits, go
  in gtin13; UPC, and GTIN with 8, 12 or 14 digits, in gtin; a 13-digit ISBN is
  an EAN-13; ASIN and NS_PID are not GTINs: leave them out of the gtin fields;
  a barcode with no type, by its digit count as for the Ajax API.
- **The tax basis**: the store's markets (`markets`, each with
  `priceInclusions { inclusiveTaxPricingStrategy }`):
  `INCLUDES_TAXES_IN_PRICE` is valueAddedTaxIncluded true and
  `ADD_TAXES_AT_CHECKOUT` false, for that market's countries;
  `INCLUDES_TAXES_IN_PRICE_BASED_ON_COUNTRY` states no single basis: no flag.
  With no markets, `shop { taxesIncluded }`.
- **The countries sold to**: each market's countries,
  `conditions { regionsCondition { regions } }` (`regions` on the market is
  deprecated). A market names its countries: areaServed is that list, one
  offer per country or per group of countries with the same price and
  currency.
- **Languages**: `shopLocales` lists the store's languages and its primary
  one.
<!-- /route -->
