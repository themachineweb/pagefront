import type { Sheet } from "@pagefront/lint-core";

/**
 * Shared helpers for the configurator-pricing rules (PDP-E-001's
 * `configurator` arm, PDP-E-007 to PDP-E-012, PDP-W-032 to PDP-W-035).
 * They implement the catalogue's Definitions: *pricing block*, *priced
 * dimension*, *option key*, *computed total* and *computed band*.
 */

type Obj = Record<string, unknown>;

export function asObject(value: unknown): Obj | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Obj)
    : null;
}

/** Own-property lookup: option keys are publisher strings (`constructor`, …). */
export function own(obj: Obj | null, key: string): unknown {
  return obj !== null && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
}

const CONTROL_ESCAPES: Record<string, string> = {
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
};

/**
 * A name selector in the engine's path style (RFC 9535 normalized
 * paths). Option keys are publisher strings, so the quote, the
 * backslash and control characters are escaped as the RFC prescribes.
 */
export function seg(key: string): string {
  const escaped = key.replace(/[\\'\u0000-\u001f]/g, (ch) => {
    if (ch === "\\" || ch === "'") return `\\${ch}`;
    return CONTROL_ESCAPES[ch] ?? `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
  return `['${escaped}']`;
}

// ---------------------------------------------------------------------------
// Exact decimals. An amount is a JSON number, read as the decimal its
// shortest serialization denotes, or a decimal string, read as the
// decimal it writes; comparisons are numeric whatever the carrier.
// Binary floating point is never used to sum or compare amounts.
// ---------------------------------------------------------------------------

export interface Decimal {
  units: bigint;
  /** Number of decimal places `units` is scaled by. */
  scale: number;
}

const PLAIN_DECIMAL = /^(-?)(\d+)(?:\.(\d+))?$/;

/**
 * A decimal reading of an amount: a plain decimal string, or a JSON
 * number whose shortest serialization is a plain decimal. Anything else
 * is not comparable and yields undefined.
 */
export function parseDecimal(value: unknown): Decimal | undefined {
  let text: string;
  if (typeof value === "string") text = value;
  else if (typeof value === "number" && Number.isFinite(value)) text = String(value);
  else return undefined;
  const m = PLAIN_DECIMAL.exec(text);
  if (m === null) return undefined;
  const fraction = m[3] ?? "";
  const units = BigInt(m[2] + fraction);
  return { units: m[1] === "-" ? -units : units, scale: fraction.length };
}

function rescale(d: Decimal, scale: number): bigint {
  return d.units * 10n ** BigInt(scale - d.scale);
}

export function addDecimal(a: Decimal, b: Decimal): Decimal {
  const scale = Math.max(a.scale, b.scale);
  return { units: rescale(a, scale) + rescale(b, scale), scale };
}

/** Negative, zero or positive as `a` is below, equal to or above `b`. */
export function compareDecimal(a: Decimal, b: Decimal): number {
  const scale = Math.max(a.scale, b.scale);
  const diff = rescale(a, scale) - rescale(b, scale);
  return diff < 0n ? -1 : diff > 0n ? 1 : 0;
}

export function isZero(d: Decimal): boolean {
  return d.units === 0n;
}

/** Renders with the decimal's own number of places (`859.00` at scale 2). */
export function formatDecimal(d: Decimal): string {
  const negative = d.units < 0n;
  const digits = (negative ? -d.units : d.units).toString().padStart(d.scale + 1, "0");
  const whole = digits.slice(0, digits.length - d.scale);
  const fraction = d.scale > 0 ? `.${digits.slice(digits.length - d.scale)}` : "";
  return `${negative ? "-" : ""}${whole}${fraction}`;
}

// ---------------------------------------------------------------------------
// The configurator and the pricing block
// ---------------------------------------------------------------------------

/** The string form an option value is matched by (Definitions: *option key*). */
export function optionKey(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  return undefined;
}

export interface Dimension {
  name: string;
  /** `affectsPrice` is not `false`. */
  priced: boolean;
  /** `inputType` is `text` (Definitions: *text dimension*). */
  text: boolean;
  /** The declared sizing `system`, when the dimension is a sizing dimension. */
  system: string | undefined;
  /**
   * Option keys in document order; null when the dimension enumerates
   * none. Always null for a text dimension, which takes free input.
   */
  optionKeys: string[] | null;
}

/**
 * `system` → the `pagefront:SizeAdjustment.sizeSystem` naming the same
 * system (Definitions: *corresponding size system*).
 */
export const CORRESPONDING_SIZE_SYSTEM: Record<string, string> = {
  UK: "WearableSizeSystemUK",
  EU: "WearableSizeSystemEU",
  US: "WearableSizeSystemUS",
  JP: "WearableSizeSystemJP",
};

/** The one modifier key of a text dimension: any non-empty input. */
export const TEXT_KEY = "*";

export interface Configurator {
  id: string | undefined;
  dimensions: Dimension[];
  byName: Map<string, Dimension>;
  /** Each exclusion as dimension name → option key. */
  exclusions: Map<string, string>[];
}

function selection(value: unknown): Map<string, string> | null {
  const obj = asObject(value);
  if (obj === null) return null;
  const out = new Map<string, string>();
  for (const [name, raw] of Object.entries(obj)) {
    const key = optionKey(raw);
    if (key === undefined) return null;
    out.set(name, key);
  }
  return out;
}

/** The Sheet's `pagefront:configurator`, or null when absent or shapeless. */
export function readConfigurator(sheet: Sheet): Configurator | null {
  const raw = asObject(own(asObject(sheet.data), "pagefront:configurator"));
  if (raw === null || !Array.isArray(raw["dimensions"])) return null;
  const dimensions: Dimension[] = [];
  const byName = new Map<string, Dimension>();
  for (const entry of raw["dimensions"]) {
    const d = asObject(entry);
    if (d === null || typeof d["name"] !== "string") continue;
    const text = d["inputType"] === "text";
    let optionKeys: string[] | null = null;
    if (!text && Array.isArray(d["options"]) && d["options"].length > 0) {
      optionKeys = [];
      for (const option of d["options"]) {
        const key = optionKey(asObject(option)?.["value"]);
        if (key !== undefined && !optionKeys.includes(key)) optionKeys.push(key);
      }
    }
    const dimension: Dimension = {
      name: d["name"],
      priced: d["affectsPrice"] !== false,
      text,
      system: typeof d["system"] === "string" ? d["system"] : undefined,
      optionKeys,
    };
    dimensions.push(dimension);
    if (!byName.has(dimension.name)) byName.set(dimension.name, dimension);
  }
  const exclusions: Map<string, string>[] = [];
  if (Array.isArray(raw["exclusions"])) {
    for (const entry of raw["exclusions"]) {
      const pairs = selection(entry);
      if (pairs !== null && pairs.size > 0) exclusions.push(pairs);
    }
  }
  const id = typeof raw["@id"] === "string" ? raw["@id"] : undefined;
  return { id, dimensions, byName, exclusions };
}

export function hasPricedDimension(configurator: Configurator): boolean {
  return configurator.dimensions.some((d) => d.priced);
}

/** The pricing block of an `offers` entry, or null. */
export function pricingBlock(offer: unknown): Obj | null {
  return asObject(own(asObject(offer), "pagefront:configuratorPricing"));
}

/** The `configurator.@id` a pricing block names, when it is a string. */
export function pricedConfiguratorId(block: Obj): string | undefined {
  const id = own(asObject(block["configurator"]), "@id");
  return typeof id === "string" ? id : undefined;
}

/**
 * The configurator a pricing block prices: the Sheet's configurator when
 * the block's reference equals its `@id` by exact string match. Null is
 * the unresolved reference PDP-E-001 reports; the pricing rules are
 * silent on it.
 */
export function resolveConfigurator(block: Obj, sheet: Sheet): Configurator | null {
  const configurator = readConfigurator(sheet);
  const id = pricedConfiguratorId(block);
  if (configurator === null || id === undefined || configurator.id !== id) return null;
  return configurator;
}

export function offerEntries(sheet: Sheet): unknown[] {
  const offers = own(asObject(sheet.data), "offers");
  return Array.isArray(offers) ? offers : [];
}

/**
 * True when an `offers` entry states a price, in the sense PDP-W-033 and
 * PDP-W-034 share: an `AggregateOffer`, or an `Offer` with `price` or a
 * non-empty `priceSpecification`. Price-on-request offers state none.
 */
export function entryStatesPrice(entry: unknown): boolean {
  const o = asObject(entry);
  if (o === null || o["pagefront:priceOnRequest"] !== undefined) return false;
  if (o["@type"] === "AggregateOffer") return true;
  if (o["price"] !== undefined) return true;
  const spec = o["priceSpecification"];
  if (Array.isArray(spec)) return spec.length > 0;
  return asObject(spec) !== null && Object.keys(spec as Obj).length > 0;
}

export function isComplete(block: Obj): boolean {
  return block["pricing"] !== "partial";
}

// ---------------------------------------------------------------------------
// Findings shared between a rule and the rules that are silent when it fires
// ---------------------------------------------------------------------------

export type BaseConfigurationProblem =
  | { kind: "omitted"; dimension: string }
  | { kind: "unknown-dimension"; dimension: string }
  | { kind: "unknown-option"; dimension: string; value: string };

/** PDP-E-007's findings: omitted dimensions first, then pairs in document order. */
export function baseConfigurationProblems(
  configurator: Configurator,
  block: Obj
): BaseConfigurationProblem[] {
  const base = asObject(block["baseConfiguration"]) ?? {};
  const problems: BaseConfigurationProblem[] = [];
  for (const d of configurator.dimensions) {
    if (d.priced && d.optionKeys !== null && own(base, d.name) === undefined) {
      problems.push({ kind: "omitted", dimension: d.name });
    }
  }
  for (const [name, raw] of Object.entries(base)) {
    const d = configurator.byName.get(name);
    if (d === undefined) {
      problems.push({ kind: "unknown-dimension", dimension: name });
      continue;
    }
    if (!d.priced) continue; // redundant pair, changes no total
    const key = optionKey(raw);
    if (key === undefined || d.optionKeys === null || !d.optionKeys.includes(key)) {
      problems.push({ kind: "unknown-option", dimension: name, value: key ?? JSON.stringify(raw) });
    }
  }
  return problems;
}

export type MissingModifierProblem =
  | { kind: "no-options"; dimension: string }
  | { kind: "no-text-modifier"; dimension: string }
  | { kind: "missing"; dimension: string; option: string };

/** PDP-W-032's findings, whatever the block's `pricing` value. */
export function missingModifierProblems(
  configurator: Configurator,
  block: Obj
): MissingModifierProblem[] {
  const modifiers = asObject(block["modifiers"]);
  const problems: MissingModifierProblem[] = [];
  for (const d of configurator.dimensions) {
    if (!d.priced) continue;
    const entry = asObject(own(modifiers, d.name));
    if (d.text) {
      if (own(entry, TEXT_KEY) === undefined) {
        problems.push({ kind: "no-text-modifier", dimension: d.name });
      }
      continue;
    }
    if (d.optionKeys === null) {
      problems.push({ kind: "no-options", dimension: d.name });
      continue;
    }
    for (const option of d.optionKeys) {
      if (own(entry, option) === undefined) {
        problems.push({ kind: "missing", dimension: d.name, option });
      }
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Computed band
// ---------------------------------------------------------------------------

export interface Band {
  min: Decimal;
  max: Decimal;
}

function matches(pairs: Map<string, string>, configuration: Map<string, string>): boolean {
  for (const [name, key] of pairs) {
    if (configuration.get(name) !== key) return false;
  }
  return true;
}

/**
 * The minimum and maximum computed total over all non-excluded
 * configurations, or null when it cannot be computed (an amount is not
 * a decimal, a modifier is missing, or every configuration is
 * excluded). The caller has established that the block resolves to
 * `configurator`.
 *
 * Only the dimensions named in an exclusion or an adjustment are
 * enumerated together. Every other priced dimension contributes its
 * smallest modifier to the minimum and its largest to the maximum,
 * independently of the rest, which yields the same band as the full
 * enumeration. A priced text dimension is empty or non-empty: its `*`
 * modifier lowers the minimum when negative and raises the maximum
 * when positive.
 */
export function computeBand(configurator: Configurator, block: Obj): Band | null {
  const base = parseDecimal(block["basePrice"]);
  if (base === undefined) return null;
  const modifiers = asObject(block["modifiers"]);

  const adjustments: { when: Map<string, string>; amount: Decimal }[] = [];
  if (Array.isArray(block["adjustments"])) {
    for (const entry of block["adjustments"]) {
      const a = asObject(entry);
      const when = selection(a?.["when"]);
      const amount = parseDecimal(a?.["priceModifier"]);
      if (when === null || when.size === 0 || amount === undefined) return null;
      adjustments.push({ when, amount });
    }
  }

  const coupledNames = new Set<string>();
  for (const pairs of configurator.exclusions) for (const name of pairs.keys()) coupledNames.add(name);
  for (const { when } of adjustments) for (const name of when.keys()) coupledNames.add(name);

  const modifierOf = (d: Dimension, option: string): Decimal | undefined =>
    parseDecimal(own(asObject(own(modifiers, d.name)), option));

  let min = base;
  let max = base;
  const coupled: Dimension[] = [];
  const seen = new Set<string>();
  for (const d of configurator.dimensions) {
    if (seen.has(d.name)) continue;
    seen.add(d.name);
    if (d.optionKeys === null) {
      if (!d.priced) continue;
      if (!d.text) return null;
      const amount = modifierOf(d, TEXT_KEY);
      if (amount === undefined) return null;
      if (amount.units < 0n) min = addDecimal(min, amount);
      else max = addDecimal(max, amount);
      continue;
    }
    if (coupledNames.has(d.name)) {
      coupled.push(d);
      continue;
    }
    if (!d.priced) continue;
    let lowest: Decimal | undefined;
    let highest: Decimal | undefined;
    for (const option of d.optionKeys) {
      const amount = modifierOf(d, option);
      if (amount === undefined) return null;
      if (lowest === undefined || compareDecimal(amount, lowest) < 0) lowest = amount;
      if (highest === undefined || compareDecimal(amount, highest) > 0) highest = amount;
    }
    if (lowest === undefined || highest === undefined) return null;
    min = addDecimal(min, lowest);
    max = addDecimal(max, highest);
  }

  let coupledMin: Decimal | undefined;
  let coupledMax: Decimal | undefined;
  let incomputable = false;
  const configuration = new Map<string, string>();
  const visit = (index: number, subtotal: Decimal): void => {
    if (incomputable) return;
    if (index === coupled.length) {
      if (configurator.exclusions.some((pairs) => matches(pairs, configuration))) return;
      let total = subtotal;
      for (const { when, amount } of adjustments) {
        if (matches(when, configuration)) total = addDecimal(total, amount);
      }
      if (coupledMin === undefined || compareDecimal(total, coupledMin) < 0) coupledMin = total;
      if (coupledMax === undefined || compareDecimal(total, coupledMax) > 0) coupledMax = total;
      return;
    }
    const d = coupled[index];
    for (const option of d.optionKeys ?? []) {
      let next = subtotal;
      if (d.priced) {
        const amount = modifierOf(d, option);
        if (amount === undefined) {
          incomputable = true;
          return;
        }
        next = addDecimal(subtotal, amount);
      }
      configuration.set(d.name, option);
      visit(index + 1, next);
    }
    configuration.delete(d.name);
  };
  visit(0, { units: 0n, scale: 0 });
  if (incomputable || coupledMin === undefined || coupledMax === undefined) return null;
  return { min: addDecimal(min, coupledMin), max: addDecimal(max, coupledMax) };
}
