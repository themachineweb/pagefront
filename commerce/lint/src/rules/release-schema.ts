import type { CheckFn, CheckHit, Rule } from "@pagefront/lint-core";
import { KNOWN_RELEASES, schemaUrlFor, sheetSpecVersionFor } from "../releases.js";
import type { SheetType } from "../sheet-type.js";

/**
 * Shared checks for the envelope's version fields, used by the product
 * and organization catalogues (PDP-E-002 / ORG-E-003, PDP-E-016 /
 * ORG-E-002). Transcribed from commerce/spec/rules.md (normative).
 */

/** The trailing `v<version>.json` of a `$schema` URL. */
const SCHEMA_VERSION = /v(\d+(?:\.\d+)*)\.json$/;

const SHEET_LABEL: Record<SheetType, string> = {
  product: "Product Sheet",
  organization: "Organization Sheet",
};

/**
 * Release / schema mismatch. The rule reads `$schema` and is quiet
 * whenever it is absent, on both lines: whether `$schema` is required is
 * the schema's own statement (Product Sheet spec 0.10.0 and Organization
 * Sheet spec 0.4.0 onward), not this rule's. On the release line a
 * present `$schema` must be the URL of the sheet-spec schema the release
 * manifest maps the declared `release` and the sheet type to; a release
 * the manifest does not list has no mapping (the unknown-release rule
 * reports it). On the legacy line the `$schema` version segment must
 * equal `format_version`, as before. Quiet when the sheet carries both
 * fields (the both-fields rule reports that).
 */
export function releaseSchemaMismatch(sheetType: SheetType): CheckFn {
  return (_match, ctx): CheckHit | null => {
    const { release, format_version: formatVersion, $schema: schema } = ctx.sheet;
    if (typeof schema !== "string") return null;
    if (release !== undefined && formatVersion !== undefined) return null;
    const schemaVersion = SCHEMA_VERSION.exec(schema)?.[1];
    if (typeof release === "string") {
      const expected = sheetSpecVersionFor(release, sheetType);
      if (expected === undefined) return null;
      const expectedUrl = schemaUrlFor(sheetType, expected);
      if (schema === expectedUrl) return null;
      const declared = `\`release\` \`${release}\` bundles ${SHEET_LABEL[sheetType]} spec \`${expected}\``;
      if (schemaVersion !== undefined && schemaVersion !== expected) {
        return {
          path: "$['release']",
          values: {
            declared,
            found: `\`$schema\` URL declares version \`${schemaVersion}\``,
            release,
            expected,
            schema_version: schemaVersion,
          },
        };
      }
      return {
        path: "$['release']",
        values: {
          declared,
          found: `\`$schema\` is not that schema's URL, \`${expectedUrl}\``,
          release,
          expected,
          expected_url: expectedUrl,
        },
      };
    }
    if (formatVersion !== undefined) {
      if (schemaVersion === undefined) return null;
      const declared = String(formatVersion);
      if (declared === schemaVersion) return null;
      return {
        path: "$['format_version']",
        values: {
          declared: `\`format_version\` is \`${declared}\``,
          found: `\`$schema\` URL declares version \`${schemaVersion}\``,
          format_version: declared,
          schema_version: schemaVersion,
        },
      };
    }
    return null;
  };
}

export const RELEASE_SCHEMA_MISMATCH: Pick<Rule, "title" | "severity" | "target" | "messageTemplate" | "remediation"> = {
  title: "Release / schema mismatch",
  severity: "error",
  target: "$",
  messageTemplate: "{declared} but {found}.",
  remediation:
    "Point `$schema` at the sheet-spec version the declared release bundles (see releases.md), or declare the release that bundles the schema the sheet was written against. On a legacy sheet, align `format_version` and the `$schema` version.",
};

/** A sheet carrying both `format_version` and `release`. */
export const bothVersionFields: CheckFn = (_match, ctx) =>
  ctx.sheet.release !== undefined && ctx.sheet.format_version !== undefined ? {} : null;

export const BOTH_VERSION_FIELDS: Pick<Rule, "title" | "severity" | "target" | "messageTemplate" | "remediation"> = {
  title: "Sheet carries both format_version and release",
  severity: "error",
  target: "$",
  messageTemplate:
    "Sheet carries both `format_version` and `release`; a sheet declares one.",
  remediation:
    "Keep `release` and remove `format_version`. A sheet on the legacy draft line keeps `format_version` alone and its legacy `$schema`.",
};

/**
 * Unknown release: the sheet declares a `release` the release manifest
 * does not list, so no sheet-spec version and no schema can be resolved
 * for it. Only a string `release` is judged; another JSON type is
 * Layer 1's concern.
 */
export const unknownRelease: CheckFn = (_match, ctx) => {
  const { release } = ctx.sheet;
  if (typeof release !== "string" || KNOWN_RELEASES.includes(release)) return null;
  return { path: "$['release']", values: { release, known: KNOWN_RELEASES.join(", ") } };
};

export const UNKNOWN_RELEASE: Pick<Rule, "title" | "severity" | "target" | "messageTemplate" | "remediation"> = {
  title: "Unknown release",
  severity: "error",
  target: "$",
  messageTemplate:
    "`release` at `{path}` is `{release}`, which is not a release this catalogue knows ({known}).",
  remediation:
    "Declare a published commerce release (see releases.md). If the release is newer than this linter, update the linter.",
};
