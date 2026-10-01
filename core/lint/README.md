# @pagefront/lint-core

The vertical-agnostic Pagefront linter engine: rule runner, canonical
report emitter, and renderers, per
[`core/spec/linter.md`](https://github.com/themachineweb/pagefront/blob/main/core/spec/linter.md). Vertical packages (e.g.
[`@pagefront/lint-commerce`](https://www.npmjs.com/package/@pagefront/lint-commerce)) supply the rule
catalogue; this package runs it.

## API

- `lint(sheet: Sheet, catalogue: Catalogue, options?: LintOptions): Report`
  — evaluate every catalogue rule's JSONPath target, run checks, and
  assemble the canonical Report. Assumes the sheet already passed
  Layer 1 (JSON Schema) validation — sequencing is the caller's job
  (see `validateAndLint` in the vertical packages).
- Renderers, pure functions over the canonical Report:
  `renderText(report, { color? })`, `renderHtml(report)`,
  `renderGithub(report)`.
- Check helpers for rule implementations: `fieldAbsentOrEmpty`,
  `isFullAbsoluteUrl`, `isSameDocumentId`, `isInlineDeclaration`,
  `collectDeclaredIds`, `valueAtPath`.
- Types: `Report`, `Finding`, `Summary`, `Severity`, `Sheet`, `Rule`,
  `Catalogue`, `CheckFn`, `CheckHit`, `RuleMatch`, `RuleContext`,
  `LintOptions`, `RenderTextOptions`.

## Versioning

This package has its own semver. 0.2.0 changes the report shape: `Report`
carries `release` and `sheet_spec_version` in place of `spec_version`,
`Sheet` carries `release` or a legacy `format_version`, and `Catalogue`
carries `releases` in place of `formatVersion`. See "Versioning" in
[`linter.md`](https://github.com/themachineweb/pagefront/blob/main/core/spec/linter.md).

Pre-1.0: minor versions may break the API. The surface above is what
versioning tracks; anything reached through `dist/` paths is internal.
