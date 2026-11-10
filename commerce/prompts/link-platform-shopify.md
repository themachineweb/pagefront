### Shopify

- Documentation: https://help.shopify.com/en/manual/custom-data/metafields/metafield-definitions/creating-custom-metafield-definitions , https://help.shopify.com/en/manual/custom-data/metafields/adding-values-to-metafields , https://shopify.dev/docs/api/liquid/objects/metafield and https://help.shopify.com/en/manual/online-store/themes/customizing-themes/edit-code/edit-theme-code
- **Signs**: `<origin>/products/<handle>.js` answers with the product as
  JSON (Shopify's Ajax API). Every address redirecting to `/password`: the
  store is closed. Go on with the setup; tell the merchant the links show
  publicly only once the store is open; the shop's signs and CHECKS wait
  until they say it is open. A product address with no `.js` answer: a
  storefront served by another application, whose pages the theme does not
  make; say so and stop.
- **Sheet path**: `/apps/pagefront`.
- **Pages with a field**: a product (`/products/<handle>`), a collection
  (`/collections/<handle>`), the organization page if it is a page of the
  online store (`/pages/<handle>`). The homepage has no field: an
  organization sheet whose page is the homepage gets no page link and is
  reported so, with the entry point as the way a reader reaches it.
- **The field**: a metafield, one definition each for Products,
  Collections and Pages: name "Pagefront sheet", namespace and key
  `custom.pagefront_sheet`, type URL (not Link), one value, Storefront
  API access on.
- **The code**: a block for the theme's `layout/theme.liquid`, the file
  `pagefront-theme-link.txt`, pasted just before `</head>`. By
  `request.page_type` (`product`, `collection`, `page`), it reads that
  object's `metafields.custom.pagefront_sheet.value` and, if not blank and
  under the sheet path (rule 4), prints the `<link>` element, its `href`
  escaped. Short Liquid comments; nothing else.
- **Sign the code runs**: none until a field is filled; the code step has
  no check.
- **What Shopify cannot do**, said plainly in the report: a theme sets no
  response header, so no `Link` header; no `Pagefront:` line in
  `robots.txt`. The entry point is the redirect below, on its own.
- **Entry point**: a URL redirect the merchant makes in the admin (step 4),
  one step of its own after the pages, only when Step 1 found a root.
  Shopify answers it with `301`, which no setting changes; Discovery says
  `303 See Other`, so the Check warns on that line: say so once, in the
  report, never per check. Its checks, at full addresses:
  `<origin>/.well-known/pagefront` and `<origin>/.well-known/pagefront/`
  answer a redirect whose `Location`, resolved against the address asked
  (Shopify stores the target as a path on the same host), is the root's
  address.
- **Admin, in English, from the documentation; steps 1 (Products) and 2 as
  shown on 2026-11-06, step 4 walked on 2026-11-10 with the
  documentation's labels** (the rest not yet walked):
  1. The field, once per kind: in the admin, Settings (the very bottom of
     the left menu) › Metafields and metaobjects ›
     Products (then Collections, then Pages) › "Add definition" (top
     right). Other definitions may be listed already: leave them. Name
     `Pagefront sheet`; below it the screen shows `custom.pagefront_sheet`
     (there is no separate key field). Type: "One", then URL in the list
     next to it. Leave "Validation" empty. Under "Options", "Storefront API
     access" on. "Save", in the bar at the top of the screen.
  2. The theme: click "Online Store" in the left menu; it opens the
     themes page (there is no "Themes" item). The current theme is the
     large card at the top, named with the store's address. "Duplicate"
     and "Edit code" are behind the three dots (…) just right of its "Edit
     theme" button. First the three dots › "Duplicate" (a backup; the plain
     "Duplicate", not "Duplicate in Canvas"); the copy shows under "Draft
     themes": leave it. Then the top card's three dots again › "Edit code";
     it opens in its own browser tab, filling the window. In Layout,
     `theme.liquid`; paste all of `pagefront-theme-link.txt` on a new line
     just above `</head>`; "Save" (top right). Then close that browser tab,
     back to the admin: the editor's own ⚙ settings are not Shopify's.
  3. A product, collection or page: open it; in the Metafields section,
     next to "Pagefront sheet", "+ Add" (or "View all" if it is not
     listed); paste the address; "Save".
  4. The entry point, once, when there is a root: Content › Menus › "View
     URL Redirects" › "Create URL redirect". "Redirect from"
     `/.well-known/pagefront`; "Redirect to" the root's address, in full;
     "Save redirect". Shopify redirects only an address that answers 404,
     which `/.well-known/pagefront` does on a Shopify store.
- **What stays the merchant's** (report): a theme update can drop code
  edits ("Theme added: code edits could not be included"); after one,
  paste the block again. A new theme needs the block too. When the root
  sheet's address changes, edit the redirect (Content › Menus › "View URL
  Redirects", the redirect's row); a redirect deleted there removes the
  entry point. Browsers and crawlers may keep a `301` without limit, so a
  reader that followed the old one can hold the old address for a while
  after a change.
