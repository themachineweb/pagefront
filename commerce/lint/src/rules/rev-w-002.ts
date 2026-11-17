import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, nonBlank } from "./rev-shared.js";

/**
 * REV-W-002 — Curated set without a policy page.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `pagefront:reviewPolicy.url` is required when `collection` is
 * `curated`: a publisher that selects which reviews to show states the
 * criteria somewhere a reader can go ("The set" in review.md).
 */
export const revW002: Rule = {
  id: "REV-W-002",
  title: "Curated set without a policy page",
  severity: "warning",
  target: "$.data['pagefront:reviewPolicy']",
  check: (match) => {
    const policy = asRecord(match.value);
    if (policy === null || policy["collection"] !== "curated" || nonBlank(policy["url"])) return null;
    return { values: {} };
  },
  messageTemplate: "`pagefront:reviewPolicy` at `{path}` declares `collection` `curated` and no `url`.",
  remediation:
    "Add `url`, the human-readable page that states how reviews are selected for display.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#the-set-pagefrontreviewpolicy",
};
