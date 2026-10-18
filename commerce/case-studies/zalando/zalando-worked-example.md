# Zalando / Friboo — Commerce Organization Sheet worked example (release 0.5.0; first worked at legacy format 0.9, sketch v0.1)
 
Second worked example, chosen to exercise everything the Nitto DTC case could not: the seller-only path, the multi-brand shared storefront, and the registration-identifier pattern outside France. Source page: the Friboo Stiefelette product (`zalando.de/friboo-stiefelette-taupe-f5713i0iv-n11.html`), plus live fetches of the Zalando Impressum, returns FAQ, and the Friboo brand page (2026-08-14). Companion files: `zalando-organization-v0_9.json` (seller sheet), `zalando-friboo-organization-v0_9.json` (brand sheet).
 
## Why this case
 
Zalando is the retailer shape: a multi-brand store that is the target of `Offer.seller` and never of `Product.brand`. And Friboo is a **Zalando private label** — so one entity (Zalando SE) is simultaneously the store and the owner of one of the brands it carries. That is precisely the multi-brand-shared-storefront configuration the sketch decided: **separate seller sheet; brand sheets stay brand-only.**
 
## The two-sheet pattern in practice
 
- **Seller sheet** (`zalando-organization-v0_9.json`): `@type: OnlineStore`, `commerceRole: ["seller"]`, no `brand` node. Carries the store-wide terms: 30-day free returns, free standard shipping ≥€34.90 else €4.90 (via `pagefront:fulfillmentTerms` + `appliesWhen`).
- **Brand sheet** (`zalando-friboo-organization-v0_9.json`): `commerceRole: ["brand_owner"]`, the Friboo `Brand` node nested, no seller content.
- **Same `Organization.@id`** (`https://www.zalando.de/#org`) in both — the sketch's identity-dedup rule for one company emitting several sheets, exercised for real.
The Friboo product page closes the graph: `Product.brand` → `…/friboo/#brand` (brand sheet), `Offer.seller` → `…/#org` (seller sheet). Same legal entity, two roles, two sheets, one identity.
 
## Findings
 
1. **The ISO 6523 machine key fails on its second-ever test.** Germany's Handelsregister has **no ISO 6523 ICD** — the Peppol ICD list has SIRENE (0002) for France but nothing for the German commercial register. "HRB 158855 B, Amtsgericht Charlottenburg" has no machine-key encoding under the dual pattern as decided. But Zalando SE has an **LEI** (`529900YRFFGH5AXU4S86`), and Schema.org has a native `leiCode` property. **The registration pattern must become a ladder**: `leiCode` when the entity has one → `iso6523Code` where the national register has an ICD → generic `identifier` display form always recommended alongside. The sketch's pattern (decided on the French case alone) needs this amendment; large entities will hit LEI first, small local ones iso6523 or display-only.
2. **Seller-only sheet works as specified.** `OnlineStore` subtype accepted, no `brand` node, role-scoped content only. The no-brand-enumeration rule holds without strain — nothing in the sheet wants to list Zalando's thousands of carried brands.
3. **A brand with no domain of its own.** Friboo has no website; its canonical presence is a brand page on the retailer's domain. `canonical_url` = the Zalando brand page, `Brand.@id` anchored on the retailer's domain (`…/friboo/#brand`). The sketch's assumption that a brand sheet lives at "the brand's own canonical_url" survives, but the URL is on the owner's storefront domain — worth one sentence in the spec acknowledging private labels as the normal case of this.
4. **Marketplace wrinkle observed, not modeled.** Zalando also hosts partner offers where the seller is a third party, not Zalando SE. The org sheets are unaffected (each partner would have its own seller sheet; `Offer.seller` per offer points wherever it truly points), but a Product Sheet for a marketplace listing must carry the *actual* seller per offer. No spec change needed — the existing `Offer.seller` edge already expresses it — but the case study set should eventually include a partner-sold product to prove it.
5. **`pagefront:fulfillmentTerms` holds at retailer scale.** Zalando's store-wide terms (threshold-conditional free shipping, flat standard rate) express in two entries with existing machinery. The conditional-free-threshold shape (`appliesWhen` + `minimumOrderValue`) recurs identically at Nitto (€200) and Zalando (€34.90) — the pattern generalizes.
## Suggested sketch edits
 
- Amend the registration-number pattern to the **identifier ladder**: `leiCode` → `iso6523Code` → display-form `identifier` (always recommended alongside whichever key is present). Note uneven ISO 6523 national-register coverage explicitly (France yes, Germany no).
- One sentence on private labels: a brand sheet's `canonical_url` may live on the owning retailer's domain when the brand has no site of its own; this is the normal private-label case, not an anomaly.

## `sameAs` / social split (2026-08-14)

With the in-cut `sameAs` tightening (authority records only) and `pagefront:socialAccount`, the seller sheet keeps its Wikidata record (Q136570) and corporate.zalando.com in `sameAs` and gains four `pagefront:socialAccount` entries — Instagram, Facebook, Pinterest, TikTok — each verified as linked from zalando.de's own homepage. The Friboo brand sheet is unchanged: no Friboo-specific handles are linked from the storefront, and omission is conformant.

## Store locations — outlet grounding considered and declined (2026-09-02)

With the "Store locations" section landing on the Organization Sheet (Schema.org-native `location` for the seller's own stores), Zalando was the natural corpus candidate: Zalando operates physical outlet stores in German cities, with published addresses and opening hours. Checked live (2026-09-02) and **declined**, and the reason is the section's own boundary:

- The outlet stores are published on `zalando-outlet.de`, whose Impressum names **ZALANDO OUTLETS GmbH** (HRB 153374 B, AG Charlottenburg) — with a second entity, Zalando Stores Experiences & Clearance Solutions GmbH & Co. KG, alongside — not Zalando SE. The seller sheet in this corpus is **Zalando SE** (`zalando.de`, `@id …/#org`).
- `location` is self-description: the seller's statement about *its own* stores, publisher-stated from the retailer's own store-locator pages. A store list published by a different legal entity on a different domain fails both halves. The addresses are real and extractable (e.g. Tauentzienstraße 18, 10789 Berlin, hours 10:00–20:00), but they ground a hypothetical ZALANDO OUTLETS organization sheet, not this one.
- `zalando.de` itself answers 403 to non-browser fetches, so no locator published under Zalando SE's own domain could be verified either way. Absence of `location` on the seller sheet is conformant — no rule warns on it.

Net: the corpus stays unchanged, and the exercise validated the section's boundary rather than exercising its field — the entity behind a store list matters, exactly as the entity behind a reseller list does in `pagefront:authorizedResellers`.
