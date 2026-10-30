# Pagefront prompts

The prompts a merchant hands to a chat assistant or a code assistant to
write Pagefront sheets. The site renders them; this folder is the source.

## What the folder holds

- `core.md`: the shared body of the write-phase prompts. Blocks between
  `<!-- route: chat -->` or `<!-- route: code -->` and `<!-- /route -->`
  appear only in that route's prompt; `<!-- platform -->` marks where the
  platform section goes.
- `platform-generic.md`, `platform-shopify.md`, `platform-woocommerce.md`:
  one section per platform, read into `core.md` at the marker.
- `write-<platform>-<route>.md`: the six built prompts, `core.md` plus one
  platform section for one route (`chat` or `code`). They are committed, so
  the site build never runs Python and a reader gets the prompt as served.
- `draft-product-from-page-chat.md`: the one-product prompt, which drafts a
  Product sheet from a single product page. It has no platform section and
  is not built.
- `build.py`: assembles the six built prompts from `core.md` and the
  platform sections.

## Rebuilding

After editing `core.md` or a platform section:

```
python3 commerce/prompts/build.py
```

Commit the sources and the six outputs together. A pull request that edits
a source without rebuilding leaves the served prompt behind the source.

## Versioning

Prompts version the way the rule catalogue does: a semver of their own,
independent of the commerce release, stating which release they target.
The version is the second line of every prompt's header block:

```
- Prompt set 1.7.0, for commerce release 0.5.0.
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
- The code-route prompts are in the site's collection and have no page yet.
