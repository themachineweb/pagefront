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

This page takes you through them by hand, to your first sheets, live on
your domain. For your whole catalogue, use the upcoming developer version.

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

<figure class="diagram">
<!-- diagram: write-sheets -->
<figcaption>One product address in. Out: its sheet, the sheet of the category it belongs to, and the organization sheet, each pointing at the others by <code>@id</code>. What comes back is a draft, for you to check.</figcaption>
</figure>

Pick the platform where your catalogue lives. The prompt works out what
renders your pages.

<p><a class="pf-cta" href="/pagefront/publish/write/shopify">Shopify <span aria-hidden="true">→</span></a> <a class="pf-cta" href="/pagefront/publish/write/woocommerce">WooCommerce <span aria-hidden="true">→</span></a></p>

On another platform, the upcoming developer version is the route.

What comes back is a draft. The assistant reads your shop the way a visitor
does, and it will get things wrong: a struck-through price taken as the price,
a variant mistaken for the main product, an identifier it filled in because
the shape looked right. You know the answers and it does not. Check the price,
check availability, check the identifier. Tell the assistant which value is
wrong, or which you cannot confirm, and it corrects the file; a field you
cannot confirm comes out. A missing field costs you a little completeness. An
invented one is the failure this standard exists to prevent.

The assistant also hands back a sheet for each category the product belongs
to and the organization sheet for your shop. Each is served and linked the
same way, from the page it describes: the category sheet from the category
page, the organization sheet from your About page. Publish the product sheet
first if you want to see one working before you do the rest. How a machine
finds the organization sheet from your domain is in [the Discovery
document](/pagefront/spec/core/discovery).

## 2. Serve it

The sheet is served on your own domain. The file itself lives on a small
server of your own, and your shop platform forwards a path on your domain to
it, the way it forwards to any app. A server behind your domain is hosting,
as Shopify or WordPress is hosting; the link on your page is what makes the
sheet yours.

<figure class="diagram">
<!-- diagram: sheet-server -->
<figcaption>A machine asks your domain for the sheet. Your shop platform forwards the request to your sheet server and returns the file as its own, from your address. The machine only ever sees your domain; the server is in your own account.</figcaption>
</figure>

**Why a server of your own.**

- It sees every sheet fetch, so for the first time you can count the
  machines reading you, which your page analytics never will.
- It hardly touches your shop: one proxy, one line in a template, nothing in
  the theme or the checkout.
- Machine reads stop costing you page renders.
- It holds your catalogue as sheets, which is where anything you build on
  the machine side later will read from.

**What you set up, once.** A sheet server in your own hosting account: the
prompts use a Cloudflare Worker, and the free tier covers a shop. The spec
asks for nothing but a URL on your domain, and any host that can serve a
file would do; the prompts pick one so they can take you through it step by
step, and this one costs nothing at a shop's scale. Pagefront has no
relationship with Cloudflare. A proxy in your platform that forwards the
sheet path to it: on Shopify a custom app with an app proxy, on WooCommerce
a small plugin. Then you import the sheets from step 1. The prompt for your
platform walks you through all three, and you need no developer for any of
it.

<p><a class="pf-cta" href="/pagefront/publish/serve/shopify">Shopify <span aria-hidden="true">→</span></a> <a class="pf-cta" href="/pagefront/publish/serve/woocommerce">WooCommerce <span aria-hidden="true">→</span></a></p>

On another platform, the upcoming developer version is the route.

**What the server does for you.** Serves each sheet at a stable address that
survives a redesign. Sends `Content-Type: application/pagefront+json`, and
allows cross-origin reads for machines that run in a browser. Answers 404
when there is no sheet, rather than a page that says "not found." Keeps the
sheets indexable, with no `noindex`, so assistants that reach the web
through a search index can reach them. One sheet per resource per language,
the `inLanguage` field saying which.

**Before you link it**, open a sheet address from outside your admin, signed
out. It answers with the sheet itself, byte for byte. Change one value,
import again, load it again: the new value is there.

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

The prompt for your platform walks you through it: one piece of code, pasted
once, that prints the link on every page whose field is set, then each
sheet's address to paste into its page's field. It checks each page as you
go.

<p><a class="pf-cta" href="/pagefront/publish/link/shopify">Shopify <span aria-hidden="true">→</span></a> <a class="pf-cta" href="/pagefront/publish/link/woocommerce">WooCommerce <span aria-hidden="true">→</span></a></p>

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
