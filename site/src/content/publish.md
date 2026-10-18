# Publish

Publishing a sheet takes three things: a few kilobytes of JSON on your own
server, a URL to serve it from, and one line in the head of the page it
describes. There is no account to open, no registry to join, and nobody to ask.
If this site disappeared tomorrow, the sheets already published would keep
working.

This page is the whole procedure. Start with one product.

---

## The whole thing

```
your-shop.example/product/anorak          the page, unchanged
your-shop.example/product/anorak.en.json  the sheet you add
                                          one <link> in the page head
```

Four steps: write it, serve it, link it, check it.

---

## 1. Write the sheet

A sheet is a small typed JSON-LD document describing one resource, such as
this product or this organization. It has an envelope that says what it is and when
it was made, and a `data` block that carries the Schema.org description.

```json
{
  "$schema": "https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json",
  "release": "0.5.0",
  "schema_org_version": "30.0",
  "canonical_url": "https://your-shop.example/product/anorak",
  "sheet_url": "https://your-shop.example/product/anorak.en.json",
  "generated_at": "2026-09-04T09:12:00Z",
  "data": { ... }
}
```

The [Product sheet spec](/pagefront/spec/commerce/product) is the normative
document: what belongs in `data`, which fields are required, which identifier
you need. `sheet_url` is optional: include it when you know the address at
generation time. The link in step 3 is what tells consumers where the sheet is.

There are three ways to write your first one. Pick the one that matches what
you have.

**You have a shop platform.** Your shop already holds this product as structured
data: price, SKU, stock, shipping terms. Mapping those fields onto the schema is the
sturdiest route, and the only one that still works when you have a catalogue
rather than a product. It is also the only route where the sheet stays true
without anyone re-reading the page.

**You have a text editor.** For a single product the document is short enough
to fill in by hand. Copy the example from the spec, change the values, and delete
what does not apply.

**You have an AI assistant.** Give ChatGPT, Claude or whatever you use
**[this prompt](/pagefront/publish/assistant)**. It asks which of your product
pages to work from, reads that page and returns a draft sheet, plus the link
element for step 3. This takes about ten minutes, and it is how most
people should see their first sheet.

<p><a class="pf-cta" href="/pagefront/publish/assistant">Get the assistant prompt <span aria-hidden="true">→</span></a></p>

> **Check the draft before you serve it.**
>
> The assistant reads your page the way a visitor does, and it will get things
> wrong: a struck-through price taken as the price, a variant mistaken for the
> main product, an identifier it filled in because the shape looked right. You
> know the answers and it does not.
>
> Check the price, check availability, check the identifier. Delete any field
> you cannot confirm. A missing field costs you a little completeness. An
> invented one is the failure this standard exists to prevent.

---

## 2. Serve it

The sheet lives at a URL **on your own domain**, and nowhere else. A sheet is
your own statement about your own resource, and it carries weight because it
comes from you.

Four things to get right:

- **Stable, if you can.** The page is the identity: the sheet lives wherever
  the page's link says today, and a consumer that follows the link finds it
  after a move. A URL that survives your next redesign and your next platform
  migration is still worth having, because consumers that cached it keep
  finding the sheet and the hints other sheets carry stay correct for longer.
  Pick a shape you can keep: alongside the page (`/product/anorak.en.json`) or
  under a path of your own (`/sheets/anorak.en.json`).
- **`Content-Type`.** Serve the sheet as `application/pagefront+json` if you
  control response headers; `application/json` is accepted too. Some static
  hosts guess wrong on unusual extensions. Check what yours actually sends.
- **Reachable by machines.** Not behind a login, not behind a bot challenge, and
  not blocked in `robots.txt`. If you serve consumers that run in a browser, allow
  cross-origin reads.
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

How this lands on the platform you are on:

**Your own server, or a static host.** Put the file where the rest of your
assets live and confirm the content type.

**Shopify.** Files uploaded through the admin are served from Shopify's CDN,
not from your domain. There are two ways round it: point a subdomain you
control at a static host and serve sheets from there, or serve them from an app
or proxy on your own domain. Neither is a five-minute job. If you get stuck
here, the platform is the obstacle.

**WooCommerce or another self-hosted CMS.** You have the filesystem and you
have routing. Either works.

**A custom backend.** A route that emits the document, generated from the same
data your product page renders from. The sheet then stays current without
anyone maintaining it.

---

## 3. Link it

The page points at the sheet. Consumers follow the link and never guess the
path.

```html
<link rel="alternate"
      type="application/pagefront+json"
      href="https://your-shop.example/product/anorak.en.json">
```

In the `<head>` of the product page, one per sheet. The `type` is what tells
the sheet apart from the other `alternate` links a page carries, such as feeds,
so keep it exactly as written. If you can set response
headers, the same statement travels as an HTTP `Link` header, which reaches
consumers that read headers without fetching the body:

```
Link: <https://your-shop.example/product/anorak.en.json>; rel="alternate"; type="application/pagefront+json"
```

Either carrier is enough. Most publishers should use the element, because most
publishers can edit a template and cannot edit headers.

---

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

---

## Keeping it true

A sheet that is wrong is worse than no sheet.

`generated_at` says when the document was made. `expires_at` says when you
consider it stale. Declare it if you have a meaningful expiry policy, and omit
it if you do not. Consumers use both to decide how much to trust what they are
holding.

Re-emit when the facts change. Price and availability move fastest; name,
identifier and specification rarely move at all. If your sheet is generated
from your shop's own data, this costs you nothing and happens on its own. If it
was written by hand or drafted by an assistant, it is a recurring job you have
to remember, which is why the platform-data route is the one that lasts.

One product with a sheet you keep accurate is worth more than a catalogue of
sheets you emitted once.

---

## What none of this requires

- No account, on this site or anywhere else.
- No registry, no directory, no listing.
- No fee, no licence, no permission.
- No intermediary between your data and the consumer reading it.
- No dependency on us. The schema URL identifies a version; it is not a service
  your sheet calls at request time. Sheets published today keep working whether
  or not this site does.

---

## Start with one product

Pick the product you would most want an agent to describe correctly. Write its
sheet, serve it, link it, check it. You will know within an hour whether this
is worth doing for the rest of the catalogue, and if it is not, you have lost
an hour and a file.

Commerce release 0.5.0 · the current release. Breaking changes follow semver; the stability policy applies from release 1.0.0.
