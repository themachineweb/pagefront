import type { Catalogue } from "@pagefront/lint-core";
import { KNOWN_RELEASES } from "./releases.js";
import { colE001 } from "./rules/col-e-001.js";
import { colE002 } from "./rules/col-e-002.js";
import { colE003 } from "./rules/col-e-003.js";
import { colE004 } from "./rules/col-e-004.js";
import { colE005 } from "./rules/col-e-005.js";
import { colW001 } from "./rules/col-w-001.js";
import { colW002 } from "./rules/col-w-002.js";
import { colW004 } from "./rules/col-w-004.js";
import { colW005 } from "./rules/col-w-005.js";
import { colW006 } from "./rules/col-w-006.js";

/**
 * The Commerce Collection Sheet rule catalogue — the executable form
 * of the "Commerce Collection Sheet rules" section of
 * commerce/spec/rules.md (normative). It shares rules.md's catalogue
 * version with the product and organization catalogues: one normative
 * document, one version, three page-type rule sets dispatched by sheet
 * type (see sheet-type.ts). No page type's rules run on another page
 * type's sheets.
 *
 * COL-W-003 is reserved in rules.md and awaits implementation: a root
 * category absent from the organization sheet's `hasOfferCatalog` needs
 * both sheets, which a single-sheet linter does not have.
 */
export const collectionCatalogue: Catalogue = {
  vertical: "commerce",
  releases: KNOWN_RELEASES,
  catalogueVersion: "0.17.0",
  rules: [colE001, colE002, colE003, colE004, colE005, colW001, colW002, colW004, colW005, colW006],
};
