### WooCommerce

- Documentation: https://developer.woocommerce.com/docs/apis/store-api/
- **How it shows itself**: WordPress names its REST index in the page head
  (`<link rel="https://api.w.org/">`); WooCommerce's public Store API is the
  `wc/store/v1` namespace of that index, whose routes carry their own
  addresses. A store on its own front (pages served by another application,
  WordPress on another host) prints no such link: when the page's images are
  served from `<host>/wp-content/uploads/` on another host, and that host's
  `/wp-json/` index lists `wc/store/v1` with products whose `permalink` are
  the shop's own pages, it is a WooCommerce store on its own front: its Store
  API is the platform's data, read as below, with what "On its own front"
  says.
- **Sheet path**: `/pagefront`.
- **Ids**: a product's and a category's `slug` in the Store API; a page's
  slug from WordPress's pages route in the REST index.
- **The catalogue**: the Store API's products and product categories
  routes; a category with `parent` 0 is top-level. WooCommerce does not
  show shoppers a category with no products (`count` 0, which counts its
  subcategories' products too); the categories route leaves those out by
  default (`hide_empty`).
- **The sets**: product categories, kind `category`, the tree given by each
  category's `parent`; a product's categories are its Store API
  `categories`. WooCommerce has no other kind of set: no `collection`
  sheets. Members: read the category's page (its `permalink`) and every page
  its pagination links to, the product tiles in the order shown, and the
  subcategory tiles where the page shows them (otherwise the subcategories
  in the order the main navigation lists them, or, where it lists none, in
  the categories route's order, saying so). A category page also lists the
  products of its subcategories (WordPress includes a category's children
  by default: `include_children`, "Defaults to true"): the category's direct
  members are the products on its pages that are on none of its
  subcategories' pages, at any depth, so read those pages too. A tile's
  product is the Store API product with that `permalink`: `variable` is
  `ProductGroup`, any other type `Product`. WooCommerce fills no category by
  a rule.
- **Checkout links**: WooCommerce's add-to-cart addresses are the
  platform's pattern, not the merchant's statement: never write one as
  `checkoutPageURLTemplate`.
- **A product's data**: the Store API's product; a `variable` product's
  variations are listed in `variations`, each read from the Store API in
  turn. `simple` is a Product, `variable` a ProductGroup; `grouped`
  (separate products sold together) and `external` (sold on another site)
  get no sheet. `is_purchasable` false or `is_password_protected` true: not
  on sale.
- **A variant's page**: the product page with one query parameter per
  attribute: `attribute_<taxonomy>` for an attribute with a `taxonomy`
  (`pa_color` gives `attribute_pa_color`), `attribute_<name in lower case>`
  for one without, and the variation's value. WooCommerce then preselects
  the variant, and the page's structured data names its `sku`; if it does
  not, the variant has no page of its own: leave its url out.
- **Values**: name `name`; description the plain text of `description`, or
  of `short_description` when it is empty; brand the Store API's `brands`;
  attributes with `has_variations` true are the variant dimensions, the
  others the product's specifications, with display values from the
  attribute's `terms`; images `images[].src` with `alt`; a variable
  product's own `sku` is the family's productGroupID.
- **Prices**: integers in the currency's minor unit, `prices.price` with
  `prices.currency_minor_unit` (`"4200"` with 2 is 42.00);
  `prices.currency_code`; `prices.regular_price` above `prices.price` is the
  former price.
- **Displayed prices**: the price is the one the page renders. A simple
  product's page renders it in its HTML. For a variable product, WooCommerce
  renders a variant's price when the variant is chosen by inserting that
  variation's `price_html` (its template:
  `<div class="woocommerce-variation-price">{{{ data.variation.price_html }}}</div>`),
  which the page carries for every variation in its variations form's
  `data-product_variations` attribute: read the rendered price there, without
  running the script. WooCommerce writes that attribute when the product has
  30 variations or fewer (`woocommerce_ajax_variation_threshold`); without
  it, a variant's price is not rendered until a shopper chooses it: leave that
  offer out and say so. The Store API's prices (`prices.price`, computed with
  the same functions and the shop's tax display setting) and the page's
  structured data only check the rendered price; where either differs, leave
  that offer out.
- **Availability**: the page's, as rule 4 says; the Store API checks it
  (`is_on_backorder` true is BackOrder; otherwise `is_in_stock`).
- **Identifiers**: WooCommerce's GTIN field ("GTIN, UPC, EAN, or ISBN") is
  not in the Store API; the page's structured data carries it when set, for
  a variant once that variant is selected. The product's `id` is its
  database row.
- **Dates**: WooCommerce's structured data writes `priceValidUntil` and
  `validThrough` as December 31 of next year when the merchant set no sale
  end date; those are not the merchant's statement. The sale end date is
  the merchant's only when the product has one.
- **Weight and dimensions**: the Store API's `weight` and `dimensions` are
  the fields WooCommerce uses for shipping rates, in the store's units.
- **On its own front**: the front renders its pages itself, so what this
  section says of WooCommerce's pages does not hold there:
  - addresses: the categories and pages the Store API links are on
    WordPress's host; use the shop's own page for each, as its navigation
    links it, for addresses and for ids (the last segment of that address);
  - listings: the front renders its own category pages, which need not
    include the subcategories' products; read each as shown, and take a
    category's direct members as above, the products on its pages that are
    on none of its subcategories' pages;
  - displayed prices: the front carries no `data-product_variations`; a
    variant's price is the one the page shows once its options are chosen,
    read by choosing each combination where your browser can, and otherwise
    left out, saying so. The Store API's amounts follow the store's own tax
    display setting, which the front need not follow: where they do not
    match the displayed prices, they do not check them; the page's
    structured data does;
  - structured data: the front writes its own, not WooCommerce's, so the
    Identifiers and Dates bullets about WooCommerce's structured data do not
    apply to it;
  - script data: the page carries the data it was built from, in the front
    framework's own format (Next.js `<script id="__NEXT_DATA__">` or
    `self.__next_f.push(...)`, Nuxt `<script id="__NUXT_DATA__">` or
    `window.__NUXT__`, React Router `window.__reactRouterContext`, Remix
    `window.__remixContext`, or a `<script type="application/json">`
    block), read from the page's raw HTML, not a reader view; if your fetch
    tool does not return the page's scripts, say so and go on without it.
    Use only the object for this page's product, its `slug` the Store API
    product's, and its variations'. Where it has WooCommerce's REST API
    shape (https://woocommerce.github.io/woocommerce-rest-api-docs/, product
    and product variation properties), read it by those documented
    properties only: `sku`, `global_unique_id` (the GTIN, by its digit count:
    13 in gtin13; 8, 12 or 14 in gtin), `stock_status` (`instock`,
    `outofstock`, `onbackorder`), `attributes`, and its prices only as a
    check. A field those properties do not name is the front's own: leave it
    out. Where the script data and the Store API disagree on a value, leave
    it out.
