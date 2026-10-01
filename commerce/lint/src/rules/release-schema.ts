import type { CheckFn, CheckHit, Rule } from "@pagefront/lint-core";
import { sheetSpecVersionFor } from "../releases.js";
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
 * Release / schema mismatch. On the release line the `$schema` version
 * segment must be the sheet-spec version the release manifest maps the
 * declared `release` and the sheet type to; a release the manifest does
 * not list has no mapping and the rule is silent. On the legacy line
 * the segment must equal `format_version`, as before. Quiet when
 * `$schema` is absent or names no version, and when the sheet carries
 * both fields (the both-fields rule reports that).
 */
export function releaseSchemaMismatch(sheetType: SheetType): CheckFn {
  return (_match, ctx): CheckHit | null => {
    const { release, format_version: formatVersion, $schema: schema } = ctx.sheet;
    if (typeof schema !== "string") return null;
    const schemaVersion = SCHEMA_VERSION.exec(schema)?.[1];
    if (schemaVersion === undefined) return null;
    if (release !== undefined && formatVersion !== undefined) return null;
    if (typeof release === "string") {
      const expected = sheetSpecVersionFor(release, sheetType);
      if (expected === undefined || expected === schemaVersion) return null;
      return {
        path: "$['release']",
        values: {
          declared: `\`release\` \`${release}\` bundles ${SHEET_LABEL[sheetType]} spec \`${expected}\``,
          release,
          expected,
          schema_version: schemaVersion,
        },
      };
    }
    if (formatVersion !== undefined) {
      const declared = String(formatVersion);
      if (declared === schemaVersion) return null;
      return {
        path: "$['format_version']",
        values: {
          declared: `\`format_version\` is \`${declared}\``,
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
  messageTemplate: "{declared} but `$schema` URL declares version `{schema_version}`.",
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
