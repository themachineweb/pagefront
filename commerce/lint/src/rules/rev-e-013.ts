import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asRecord, reviewEntries } from "./rev-shared.js";

/**
 * REV-E-013 — Policy or source without its type.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * `pagefront:reviewPolicy` is one `pagefront:ReviewPolicy` and
 * `pagefront:reviewSource` one `pagefront:ReviewSource`; the `@type` is
 * what tells a consumer which vocabulary shape it is reading. A value
 * that is absent or not an object is REV-E-002's or REV-E-006's. One
 * finding per value, at the value.
 */
const EXPECTED: Record<string, string> = {
  "pagefront:reviewPolicy": "pagefront:ReviewPolicy",
  "pagefront:reviewSource": "pagefront:ReviewSource",
};

function typeProblem(field: string, value: Record<string, unknown>): string | null {
  const type = value["@type"];
  if (type === undefined) return "carries no `@type`";
  if (type === EXPECTED[field]) return null;
  const rendered = typeof type === "string" ? type : JSON.stringify(type);
  return `declares \`@type\` \`${rendered}\`, which is not \`${EXPECTED[field]}\``;
}

export const revE013: Rule = {
  id: "REV-E-013",
  title: "Policy or source without its type",
  severity: "error",
  target: "$.data",
  check: (match) => {
    const data = asRecord(match.value);
    if (data === null) return null;
    const hits: CheckHit[] = [];
    const policy = asRecord(data["pagefront:reviewPolicy"]);
    if (policy !== null) {
      const problem = typeProblem("pagefront:reviewPolicy", policy);
      if (problem !== null) hits.push({ path: `${match.path}['pagefront:reviewPolicy']`, values: { field: "pagefront:reviewPolicy", problem } });
    }
    for (const { entry, path } of reviewEntries(data, match.path)) {
      const source = asRecord(entry["pagefront:reviewSource"]);
      if (source === null) continue;
      const problem = typeProblem("pagefront:reviewSource", source);
      if (problem !== null) hits.push({ path: `${path}['pagefront:reviewSource']`, values: { field: "pagefront:reviewSource", problem } });
    }
    return hits;
  },
  messageTemplate: "`{field}` at `{path}` {problem}.",
  remediation: "Give the policy `@type` `pagefront:ReviewPolicy` and every source `@type` `pagefront:ReviewSource`.",
  introduced: "release 0.6.0",
  appliesFrom: "0.6.0",
  specReference: "review.md#pagefront-declarations",
};
