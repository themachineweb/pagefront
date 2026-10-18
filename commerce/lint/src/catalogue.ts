import type { Catalogue } from "@pagefront/lint-core";
import { KNOWN_RELEASES } from "./releases.js";
import { pdpE001 } from "./rules/pdp-e-001.js";
import { pdpE002 } from "./rules/pdp-e-002.js";
import { pdpE003 } from "./rules/pdp-e-003.js";
import { pdpE004 } from "./rules/pdp-e-004.js";
import { pdpE005 } from "./rules/pdp-e-005.js";
import { pdpE006 } from "./rules/pdp-e-006.js";
import { pdpE007 } from "./rules/pdp-e-007.js";
import { pdpE008 } from "./rules/pdp-e-008.js";
import { pdpE009 } from "./rules/pdp-e-009.js";
import { pdpE010 } from "./rules/pdp-e-010.js";
import { pdpE011 } from "./rules/pdp-e-011.js";
import { pdpE012 } from "./rules/pdp-e-012.js";
import { pdpE013 } from "./rules/pdp-e-013.js";
import { pdpE014 } from "./rules/pdp-e-014.js";
import { pdpE015 } from "./rules/pdp-e-015.js";
import { pdpE016 } from "./rules/pdp-e-016.js";
import { pdpE017 } from "./rules/pdp-e-017.js";
import { pdpE018 } from "./rules/pdp-e-018.js";
import { pdpE019 } from "./rules/pdp-e-019.js";
import { pdpE020 } from "./rules/pdp-e-020.js";
import { pdpE021 } from "./rules/pdp-e-021.js";
import { pdpW001 } from "./rules/pdp-w-001.js";
import { pdpW002 } from "./rules/pdp-w-002.js";
import { pdpW003 } from "./rules/pdp-w-003.js";
import { pdpW004 } from "./rules/pdp-w-004.js";
import { pdpW005 } from "./rules/pdp-w-005.js";
import { pdpW006 } from "./rules/pdp-w-006.js";
import { pdpW007 } from "./rules/pdp-w-007.js";
import { pdpW008 } from "./rules/pdp-w-008.js";
import { pdpW009 } from "./rules/pdp-w-009.js";
import { pdpW010 } from "./rules/pdp-w-010.js";
import { pdpW011 } from "./rules/pdp-w-011.js";
import { pdpW012 } from "./rules/pdp-w-012.js";
import { pdpW013 } from "./rules/pdp-w-013.js";
import { pdpW014 } from "./rules/pdp-w-014.js";
import { pdpW015 } from "./rules/pdp-w-015.js";
import { pdpW016 } from "./rules/pdp-w-016.js";
import { pdpW017 } from "./rules/pdp-w-017.js";
import { pdpW018 } from "./rules/pdp-w-018.js";
import { pdpW019 } from "./rules/pdp-w-019.js";
import { pdpW020 } from "./rules/pdp-w-020.js";
import { pdpW021 } from "./rules/pdp-w-021.js";
import { pdpW022 } from "./rules/pdp-w-022.js";
import { pdpW023 } from "./rules/pdp-w-023.js";
import { pdpW024 } from "./rules/pdp-w-024.js";
import { pdpW025 } from "./rules/pdp-w-025.js";
import { pdpW026 } from "./rules/pdp-w-026.js";
import { pdpW027 } from "./rules/pdp-w-027.js";
import { pdpW028 } from "./rules/pdp-w-028.js";
import { pdpW029 } from "./rules/pdp-w-029.js";
import { pdpW030 } from "./rules/pdp-w-030.js";
import { pdpW031 } from "./rules/pdp-w-031.js";
import { pdpW032 } from "./rules/pdp-w-032.js";
import { pdpW033 } from "./rules/pdp-w-033.js";
import { pdpW034 } from "./rules/pdp-w-034.js";
import { pdpW035 } from "./rules/pdp-w-035.js";
import { pdpW036 } from "./rules/pdp-w-036.js";
import { pdpW037 } from "./rules/pdp-w-037.js";
import { pdpW038 } from "./rules/pdp-w-038.js";
import { pdpW039 } from "./rules/pdp-w-039.js";
import { pdpW040 } from "./rules/pdp-w-040.js";
import { pdpI001 } from "./rules/pdp-i-001.js";

/**
 * The commerce product-sheet rule catalogue — the executable form of
 * the product rules in commerce/spec/rules.md (normative). Every
 * subsequent rule file gets imported and appended to `rules` here, in
 * ID order. Organization-sheet rules live in organization-catalogue.ts;
 * lintSheet dispatches between the two by sheet type.
 */
export const commerceCatalogue: Catalogue = {
  vertical: "commerce",
  releases: KNOWN_RELEASES,
  catalogueVersion: "0.17.0",
  rules: [pdpE001, pdpE002, pdpE003, pdpE004, pdpE005, pdpE006, pdpE007, pdpE008, pdpE009, pdpE010, pdpE011, pdpE012, pdpE013, pdpE014, pdpE015, pdpE016, pdpE017, pdpE018, pdpE019, pdpE020, pdpE021, pdpW001, pdpW002, pdpW003, pdpW004, pdpW005, pdpW006, pdpW007, pdpW008, pdpW009, pdpW010, pdpW011, pdpW012, pdpW013, pdpW014, pdpW015, pdpW016, pdpW017, pdpW018, pdpW019, pdpW020, pdpW021, pdpW022, pdpW023, pdpW024, pdpW025, pdpW026, pdpW027, pdpW028, pdpW029, pdpW030, pdpW031, pdpW032, pdpW033, pdpW034, pdpW035, pdpW036, pdpW037, pdpW038, pdpW039, pdpW040, pdpI001],
};
