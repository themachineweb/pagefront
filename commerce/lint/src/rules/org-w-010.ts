import type { Rule } from "@pagefront/lint-core";
import { asRecord, isEmptyOrWhitespace } from "./org-shared.js";

/**
 * ORG-W-010 — Store question with a structured home.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * A store-wide FAQ answer about returns, shipping, payment or hours
 * belongs in the structured field that carries it ("Structure first"
 * under "Store Q&A" in organization.md). The question's `name` is
 * case-folded and tested against one keyword set per field; a keyword
 * matches at the start of a word, so `ship` covers "shipping" and
 * "shipped" and `pay` covers "payment" and "PayPal". The rule fires when
 * a set matches and its field is absent or empty on the sheet, once per
 * question, naming the first matching field in the order below. A
 * redundant question beside a present field is a style matter and does
 * not fire.
 *
 * The keyword sets live here, in one place, so that they can be extended
 * per language. The English set is the baseline; the French equivalents
 * are included because the corpus has French sheets.
 */
export interface StoreTopic {
  /** The word rendered in the message. */
  topic: string;
  /** The data-block field that carries the answer. */
  field: string;
  /** Lower-case word starts; matched against the case-folded question. */
  keywords: readonly string[];
}

export const STORE_TOPICS: readonly StoreTopic[] = [
  {
    topic: "returns",
    field: "hasMerchantReturnPolicy",
    keywords: ["return", "refund", "exchange", "send back", "retour", "rembourse", "échange", "echange"],
  },
  {
    topic: "shipping",
    field: "pagefront:fulfillmentTerms",
    keywords: ["ship", "deliver", "postage", "duties", "customs", "livraison", "livrer", "livré", "expédition", "expedition", "douane"],
  },
  {
    topic: "payment",
    field: "paymentAccepted",
    keywords: ["pay", "payment", "card", "instalment", "installment", "klarna", "paypal", "paiement", "carte"],
  },
  {
    topic: "hours",
    field: "location[*].openingHoursSpecification",
    keywords: ["open", "hours", "closing", "horaires", "ouvert"],
  },
];

function matches(name: string, keywords: readonly string[]): boolean {
  return keywords.some((k) => new RegExp(`(^|[^\\p{L}])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "u").test(name));
}

/** Whether the sheet carries the field, by the Definitions section's emptiness; hours need a location with hours. */
function carries(data: Record<string, unknown>, field: string): boolean {
  if (field.startsWith("location")) {
    const location = data["location"];
    if (!Array.isArray(location)) return false;
    return location.some((place) => {
      const p = asRecord(place);
      return p !== null && (!isEmptyOrWhitespace(p["openingHoursSpecification"]) || !isEmptyOrWhitespace(p["openingHours"]));
    });
  }
  return !isEmptyOrWhitespace(data[field]);
}

export const orgW010: Rule = {
  id: "ORG-W-010",
  title: "Store question with a structured home",
  severity: "warning",
  target: "$.data.question[*]",
  check: (match, ctx) => {
    const question = asRecord(match.value);
    if (question === null || typeof question["name"] !== "string") return null;
    const data = asRecord(ctx.sheet.data);
    if (data === null) return null;
    const name = (question["name"] as string).toLowerCase();
    for (const { topic, field, keywords } of STORE_TOPICS) {
      if (!matches(name, keywords)) continue;
      if (carries(data, field)) continue;
      return { values: { name: question["name"] as string, topic, field } };
    }
    return null;
  },
  messageTemplate: "Question `{name}` at `{path}` concerns {topic} but the sheet carries no `{field}`.",
  remediation:
    "Extract the answer into the field the message names. Keep the question only if it carries a nuance the field cannot.",
  introduced: "release 0.7.0",
  appliesFrom: "0.7.0",
  specReference: "organization.md#store-qa",
};
