# Changelog: Pagefront Discovery

The history of [`discovery.md`](discovery.md). Changes land under "Unreleased" and are versioned at the next release, when the heading becomes `### <version> — <date>`; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

### Unreleased

Changes land here and are versioned at the next release; see "Releasing" in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

- **Editorial: the changelog moves to this file.** `discovery.md` keeps a one-line Changelog section that points here; the entries are unchanged.

### 0.1.0 — 2026-10-18

First version. This document is format-level and is dated on its own; it is not a member of a commerce release.

- **Initial text.** Moved from the Product Sheet spec, unchanged in wording: the discovery principle, the page-based carriers (the `Link` header and the HTML `<link>` element, the media type, the selection rule, the serving note, the carriers paragraph and the CORS recommendation), and the filename convention. Generalised from the same spec: the traversal-hint rule, which no longer lists the product fields that carry hints (each sheet spec does), and the confirmation step from the Collection Sheet spec's "Resolution", which the rule now states for every reference. The one addition is "Entry point": `/.well-known/pagefront` and the `Pagefront:` line in `/robots.txt`, two carriers that reach an origin's root Sheet without a page, and the intended provisional registration of the well-known suffix. The discovery principle gains one sentence saying the entry point is located by declaration too.
- **Addition: DNS as the third entry-point carrier.** DNS TXT record at `_pagefront.<host>` added as third entry-point carrier; may delegate the root off-origin. The record's value is the root Sheet's absolute URL; a consumer tries it after `/.well-known/pagefront` and `/robots.txt`, MAY omit the DNS step, and takes the first well-formed record where several are present. A publisher MUST NOT rely on DNS as its only carrier where either of the other two is available to it. "Delegation by DNS": a root named by the record is authoritative for the domain that published it, even on another host, and the host rules below the root are unchanged; the other two carriers resolve on the origin that serves them. The conformance sentence under "Carriers" now admits a declaration from the DNS zone of the publisher's domain, and the node name `_pagefront` is intended for the IANA underscored-names registry.
- **Clarification: the entry-point origin.** Entry-point origin defined as the host reached after the site's own redirects for `/`. DNS carrier name is `_pagefront.<host>`, no walk-up. Validator fails off-origin well-known and robots pointers.
- **Clarification: what a sheet is.** "Serving" adds the mirror of the `application/json` sentence: a consumer does not accept a response as a sheet on its Content-Type alone; a sheet is a body that parses as JSON and carries `$schema`. The hosted checker reads bodies that way and reports a response labelled as a sheet whose body is something else.
- **Clarification: indexing.** The non-normative serving recommendation adds that publishers should let search crawlers index sheet URLs and list them in the sitemap, so that consumers reaching the web through a search index can fetch them. A sitemap entry is a reachability aid and never a discovery declaration. The paragraph's CORS sentence drops its RFC 2119 keyword to plain "should" at the same time: the paragraph is advice and no rule tests it.
