import type { Rule } from "@pagefront/lint-core";
import { asObject } from "./configurator-pricing.js";

/**
 * PDP-W-038 — Configurator note reads as page copy.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Heuristic on English Sheets (`inLanguage` `en` or `en-…`): the
 * dimension's `note` contains `you`, `your`, `select`, `order` or
 * `contact` as a whole word, delimited by non-letters.
 */
const PAGE_COPY_WORD = /(?<!\p{L})(you|your|select|order|contact)(?!\p{L})/iu;

export const pdpW038: Rule = {
  id: "PDP-W-038",
  title: "Configurator note reads as page copy",
  severity: "warning",
  target: "$.data['pagefront:configurator'].dimensions[*]",
  check: (match, ctx) => {
    const inLanguage = asObject(ctx.sheet.data)?.["inLanguage"];
    if (typeof inLanguage !== "string" || !/^en(-|$)/i.test(inLanguage)) return null;
    const note = asObject(match.value)?.["note"];
    if (typeof note !== "string") return null;
    const found = PAGE_COPY_WORD.exec(note);
    return found === null ? null : { values: { word: found[1].toLowerCase() } };
  },
  messageTemplate: "Note reads as page copy; state the fact.",
  remediation:
    "Restate the note as a fact in the third person: what the merchant offers or recommends, with no \"you\" and no instruction.",
  introduced: "v0.9 (2026-10-01 revision)",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "product.md#configurator-pricing-and-price-bands",
};
