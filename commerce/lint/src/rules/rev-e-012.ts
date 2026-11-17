import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, isOrganizationSubject, reviewEntries, reviewId } from "./rev-shared.js";

/**
 * REV-E-012 — Product review on an Organization review sheet.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * An Organization review sheet carries the reviews collected about the
 * seller as a seller; every entry's subject is `seller` ("The
 * Organization review sheet" in review.md). Entries whose subject is
 * absent or not a string are REV-E-005's. One finding per entry, at its
 * `pagefront:reviewSubject`.
 */
export const revE012: Rule = {
  id: "REV-E-012",
  title: "Product review on an Organization review sheet",
  severity: "error",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null || !isOrganizationSubject(data)) return null;
    const hits: CheckHit[] = [];
    for (const { entry, path } of reviewEntries(data, match.path)) {
      const subject = entry["pagefront:reviewSubject"];
      if (typeof subject !== "string" || subject === "seller") continue;
      hits.push({ path: `${path}['pagefront:reviewSubject']`, values: { id: reviewId(entry), subject } });
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` declares `pagefront:reviewSubject` `{subject}` on an Organization review sheet.",
  remediation:
    "An Organization review sheet carries `seller`-subject reviews only. A review about a product, or a mixed one, stays in the review sheet of the product it was published on.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#the-organization-review-sheet",
};
