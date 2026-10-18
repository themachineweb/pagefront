import { isFullAbsoluteUrl } from "@pagefront/lint-core";
import { asObject, own } from "./configurator-pricing.js";

/**
 * Shared by PDP-E-019 and PDP-E-020: the checkout template an Offer may
 * carry as Schema.org's `checkoutPageURLTemplate` (product.md, "Where to
 * buy"), and the RFC 6570 syntax check PDP-E-019 applies to it.
 *
 * The syntax check follows the RFC's grammar (sections 2.1 to 2.4):
 *
 *   expression    = "{" [ operator ] variable-list "}"
 *   operator      = "+" / "#" / "." / "/" / ";" / "?" / "&"   (levels 2 and 3)
 *                 / "=" / "," / "!" / "@" / "|"                (reserved)
 *   variable-list = varspec *( "," varspec )
 *   varspec       = varname [ ":" max-length / "*" ]
 *   varname       = varchar *( ["."] varchar )
 *   varchar       = ALPHA / DIGIT / "_" / pct-encoded
 *
 * Literals outside an expression may be any character except a control
 * character, a space, `"`, `'`, `%` (unless it starts a pct-encoded
 * triplet), `<`, `>`, `\`, `^`, `` ` ``, `{`, `|` and `}`. The reserved
 * operators are a template error here: the RFC reserves them for future
 * extensions and defines no expansion for them.
 *
 * Expansion (section 3.2) is implemented for the one defined variable,
 * a scalar: the operator sets the expression's first character and the
 * separator between varspecs, and `;`, `?` and `&` prefix the value with
 * `name=`; a prefix modifier truncates the value; explode has no effect
 * on a scalar; an undefined variable expands to nothing.
 */

/** The one template variable the Product Sheet spec defines. */
export const DEFINED_VARIABLES: readonly string[] = ["quantity"];

export type TemplateProblem =
  | { kind: "not-string" }
  | { kind: "invalid"; detail: string }
  | { kind: "undefined-variables"; variables: string[] }
  | { kind: "not-https"; expansion: string };

const VARSPEC = /^(?:[A-Za-z0-9_]|%[0-9A-Fa-f]{2})(?:\.?(?:[A-Za-z0-9_]|%[0-9A-Fa-f]{2}))*(?:\*|:[1-9][0-9]{0,3})?$/;
const LEVEL_OPERATORS = new Set(["+", "#", ".", "/", ";", "?", "&"]);
const RESERVED_OPERATORS = new Set(["=", ",", "!", "@", "|"]);
const EXCLUDED_LITERALS = new Set(['"', "'", "<", ">", "\\", "^", "`", "|"]);

/** The variable name of a varspec, without its prefix or explode modifier. */
function varnameOf(varspec: string): string {
  return varspec.replace(/(?:\*|:[1-9][0-9]{0,3})$/, "");
}

/**
 * Parse an RFC 6570 template. Returns the variable names it references
 * (each once, in order of appearance), or the first syntax problem.
 */
export function parseTemplate(template: string): { variables: string[] } | { detail: string } {
  const variables: string[] = [];
  let i = 0;
  while (i < template.length) {
    const ch = template[i];
    if (ch === "{") {
      const close = template.indexOf("}", i + 1);
      if (close === -1) return { detail: `the expression opened at position ${i} is never closed` };
      let body = template.slice(i + 1, close);
      if (body.length === 0) return { detail: `the expression at position ${i} is empty` };
      if (RESERVED_OPERATORS.has(body[0])) {
        return { detail: `the operator \`${body[0]}\` at position ${i + 1} is reserved by RFC 6570 and has no expansion` };
      }
      if (LEVEL_OPERATORS.has(body[0])) body = body.slice(1);
      for (const varspec of body.split(",")) {
        if (!VARSPEC.test(varspec)) return { detail: `\`${varspec}\` in the expression at position ${i} is not a variable specifier` };
        const name = varnameOf(varspec);
        if (!variables.includes(name)) variables.push(name);
      }
      i = close + 1;
      continue;
    }
    if (ch === "}") return { detail: `\`}\` at position ${i} is outside an expression` };
    if (ch === "%") {
      if (!/^%[0-9A-Fa-f]{2}/.test(template.slice(i, i + 3))) {
        return { detail: `\`%\` at position ${i} does not start a percent-encoded triplet` };
      }
      i += 3;
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code < 0x20 || code === 0x7f || ch === " " || EXCLUDED_LITERALS.has(ch)) {
      const shown = code < 0x20 || code === 0x7f ? `U+${code.toString(16).toUpperCase().padStart(4, "0")}` : ch === " " ? "a space" : `\`${ch}\``;
      return { detail: `${shown} at position ${i} is not allowed in a literal` };
    }
    i += 1;
  }
  return { variables };
}

