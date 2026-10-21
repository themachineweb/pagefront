# Pagefront: working rules for Claude

Rules for working in this repository that are easy to break by accident.
Each one points at the document that owns the detail; read that document
before acting on the area it covers. Version numbers and release state are
left out on purpose: read them from `commerce/spec/releases.json`, the
package manifests and git.

## Landing changes

- Never commit or push to `main` directly. Work on a short-lived topic
  branch named by what it touches (`spec/<topic>`, `fix/<topic>`,
  `lint/<topic>`, `site/<topic>`), open a pull request, wait for its
  checks, merge it by rebase so the commit lands as written, and delete
  the branch. There are two checks, and the second reports a few minutes
  after the first: `frozen-schemas` and `Workers Builds: themachineweb`
  (the site's preview build). Wait for both. `main` has no branch protection on GitHub, so this rule
  holds only if you follow it. See "Branches" in `CONTRIBUTING.md`.
- Commit as the user. No co-author trailer and no tool attribution in
  commit messages or pull request descriptions.
- Before opening a pull request, run what the change can affect:
  - `npm test` in `core/lint`
  - `npm test` in `commerce/lint` (it builds first)
  - `npm test` and `npm run build` in `site`
  - `node scripts/check-frozen-schemas.mjs`

## Frozen folders

- `commerce/schemas/` holds every published JSON Schema, one file per
  version. Each file is served verbatim at a public URL. Never edit,
  rename or delete a file there. A release adds files; nothing else
  changes the folder. CI fails a pull request that breaks this.
- `commerce/spec/product.json` and `commerce/spec/organization.json` are
  the editable heads. A head that differs from the latest frozen file must
  name a new, unreleased version in its `$id`.
- There is no archive folder, and none gets created. Drafts before
  release 0.3.0 are in the tree of tag `commerce-v0.3.0`.

## Versioning

- Each sheet spec has its own semver. A commerce release bundles the sheet
  specs and the vocabulary, and the vocabulary carries the release version.
  The scheme and the release table are in `commerce/spec/releases.md`.
- A sheet carries `release` in its envelope, and its `$schema` names its
  sheet-spec version. `format_version` belongs to the legacy draft line:
  keep reading it, never write it into a new sheet.
- A change to a spec document gets an entry under `### Unreleased` in that
  document's changelog, in the same pull request. A document's version line
  changes only in a release pull request.
- New annotations name the release ("added in release 0.3.0"). The "v0.7",
  "v0.9" annotations already in the documents are legacy format versions
  and stay as they are.
- When a rule is added or changes what it checks, `commerce/spec/rules.md`,
  the rule's code, its fixtures and the catalogue version move together.
  Rule IDs are permanent and a retired number is never reused.

## Releasing and publishing

Follow "Releasing" in `CONTRIBUTING.md`. The parts that go wrong:

- Tags are `commerce-v<semver>` for a commerce release, and
  `lint-core-v<semver>` and `lint-commerce-v<semver>` for the npm packages.
  A tag goes on a commit that is already on `main`.
- Pushing a `lint-*` tag publishes to npm through GitHub Actions. Never run
  `npm publish` locally. Bump `version` in the package's `package.json` and
  the constant in its `src/version.ts` together.
- Publish `lint-core` before a `lint-commerce` that depends on it.
- After the publish workflow succeeds, npm can take from minutes to half an
  hour to serve the version. Do not re-tag. Wait until the tarball URL and
  the package's `latest` tag are live, then bump the pin in
  `site/package.json` with `npm install --prefer-online`.
- The site's validator runs the pinned, published `lint-commerce`. Site code
  must work with that version, whatever the workspace version is.
- `commerce/lint/src/generated/` is built from `commerce/schemas/` and
  `releases.json` and is ignored by git. Do not commit it or edit it.

## Spec and site prose

- No em dashes in running prose.
- State what a thing is. Avoid the contrast forms "X, not Y" and "not X
  but Y".
- Examples in normative text stand on their own: a fictional merchant
  (`merchant.com` in the specs, `merchant.example` in linter fixtures) and
  generic products, readable without having seen a real page.
- Identifiers and URLs are minted on `themachineweb.org`.
- Do not introduce numeric weights, thresholds or scores into a rule or a
  rubric without the user deciding them first.

## Case studies

- An offer's price is the price the product page renders, read in a
  browser: the full price of the item as the shopper sees it, the sale
  price when a sale is shown. The page's structured data and the
  merchant's store data only check it; where they disagree with the
  rendered price, the offer is not published. A figure on the page can be
  one component of the price, so read the one presented as the price of
  the item.
- Set `valueAddedTaxIncluded` and `areaServed` only from a merchant
  statement: text on the page, the terms of sale, the merchant's
  structured data, or a store setting the platform exposes. Never infer
  them from the URL, the domain, the currency or the seller's country.
  See "Tax inclusion" in `commerce/spec/product.md`.
- Other values, such as configurator options and their price differences,
  come from the merchant's own store data where the platform exposes it.
- Quote legal and safety statements as written, in the sheet's language.
  Restate descriptive fields, such as configurator notes, as facts.
- Verify against the live source on the day, and say in the case study
  what was read and when.
