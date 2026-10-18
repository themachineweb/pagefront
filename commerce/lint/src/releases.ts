import { RELEASE_MANIFEST } from "./generated/release-manifest.js";
import { overrides, type ReleaseManifestShape } from "./overrides.js";
import type { SheetType } from "./sheet-type.js";

/**
 * The commerce release manifest (commerce/spec/releases.json): each
 * release and the member versions it bundles. Bundled at build time by
 * scripts/bundle-schemas.mjs, so the package always carries the
 * manifest it was built from. The exported constants describe the
 * bundled manifest; the functions below read the manifest in force,
 * which is the bundled one unless a test installed another through
 * test-hooks.ts.
 */
export { RELEASE_MANIFEST };

/** Every release the bundled manifest lists, in manifest order. */
export const KNOWN_RELEASES: readonly string[] = RELEASE_MANIFEST.releases.map((r) => r.release);

/** The latest release the bundled manifest lists. */
export const CURRENT_RELEASE: string = KNOWN_RELEASES[KNOWN_RELEASES.length - 1];

/** The manifest in force: the bundled one, or the one a test installed. */
export function manifest(): ReleaseManifestShape {
  return overrides().manifest ?? (RELEASE_MANIFEST as unknown as ReleaseManifestShape);
}

/** Every release the manifest in force lists, in manifest order. */
export function knownReleases(): readonly string[] {
  return manifest().releases.map((r) => r.release);
}

/** The latest release the manifest in force lists. */
export function currentRelease(): string {
  const releases = knownReleases();
  return releases[releases.length - 1];
}

/**
 * The sheet-spec version a release bundles for a sheet type, or
 * undefined when the manifest does not list the release, or lists it
 * without that sheet type (a type that joined the line in a later
 * release).
 */
export function sheetSpecVersionFor(release: string, sheetType: SheetType): string | undefined {
  return manifest().releases.find((r) => r.release === release)?.sheets[sheetType];
}

/** The published URL of a sheet spec's JSON Schema, which is also its `$id`. */
export function schemaUrlFor(sheetType: SheetType, version: string): string {
  return manifest().schema_url_template.replace("{sheet}", sheetType).replace("{version}", version);
}

/**
 * The legacy draft line's schema URL for a sheet type, or undefined for
 * a type that was never on that line (the collection sheet).
 */
export function legacySchemaUrl(sheetType: SheetType): string | undefined {
  return manifest().legacy.schemas[sheetType];
}
