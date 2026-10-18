# Consume

Reading a sheet takes two requests and no permission. You fetch a page you were
going to fetch anyway, follow one link in it, and get a few kilobytes of typed
JSON. There is no key to obtain, no account to register, and nobody to ask.

Where there is no link, there is no sheet, and nothing about your existing
pipeline changes.

## The whole thing

```
GET  merchant.example/product/anorak          the page
     Link: <...anorak.en.json>; rel="alternate"; type="application/pagefront+json"
GET  merchant.example/product/anorak.en.json  the sheet
```

Four steps: find it, fetch it, read the envelope, read the data.

## 1. Find the sheet

A sheet is located by publisher declaration. The publisher states where it is,
and you follow that statement.

The `Link` response header on the page is the primary carrier:

```
Link: <https://merchant.example/api/sheets/anorak.en.json>;
      rel="alternate";
      type="application/pagefront+json";
      profile="https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json";
      title="Pagefront product sheet"
```

The `<link>` element in the page head is the fallback, and publishers are
advised to emit both:

```html
<link rel="alternate"
      type="application/pagefront+json"
      href="https://merchant.example/api/sheets/anorak.en.json"
      title="Pagefront product sheet">
```

Check the header first. A HEAD request on the page is enough when the header
is there, and you never download the page body. Fetch the page and parse its
head only when no header declares the sheet; where both are present, the header
is authoritative. Select the link by `rel="alternate"`
together with `type="application/pagefront+json"`: a page carries other
alternates, such as feeds and embeds, and the type is what tells the sheet
apart. Do not select by title or by the look of the URL, and expect at most one
such link per page. A sheet served as `application/json` is still a sheet; its
`$schema` confirms what the link said.

The spec is strict about the other direction. A consumer must not construct a
sheet URL from the shape of a page URL, from the recommended filename
convention, or from any pattern the publisher has not declared, even where the
construction would succeed. A guess that works today breaks when the publisher
moves the file, and it turns a stable contract back into scraping.

## 2. Fetch it

One GET. Sheets are small, and they are ordinary documents on the publisher's
own domain.

## 3. Read the envelope

Every sheet carries `$schema`, `release`, `schema_org_version`, `canonical_url`,
`generated_at` and `data`. `sheet_url` is optional, and `expires_at` is
recommended and often present.

`canonical_url` is the resource the sheet describes. `sheet_url`, where present,
is the address the publisher knew when it generated the sheet; the page's link
is what locates the sheet today. `generated_at` is when the publisher produced
it.

`expires_at`, where present, is how long the publisher believes this sheet
holds. Sheets carrying live pricing or stock use short windows; a static
catalogue entry may run for days. Where it is absent, the publisher has declared
no expiry policy and the freshness decision is yours.

`release` tells you which commerce release the sheet is written against, and
`$schema` names the version of its own sheet spec. A sheet carrying
`format_version` in place of `release` is on the legacy draft line (format 0.9
and earlier) and reads against the legacy schema its `$schema` names. The
format is pre-1.0 and can still change; breaking changes follow semver.

## 4. Read the data

The `data` block is Schema.org JSON-LD. If you already parse Schema.org, you
already parse this.

Commerce specifics that Schema.org does not carry sit under the `pagefront:`
prefix: configurable pricing, made-to-order terms, material composition,
manufacturing chains, certifications and their scope. The
[vocabulary document](/pagefront/spec/commerce/vocabulary) defines each one. If
you expand the JSON-LD rather than reading it as JSON, the `pagefront` prefix
must be present in `@context` for those terms to resolve.

One sheet is one language. `inLanguage` says which.

## Follow references

Sheets point at each other by `@id`. A variant refers to its parent, a product
refers to the organization behind it.

Where the target lives in its own sheet, the entry carries a `sheet_url`
alongside the `@id` as a traversal hint. The hint can be stale, because the
target's address can change between updates of the sheet you are holding.
Where it is missing or does not resolve, reach the target the same way you
reached this one: fetch its `url` and follow the `alternate` link. Do not
keep a sheet URL past the next change of the page it belongs to.

## What none of this requires

No API key. No account. No partnership with the merchant, no rate-limit
negotiation, and no data agreement. You read a public document at a public URL,
the same way you read the page it describes.

Nothing about it depends on this site. If themachineweb.org disappeared
tomorrow, every published sheet would keep working.

## Consumption follows adoption

[Worked examples are on this site](/pagefront/commerce/case-studies) as
documents you can fetch and parse, and the specification is pre-1.0, so what you
need from it can still go in.
