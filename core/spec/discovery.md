# Pagefront Discovery

Status: normative spec.
Discovery spec version: 0.1.0
Applies to: every Sheet type in every vertical.

This document states how a consumer locates a Pagefront Sheet, and how a consumer holding only an origin reaches that origin's Sheets. The page-based carriers, the traversal-hint rule and the filename convention moved here from the Product Sheet spec ([`../../commerce/spec/product.md`](../../commerce/spec/product.md)) on 2026-10-15; they were format-level from the start and lived there because the product was the first sheet. The entry point is new in this document. Each sheet spec binds what this document leaves open: which fields carry traversal hints, and which Sheet type is an origin's root.

## Scope

This document governs two things. First, how a consumer locates the Sheet for a page it is reading, or for a Sheet it already holds that references another: the discovery principle, the carriers a page declares a Sheet with, and the rule for following a Sheet URL carried inside a Sheet. Second, how a consumer holding only an origin, with no page and no Sheet in hand, reaches that origin's Sheets: the entry point. It applies to every Sheet type in every vertical. What a Sheet contains, and which Sheet type is the root of an origin, are bound by each vertical's sheet specs.

## Discovery principle (normative)

**Discovery principle (normative).** A Sheet is located by publisher declaration. The publisher states where the Sheet is; the consumer follows that statement. A consumer MUST NOT construct a Sheet URL from the shape of a page URL, from the recommended filename convention, or from any other pattern the publisher has not declared, even where the construction would succeed. An entry point reached without a page is still located by declaration; the carriers below are the declarations.

## Page-based carriers

Discovery uses HTTP `Link` response headers per RFC 8288 as the primary mechanism, with HTML `<link>` element fallback. Per-page sheet links use `rel="alternate"`. The sheet is the publisher's representation of the same resource in a machine-readable format; `alternate` is the relation for that.

The examples are a product sheet's; every sheet type is declared the same way, and the `profile` names the sheet spec the declared Sheet follows.

```
Link: <https://merchant.example/api/sheets/anorak.en.json>;
      rel="alternate";
      type="application/pagefront+json";
      profile="https://themachineweb.org/pagefront/spec/commerce/product/v0.11.0.json";
      title="Pagefront product sheet"
```

```html
<link rel="alternate"
      type="application/pagefront+json"
      href="https://merchant.example/api/sheets/anorak.en.json"
      title="Pagefront product sheet">
```

**Media type.** The sheet's media type is `application/pagefront+json`. A page carries other `alternate` links, such as feeds and embeds, and where a page has no `Link` header the `type` attribute is the one selector a consumer has; `application/json` would leave the sheet indistinguishable from any other JSON alternate.

**Selection (normative).** A consumer selects the sheet link by `rel="alternate"` and `type="application/pagefront+json"` together. It MUST NOT select by `title`, by the shape of `href`, or because a link is the only JSON alternate on the page. A page declares at most one such link. A consumer reads the `Link` header first. A HEAD request on the canonical page is enough when the header is present: the sheet is discovered without downloading the page body. A consumer fetches the page and parses its head only when no header declares the sheet, on the HEAD response or on the GET response that follows it. Where both carriers are present, the header is authoritative. A publisher that emits the header SHOULD return it on HEAD responses as well as GET responses, so that discovery never needs the page body.

**Serving.** Publishers SHOULD serve sheets with `Content-Type: application/pagefront+json` where they control response headers. The link's `type` attribute is advisory: a consumer MUST NOT reject a sheet because it is served as `application/json`. Nor does a consumer accept a response as a sheet on its Content-Type alone: a sheet is a body that parses as JSON and carries `$schema`. The sheet's `$schema` confirms what the link type claimed.

**Carriers (non-exhaustive).** At v0.9 the declaration is carried by `Link: rel="alternate"` on the canonical page response, with the HTML `<link>` element as fallback; both together are recommended. A publisher that cannot set response headers declares the sheet with the `<link>` element alone; that carrier conforms on its own. Later versions may register additional carriers. A carrier is conformant if the declaration originates from the publisher's origin, or from the DNS zone of the publisher's domain.

