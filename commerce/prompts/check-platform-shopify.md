### Shopify

- **Start**: the shop's homepage. Request: "Please give me your shop's
  homepage address."
- **Signs**: every address redirecting to `/password`, Shopify's
  storefront password page: the store is closed (below), and that page is
  the sign. An open store: `<origin>/cart.js` answers with the cart as JSON
  (Shopify's Ajax API), read with your fetch tool or your code, not your
  browser, which may refuse an address ending in `.js`; a refusal is not a
  reason to stop. No `cart.js` answer from your tool or code: a storefront
  served by another application; say so and stop.
- **A closed store**: "A closed shop" says what runs and what waits; the
  page to open in the browser the merchant takes over is
  `<origin>/password`.
- **Sheet path**: `/apps/pagefront`.
- **`Link` header**: none; a theme sets no response header. The `<link>`
  element is the declaration, which the Check takes as conformant on its
  own: its lines on the header and on both carriers say the header is not
  set, as information.
- **Entry point**: `/.well-known/pagefront` alone, a URL redirect the
  merchant made in the admin (link phase); no `Pagefront:` line in
  `robots.txt`. Shopify answers the redirect with `301`, which no setting
  changes, where Discovery says `303 See Other`: the Check's warning on
  that line, and its note that `robots.txt` has no line, are reported
  once, as what the platform cannot do, neither failure nor warning. A `301` that
  leads to the organization sheet passes CHECKS 1.
- **The homepage** has no field. An organization sheet whose page is the
  homepage is reached from the entry point and the products' `seller`, and
  its page cannot declare it (CHECKS 2: run the Check on the sheet's
  address). Say so once.
