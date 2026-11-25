import type { Catalogue } from "@pagefront/lint-core";
import { KNOWN_RELEASES } from "./releases.js";
import { revE001 } from "./rules/rev-e-001.js";
import { revE002 } from "./rules/rev-e-002.js";
import { revE003 } from "./rules/rev-e-003.js";
import { revE004 } from "./rules/rev-e-004.js";
import { revE005 } from "./rules/rev-e-005.js";
import { revE006 } from "./rules/rev-e-006.js";
import { revE007 } from "./rules/rev-e-007.js";
import { revE008 } from "./rules/rev-e-008.js";
import { revE009 } from "./rules/rev-e-009.js";
import { revE010 } from "./rules/rev-e-010.js";
import { revE011 } from "./rules/rev-e-011.js";
import { revE012 } from "./rules/rev-e-012.js";
import { revE013 } from "./rules/rev-e-013.js";
import { revE014 } from "./rules/rev-e-014.js";
import { revE015 } from "./rules/rev-e-015.js";
import { revE016 } from "./rules/rev-e-016.js";
import { revE017 } from "./rules/rev-e-017.js";
import { revW001 } from "./rules/rev-w-001.js";
import { revW002 } from "./rules/rev-w-002.js";
import { revW003 } from "./rules/rev-w-003.js";
import { revW004 } from "./rules/rev-w-004.js";
import { revW005 } from "./rules/rev-w-005.js";
import { revW006 } from "./rules/rev-w-006.js";
import { revW007 } from "./rules/rev-w-007.js";
import { revW008 } from "./rules/rev-w-008.js";
import { revW009 } from "./rules/rev-w-009.js";
import { revW010 } from "./rules/rev-w-010.js";
import { revW011 } from "./rules/rev-w-011.js";
import { revW012 } from "./rules/rev-w-012.js";

/**
 * The Commerce Review Sheet rule catalogue — the executable form of the
 * "Commerce Review Sheet rules" section of commerce/spec/rules.md
 * (normative). It shares rules.md's catalogue version with the product,
 * organization and collection catalogues: one normative document, one
 * version, four page-type rule sets dispatched by sheet type (see
 * sheet-type.ts). No page type's rules run on another page type's
 * sheets.
 *
 * The product-side and organization-side checks the Review Sheet spec
 * reserves (an inline `review` on a product sheet, a `subjectOf` hint
 * off-host, the aggregate's count against the review sheet's) are
 * reserved in rules.md and await implementation: the cross-sheet ones
 * need both sheets, which a single-sheet linter does not have.

 */
export const reviewCatalogue: Catalogue = {
  vertical: "commerce",
  releases: KNOWN_RELEASES,
  catalogueVersion: "0.22.0",
  rules: [revE001, revE002, revE003, revE004, revE005, revE006, revE007, revE008, revE009, revE010, revE011, revE012, revE013, revE014, revE015, revE016, revE017, revW001, revW002, revW003, revW004, revW005, revW006, revW007, revW008, revW009, revW010, revW011, revW012],
};
