import { RELEASE_MANIFEST } from "./generated/release-manifest.js";
import type { SheetType } from "./sheet-type.js";

/**
 * The commerce release manifest (commerce/spec/releases.json): each
 * release and the member versions it bundles. Bundled at build time by
 * scripts/bundle-schemas.mjs, so the package always carries the
 * manifest it was built from.
 */
export { RELEASE_MANIFEST };

/** Every release the manifest lists, in manifest order. */
export const KNOWN_RELEASES: readonly string[] = RELEASE_MANIFEST.releases.map((r) => r.release);

/** The latest release the manifest lists. */
export const CURRENT_RELEASE: string = KNOWN_RELEASES[KNOWN_RELEASES.length - 1];

/**
 * The sheet-spec version a release bundles for a sheet type, or
 * undefined when the manifest does not list the release.
 */
export function sheetSpecVersionFor(release: string, sheetType: SheetType): string | undefined {
  return RELEASE_MANIFEST.releases.find((r) => r.release === release)?.sheets[sheetType];
}

/** The published URL of a sheet spec's JSON Schema, which is also its `$id`. */
export function schemaUrlFor(sheetType: SheetType, version: string): string {
  return RELEASE_MANIFEST.schema_url_template.replace("{sheet}", sheetType).replace("{version}", version);
}

/** The legacy draft line's schema URL for a sheet type. */
export function legacySchemaUrl(sheetType: SheetType): string {
  return RELEASE_MANIFEST.legacy.schemas[sheetType];
}