Non-normative serving recommendation: publishers should serve sheets with `Access-Control-Allow-Origin: *`. Sheets are machine-facing public documents, and open CORS lets browser-based consumers (including the hosted checker at `/pagefront/commerce/validate`) read them directly. Publishers should also let search crawlers index sheet URLs and list them in the sitemap: consumers that reach the web through a search index fetch only what that index holds, and a sheet the index has never seen is out of their reach even when the page declares it. A sitemap entry is a reachability aid for those consumers and nothing more; discovery still follows the declaration, and a consumer MUST NOT take a sitemap entry as one.

## Entry point

The Sheets of an origin have a root. Which Sheet type is the root is bound by each vertical; this document does not say. A consumer holding only an origin, with no page to read, reaches the root through one of three carriers. The first two originate from the publisher's origin, the third from the DNS zone of the publisher's domain:

- **`/.well-known/pagefront`** (RFC 8615). The resource answers `303 See Other` with `Location` set to the root Sheet's URL. It MAY instead serve the root Sheet directly, with `Content-Type: application/pagefront+json`; the redirect is preferred, so that the Sheet has one address.
- **A `Pagefront:` line in `/robots.txt`**, whose value is the root Sheet's absolute URL. Parsers ignore lines they do not recognise (RFC 9309), so the line is safe on every origin; where `/.well-known/` cannot be written, this is the carrier.
- **A DNS TXT record at `_pagefront.<host>`**, whose value is the root Sheet's absolute URL. `<host>` is the origin's host name as reached after following the site's own redirects for `/`, the canonical storefront host: `shop.merchant.example` publishes `_pagefront.shop.merchant.example`. There is no walk-up: a consumer queries exactly `_pagefront.<host>` and does not try parent domains. A storefront reachable on both the apex and `www` publishes a record at each host it intends consumers to hold, or redirects one to the other at the HTTP layer; DNS lookups happen before any redirect, so a redirect alone does not cover the other name. The underscored name follows RFC 8552. A publisher sets one record; where several are present, a consumer takes the first well-formed one. This carrier needs no writable path on the origin: control of the domain is enough.

The origin is the host reached after following the site's own redirects for `/`; a pointer to that host is on-origin. A publisher SHOULD provide at least one carrier. A consumer holding only an origin tries `/.well-known/pagefront` first, then `/robots.txt`, then the TXT record. A consumer MAY omit the DNS step: an HTTP client does not resolve TXT records without a resolver library. For the same reason, a publisher MUST NOT rely on DNS as its only carrier where either of the other two is available to it. The entry point resolves to a Sheet and nothing else: the root Sheet's own references lead on from there, under "Traversal hints" below, and no index, catalog or registry document stands between the origin and its Sheets. The discovery principle holds here as everywhere: these three carriers are the declarations, and a consumer MUST NOT construct the root Sheet's URL from any other pattern.

**Delegation by DNS.** A TXT record at `_pagefront.<host>` is a statement by the domain's controller, and it MAY name a root Sheet URL on another host. A root reached this way is authoritative for the domain that published the record. The host rules for cross-sheet references below the root are unchanged: the collections and products referenced from that root follow the rules in their own specs. This is the only carrier permitted to point off-origin; `/.well-known/pagefront` and the `Pagefront:` line in `/robots.txt` resolve on the origin that serves them.

The suffix `pagefront` is intended for registration in the IANA Well-Known URIs registry with status provisional, and the node name `_pagefront` for the TXT record type in the IANA "Underscored and Globally Scoped DNS Node Names" registry (RFC 8552); this document is the specification reference for both.

## Traversal hints (normative)

**Traversal hints (normative).** A field whose value is another Sheet's URL is a traversal hint. Each sheet spec names the fields that carry one. The identity of the target is its `@id`, and its location is whatever its page currently declares. A hint MAY be stale: the target Sheet's address can change between updates, and the Sheet carrying the hint is re-emitted on its own schedule. A consumer MUST be able to reach the target through its page, the entry's `url` and then the Sheet that page declares, and SHOULD treat the hint as an optimisation over that path; the path stays the one a consumer relies on. A consumer MUST NOT cache a Sheet URL across the target's page changes. A consumer MUST NOT construct a Sheet URL from any pattern. The per-field notes in the sheet specs and in the vocabulary refer to this paragraph.

**Confirmation.** A consumer following a hint reads the Sheet URL it carries, fetches the Sheet, and confirms the fetched Sheet's data-block `@id` matches the reference's `@id` by exact string. On a mismatch, or when the hint is absent or fails, it fetches the reference's `url` and follows the `alternate` link that page declares.

