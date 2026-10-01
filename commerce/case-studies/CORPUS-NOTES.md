# What the case studies taught the specification

Notes for contributors: the format decisions each worked example forced.
The case studies themselves are written for merchants and implementers and
do not carry this history.

## Nitto Knitwear (apparel)

1. **Manufacturing chain.** Yarn spun in one place, knitted in another,
   assembled in a third: a single country of origin could not carry it.
   `pagefront:manufacturingChain`.
2. **Typed size charts.** Named measurements, size columns, unit code and
   model references: `pagefront:sizeChart`.
3. **Conditional shipping.** Free over a threshold, tiered below:
   `pagefront:appliesWhen` on `OfferShippingDetails`.
4. **Certification scope.** OEKO-TEX on the yarn is not OEKO-TEX on the
   garment: the `scope` property value on certifications.
5. **Construction.** Stitch, gauge, machine and notes:
   `pagefront:construction`.
6. **Organization sheet patterns.** The first organization sheet exercised
   `pagefront:fulfillmentTerms`, the registration ladder with `iso6523Code`
   as the machine key, the no-`sameAs` case, and the split of social
   accounts out of `sameAs`.
7. **Authorized resellers.** The brand's own stockist list was 113 shops
   with addresses and no websites; the inline reseller shape was relaxed to
   `name` plus `url` and/or `address`.
8. **Return-policy placement.** The product-else-seller resolution for
   store-wide terms was worked out here.
9. **Sizes as variants.** Deferred through four format versions, decided
   on 2026-09-04: a size-varying `ProductGroup` nested in a page-level
   family.

## Kimaï (jewellery, made to order)

1. **Configurators.** `pagefront:configurator` with dimensions, options and
   price modifiers.
2. **Made-to-order economics.** `pagefront:madeToOrderTerms`: lead time as
   duration, cancellation, return exceptions, after-sales services.
3. **Material with provenance.** `pagefront:materialComposition`,
   generalised from the textile-only field.
4. **Gemstone grading.** `pagefront:gemstone`.
5. **Promotion scope.** The `scope` requirement on `pagefront:promotions`.
6. **Complementary pairing.** The matching-bands carousel as the worked
   example of `recommended_with`.
7. **The registration ladder's last rung.** No LEI and no ISO 6523 code
   for Companies House: display-form identifier alone.
8. **Shape as page boundary.** Diamond shape is both a configurator-style
   choice and a set of sibling pages; modeled in `isVariantOf`, the general
   question still open in the spec.
9. **Language-scoped sheets in practice.** The same product in four
   editions across three currencies; one edition per sheet. Since
   2026-10-01 each market's price list is its own sheet: the French list
   is not a conversion of the UK one.
10. **Configurator pricing in the offer.** The sheet carried the diamond's
    price as the configurator's base price while the store sold the ring
    as diamond plus band. `pagefront:configuratorPricing` on the offer: a
    named base configuration, its total, a modifier per priced option.
11. **Option identifiers, services and free text.** The first re-derivation
    used the store's labels as option values and listed the ring sizer as
    a size. Option values became identifiers, order-time services left
    `options`, and `inputType: "text"` covers the engraving field.

## AFS (sports equipment, multi-SKU)

1. **Feature groups with raw values.** Flat property rows with units in
   their names became `pagefront:featureGroup` with numeric values,
   UN/CEFACT units and display strings.
2. **Same-document identifiers.** Full-URL fragment `@id`s on variants and
   offers, and reference form versus inline declaration, drove the linter's
   hardening passes.
3. **Per-variant URL honesty.** PDP-W-014 distinguishes "no addresses
   declared" from "no addresses exist"; this merchant is its standing
   example of the second.
4. **Publisher-stated only, against the registry.** Foil And Co has an LEI
   in the public register and states it nowhere; the sheet withholds it.
5. **Brand and company on one sheet.** The first organization sheet where
   brand and legal name differ; the organization identity is minted on the
   company's own domain so a second brand's sheet can share it.
6. **Store-wide strips versus legal terms.** A product page's "free
   returns" and "2-year warranty" strips carried on the offers as
   product-level statements, the legal terms on the seller sheet.
7. **Tax basis.** The shop's API returns net prices and the page shows
   gross ones. The displayed-consumer-price meaning of `price`, and
   `valueAddedTaxIncluded` on every offer.
