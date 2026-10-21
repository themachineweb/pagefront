# Publish

Publishing a sheet takes three things: a few kilobytes of JSON on your own
server, a URL to serve it from, and one link in the head of the page it
describes. There is no account to open, no registry to join, and nobody to ask.
If this site disappeared tomorrow, the sheets already published would keep
working.

This page is the whole procedure. Start with one product.

Steps 1 and 4 you can do yourself. Steps 2 and 3 are changes to your site,
and on most platforms that is a job for whoever runs it. This page gives
you what to hand them.

For a first product, the sheet is a copy of what your shop already says,
and keeping it true is on you: when a price or the stock changes, run the
prompt again. The arrangement that lasts generates the sheet from your
shop's own data, which is what the developer version will do.

## The whole thing

```
your-shop.example/product/anorak          the page, unchanged
your-shop.example/product/anorak.en.json  the sheet you add
                                          one <link> in the page head
```

Four steps: write it, serve it, link it, check it.

A version for developers and agencies, with one code-assistant prompt
that does all four steps, is coming.

## 1. Write the sheet

A sheet is a small JSON document describing one resource: this
product, this collection, or the organization behind them. It has a header
that says what it is and when it was made, and a `data` block that carries the
Schema.org description.

```json
{
  "$schema": "https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json",
  "release": "0.5.0",
  "schema_org_version": "30.0",
  "canonical_url": "https://your-shop.example/product/anorak",
  "generated_at": "2026-09-04T09:12:00Z",  "data": { ... }
}
```

A finished one, with the page it describes: [the Nitto case study](/pagefront/commerce/case-studies/nitto).

The [Product sheet spec](/pagefront/spec/commerce/product) is the reference: what belongs in `data`, which fields are required, which identifier
you need. You do not need to write it by hand. A chat assistant writes it from
what your shop already says.

Give ChatGPT, Claude or whatever chat assistant you use the prompt for your
platform and it will ask for the addresses of the products you want sheets
for. It reads your platform's own data, writes a sheet for each product, the sheets for the categories they
belong to, and the organization sheet for your shop, each linked to the
others, and reports what it could not find.

Pick the platform where your catalogue lives. The prompt works out what
renders your pages.

<p><a class="pf-cta" href="/pagefront/publish/write/shopify">Shopify <span aria-hidden="true">→</span></a> <a class="pf-cta" href="/pagefront/publish/write/woocommerce">WooCommerce <span aria-hidden="true">→</span></a> <a class="pf-cta" href="/pagefront/publish/write/generic">Any other platform <span aria-hidden="true">→</span></a></p>

What comes back is a draft. The assistant reads your shop the way a visitor
does, and it will get things wrong: a struck-through price taken as the price,
a variant mistaken for the main product, an identifier it filled in because
the shape looked right. You know the answers and it does not. Check the price,
check availability, check the identifier. Tell the assistant which value is
wrong, or which you cannot confirm, and it corrects the file; a field you
cannot confirm comes out. A missing field costs you a little completeness. An
invented one is the failure this standard exists to prevent.

The product sheet alone is a complete first publication. The assistant also
hands back a sheet for each category the product belongs to and the
organization sheet for your shop. Each is served and linked the same way,
from the page it describes: the category sheet from the category page, the
organization sheet from your About page. They can follow later. How a
machine finds the organization sheet from your domain is in [the Discovery
document](/pagefront/spec/core/discovery).

## 2. Serve it

The sheet lives at a URL **on your own domain**, and nowhere else. A sheet is
your own statement about your own resource, and it carries weight because it
comes from you.

Four things to get right:

- **Stable, if you can.** The page is the identity: the sheet lives wherever
  the page's link says today, and a reader that follows the link finds it
  after a move. A URL that survives your next redesign and your next platform
  migration is still worth having, because readers that cached it keep
  finding the sheet and the hints other sheets carry stay correct for longer.
  Pick a shape you can keep: alongside the page (`/product/anorak.en.json`) or
  under a path of your own (`/sheets/anorak.en.json`).
