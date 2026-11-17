import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, enumText, nonBlank, SUBJECT_TYPES } from "./rev-shared.js";

/**
 * REV-E-001 — Subject absent, without `@id`, or of another type.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `about` names the one subject the sheet carries reviews for, in the
 * member entry shape: a product, a variant family or an organization.
 * Without it, or without an `@id`, the reviews are about nothing a
 * consumer can recognise. The finding sits at the data block when the
 * field is absent and at `about` otherwise.
 */
export const revE001: Rule = {
  id: "REV-E-001",
  title: "Subject absent, without @id, or of another type",
  severity: "error",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null) return null;
    if (data["about"] === undefined) return { values: { problem: "is absent" } };
    const path = `${match.path}['about']`;
    const about = asRecord(data["about"]);
    if (about === null) return { path, values: { problem: "is not an object" } };
    if (!nonBlank(about["@id"])) return { path, values: { problem: "carries no `@id`" } };
    const type = about["@type"];
    if (typeof type !== "string") return { path, values: { problem: "carries no `@type`" } };
    if (SUBJECT_TYPES.includes(type)) return null;
    return { path, values: { problem: `declares \`@type\` \`${type}\`, which is not one of ${enumText(SUBJECT_TYPES)}` } };
  },
  messageTemplate: "`about` at `{path}` {problem}.",
  remediation:
    "Name the subject in `about`, in the member entry shape: `@type` (`Product`, one of its subtypes, `ProductGroup` or `Organization`), the exact `@id` its own sheet declares, `url` and `pagefront:sheetUrl`. One sheet, one subject.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#required-core-fields",
};