<!-- route: chat -->
- **Not readable**: the tax setting and the selling countries are admin
  settings, absent from the Store API; only the shop's pages can state them.
<!-- /route -->
<!-- route: code -->
- **The read-only key**: WooCommerce › Settings › Advanced › REST API › Add
  key, for an administrator, with Read access; it gives a consumer key and a
  consumer secret. In `.env`: `WC_CONSUMER_KEY=ck_…` and
  `WC_CONSUMER_SECRET=cs_…`. Send them as HTTP Basic credentials over HTTPS to
  the REST API (`/wp-json/wc/v3/…`, the `wc/v3` namespace of the REST index).
  Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/
- **With the key**:
  - the GTIN: the REST product's `global_unique_id` ("GTIN, UPC, EAN or
    ISBN"), on the product and on each variation;
  - the tax basis: `settings/general` `woocommerce_calc_taxes`; when it is
    `yes`, `settings/tax` `woocommerce_tax_display_shop` states how shop
    prices are displayed: `incl` is valueAddedTaxIncluded true, `excl` false.
    When taxes are off, the store states no basis: no flag;
  - the countries sold to: `settings/general` `woocommerce_allowed_countries`
    (`all`, `all_except`, `specific`), with `woocommerce_specific_allowed_countries`
    listing the countries for `specific`. Only `specific` names the market:
    areaServed is that list. `all` and `all_except` name none.
- **Without the key**: the tax setting and the selling countries are not in
  the Store API; only the shop's pages can state them.
<!-- /route -->

