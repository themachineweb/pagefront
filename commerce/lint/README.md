# @pagefront/lint-commerce

The Pagefront commerce linter: the commerce rule catalogue
([`commerce/spec/rules.md`](https://github.com/themachineweb/pagefront/blob/main/commerce/spec/rules.md), normative) and the
`pagefront-lint-commerce` CLI, on the
[`@pagefront/lint-core`](https://www.npmjs.com/package/@pagefront/lint-core) engine. This is the
reference implementation of Layer 2 of the validation stack defined in
[`core/spec/linter.md`](https://github.com/themachineweb/pagefront/blob/main/core/spec/linter.md).

## CLI

```
pagefront-lint-commerce <sheet-url-or-path> [options]

  --format <json|text|html|github>   output format (default: json)
  --fail-on <error|warning>          lowest severity that fails the exit code
  --checked-at <iso8601>             inject the report timestamp (reproducible output)
```

The CLI validates Layer 1 (JSON Schema) first; a failing Sheet gets its
schema errors on stderr and no report. Exit codes: `0` nothing
blocking, `1` Layer 1 failure or blocking findings, `2` operational
failure. Both commerce page types are handled: product sheets and
Commerce Organization Sheets each validate against their own schema and
lint with their own catalogue, dispatched by sheet type.

## Catalogue

Catalogue 0.16.0, supporting commerce releases 0.4.0 (Product Sheet spec
0.10.0, Organization Sheet spec 0.4.0) and 0.3.0, and the legacy draft line
(format 0.9): 58 product rules (`PDP-E-001` to `PDP-E-018`, `PDP-W-001` to
`PDP-W-039`, `PDP-I-001`) and 10 organization rules (`ORG-E-001` to
`ORG-E-004`, `ORG-W-001` to `ORG-W-006`), each defined in
[`rules.md`](https://github.com/themachineweb/pagefront/blob/main/commerce/spec/rules.md)
with its target, check, message and remediation. Every report carries the
`catalogue_version` it was produced with.

Added in 0.5.0 (catalogue 0.8.0), from the product spec's
["Tax inclusion"](https://themachineweb.org/pagefront/spec/commerce/product#tax-inclusion)
section:

- `PDP-W-028` — an Offer states a price but no `priceSpecification` entry
  carries a boolean `valueAddedTaxIncluded`
- `PDP-W-029` — an Offer states a price but declares neither `areaServed`
  nor `eligibleRegion`
- `PDP-E-004` — a `priceSpecification` entry mirroring the Offer's price
  states a different amount in the same currency

The two warnings exempt offers carrying `pagefront:priceOnRequest`.

Added in 0.6.0 (catalogue 0.9.0), from the product spec's
["Warranty"](https://themachineweb.org/pagefront/spec/commerce/product#warranty)
section:

- `PDP-W-030` — a `warranty` on an Offer, or a `pagefront:manufacturerWarranty`
  on the Product, carries neither `durationOfWarranty` nor `description`

Added in 0.7.0 (catalogue 0.10.0), from the organization spec's
["Linking contract"](https://themachineweb.org/pagefront/spec/commerce/organization#linking-contract-identity-only)
section:

- `PDP-E-005` — `pagefront:sheetUrl` on an Offer's `seller` is on a host
  other than the product sheet's
- `PDP-E-006` — `pagefront:sheetUrl` on `brand` is on a host other than
  that of the brand's `@id`
- `PDP-W-031` — an Offer's `seller` has an `@id` but no
  `pagefront:sheetUrl`, and the Offer states no return or shipping terms
  of its own

Added in 0.8.0 (catalogue 0.11.0), from the product spec's
["Configurator pricing and price bands"](https://themachineweb.org/pagefront/spec/commerce/product#configurator-pricing-and-price-bands)
section. Configurator pricing moved from `pagefront:configurator` into the
offer's `pagefront:configuratorPricing`; a sheet carrying prices inside the
configurator now fails Layer 1.

- `PDP-E-001` now also covers the pricing block's `configurator`
  reference, which must equal the `@id` of the Sheet's
  `pagefront:configurator`
- `PDP-E-007` — `baseConfiguration` omits a priced dimension, or names a
  dimension or option the configurator does not declare
- `PDP-E-008` — the modifier of a base option is not zero
- `PDP-E-009` — a modifier names an unknown dimension or option, or a
  dimension declared `affectsPrice: false`
- `PDP-E-010` — an Offer's `price` differs from its pricing block's
  `basePrice`
- `PDP-E-011` — an AggregateOffer's `lowPrice` or `highPrice` differs
  from the band computed from a complete pricing block
- `PDP-E-012` — more than one offer prices the same configurator
- `PDP-W-032` — a priced option has no modifier and `pricing` is not
  `partial`
- `PDP-W-033` — a configurator has priced dimensions and no offer prices it
- `PDP-W-034` — an offer states a price beside a configurator and no
  offer carries a pricing block
- `PDP-W-035` — `basePrice` looks like a component price (heuristic)

Amounts are summed and compared as exact decimals.

Added in 0.9.0 (catalogue 0.14.0), from the same section and from
["Size guidance"](https://themachineweb.org/pagefront/spec/commerce/product#size-guidance-pagefrontsizechart-and-pagefrontsizerecommendation):
option values are identifiers, free-text dimensions, order-time services
kept out of `options`, notes as facts, and size advice in the sizing
dimension's system. From 0.9.0 every amount is a JSON number or a plain
decimal string, one carrier per Sheet, and amounts are compared numerically
whatever the carrier; 0.8.0 validated pricing-block amounts as decimal
strings only. An Offer's `price`, a variant's `price` and a promotion's
`discountAmount` no longer accept a string that is not a plain decimal, and
prices, bounds and base prices no longer accept a negative amount.

- `PDP-E-013` — a dimension declares `inputType: "text"` and enumerates
  options
- `PDP-W-036` — an option value looks like a display label (whitespace,
  an uppercase letter, or a unit suffix); sizing dimensions are exempt
- `PDP-W-037` — an option in a sizing dimension (`system` of `UK`, `EU`,
  `US` or `JP`) is not written as a size in that system
- `PDP-W-032`, `PDP-E-009` and the computed band of `PDP-E-011` now cover
  the `"*"` modifier of a priced text dimension
- `PDP-E-014` — a size adjustment's `sizeSystem` is another system than
  the configurator's sizing dimension
- `PDP-E-015` — the Sheet's amounts mix JSON numbers and strings
- `PDP-W-038` — a configurator dimension's `note` reads as page copy
  (English Sheets: `you`, `your`, `select`, `order`, `contact`)
- `PDP-W-039` — size advice carries a `description` and no
  `sizeAdjustment` beside a sizing dimension

Added in 0.10.0 (catalogue 0.15.0), with commerce release 0.3.0 and the
[versioning scheme](https://github.com/themachineweb/pagefront/blob/main/commerce/spec/releases.md)
that replaces format versions:

- Sheets carry `release` in place of `format_version`, and `$schema` names
  the sheet-spec version (`product/v0.9.0.json`, `organization/v0.3.0.json`).
  Sheets carrying `format_version` are the legacy draft line and keep
  validating against the bundled legacy schemas.
- `PDP-E-002` becomes "Release / schema mismatch": `$schema` must name the
  sheet-spec version the release manifest maps the declared `release` to.
  On legacy sheets it compares `format_version` with `$schema`, as before.
  `ORG-E-003` is the same check for Organization Sheets.
- `PDP-E-016` and `ORG-E-002` — a sheet carries both `format_version` and
  `release`
- **Breaking:** the report carries `release` (the value the sheet declares;
  a legacy sheet's `format_version` value) and `sheet_spec_version` (parsed
  from `$schema`) in place of `spec_version`. Requires
  `@pagefront/lint-core` 0.2.0.
- New exports: `detectSheetLine`, `RELEASE_MANIFEST`, `KNOWN_RELEASES`,
  `sheetSpecVersionFor`.

Changed in 0.11.0 (catalogue 0.15.0, unchanged):

- Layer 1 validates a sheet against the published schema its `$schema`
  names. The package bundles every file in the repository's frozen schema
  store (`commerce/schemas/`) at build time, with the release manifest;
  nothing is embedded by hand.
- A `$schema` naming no bundled schema fails Layer 1 with one error. In
  0.10.0 the schema was chosen from the envelope field, so a release
  sheet pointing at another version passed Layer 1 and fired `PDP-E-002`;
  it now fails Layer 1 against the schema it names.
- New exports: `CURRENT_RELEASE`, `schemaUrlFor`, `BUNDLED_SCHEMA_IDS`.

Added in 0.12.0 (catalogue 0.16.0), with commerce release 0.4.0. Requires
`@pagefront/lint-core` 0.3.0.

- **A sheet is judged by the release it declares.** Layer 1 validates it
  against the schema its `release` bundles for its type (release 0.4.0:
  `product/v0.10.0.json`, `organization/v0.4.0.json`, which require
  `$schema`; release 0.3.0: the 0.3.0 schemas). Legacy sheets keep
  resolving through `$schema`.
- **Rules are gated by release.** Every rule has an `appliesFrom` release
  and the engine skips it on a sheet declaring a lower one. All earlier
  rules apply from 0.3.0 and to legacy sheets.
- `PDP-E-002` and `ORG-E-003` compare a present `$schema` with the URL of
  the schema the release bundles, and are quiet when `$schema` is absent.
- `PDP-E-017` (applies from release 0.4.0) — an exclusion, or an
  adjustment's `when`, names a dimension the configurator does not declare
  or an option the dimension does not list. Values are compared strictly:
  `1` is not `"1"`.
- `PDP-E-018` and `ORG-E-004` — the sheet declares a `release` the release
  manifest does not list. At Layer 1 this is a single error at `/release`.

## API

The public surface — everything importable from the package root, and
nothing else (the bundled schemas and the individual rule modules are
internal):

- `validateAndLint(input: unknown, options?: LintOptions)` — the CLI's
  own pipeline as a function: Layer 1 against the published schema the
  document's declared release bundles for its page type, then Layer 2
  against that page type's catalogue (see `detectSheetType`), with the
  rules that apply from that release. Returns
  `{ layer: 1, schemaErrors: SchemaError[] }` or
  `{ layer: 2, report: Report }`. The package bundles every published
  schema, on both lines. A `release` the manifest does not list fails
  Layer 1 with a single error at `/release` (keyword `release`). A
  `$schema` that disagrees with the release is a Layer 2 finding. Legacy
  sheets (`format_version`) are validated against the schema their
  `$schema` names, or the legacy schema when it is absent.
  Layer 1 runs validators compiled ahead of time at
  package build, so the pipeline needs no runtime code generation and
  runs under Cloudflare Workers and strict Content Security Policies.
- `lintSheet(sheet: Sheet, options?: LintOptions): Report` — Layer 2
  only, for input you have already schema-validated. Dispatches to the
  page type's catalogue the same way.
- `validateOrganizationSheet(input: unknown)` — Layer 1 only, against
  the Commerce Organization Sheet schema the document names. Returns
  `{ valid: true }` or `{ valid: false, schemaErrors: SchemaError[] }`.
- `detectSheetType(sheet: Sheet): SheetType` — the page-type dispatch:
  `"organization"` when the envelope `$schema` path contains
  `/spec/commerce/organization/` or `/schemas/organization/` (a
  `/spec/commerce/product/` or `/schemas/product/` path likewise wins
  for `"product"`), falling back to a data block whose `@type` is
  `Organization`/`OnlineStore`/`OnlineBusiness` with
  `pagefront:commerceRole` present; `"product"` otherwise.
- `commerceCatalogue`, `organizationCatalogue` — the per-page-type
  catalogue objects (read-only), for direct engine use or
  introspection. Product rules never run on organization sheets and
  vice versa.
- Types: `SchemaError`, `ValidateAndLintResult`,
  `ValidateOrganizationResult`, `SheetType`, and the core types the
  signatures mention — `Report`, `Finding`, `Summary`, `Severity`,
  `LintOptions`, `Sheet`.

### CI script

```js
import { readFile } from "node:fs/promises";
import { validateAndLint } from "@pagefront/lint-commerce";

const document = JSON.parse(await readFile(process.argv[2], "utf8"));
const result = validateAndLint(document);
if (result.layer === 1) {
  for (const e of result.schemaErrors) {
    console.error(`${e.instancePath === "" ? "(root)" : e.instancePath}: ${e.message}`);
  }
  process.exit(1);
}
process.exit(result.report.summary.errors > 0 ? 1 : 0);
```

### Pipeline embed

A production pipeline with its own validation layer calls the same
function and folds the union into its own result
shape — the schema compiles once at module load, so per-document calls
are cheap:

```js
import { validateAndLint } from "@pagefront/lint-commerce";

export function validateSheet(document) {
  const result = validateAndLint(document);
  return result.layer === 1
    ? { ok: false, schemaErrors: result.schemaErrors }
    : { ok: result.report.summary.errors === 0, report: result.report };
}
```

### Rendering stored reports

The renderers are pure functions over the canonical Report JSON — they
live in `@pagefront/lint-core` and work on any report, including one
you stored earlier:

```js
import { readFile } from "node:fs/promises";
import { renderHtml } from "@pagefront/lint-core";

const report = JSON.parse(await readFile("report.json", "utf8"));
await writeFile("report.html", renderHtml(report));
```

## Versioning

This package has its own semver, separate from the rule catalogue's
(`catalogue_version` in every report) and from the commerce release and
sheet-spec versions a sheet declares (`release` and `sheet_spec_version`
in every report). The scheme is in
[`releases.md`](https://github.com/themachineweb/pagefront/blob/main/commerce/spec/releases.md).

Pre-1.0: minor versions may break the API. The surface listed above is
what versioning tracks — imports that reach past it (`dist/` paths,
rule modules) are internal and may change without notice in any
release.
