import { lint } from "@pagefront/lint-core";
import type { LintOptions, Report, Sheet } from "@pagefront/lint-core";
import { commerceCatalogue } from "./catalogue.js";
import { organizationCatalogue } from "./organization-catalogue.js";
import { detectSheetType } from "./sheet-type.js";
import { PACKAGE_VERSION } from "./version.js";

/**
 * Lint a Sheet against the commerce rule catalogue for its page type:
 * the product catalogue for product sheets, the organization catalogue
 * for Commerce Organization Sheets, dispatched by sheet-type detection
 * (see sheet-type.ts). Product rules never run on organization sheets
 * and vice versa.
 *
 * `Report.linter_version` identifies the invoking implementation, so the
 * default here is this package's version — lint-core's own fallback (its
 * engine version) applies only to direct engine use.
 */
export function lintSheet(sheet: Sheet, options?: LintOptions): Report {
  const opts: LintOptions = { ...options };
  if (opts.linterVersion === undefined) opts.linterVersion = PACKAGE_VERSION;
  const catalogue =
    detectSheetType(sheet) === "organization"
      ? organizationCatalogue
      : commerceCatalogue;
  return lint(sheet, catalogue, opts);
}
