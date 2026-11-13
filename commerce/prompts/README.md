# Pagefront prompts

The prompts a merchant hands to a chat assistant to write Pagefront
sheets, then to serve them on the shop's own domain, then to link them from
the shop's pages.
The site renders the write prompts; this folder is the source.

## What the folder holds

The write phase:

- `core.md`: the shared body of the write-phase prompts; `<!-- platform -->`
  marks where the platform section goes.
- `platform-generic.md`, `platform-shopify.md`, `platform-woocommerce.md`:
  one section per platform, read into `core.md` at the marker.
- `write-<platform>-chat.md`: the three built write prompts, `core.md` plus
  one platform section. They are committed, so the site build never runs
  Python and a reader gets the prompt as served.
- `draft-product-from-page-chat.md`: the one-product prompt, which drafts a
  Product sheet from a single product page. It has no platform section and
  is not built.
- `code-route/`: the last builds of the write phase's code route, from
  prompt set 1.13.0, kept as the starting point of the developer version.
  A snapshot: nothing builds them, the site does not serve them, and the
  set's version moves without them. Its README says more.

The serve phase, which puts the sheets the write phase handed over
(`commerce.zip`) online on the shop's domain, through Cloudflare R2, a
Worker and the platform's forwarding:

- `serve-core.md`: the shared body of the serve-phase prompts, with the
  same marker. Its SCREENS section and the platform sections' admin paths
  are dated observations of the dashboards, which go stale when the
  dashboards change.
- `serve-platform-shopify.md`, `serve-platform-woocommerce.md`: one
  section per platform. A platform gets a serve section once its path has
  been walked end to end; a shop on a headless front needs a developer and
  belongs to the developer version, which does not exist yet.
- `serve-<platform>-chat.md`: the two built serve prompts.

The link phase, which makes the served sheets findable from the shop's
pages per Discovery: the merchant pastes each sheet's address into a field
of its page, and one piece of code prints the declaration on every page
whose field is set:

- `link-core.md`: the shared body of the link-phase prompts, with the same
  marker.
- `link-platform-shopify.md`, `link-platform-woocommerce.md`: one section
  per platform, its admin paths dated observations. WooCommerce was walked
  end to end; Shopify for one product on a development store, and its
  entry point redirect on the same store on 2026-11-10, so its collection
  and page definitions and the public checks on an open store are
  untested.
- `link-<platform>-chat.md`: the two built link prompts.

`build.py` assembles every built prompt from the cores and the platform
sections.

## Rebuilding

After editing a core or a platform section:

```
python3 commerce/prompts/build.py
```

Commit the sources and the seven outputs together. A pull request that
edits a source without rebuilding leaves the served prompt behind the
source.

## Versioning

Prompts version the way the rule catalogue does: a semver of their own,
independent of the commerce release, stating which release they target.
The version is the second line of every prompt's header block:

```
- Prompt set 1.17.0, for commerce release 0.5.0.
```

The whole set shares one version. The rule:

- A change to what a prompt asks for or produces is a minor.
- Wording that changes no behaviour is a patch.
- A change of target commerce release is a minor. A commerce release
  rebuilds the prompts for it (schema URLs, spec versions, the target
  release line), bumps the set and adds a changelog entry; see "Releasing"
  in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

Changes are recorded in [`CHANGELOG.md`](CHANGELOG.md): a change lands
with its version bump, its entry and the entry's date in the same pull
request. The set is tagged `commerce-prompts-v<semver>` at a commerce
release, which rebuilds the prompts, and at any other time the owner wants
to cite a set; a tag goes on a commit that is already on `main` and carries
the version the prompts state, following the `lint-*` tag pattern in
`CONTRIBUTING.md`. Nothing is published by the tag; the site serves the
prompts from `main`.

## Where the site renders them

- The built chat prompts: `/pagefront/publish/write/<platform>`, for
  `shopify` and `woocommerce`, each with a markdown twin at the same path
  plus `.md`. The generic prompt (`write-generic-chat.md`) is built and
  committed with the set and is not rendered on the site.
- The one-product prompt: `/pagefront/publish/assistant`, with its twin at
  `/pagefront/publish/assistant.md`.
- The built serve prompts: `/pagefront/publish/serve/<platform>`, for
  `shopify` and `woocommerce`, each with a markdown twin at the same path
  plus `.md`.
- The built link prompts: `/pagefront/publish/link/<platform>`, for
  `shopify` and `woocommerce`, each with a markdown twin at the same path
  plus `.md`.
