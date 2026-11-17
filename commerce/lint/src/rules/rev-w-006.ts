import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, memberEntries, reviewId } from "./rev-shared.js";

/**
 * REV-W-006 — Platform verification without a platform.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `platform_verified` means a third-party platform asserts the purchase
 * under its own scheme, so the source is `third_party` or `marketplace`;
 * a `first_party` or `imported` source names no platform that could. One
 * finding per entry, at its path.
 */
export const revW006: Rule = {
  id: "REV-W-006",
  title: "Platform verification without a platform",
  severity: "warning",
  target: "$.data.itemListElement",
  check: (match) => {
    const hits: CheckHit[] = [];
    for (const { entry, path } of memberEntries(match.value, match.path)) {
      if (entry["pagefront:purchaseVerification"] !== "platform_verified") continue;
      const kind = asRecord(entry["pagefront:reviewSource"])?.["kind"];
      if (kind !== "first_party" && kind !== "imported") continue;
      hits.push({ path, values: { id: reviewId(entry), kind } });
    }
    return hits;
  },
  messageTemplate: "Review `{id}` at `{path}` is `platform_verified` with a `{kind}` source.",
  remediation:
    "Name the platform that asserts the purchase in `pagefront:reviewSource` (`third_party` or `marketplace`), or declare the verification the publisher established itself: `order_matched`, `post_purchase_invitation`, `none` or `undisclosed`.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#pagefront-declarations",
};
