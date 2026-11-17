import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, enumText, POLICY_COLLECTIONS } from "./rev-shared.js";

/**
 * REV-E-002 — Review policy absent, or `collection` outside the enum.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `pagefront:reviewPolicy` is the publisher's statement about the set,
 * required and single-valued; its `collection` says how reviews reach the
 * published set, from a closed enum with `undisclosed`. The finding sits
 * at the data block when the policy is absent and at the policy otherwise.
 */
export const revE002: Rule = {
  id: "REV-E-002",
  title: "Review policy absent, or collection outside the enum",
  severity: "error",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null) return null;
    if (data["pagefront:reviewPolicy"] === undefined) return { values: { problem: "is absent" } };
    const path = `${match.path}['pagefront:reviewPolicy']`;
    const policy = asRecord(data["pagefront:reviewPolicy"]);
    if (policy === null) return { path, values: { problem: "is not an object" } };
    const collection = policy["collection"];
    if (collection === undefined) return { path, values: { problem: "carries no `collection`" } };
    if (typeof collection === "string" && (POLICY_COLLECTIONS as readonly string[]).includes(collection)) return null;
    const rendered = typeof collection === "string" ? collection : JSON.stringify(collection);
    return { path, values: { problem: `declares \`collection\` \`${rendered}\`, which is not one of ${enumText(POLICY_COLLECTIONS)}` } };
  },
  messageTemplate: "`pagefront:reviewPolicy` at `{path}` {problem}.",
  remediation:
    "Declare `pagefront:reviewPolicy` with `@type` `pagefront:ReviewPolicy` and `collection` as `all`, `moderated`, `curated` or `undisclosed`; a publisher that does not state its practice writes `undisclosed`. Additional values require a spec amendment.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#the-set-pagefrontreviewpolicy",
};
