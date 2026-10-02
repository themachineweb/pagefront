import { fieldAbsentOrEmpty, type Rule } from "@pagefront/lint-core";

/**
 * PDP-W-001 — Recommended field absent: image.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Spec check: "`data.image` is absent, or is an empty array."
 * `fieldAbsentOrEmpty` additionally fires on null and empty/whitespace
 * strings — inputs a Layer-1-valid Sheet cannot present for `image`
 * (the schema types it as an array), so the check is equivalent on the
 * linter's input domain.
 */
export const pdpW001: Rule = {
  id: "PDP-W-001",
  title: "Recommended field absent: image",
  severity: "warning",
  target: "$.data",
  check: fieldAbsentOrEmpty("image"),
  messageTemplate: "No images declared at `{path}`.",
  remediation:
    "Add at least one `ImageObject` to the `data.image` array. The primary image should typically declare role `hero` or `packshot`.",
  introduced: "v0.6",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#image-roles",
};
