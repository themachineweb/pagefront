# Pagefront

An open specification for publisher-authored, machine-readable representations
of web resources — on the publisher's own domain, on the publisher's own terms.

The experience layer of the web is moving. AI agents, search crawlers, and
platforms increasingly read on behalf of users who never visit the source page.
Publishers lose control over how they are represented — their voice, their
story, their data — to whichever intermediary summarizes them.

Pagefront proposes a way back: a small companion document, published by the
resource owner, linked from the canonical page, and served on the same domain.
A publisher's canonical, machine-readable statement of what they are and what
they offer — without any platform's permission required.

## Status

Commerce release 0.5.0 is the current release. It bundles the Product Sheet
spec 0.11.0, the Organization Sheet spec 0.5.0, the Collection Sheet spec
0.1.0 and the vocabulary.
The format is suitable for experimentation and feedback today; the stability
policy applies from release 1.0.0.

What this repository contains today:

- [`manifesto.md`](manifesto.md) — why this exists
  ([read online](https://themachineweb.org/manifesto)).
- [`commerce/spec/`](commerce/spec/) — the commerce vertical, one living
  copy of each document: the product sheet (`product.md`, with its design
  notes in `product-notes.md`), the organization
  sheet (`organization.md`), the `pagefront:` vocabulary, the releases and
  versioning scheme (`releases.md`, `releases.json`), the linter rule
  catalogue (`rules.md`), and the non-normative completeness dimensions
  (`scoring.md`). `product.json` and `organization.json` are the editable
  heads of the JSON Schemas. Rendered at
  [themachineweb.org/pagefront/spec](https://themachineweb.org/pagefront/spec).
- [`core/spec/`](core/spec/) — the format-level documents: discovery
  (`discovery.md`) and the vertical-agnostic linter design (`linter.md`).
- [`core/lint/`](core/lint/) and [`commerce/lint/`](commerce/lint/) —
  `@pagefront/lint-core` and `@pagefront/lint-commerce`, published on npm:
  the rule engine, the commerce catalogue, and the `pagefront-lint-commerce`
  CLI.
- [`commerce/case-studies/`](commerce/case-studies/) — worked examples
  against real merchants, all with release 0.5.0 sheets. Nitto (apparel) and
  AFS Blackbird V3 (sports equipment, multi-SKU) are published on the site,
  each with a product sheet and an organization sheet. Kimaï (jewelry,
  made-to-order, product and organization sheets) and Zalando / Friboo
  (multi-brand retailer, organization sheets only) are corpus examples kept
  in the repository.
- [`commerce/schemas/`](commerce/schemas/) — every published JSON Schema,
  one file per version (`product/v0.11.0.json`, `organization/v0.5.0.json`,
  `collection/v0.1.0.json`, the earlier versions, and the legacy `v0.9.json`
  files). Frozen and append-only: the site serves
  these files verbatim, so a published schema URL never changes or
  disappears.
- [`commerce/prompts/`](commerce/prompts/) — the prompts a merchant hands
  to a chat or code assistant to write sheets: the sources, the built
  prompts the site serves, and the prompt set's own version and changelog.
- [`site/`](site/) — themachineweb.org, including
  [Check](https://themachineweb.org/pagefront/commerce/validate), which reads a
  page's sheet declaration and judges the sheet it points at.

Drafts before release 0.3.0 are in the tree of tag `commerce-v0.3.0`;
later history is in git tags and changelogs. The public history of this
repository starts at the release snapshots, one commit per release tag
from 0.3.0; the working record before them is kept in a private archive.

Not yet: verticals beyond commerce (`media/` is reserved).

## Repository layout

```
pagefront/
├── manifesto.md                  Why this exists
├── CONTRIBUTING.md               How to contribute
├── GOVERNANCE.md                 How decisions are made
├── LICENSE                       CC BY 4.0 (the specification)
├── package.json                  npm workspaces root (lint packages)
├── core/                         Vertical-agnostic pieces
│   ├── spec/
│   │   ├── discovery.md            Discovery: carriers, entry point, traversal hints
│   │   └── linter.md               Linter design (rule structure, output)
│   └── lint/                       @pagefront/lint-core (rule engine, renderers)
├── commerce/                     The commerce vertical
│   ├── spec/
│   │   ├── product.md              Product sheet, the field reference
│   │   ├── product-notes.md        Product sheet design notes (non-normative)
│   │   ├── product.json            Product sheet JSON Schema, editable head
│   │   ├── organization.md         Organization sheet, prose spec
│   │   ├── organization.json       Organization sheet JSON Schema, editable head
│   │   ├── vocabulary.md           pagefront: extension vocabulary
│   │   ├── releases.md             Versioning scheme, release table and notes
│   │   ├── releases.json           The release table, for machines
│   │   ├── rules.md                Linter rule catalogue
│   │   ├── scoring.md              Completeness dimensions (non-normative)
│   │   └── registry/               Machine-readable property registry
│   ├── schemas/                    Published JSON Schemas, frozen, one per version
│   │   ├── product/                  v0.11.0.json, v0.10.0.json, v0.9.0.json, and the legacy v0.9.json
│   │   ├── organization/             v0.5.0.json, v0.4.0.json, v0.3.0.json, and the legacy v0.9.json
│   │   └── collection/               v0.1.0.json
│   ├── lint/                       @pagefront/lint-commerce (catalogue + CLI)
│   ├── prompts/                    Assistant prompts: sources, built files, version and changelog
│   └── case-studies/               Worked examples against real merchants
│       ├── nitto/                    Apparel (Nitto Knitwear)
│       ├── kimai/                    Jewelry, made-to-order, configurable
│       ├── blackbird/                Sports equipment, multi-SKU (AFS)
│       └── zalando/                  Multi-brand retailer, organization sheets
├── scripts/                      Repository checks (frozen-schema guard)
├── media/                        Reserved for the media/article vertical
└── site/                         themachineweb.org (Astro, Cloudflare Workers)
```

## Where to start

1. Read [`manifesto.md`](manifesto.md) for the problem and the case for
   publisher-owned machine-readable publishing.
2. Read [`commerce/spec/product.md`](commerce/spec/product.md) for the prose
   specification, here or [on the site](https://themachineweb.org/pagefront/spec/commerce/product).
3. Author a sheet and check it: paste it into the
   [Check](https://themachineweb.org/pagefront/commerce/validate),
   or run `pagefront-lint-commerce <sheet-url-or-path>` from
   `@pagefront/lint-commerce`. Both validate against the JSON Schema first,
   then apply the rule catalogue.
4. Look at the case studies for how the spec applies to real products of
   different shapes.

## Versioning

Each sheet spec (product, organization, and those to come) has its own
semver. A commerce release is a named, versioned bundle of the sheet specs
and the vocabulary, and its bump follows its members. A sheet carries the
release in its envelope (`release`) and names its sheet-spec version in its
`$schema` URL. Breaking changes follow semver: before 1.0 a breaking change
is a new minor. From release 1.0.0, a term never changes meaning, and a
removal is deprecated first, stays valid for at least twelve months and is
announced before it happens. The linter rule catalogue and the linter
packages each keep their own semver.

Sheets carrying `format_version` belong to the legacy draft line (format 0.9
and earlier) and stay valid against the legacy schemas.

The scheme, the release table and the release notes are in
[`commerce/spec/releases.md`](commerce/spec/releases.md).

## Who this is for

- **Publishers** who want direct control over what machines see, with reduced
  bandwidth from non-human traffic and freedom from any single agent ecosystem.

- **Agent and tool builders** who want a stable, deterministic contract for
  resource data — without parsing rendered HTML or maintaining brittle
  selectors.

- **Implementers** building libraries, validators, plugins, or platform
  integrations against the spec.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). The most useful contributions are
the ones that get the spec used: publishing sheets for a real catalog,
building producers and consumers, and bringing case studies. Spec proposals
go through issues. The project's decision-making process is documented in
[`GOVERNANCE.md`](GOVERNANCE.md).

## License

The Pagefront specification is licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). You may use,
modify, and redistribute it — including commercially — provided you give
appropriate credit and indicate any changes.

Code in this repository is licensed under Apache 2.0: the lint packages
under `core/lint/` and `commerce/lint/`, the site and its Worker under
`site/`, and the prompt build script in `commerce/prompts/`. Each code
folder carries its `LICENSE` file. The specification, the case studies and
the prompts remain CC BY 4.0.

## Contact

For general inquiries: contact@themachineweb.org
For security disclosures: security@themachineweb.org

## Acknowledgments

Pagefront is written and edited by Stephane Lee. The specification is governed
independently and welcomes contributors and implementers from any organization.
A commercial implementation may launch as a venture of
[VengaLabs](https://vengalabs.com), an early-stage startup studio founded by
the editor; none exists today. See [`GOVERNANCE.md`](GOVERNANCE.md) for the
editor's disclosed interest.
