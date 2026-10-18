/**
 * Test-only hooks. Not part of the public surface (index.ts does not
 * export this module): the conformance suite and the collection tests
 * import it from dist/ to run the linter against a release manifest
 * other than the bundled commerce/spec/releases.json, and to validate
 * at Layer 1 against an editable schema head the frozen store does not
 * carry yet. Production callers never reach this code, and nothing here
 * imports a Node built-in, so the library stays browser-pure.
 */
import Ajv2020Module from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import type { ValidateFunction } from "ajv";
import { setOverrides, type ReleaseManifestShape } from "./overrides.js";

type Ctor = new (options: object) => { compile(schema: object): ValidateFunction };
const Ajv2020 = ((Ajv2020Module as unknown as { default?: Ctor }).default ?? Ajv2020Module) as Ctor;
type AddFormats = (ajv: object) => unknown;
const addFormats = ((addFormatsModule as unknown as { default?: AddFormats }).default ?? addFormatsModule) as AddFormats;

export interface TestManifestOptions {
  /** The manifest to read in place of the bundled one. */
  manifest: ReleaseManifestShape;
  /**
   * Schemas to validate against at Layer 1 for ids the package does not
   * bundle, keyed by `$id`; compiled here with the options the build
   * uses for the frozen schemas.
   */
  schemas?: Record<string, object>;
}

/** Install a test manifest (and optional schemas) until `clearTestManifest`. */
export function installTestManifest(options: TestManifestOptions): void {
  const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
  addFormats(ajv);
  const validators: Record<string, ValidateFunction> = {};
  for (const [id, schema] of Object.entries(options.schemas ?? {})) {
    validators[id] = ajv.compile(schema);
  }
  setOverrides({ manifest: options.manifest, validators });
}

/** Back to the bundled manifest and the compiled validators. */
export function clearTestManifest(): void {
  setOverrides({});
}
