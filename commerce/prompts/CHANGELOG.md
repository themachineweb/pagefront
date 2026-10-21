# Changelog: Pagefront prompts

The prompt set's own semver; see "Versioning" in [`README.md`](README.md).

## Unreleased

## 1.1.0 — 2026-10-21

For commerce release 0.5.0.

- The chat-route write prompts take a list of product page addresses as
  their input and find the shop from them. Pasted alone, the prompt's first
  reply asks for that list and nothing else; given the list with the prompt,
  it starts at once (rule 1 and Step 1 of `core.md`; the six built prompts
  rebuilt).
- The code-route prompts keep the homepage address as their input.
- The one-product prompt keeps its behaviour and carries the set's version.

## 1.0.0 — 2026-10-20

First versioned set, for commerce release 0.5.0.

- Write-phase prompts for a whole shop, built from `core.md` and a platform
  section: generic, Shopify and WooCommerce, each on the chat route and the
  code route (`write-<platform>-<route>.md`).
- The one-product page prompt, `draft-product-from-page-chat.md`, which
  drafts a Product sheet from a single product page; it was served from the
  site's own content folder before this set.
