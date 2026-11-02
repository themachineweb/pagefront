# Pagefront prompts

The prompts a merchant hands to a chat assistant or a code assistant to
write Pagefront sheets, and then to serve them on the shop's own domain.
The site renders the write prompts; this folder is the source.

## What the folder holds

The write phase:

- `core.md`: the shared body of the write-phase prompts. Blocks between
  `<!-- route: chat -->` or `<!-- route: code -->` and `<!-- /route -->`
  appear only in that route's prompt; `<!-- platform -->` marks where the
  platform section goes.
- `platform-generic.md`, `platform-shopify.md`, `platform-woocommerce.md`:
  one section per platform, read into `core.md` at the marker.
- `write-<platform>-<route>.md`: the six built write prompts, `core.md`
  plus one platform section for one route (`chat` or `code`). They are
  committed, so the site build never runs Python and a reader gets the
  prompt as served.
- `draft-product-from-page-chat.md`: the one-product prompt, which drafts a
  Product sheet from a single product page. It has no platform section and
  is not built.

The serve phase, which puts the sheets the write phase handed over
(`commerce.zip`) online on the shop's domain, through Cloudflare R2, a
Worker and the platform's forwarding:

- `serve-core.md`: the shared body of the serve-phase prompts, with the
  same markers. Its SCREENS section and the platform sections' admin paths
  are dated observations of the dashboards, which go stale when the
  dashboards change.
- `serve-platform-shopify.md`, `serve-platform-woocommerce.md`: one
  section per platform. A platform gets a serve section once its path has
  been walked end to end; a shop on a headless front needs a developer and
  belongs to a code route, which does not exist yet.
- `serve-<platform>-chat.md`: the two built serve prompts, chat route only.

`build.py` assembles every built prompt from the cores and the platform
sections.

## Rebuilding

After editing a core or a platform section:

```
python3 commerce/prompts/build.py
```

Commit the sources and the eight outputs together. A pull request that
edits a source without rebuilding leaves the served prompt behind the
source.

## Versioning

Prompts version the way the rule catalogue does: a semver of their own,
independent of the commerce release, stating which release they target.
The version is the second line of every prompt's header block:

```
- Prompt set 1.8.0, for commerce release 0.5.0.
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
  plus `.md`. The generic prompts (`write-generic-chat.md`,
  `write-generic-code.md`) are built and committed with the set and are not
  rendered on the site.
- The one-product prompt: `/pagefront/publish/assistant`, with its twin at
  `/pagefront/publish/assistant.md`.
- The built serve prompts: `/pagefront/publish/serve/<platform>`, for
  `shopify` and `woocommerce`, each with a markdown twin at the same path
  plus `.md`.
- The code-route prompts are in the site's collection and have no page yet.
