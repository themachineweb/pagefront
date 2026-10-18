import type { Rule } from "@pagefront/lint-core";
import { asObject, own } from "./configurator-pricing.js";
import { checkoutTemplateProblem } from "./checkout-template.js";

/**
 * PDP-E-019 — Invalid checkout template.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * An Offer's `checkoutPageURLTemplate` must be a string, a valid RFC 6570
 * template, name no variable other than `quantity`, the one variable the
 * Product Sheet spec defines ("Where to buy"), and expand with `quantity`
 * set to 1 to an absolute https URL (an empty template fails). One
 * finding per Offer, the first of those checks in that order. Applies
 * from release 0.5.0, whose Product Sheet spec 0.11.0 introduces the
 * requirement.
 */
function listVariables(variables: string[]): string {
  const quoted = variables.map((v) => `\`${v}\``);
  if (quoted.length === 1) return `the variable ${quoted[0]}`;
  return `the variables ${quoted.slice(0, -1).join(", ")} and ${quoted[quoted.length - 1]}`;
}

export const pdpE019: Rule = {
  id: "PDP-E-019",
  title: "Invalid checkout template",
  severity: "error",
  target: "$.data.offers[*]",
  check: (match) => {
    const offer = asObject(match.value);
    if (offer === null || !Object.prototype.hasOwnProperty.call(offer, "checkoutPageURLTemplate")) return null;
    const problem = checkoutTemplateProblem(own(offer, "checkoutPageURLTemplate"));
    if (problem === null) return null;
    const text =
      problem.kind === "not-string"
        ? "is not a string"
        : problem.kind === "invalid"
          ? `is not a valid RFC 6570 template: ${problem.detail}`
          : problem.kind === "undefined-variables"
            ? `names ${listVariables(problem.variables)}, which Pagefront does not define; the one defined variable is \`quantity\``
            : problem.expansion === ""
              ? "is empty"
              : `expands with \`quantity\` set to 1 to \`${problem.expansion}\`, which is not an absolute https URL`;
    return { path: `${match.path}['checkoutPageURLTemplate']`, values: { problem: text } };
  },
  messageTemplate: "Checkout template at `{path}` {problem}.",
  remediation: "Use only `quantity` and write the template so that it expands to an absolute `https` URL, or remove the template.",
  introduced: "release 0.5.0",
  // The requirement is introduced by release 0.5.0 (Product Sheet spec 0.11.0).
  appliesFrom: "0.5.0",
  specReference: "product.md#where-to-buy",
};
