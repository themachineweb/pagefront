import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord } from "./org-shared.js";

/**
 * ORG-W-005 — malformed registration machine key.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Checks PRESENT values only. organization.md's registration-identity
 * rules forbid warning on absent registration identifiers — absence is
 * jurisdiction-dependent, not a quality signal — so this rule (and the
 * catalogue as a whole) has no presence check for `leiCode`,
 * `iso6523Code`, `identifier`, or `sameAs`. Non-string values are
 * Layer 1's concern (the schema types both fields as strings) and are
 * skipped here.
 */
const ISO6523 = /^\d{4}:.+$/;
const LEI = /^[A-Z0-9]{18}[0-9]{2}$/;

export const orgW005: Rule = {
  id: "ORG-W-005",
  title: "Malformed registration machine key",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null) return null;
    const hits: CheckHit[] = [];
    const iso = data["iso6523Code"];
    if (typeof iso === "string" && !ISO6523.test(iso)) {
      hits.push({
        values: {
          field: "iso6523Code",
          value: iso,
          form: "ISO 6523 shape (four-digit ICD, colon, register number)",
        },
        path: `${match.path}['iso6523Code']`,
      });
    }
    const lei = data["leiCode"];
    if (typeof lei === "string" && !LEI.test(lei)) {
      hits.push({
        values: {
          field: "leiCode",
          value: lei,
          form: "ISO 17442 shape (18 alphanumerics plus 2 check digits)",
        },
        path: `${match.path}['leiCode']`,
      });
    }
    return hits.length > 0 ? hits : null;
  },
  messageTemplate:
    "`{field}` at `{path}` carries `{value}`, which does not match the {form}.",
  remediation:
    "Correct the machine key: `iso6523Code` is `NNNN:register-number` (e.g. `0002:808641435` for a SIREN), `leiCode` is a 20-character ISO 17442 LEI. If no well-formed machine key exists for this register, drop the field and keep the display-form `identifier` — absence is conformant.",
  introduced: "v0.9",
  specReference: "organization.md#company-registration-identity",
};
