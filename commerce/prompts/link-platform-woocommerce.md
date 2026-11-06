### WooCommerce

- Documentation: https://developer.wordpress.org/plugins/hooks/ and https://wordpress.org/documentation/article/assign-custom-fields/
- **Signs**: the homepage's head has `<link rel="https://api.w.org/">`, and
  that REST index lists `wc/store/v1`. Without it (a storefront served by
  another application) say so and stop.
- **Sheet path**: `/pagefront`.
- **Pages with a field**: a product; a product category; the organization
  page if it is a WordPress page (the homepage counts when the site shows a
  static page as its homepage). Any other page is left out and reported.
- **The field**: a custom field named `pagefront_sheet` (no leading `_`:
  WordPress hides those from the Custom Fields box). Categories have no
  custom fields, so the snippet adds one to the category's edit screen,
  labelled "Pagefront sheet".
- **The code**: a Code Snippets snippet, the file `pagefront-link-snippet.txt`:
  plain PHP for the shop's WordPress version, no opening tag, names
  prefixed `pagefront_`, short comments, the root's address in one
  constant at the top, written by you.
  - On a product, page or product category whose field is set (rule 4):
    the `<link>` element in `<head>` (`wp_head`), and the `Link` header
    `<address>; rel="alternate"; type="application/pagefront+json"`
    (`template_redirect` at priority 11, after WordPress's canonical
    redirect, so a `301` never carries it; it runs on `HEAD` too, while
    `wp_head` does not).
  - The category field: shown on the category's edit screen, saved on
    "Update" by a user who may edit that category.
  - The entry point: `/.well-known/pagefront`, with or without a trailing
    slash, on `GET` and `HEAD`, answers `303 See Other` to the root's
    address; `robots.txt` (WordPress's own, through the `robots_txt` filter)
    gains the line `Pagefront: <root's address>`. If `robots.txt` is a file
    an SEO plugin wrote, the filter does not run: tell the merchant to add
    the line in that plugin's editor.
- **Sign the code runs**: `<origin>/.well-known/pagefront` answers `303`.
- **Entry point**: made by the code; the merchant does nothing for it.
  Its checks, at full addresses: `<origin>/.well-known/pagefront` and
  `<origin>/.well-known/pagefront/` answer `303` with `Location` the root's
  address; `<origin>/robots.txt` holds the `Pagefront:` line.
- **Removing a declaration** (report, what stays the merchant's): on a
  product or page, the small "Delete" under the field's name in Custom
  Fields, which removes it at once, nothing else to save; on a category,
  empty "Pagefront sheet", then "Update".
- **Admin, in English, as shown on 2026-11-05**:
  1. Snippets › "Add Snippet". Title `Pagefront: links`; type PHP; paste
     all of `pagefront-link-snippet.txt`; Location: Run everywhere (the
     category field is in the admin); "Save and Activate". The serving
     snippet stays as it is.
  2. A product: Products › the product's name. The Custom Fields box is
     hidden at first. At the very top right, just under the black bar, a
     small ⚙ wheel between two other icons, with no label (pointing at
     it shows "Screen options"): click it, tick "Custom Fields"; the box
     shows at once, no reload, below "Product data". It may already list
     fields of WooCommerce's own (`total_sales`): leave them. Under "Add
     Custom Field:", the small "Enter new" button below "— Select —";
     Name `pagefront_sheet`, Value the address; "Add Custom Field". That
     saves it: the field shows in the list above, and no other button is
     needed. Next products: pick `pagefront_sheet` from "— Select —".
  3. A category: Products › Categories. The page opens on a form "Add new
     category" on the left: not that one. In the list on the right, click
     the category's name (a subcategory shows as "— Hoodies"; not "Quick
     Edit", which lacks the field). Its "Edit category" screen has the
     "Pagefront sheet" field: paste, then "Update".
  4. The organization page: Pages › its name. If the merchant has edited
     the page, save it first: the setting below reloads the editor. ⋮
     (top right) › Preferences › General › Advanced (the last section):
     turn on "Custom fields"; a "Show & Reload Page" button appears
     below it: click it. After the reload the box is folded into a thin
     "Meta Boxes" bar at the very bottom of the editor: click "Meta
     Boxes" to open it. Then as for a product: "Add Custom Field" saves
     the field; the blue "Save" at the top right is not needed for it.
