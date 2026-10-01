/**
 * The commerce release manifest (commerce/spec/releases.json), read from
 * the repository at build time. Everything the site says about "the
 * current release" and the sheet-spec versions it bundles derives from
 * this file: no version is written into a page by hand.
 *
 * Plain .mjs with a JSON import attribute, so astro.config.mjs (through
 * spec-routes.mjs) can load it under Node as well as Vite.
 */
import manifest from '../../../commerce/spec/releases.json' with { type: 'json' };

/** The latest release in the manifest. */
const current = manifest.releases[manifest.releases.length - 1];

export const CURRENT_RELEASE = current.release;

/** The sheet-spec version the current release bundles for a sheet type. */
export const currentSheetSpec = (type) => current.sheets[type];

/** The published URL of a sheet spec's JSON Schema (also its `$id`). */
export const schemaUrl = (type, version = currentSheetSpec(type)) =>
  manifest.schema_url_template.replace('{sheet}', type).replace('{version}', version);

/** The site-relative path of the same schema. */
export const schemaPath = (type, version) => new URL(schemaUrl(type, version)).pathname;

/** The legacy draft line's format versions (≤ 0.9). */
export const LEGACY_FORMATS = manifest.legacy.format_versions;
