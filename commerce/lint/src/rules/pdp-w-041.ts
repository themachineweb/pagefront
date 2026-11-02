import type { CheckHit, Rule } from "@pagefront/lint-core";
import { asObject, own } from "./configurator-pricing.js";
import { checkoutTemplateProblem, expandTemplate } from "./checkout-template.js";
import { hostOf, renderHost } from "./sheet-url-host.js";

/**
 * PDP-W-041 — Purchase URL off the canonical host.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * A purchase URL is an Offer's `url`, or its `checkoutPageURLTemplate`
 * expanded with `quantity` set to 1 ("Where to buy", "Purchase host").
 * Fires once for each whose host differs from the canonical host, the
 * host of the envelope `canonical_url`. A `url` with no host is
 * PDP-E-021's concern and a template that does not expand to an
 * absolute https URL is PDP-E-019's; both are skipped here. The seller
 * sheet's `pagefront:checkoutHosts`, which can declare the host, is out
 * of the linter's sight: it never fetches. Applies from release 0.6.0.
 */
export const pdpW041: Rule = {
  id: "PDP-W-041",
  title: "Purchase URL off the canonical host",
  severity: "warning",
  target: "$.data.offers[*]",
  check: (match, ctx) => {
    const offer = asObject(match.value);
    if (offer === null) return null;
    const canonicalHost = hostOf(ctx.sheet.canonical_url);
    const hits: CheckHit[] = [];
    const urlHost = hostOf(own(offer, "url"));
    if (urlHost !== null && urlHost !== canonicalHost) {
      hits.push({
        path: `${match.path}['url']`,
        values: { purchaseHost: urlHost, host: renderHost(canonicalHost) },
      });
    }
    const template = own(offer, "checkoutPageURLTemplate");
    if (typeof template === "string" && checkoutTemplateProblem(template) === null) {
      const templateHost = hostOf(expandTemplate(template, { quantity: "1" }));
      if (templateHost !== null && templateHost !== canonicalHost) {
        hits.push({
          path: `${match.path}['checkoutPageURLTemplate']`,
          values: { purchaseHost: templateHost, host: renderHost(canonicalHost) },
        });
      }
    }
    return hits.length > 0 ? hits : null;
  },
  messageTemplate: "Purchase URL at `{path}` is on host `{purchaseHost}`; the canonical page is on `{host}`.",
  remediation:
    "Move the purchase to the canonical host, or declare the host in `pagefront:checkoutHosts` on the seller's organization sheet.",
  introduced: "release 0.6.0",
  // The purchase-host rule is introduced by release 0.6.0 (Product Sheet spec 0.12.0).
  appliesFrom: "0.6.0",
  specReference: "product.md#where-to-buy",
};
