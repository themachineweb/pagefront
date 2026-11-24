### Shopify

- Documentation: https://help.shopify.com/en/manual/custom-data/metafields/metafield-definitions/creating-custom-metafield-definitions , https://help.shopify.com/en/manual/custom-data/metafields/adding-values-to-metafields , https://shopify.dev/docs/api/liquid/objects/metafield and https://help.shopify.com/en/manual/online-store/themes/customizing-themes/edit-code/edit-theme-code
- Check prompt, the next phase: https://themachineweb.org/pagefront/publish/check/shopify
- **Signs**: `<origin>/products/<handle>.js` answers with the product as
  JSON (Shopify's Ajax API). Every address redirecting to `/password`: the
  store is closed, as "A closed shop" says; its signs are read in the
  merchant's session, where there is one. A product address with no `.js`
  answer: a
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
- **The code**: two blocks. The file `pagefront-theme-link.txt`, pasted
  into the theme's `layout/theme.liquid` just before `</head>`: by
  `request.page_type` (`product`, `collection`, `page`), it reads that
  object's `metafields.custom.pagefront_sheet.value` and, if not blank and
  under the sheet path (rule 4), prints the `<link>` element, its `href`
  escaped. The file `pagefront-body.txt`, pasted in the theme editor into
  a "Custom liquid" block placed right below the description on the
  product template, and into a "Custom liquid" section placed right below
  the section that prints the description on the collection and the page
  templates, so the body link sits in the page's main content after the
  description: the same guard on the same metafield, by
  `request.page_type` too, so one file serves all three, printing the body
  link as one sentence, the pair of that kind of page,
  `<p class="pagefront-data">Full specifications, materials and care for this product are published as <a rel="alternate" type="application/pagefront+json" href="…">Product data (JSON)</a>.</p>`
  on a product: the three sentences in Liquid `assign` lines at its top
  with `[link]` where the anchor goes, and the three anchor texts in three
  more, the `case` on `request.page_type` picking the pair and `replace`
  putting the anchor in; the merchant may change them. A merchant who
  wants no body link leaves this second file out. A Liquid
  setting runs standard tags and filters, global objects and the
  template's own object (`product`, `collection`, `page`), none of
  `section`, `layout` or `settings`; it must stay under 50 KB and be valid
  Liquid, or the editor refuses to save. Short Liquid comments; nothing
  else. The block and the section are the theme's: Shopify's own theme
  Dawn has both, and so do most current themes. A theme with neither
  gets the head link alone, said in the report.
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
  address. A redirect edited in the admin can keep answering its old
  target for some hours after the save (seen on 2026-11-13 on a
  development store; Shopify's documentation says a redirect works at
  once): a check run right after an edit that still shows the old target
  is run again later before it counts as failed, and the merchant is never
  told to make the redirect again for it.
- **Admin, in English, from the documentation; step 1 (Products) and the
  code editor part of step 2 as shown on 2026-11-06, step 4 walked on
  2026-11-10 with the documentation's labels; the theme editor part of
  step 2 as shown on 2026-11-23 on Dawn for a product, the collection
  and page parts from the documentation and Dawn's labels** (the rest not
  yet walked):
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
     just above `</head>`; "Save" (top right). Then close that browser
     tab, back to the admin: the editor's own ⚙ settings are not
     Shopify's. Then the body link, in the theme editor: the top card's
     "Edit theme" button. The drop-down in the bar at the top, which reads
     "Home page" at first, lists the templates: "Products", then the
     template the products use. A shop that never made a template of its
     own sees one, "Default product", with "Assigned to N products" under
     it: that one. More than one listed: a product's own admin screen
     names its template, under "Theme template"; the same on each template
     a product in the list uses. In the sidebar on the left, click the
     section that holds the description ("Product information" in Dawn);
     it unfolds its blocks, with "Add block" below them: click it, and in
     "Search blocks" type `Custom liquid`, then select it. The new block's
     settings open in a panel on the right, with one large field labelled
     "Custom liquid" (older versions of Dawn label it "Liquid code"):
     paste all of `pagefront-body.txt` into it. In the sidebar, drag the
     block by its handle so that it sits right below "Description".
     "Save". What they should see: in the sidebar, "Custom liquid" listed
     right below "Description". The large area on the right is the theme
     editor's preview; it shows one product of that template, which need
     not be a linked one, so it is no check: the pages are checked at
     their own addresses (CHECKS). Then the collection template from the
     same drop-down ("Collections", then the template): in the sidebar,
     "Add section", in "Search sections" type `Custom liquid`, select it;
     paste all of `pagefront-body.txt` into its field; drag the section so
     that it sits right below the section that prints the description
     ("Collection banner" in Dawn); "Save". The same on the page template
     ("Pages"), below the section that prints the page's content ("Page"
     in Dawn). Then back to the admin: the "Exit" button, the first icon
     at the top left of the editor (pointing at it shows "Exit"). (Or
     leave the body link out: then the pages carry the head link alone.)
     The step says, in these words, after the search: "If your theme
     offers neither a Custom liquid block nor a Custom liquid section,
     stop here: your pages will keep their head link alone." A merchant
     who stops there: CHECKS 1 expects no body link, and the report says
     so.
  3. A product, collection or page: open it; in the Metafields section,
     next to "Pagefront sheet", "+ Add" (or "View all" if it is not
     listed); paste the address; "Save".
  4. The entry point, once, when there is a root: Content › Menus › "View
     URL Redirects" › "Create URL redirect". "Redirect from"
     `/.well-known/pagefront`; "Redirect to" the root's address, in full;
     "Save redirect". Shopify redirects only an address that answers 404,
     which `/.well-known/pagefront` does on a Shopify store.
- **What stays the merchant's** (report): a theme update carries the
  theme editor's work over, the "Custom liquid" blocks and sections with
  it, and can drop code edits ("Theme added: code edits could not be
  included"); after one, paste `pagefront-theme-link.txt` again and check
  the blocks and sections are still there. A new theme needs both files
  again. A new product template needs the block; a product moved to a
  template without it loses its body link. When the root
  sheet's address changes, edit the redirect (Content › Menus › "View URL
  Redirects", the redirect's row), and the old target can answer for some
  hours after the save; a redirect deleted there removes the
  entry point. Browsers and crawlers may keep a `301` without limit, so a
  reader that followed the old one can hold the old address for a while
  after a change.
