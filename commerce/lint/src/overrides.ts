import type { ValidateFunction } from "ajv";
import type { SheetType } from "./sheet-type.js";

/**
 * The shape of the release manifest (commerce/spec/releases.json), as
 * the registry reads it: each release names the member versions it
 * bundles, and a sheet type a release does not bundle is absent.
 */
export interface ManifestRelease {
  release: string;
  date: string;
  vocabulary: string;
  sheets: Readonly<Partial<Record<SheetType, string>>>;
}

export interface ReleaseManifestShape {
  schema_url_template: string;
  releases: readonly ManifestRelease[];
  legacy: {
    envelope_field: string;
    format_versions: readonly string[];
    schemas: Readonly<Partial<Record<SheetType, string>>>;
  };
}

/**
 * Test-only overrides of what the package bundles: a release manifest
 * other than commerce/spec/releases.json, and Layer 1 validators for
 * schema ids the frozen store does not carry (an editable head). The
 * production code path never sets them, so it reads the bundled
 * manifest and the compiled validators; tests install them through
 * test-hooks.ts to exercise a release before it lands.
 */
export interface TestOverrides {
  manifest?: ReleaseManifestShape;
  validators?: Readonly<Record<string, ValidateFunction>>;
}

let active: TestOverrides = {};

export const overrides = (): TestOverrides => active;

export const setOverrides = (next: TestOverrides): void => {
  active = next;
};
