import type { CheckHit, Rule } from "@pagefront/lint-core";

/**
 * PDP-W-030 — Offer or product warranty with no content.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Present-but-empty rule (the PDP-W-022 / PDP-W-027 family): a
 * `warranty` on an offer, or the data block's
 * `pagefront:manufacturerWarranty`, that carries neither
 * `durationOfWarranty` nor a non-empty `description`. The rule's
 * conceptual target spans two positions; the JSONPath target matches
 * the data block once and the check walks both from there, giving each
 * finding the entry's own path.
 */
const isEmptyWarranty = (entry: unknown): boolean => {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return false;
  const e = entry as Record<string, unknown>;
  if (e["durationOfWarranty"] !== undefined && e["durationOfWarranty"] !== null) return false;
  const description = e["description"];
  return !(typeof description === "string" && description.trim() !== "");
};

export const pdpW030: Rule = {
  id: "PDP-W-030",
  title: "Offer or product warranty with no content",
  severity: "warning",
  target: "$.data",
  check: (match) => {
    const data = match.value;
    if (typeof data !== "object" || data === null) return null;
    const d = data as Record<string, unknown>;
    const hits: CheckHit[] = [];
    if (isEmptyWarranty(d["pagefront:manufacturerWarranty"])) {
      hits.push({ path: `${match.path}['pagefront:manufacturerWarranty']` });
    }
    const offers = d["offers"];
    if (Array.isArray(offers)) {
      offers.forEach((offer, index) => {
        if (typeof offer !== "object" || offer === null) return;
        if (isEmptyWarranty((offer as Record<string, unknown>)["warranty"])) {
          hits.push({ path: `${match.path}['offers'][${index}]['warranty']` });
        }
      });
    }
    return hits.length > 0 ? hits : null;
  },
  messageTemplate: "Warranty at `{path}` states neither a duration nor a description.",
  remediation:
    "State the warranty as written in `description`, and add `durationOfWarranty` where a finite length is stated. A lifetime warranty carries `description` (and optionally `name`) with no `durationOfWarranty`.",
  introduced: "v0.9",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#warranty",
};
