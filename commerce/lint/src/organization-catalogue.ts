import type { Catalogue } from "@pagefront/lint-core";
import { KNOWN_RELEASES } from "./releases.js";
import { orgE001 } from "./rules/org-e-001.js";
import { orgE002 } from "./rules/org-e-002.js";
import { orgE003 } from "./rules/org-e-003.js";
import { orgE004 } from "./rules/org-e-004.js";
import { orgW001 } from "./rules/org-w-001.js";
import { orgW002 } from "./rules/org-w-002.js";
import { orgW003 } from "./rules/org-w-003.js";
import { orgW004 } from "./rules/org-w-004.js";
import { orgW005 } from "./rules/org-w-005.js";
import { orgW006 } from "./rules/org-w-006.js";
import { orgW007 } from "./rules/org-w-007.js";

/**
 * The Commerce Organization Sheet rule catalogue — the executable form
 * of the "Commerce Organization Sheet rules" section of
 * commerce/spec/rules.md (normative). It shares rules.md's catalogue
 * version with the product and collection catalogues: one normative
 * document, one version, three page-type rule sets dispatched by sheet
 * type (see sheet-type.ts). No page type's rules run on another page
 * type's sheets.
 */
export const organizationCatalogue: Catalogue = {
  vertical: "commerce",
  releases: KNOWN_RELEASES,
  catalogueVersion: "0.18.0",
  rules: [orgE001, orgE002, orgE003, orgE004, orgW001, orgW002, orgW003, orgW004, orgW005, orgW006, orgW007],
};
