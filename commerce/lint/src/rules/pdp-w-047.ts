import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-047 — Answer contradicts a named feature.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * For each `acceptedAnswer`, the rows of `pagefront:featureGroup` and the
 * `additionalProperty` entries whose `name` (case-folded) appears in the
 * parent question's `name` are the named features. A row with a numeric
 * `value` and a unit (`unitCode`, or `unitText`) gives the unit's
 * spellings: the row's `unitText` and the table below for the code. The
 * answer text is scanned for a number followed, with or without a space,
 * by one of those spellings as a whole token; the rule fires when at
 * least one number is matched and none equals the row's value. A number
 * followed by another unit's spelling is never matched, so `10 ATM`
 * beside a `100` `MTR` rating is silent. One finding per question: the
 * first mismatching row in sheet order.
 */
const UNIT_SPELLINGS: Record<string, readonly string[]> = {
  MTR: ["m", "metre", "metres", "meter", "meters"],
  CMT: ["cm", "centimetre", "centimetres", "centimeter", "centimeters"],
  MMT: ["mm", "millimetre", "millimetres", "millimeter", "millimeters"],
  KMT: ["km", "kilometre", "kilometres", "kilometer", "kilometers"],
  INH: ["in", "inch", "inches", "″"],
  FOT: ["ft", "foot", "feet"],
  KGM: ["kg", "kilogram", "kilograms", "kilo", "kilos"],
  GRM: ["g", "gram", "grams", "gramme", "grammes"],
  LBR: ["lb", "lbs", "pound", "pounds"],
  ONZ: ["oz", "ounce", "ounces"],
  LTR: ["l", "litre", "litres", "liter", "liters"],
  MLT: ["ml", "millilitre", "millilitres", "milliliter", "milliliters"],
  HUR: ["h", "hr", "hrs", "hour", "hours"],
  MIN: ["min", "mins", "minute", "minutes"],
  SEC: ["s", "sec", "secs", "second", "seconds"],
  DAY: ["day", "days"],
  WEE: ["week", "weeks"],
  MON: ["month", "months"],
  ANN: ["year", "years", "yr", "yrs"],
  WTT: ["w", "watt", "watts"],
  KWT: ["kw", "kilowatt", "kilowatts"],
  VLT: ["v", "volt", "volts"],
  AMP: ["a", "amp", "amps", "ampere", "amperes"],
  WHR: ["wh", "watt-hour", "watt-hours"],
  KWH: ["kwh"],
  HTZ: ["hz", "hertz"],
  MHZ: ["mhz"],
  A86: ["ghz"],
  E34: ["gb", "gigabyte", "gigabytes"],
  E35: ["tb", "terabyte", "terabytes"],
  CEL: ["°c"],
  FAH: ["°f"],
  BAR: ["bar"],
  ATM: ["atm"],
  P1: ["%", "percent"],
  H87: ["piece", "pieces", "pc", "pcs"],
};

/** A number, then optional whitespace, then a token free of digits and separators. */
const NUMBER_THEN_TOKEN = /([+-]?\d+(?:[.,]\d+)?)\s*([^\s\d.,;:!?()[\]{}"'+-]+)/g;

interface Row {
  name: string;
  value: number;
  valueText: string;
  unit: string;
  spellings: Set<string>;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.trim().replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function row(entry: unknown): Row | undefined {
  if (typeof entry !== "object" || entry === null) return undefined;
  const e = entry as Record<string, unknown>;
  if (typeof e["name"] !== "string") return undefined;
  const value = asNumber(e["value"]);
  if (value === undefined) return undefined;
  const code = typeof e["unitCode"] === "string" ? (e["unitCode"] as string).trim().toUpperCase() : "";
  const text = typeof e["unitText"] === "string" ? (e["unitText"] as string).trim() : "";
  const spellings = new Set<string>();
  for (const s of UNIT_SPELLINGS[code] ?? []) spellings.add(s);
  if (text !== "") spellings.add(text.toLowerCase());
  if (spellings.size === 0) return undefined;
  const unit = text !== "" ? text : (UNIT_SPELLINGS[code]?.[0] ?? code);
  return { name: e["name"] as string, value, valueText: String(e["value"]).trim(), unit, spellings };
}

function featureRows(data: Record<string, unknown>): Row[] {
  const rows: Row[] = [];
  const add = (entry: unknown) => {
    const r = row(entry);
    if (r !== undefined) rows.push(r);
  };
  const groups = data["pagefront:featureGroup"];
  if (Array.isArray(groups)) {
    for (const group of groups) {
      const features =
        typeof group === "object" && group !== null ? (group as Record<string, unknown>)["feature"] : undefined;
      if (Array.isArray(features)) features.forEach(add);
    }
  }
  const properties = data["additionalProperty"];
  if (Array.isArray(properties)) properties.forEach(add);
  return rows;
}

export const pdpW047: Rule = {
  id: "PDP-W-047",
  title: "Answer contradicts a named feature",
  severity: "warning",
  target: "$.data.question[*].acceptedAnswer",
  check: (match, ctx) => {
    const answer = match.value;
    if (typeof answer !== "object" || answer === null) return null;
    const text = (answer as Record<string, unknown>)["text"];
    if (typeof text !== "string" || text.trim() === "") return null;

    const data =
      typeof ctx.sheet.data === "object" && ctx.sheet.data !== null
        ? (ctx.sheet.data as Record<string, unknown>)
        : {};
    const index = /\['question'\]\[(\d+)\]/.exec(match.path)?.[1];
    if (index === undefined || !Array.isArray(data["question"])) return null;
    const question = (data["question"] as unknown[])[Number(index)];
    if (typeof question !== "object" || question === null) return null;
    const name = (question as Record<string, unknown>)["name"];
    if (typeof name !== "string" || name.trim() === "") return null;
    const questionName = name.toLowerCase();

    for (const feature of featureRows(data)) {
      if (!questionName.includes(feature.name.toLowerCase())) continue;
      const stated: { text: string; value: number }[] = [];
      NUMBER_THEN_TOKEN.lastIndex = 0;
      let hit: RegExpExecArray | null;
      while ((hit = NUMBER_THEN_TOKEN.exec(text)) !== null) {
        const token = hit[2].toLowerCase();
        if (!feature.spellings.has(token)) continue;
        const n = Number(hit[1].replace(",", "."));
        if (Number.isFinite(n)) stated.push({ text: `${hit[1]} ${hit[2]}`, value: n });
      }
      if (stated.length === 0) continue;
      if (stated.some((s) => Math.abs(s.value - feature.value) < 1e-9)) continue;
      return {
        values: {
          name,
          stated: stated[0].text,
          feature: feature.name,
          value: feature.valueText,
          unit: feature.unit,
        },
      };
    }
    return null;
  },
  messageTemplate:
    "Answer to `{name}` at `{path}` states `{stated}` where the sheet's `{feature}` is `{value} {unit}`.",
  remediation:
    "Correct whichever is wrong on the page, then re-emit. If the answer is right and the feature is stale, fix the feature; the structured field is what consumers compare on.",
  introduced: "release 0.7.0",
  appliesFrom: "0.7.0",
  appliesToLegacy: false,
  specReference: "product.md#qa-and-the-structured-fields",
};