- **`Content-Type`.** Serve the sheet as `application/pagefront+json` if you
  control response headers; `application/json` is accepted too. Some static
  hosts guess wrong on unusual extensions. Check what yours actually sends.
- **Reachable by machines.** Not behind a login, not behind a bot challenge, and
  not blocked in `robots.txt`. If the machines reading your sheets run in a
  browser, allow cross-origin reads.
- **Indexable.** Let search crawlers reach the sheet URLs and list them in your
  sitemap, alongside the pages. Many assistants reach the web through a search
  index and can only fetch what that index holds; in one test, a sheet the index
  had never seen was out of reach for them even though the page linked it. So
  send no `noindex` for sheets, in `X-Robots-Tag` or in a robots rule, and do
  not disallow the crawlers you want reading them. The page's `alternate` link
  already tells a crawler that the sheet is a representation of the page.
- **One sheet per resource per language.** The `inLanguage` field says which
  one this is. Publish a second document for a second language rather than
  mixing them.

Before you link it, check the URL from outside your admin, signed out:

- It answers `200` with the sheet itself, byte for byte. A redirect, or your
  theme's page around it, does not count.
- It sends the content type above, and `Access-Control-Allow-Origin: *` if you
  allow cross-origin reads.
- It stays the same after you update the sheet. Edit one value, publish, and
  load the same URL again: the new value is there.
- It answers `404` when there is no sheet: a product you have unpublished, or
  a language you have not written. A `200` page that says "not found" tells a
  machine the sheet exists.

Until the prompt for this step exists, the four things above are the brief.
Give them to whoever runs your site; they are what Check will test.

## 3. Link it

The page points at the sheet. Machines follow the link and never guess the
path.

```html
<link rel="alternate"
      type="application/pagefront+json"
      href="https://your-shop.example/product/anorak.en.json">
```

In the `<head>` of the product page, one per sheet.

On a shop platform this is one line in the product page template, not one
edit per product: the template fills in each product's sheet address.

The `type` is what tells
the sheet apart from the other `alternate` links a page carries, such as feeds,
so keep it exactly as written. If you can set response
headers, the same statement travels as an HTTP `Link` header, which reaches
readers that take headers without fetching the body:

```
Link: <https://your-shop.example/product/anorak.en.json>; rel="alternate"; type="application/pagefront+json"
```

Either form is enough. Most publishers should use the element, because they
cannot edit headers.

A prompt that adds the link to your product pages is coming.

## 4. Check it

[Check your page →](/pagefront/commerce/validate). Give it the product page's URL and it
reads the link the page carries, fetches the sheet it points at, and judges the
sheet. Paste the sheet itself to judge conformance alone. It keeps nothing and
asks for no account.

Check judges conformance: whether the document is well-formed against the rule
catalogue, and whether the page and the sheet agree on where things are. It does
not check truth. A sheet can pass every rule and still be wrong about your
price, so the confirmation in step 1 is yours to do and cannot be automated
away.

A pass means three things: the page declares the sheet, the sheet is where
the page says, and the sheet conforms. That is everything a machine needs
in order to use it.

## Keeping it true

A sheet that is wrong is worse than no sheet.

`generated_at` says when the document was made. `expires_at` says when you
consider it stale. Declare it if you have a meaningful expiry policy, and omit
it if you do not. Machines use both to decide how much to trust what they are
holding.

Publish again when the facts change. Price and availability move fastest; name,
identifier and specification rarely move at all. If your sheet is generated
from your shop's own data, this costs you nothing and happens on its own. If it
was written by hand or drafted by an assistant, it is a recurring job you have
to remember, which is why generating it from your shop's own data is the
arrangement that lasts.

One product with a sheet you keep accurate is worth more than a catalogue of
sheets you emitted once.

## What none of this requires

- No account, on this site or anywhere else.
- No registry, no directory, no listing.
- No fee, no licence, no permission.
- No intermediary between your data and the machine reading it.
- No dependency on us. The schema URL identifies a version; it is not a service
  your sheet calls at request time. Sheets published today keep working whether
  or not this site does.

Commerce release 0.5.0 · the current release. A breaking change always comes with a new release number; from release 1.0.0, nothing that is published changes meaning.
