# Contributing to Pagefront

Pagefront is an open specification under active design. Contributions are
welcome from publishers, implementers, agent and tool builders, and anyone
with field-tested input.

There are two ways to contribute, and they are unevenly supplied. The
specification has an editor; the ecosystem around it has almost no one. Until
people can emit and consume Sheets, the spec stays a document. If you are
choosing where to spend an afternoon, the first section below is worth more
than the second.

Governance and decision-making are documented separately in
[`GOVERNANCE.md`](GOVERNANCE.md).

---

## Part one: help it get used

### Publish a Sheet

The most useful thing anyone can do is emit real Sheets for a real catalog.
Everything in the spec was written against real merchant pages, and every
weakness in it has been found the same way.

Start from the normative spec, [`commerce/spec/product.md`](commerce/spec/product.md),
check your output against the
[Check](https://themachineweb.org/pagefront/commerce/validate),
and tell us what happened, including if you gave up. A report that says
"this was harder than it should have been, here is where" is a contribution.

### Build a producer

Merchants will not hand-write JSON. Pagefront gets used when it ships inside
the tools they already run. None of these exist yet:

- **Shopify**: app or theme extension emitting Sheets from the product API
- **WooCommerce**: WordPress plugin
- **PrestaShop / Sylius**: module
- **Astro / Next.js / Eleventy**: build-time integration for headless
  storefronts
- **A plain emitter library**: JS, PHP or Python, taking a product record
  and returning a conforming Sheet

These belong in your own repository, under your own name and licence. Open an
issue when one is usable and it gets linked from the README and the site. If
you are starting one, say so in an issue first so two people don't build the
same thing.

### Build a consumer

Nothing yet demonstrates the spec's central claim end to end: that agents can
read a deterministic contract instead of scraping rendered HTML. A consumer is
the biggest gap in the project.

- **An MCP server** that resolves a Sheet by URL, validates it, and exposes
  it as a tool to an agent
- **A fetch-and-parse library** implementing `Link` header discovery,
  language fallback and `@id` resolution
- **An agent connector or crawler** that consumes Sheets at more than one
  merchant

### Write about it, or talk about it

The [manifesto](https://themachineweb.org/manifesto) is CC BY 4.0. Quote it,
disagree with it in public, use it in a talk. If you are speaking somewhere
and want slides, diagrams or a review of your framing, ask; that is a
legitimate use of the editor's time.

You do not need permission to describe a conforming implementation as
Pagefront. Written permission is required in one case, implying endorsement
by the project; see the trademark note in [`GOVERNANCE.md`](GOVERNANCE.md).

### Bring a case study

A worked example grounded in a real merchant is the most persuasive artifact
this project has. There are two routes.

**If you are a merchant**, you do not need GitHub. Email
`contact@themachineweb.org` with a link to your site and what you published.
The editor will interview you, write it up, and send you the draft for
approval before anything appears. Your name and the merchant's name go on
the page.

**If you implemented it**, open a PR. A case study lives under
`commerce/case-studies/<short-name>/` and contains at minimum:

- The sheets, validating against the current schemas in `commerce/spec/`:
  the product sheet and,
  where the merchant is its own seller, the organization sheet.
- A `case-study.md` written for a merchant deciding whether to publish,
  and readable by an implementer building a producer. In this order:
  1. **The merchant and the product**, in a few sentences.
  2. **What the page says today, and what the sheet adds**: what an agent
     can answer from the sheet that it cannot from the page.
  3. **Where it came from**: which values were already in the merchant's
     platform or on its pages, and which needed a human decision.
  4. **What the merchant would decide**: the modeling choices that are
     theirs, such as which edition, how variants are cut, and what to do
     about statements that contradict each other on their own site.
  5. **What publishing would take**: emit, serve, link, validate.
  6. **Weight**: the product page's HTML document against the sheet, on
     the wire and uncompressed, measured the same day with one request
     each, and what the page still has to load to show a price.
  7. **For implementers**: what the sheet exercises, briefly.
  8. **Method**: sources and the date they were read; anything inferred
     rather than stated.
  Keep extraction mechanics and spec history out of it; what a case taught
  the standard goes in `commerce/case-studies/CORPUS-NOTES.md`.
- Attribution and the merchant's permission to be credited.

Validation runs as part of review. Case studies are edited before they
appear.

---

## Part two: improve the spec

**Spec proposals.** Open an issue before a pull request. Describe the
problem with a real example (an existing site the current spec handles
poorly, an artifact that cannot be expressed cleanly, an extension you
believe is needed). Discussion happens in the issue. If the proposal is
accepted in principle, a PR follows.

**Clarifications, fixes, and editorial improvements.** For typos, broken
links, ambiguous wording, and malformed examples, open a PR directly without
an issue.

**Reference tooling.** Tooling that lives in this repository should be
small and reference-quality; the lint packages under `core/lint/` and
`commerce/lint/` are the model. Anything larger belongs in its own repo and
is linked from here.

### How to open a spec proposal issue

A useful proposal contains:

1. **The problem.** A concrete case the current spec handles poorly or not at
   all. Link to a real merchant page if possible.
2. **What you tried.** How you attempted to express it in the current schema,
   and where it broke down.
3. **A sketched solution.** A small JSON snippet showing what the artifact
   would look like under your proposal.
4. **Compatibility note.** Is this additive (a minor of the sheet spec it
   touches), or does it break existing artifacts (a minor before 1.0, a
   major from 1.0)? If the latter, what would adopters need to do?

Proposals are discussed in the issue. Decisions are documented in the issue
before they land in a PR, and rejections are explained on the record.

### What we are not looking for at v0.x

- Backward-compatibility shims for older drafts. Sheets carrying
  `format_version` (the legacy draft line, format 0.9 and earlier) keep
  validating against the legacy schemas, and nothing more is built for
  them. Before 1.0 a breaking change is a new minor of its sheet spec.
- Vendor-specific features that do not generalize beyond a single platform,
  agent, or merchant.
- Style-only churn (renaming for taste, reformatting without a reason).

---

## Credit

Contributors to the spec and to the ecosystem are named in release notes.
Implementations are listed in the README and on the site under their
authors' names. Case-study pages carry the byline of whoever did the work.

## Versioning

Each sheet spec has its own semver, and a commerce release bundles the sheet
specs and the vocabulary. A sheet carries the release in its envelope
(`release`) and names its sheet-spec version in its `$schema` URL. The
scheme and the release table are in
[`commerce/spec/releases.md`](commerce/spec/releases.md).

A proposal's compatibility note should say which bump it is. An additive
change is a minor of the sheet spec it touches. A breaking change is a minor
before 1.0 and a major from 1.0. A fix or clarification is a patch. From
release 1.0.0, removals also follow the deprecation policy in "Versioning
and stability" in [`commerce/spec/vocabulary.md`](commerce/spec/vocabulary.md).
The linter rule catalogue keeps its own semver.

## Repository management

Four principles govern where things live:

- **`main` holds one living copy of each spec.** It is always the next
  release in progress. There are no version folders for spec prose.
- **Git tags mark releases.** A release is a tag on `main`; the spec as it
  stood at a release is the repository at that tag.
- **Published JSON Schemas are the only per-version copies.** They live in
  [`commerce/schemas/`](commerce/schemas/), one file per published version
  (`<type>/v<version>.json`). They are frozen and append-only, and the site
  serves them verbatim, so every schema URL ever published stays
  resolvable. `commerce/spec/product.json` and
  `commerce/spec/organization.json` are the editable heads: each one's
  `$id` names the version it will next be released as, and until a change
  lands the head equals the latest frozen file. A CI check
  ([`frozen-schemas.yml`](.github/workflows/frozen-schemas.yml)) fails any
  pull request that modifies or deletes a published schema, or that leaves
  the store and `commerce/spec/releases.json` disagreeing.
- **`commerce/archive/` is frozen.** It is the record of drafts before
  release 0.3.0. Nothing new goes there; tags replace it.

### Changelogs

Every spec document (`product.md`, `organization.md`, `vocabulary.md`,
`rules.md`, `core/spec/discovery.md`, `core/spec/linter.md`) has an
`### Unreleased` heading at the
top of its changelog. A change to a document lands with an entry there, in
the same pull request.

A spec header never shows an unreleased version. The version line of a
document changes only at release time, in the release pull request.

### Branches

- Changes land on `main` by pull request only. `main` is not protected on
  GitHub yet, so this holds by convention: nobody pushes to `main`
  directly, and a pull request merges once its checks pass. There are
  two: `frozen-schemas`, and the site's preview build
  (`Workers Builds: themachineweb`), which reports a little later. Branch
  protection, with the `frozen-schemas` check required, is to be enabled
  when the repository becomes public or its plan allows it.
- Work happens on short-lived topic branches, named by what they touch:
  `spec/<topic>`, `fix/<topic>`, `lint/<topic>`, `site/<topic>`. A branch
  is deleted after it merges.
- There are no long-lived release branches. If an old release needs a
  patch, a branch `release/commerce-<major>.x` is cut from that release's
  tag at that point.

### Releasing

A commerce release is cut from `main` in one pull request, then tagged.

1. **Decide each member's bump.** Read each changed member's Unreleased
   entries and take its semver bump: before 1.0, a breaking or an additive
   change is a minor and a fix or clarification is a patch.
2. **Bump the spec headers** to the new versions, and turn each Unreleased
   section into `### <version> — <date>`, leaving an empty `### Unreleased`
   above it.
3. **Freeze the schemas.** Copy each changed head schema to
   `commerce/schemas/<type>/v<version>.json`. The head's `$id` already
   names that version. Published files are never edited afterwards.
4. **Compute the release bump:** the highest member bump, and a new sheet
   type is a minor. The vocabulary takes the release version.
5. **Update [`commerce/spec/releases.md`](commerce/spec/releases.md)** (the
   table and the release notes) and
   [`commerce/spec/releases.json`](commerce/spec/releases.json).
6. **Migrate the case-study sheets and the examples** to the new release:
   `release`, `$schema`, and whatever the release changed. The examples
   include the ones on the site (`site/src/content/`).
7. **Merge to `main`, then tag** `commerce-v<release>` on the merge commit
   and publish a GitHub Release with the notes from `releases.md`.

Tag names:

- `commerce-v<semver>` marks a commerce release. The prefix is the
  vertical; future verticals use their own.
- `lint-core-v<semver>` and `lint-commerce-v<semver>` mark the npm
  packages, and match the published versions. Pushing one publishes the
  package.
- Sheet specs are not tagged. A release tag pins them through
  `releases.json`.

A rule catalogue version that supports the new release ships in a
`@pagefront/lint-commerce` release, which bundles every file in
`commerce/schemas/` and the release manifest at build time.

## Code of conduct

This project follows the
[Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
Report incidents to `conduct@themachineweb.org`.

## License of contributions

By submitting a contribution to this repository, you agree that your
contribution is licensed under the same terms as the rest of the
specification:
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) for the spec
itself, and Apache 2.0 for code.

Implementations you build in your own repositories are yours, under whatever
licence you choose. Nothing in this project asks for a claim on them.
