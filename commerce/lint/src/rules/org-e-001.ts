import type { Rule } from "@pagefront/lint-core";
import { missingPrefixTerm } from "./context-prefix.js";

/**
 * ORG-E-001 — `pagefront:` term without the vocabulary prefix in `@context`.
 * Transcribed from commerce/spec/rules.md (normative). The organization
 * counterpart of PDP-E-003; the check is shared (context-prefix.ts).
 */
export const orgE001: Rule = {
  id: "ORG-E-001",
  title: "pagefront: term without the vocabulary prefix",
  severity: "error",
  target: "$.data",
  check: (match) => missingPrefixTerm(match.value),
  messageTemplate:
    "The Sheet uses `{term}` but `@context` at `{path}` does not declare the `pagefront` prefix, so the term does not resolve to the Pagefront vocabulary.",
  remediation:
    'Declare the prefix: `"@context": ["https://schema.org", {"pagefront": "https://themachineweb.org/pagefront/vocabulary/"}]`.',
  introduced: "v0.9",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "vocabulary.md#how-to-use-this-vocabulary",
};
