### WooCommerce

- **Start**: the shop's homepage. Request: "Please give me your shop's
  homepage address."
- **Signs**: the homepage's head has `<link rel="https://api.w.org/">`, and
  that REST index lists `wc/store/v1`. Without it (a storefront served by
  another application) say so and stop. A homepage showing a password form
  or a coming-soon page a plugin put in place of the shop: closed, as "A
  closed shop" says.
- **Sheet path**: `/pagefront`.
- **`Link` header**: yes, on `GET` and `HEAD` of every page whose field is
  set.
- **Entry point**: yes, `/.well-known/pagefront` and the `Pagefront:` line
  in `robots.txt`. If `robots.txt` is a file an SEO plugin wrote, the line
  is the merchant's to add there (link phase).
- **The page's own address** ends with `/`. In CHECKS 2, also request it
  yourself without the final `/` (the Check follows the redirect and does
  not report it): a `301` to the address with it, carrying no `Link`
  header of type `application/pagefront+json`. A redirect that carries it
  is a failure (link): it declares the sheet on the wrong response, and
  the header belongs after WordPress's own redirect.