**Sheets reached by reference.** Page-based discovery (`alternate`) finds the Sheet for the page being read. A Sheet reached by reference from another Sheet is located by the URL the referencing Sheet declares, under the rule above. The prohibition on constructing Sheet URLs is unchanged: a reference that declares no URL leaves its Sheet undiscovered.

## Filename convention

The standard recommends a filename. Where a Sheet lives is the publisher's choice; the discovery declaration says where that is.

Recommended shape: `{id}.{lang}.json`

- **`{id}`**: a stable identifier for the resource. Publishers may use a slug, a SKU, a UUID or any other durable identifier; the standard does not constrain its shape. It MUST remain stable for the life of the resource. Publishers using slug-derived ids SHOULD either freeze the slug at first publication or maintain HTTP 301 redirects from old Sheet URLs to new ones, as they would for page URL migrations.
- **`{lang}`**: the BCP 47 tag matching the Sheet's `inLanguage`. Single-language publishers MAY omit this segment; `inLanguage` remains authoritative. Adding a language adds a file; removing one is a publication event the publisher SHOULD handle with 410 Gone or a redirect to the closest remaining variant.
- **`.json`**: fixed. Future serializations use distinct extensions and are announced as separate declarations.

The directory is the publisher's. `/pagefront/commerce/product/…`, `/apps/pagefront/…`, `/wp-json/pagefront/v1/…` and any other location are equally conformant.

This convention exists for publisher convenience and inspectability. It is not a discovery mechanism, and it is not sufficient to locate a Sheet; see Discovery.

## Changelog

Changes land under "Unreleased" and are versioned at the next release, when the heading becomes `### <version> — <date>`; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

### Unreleased

Changes land here and are versioned at the next release; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

### 0.1.0 — 2026-10-18

First version. This document is format-level and is dated on its own; it is not a member of a commerce release.

- **Initial text.** Moved from the Product Sheet spec, unchanged in wording: the discovery principle, the page-based carriers (the `Link` header and the HTML `<link>` element, the media type, the selection rule, the serving note, the carriers paragraph and the CORS recommendation), and the filename convention. Generalised from the same spec: the traversal-hint rule, which no longer lists the product fields that carry hints (each sheet spec does), and the confirmation step from the Collection Sheet spec's "Resolution", which the rule now states for every reference. The one addition is "Entry point": `/.well-known/pagefront` and the `Pagefront:` line in `/robots.txt`, two carriers that reach an origin's root Sheet without a page, and the intended provisional registration of the well-known suffix. The discovery principle gains one sentence saying the entry point is located by declaration too.
- **Addition: DNS as the third entry-point carrier.** DNS TXT record at `_pagefront.<host>` added as third entry-point carrier; may delegate the root off-origin. The record's value is the root Sheet's absolute URL; a consumer tries it after `/.well-known/pagefront` and `/robots.txt`, MAY omit the DNS step, and takes the first well-formed record where several are present. A publisher MUST NOT rely on DNS as its only carrier where either of the other two is available to it. "Delegation by DNS": a root named by the record is authoritative for the domain that published it, even on another host, and the host rules below the root are unchanged; the other two carriers resolve on the origin that serves them. The conformance sentence under "Carriers" now admits a declaration from the DNS zone of the publisher's domain, and the node name `_pagefront` is intended for the IANA underscored-names registry.
- **Clarification: the entry-point origin.** Entry-point origin defined as the host reached after the site's own redirects for `/`. DNS carrier name is `_pagefront.<host>`, no walk-up. Validator fails off-origin well-known and robots pointers.
- **Clarification: what a sheet is.** "Serving" adds the mirror of the `application/json` sentence: a consumer does not accept a response as a sheet on its Content-Type alone; a sheet is a body that parses as JSON and carries `$schema`. The hosted checker reads bodies that way and reports a response labelled as a sheet whose body is something else.
- **Clarification: indexing.** The non-normative serving recommendation adds that publishers should let search crawlers index sheet URLs and list them in the sitemap, so that consumers reaching the web through a search index can fetch them. A sitemap entry is a reachability aid and never a discovery declaration. The paragraph's CORS sentence drops its RFC 2119 keyword to plain "should" at the same time: the paragraph is advice and no rule tests it.