/** Expansion rules per operator (RFC 6570, section 3.2, table at 3.2.1). */
const EXPANSION: Record<string, { first: string; sep: string; named: boolean }> = {
  "": { first: "", sep: ",", named: false },
  "+": { first: "", sep: ",", named: false },
  "#": { first: "#", sep: ",", named: false },
  ".": { first: ".", sep: ".", named: false },
  "/": { first: "/", sep: "/", named: false },
  ";": { first: ";", sep: ";", named: true },
  "?": { first: "?", sep: "&", named: true },
  "&": { first: "&", sep: "&", named: true },
};

/**
 * Expand a template that `parseTemplate` accepted, with scalar string
 * values. Values are used as given (the one defined value, "1", needs no
 * encoding). A variable missing from `values` is undefined and expands
 * to nothing, as the RFC prescribes.
 */
export function expandTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{([^}]*)\}/g, (_, body: string) => {
    const operator = LEVEL_OPERATORS.has(body[0]) ? body[0] : "";
    const rule = EXPANSION[operator];
    const parts: string[] = [];
    for (const varspec of (operator === "" ? body : body.slice(1)).split(",")) {
      const name = varnameOf(varspec);
      if (!(name in values)) continue;
      let value = values[name];
      const prefix = /:([1-9][0-9]{0,3})$/.exec(varspec);
      if (prefix !== null) value = value.slice(0, Number(prefix[1]));
      if (rule.named) {
        parts.push(operator === ";" && value === "" ? name : `${name}=${value}`);
      } else {
        parts.push(value);
      }
    }
    return parts.length === 0 ? "" : rule.first + parts.join(rule.sep);
  });
}

/** True when `value` is a full absolute URL with the scheme `https`. */
export function isAbsoluteHttpsUrl(value: unknown): boolean {
  return isFullAbsoluteUrl(value) && /^https:/i.test(value as string);
}

/** True when `value` is a full absolute URL with the scheme `http` or `https`. */
export function isAbsoluteHttpUrl(value: unknown): boolean {
  return isFullAbsoluteUrl(value) && /^https?:/i.test(value as string);
}

/**
 * The problem with an Offer's `checkoutPageURLTemplate`, if any: the
 * first of syntax, undefined variables, and the expansion with
 * `quantity` set to 1 not being an absolute https URL.
 */
export function checkoutTemplateProblem(value: unknown): TemplateProblem | null {
  if (typeof value !== "string") return { kind: "not-string" };
  const parsed = parseTemplate(value);
  if ("detail" in parsed) return { kind: "invalid", detail: parsed.detail };
  const undefinedVariables = parsed.variables.filter((v) => !DEFINED_VARIABLES.includes(v));
  if (undefinedVariables.length > 0) return { kind: "undefined-variables", variables: undefinedVariables };
  const expansion = expandTemplate(value, { quantity: "1" });
  return isAbsoluteHttpsUrl(expansion) ? null : { kind: "not-https", expansion };
}

/** Whether a region property is present and not empty or whitespace-only. */
export function declaresRegion(offer: Record<string, unknown>): boolean {
  return ["areaServed", "eligibleRegion"].some((key) => {
    const value = own(offer, key);
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    const obj = asObject(value);
    return obj !== null && Object.keys(obj).length > 0;
  });
}
