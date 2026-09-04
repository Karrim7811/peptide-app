// The launch catalogue — seven SKUs, nine lots.
//
// Source of truth, in git so it is reviewable. supabase/shop_seed.sql is
// generated from this file; edit here, never there.
//
// NO REPORT CODES. A Janoshik code resolves to a public page naming the client,
// the manufacturer and a supplier-prefixed batch. Decision D3 in
// docs/superpowers/specs/2026-09-04-peptide-shop-design.md, and there is a test
// that fails if one appears here.

import type { ShopLot, ShopProduct } from '@/lib/shop/types'

export const PRODUCTS: ShopProduct[] = [
  {
    slug: 'glp-3-30mg',
    name: 'GLP-3 (Retatrutide)',
    compoundId: 'retatrutide',
    sizeValue: 30,
    sizeUnit: 'mg',
    priceCents: 12500,
    active: true,
    sortOrder: 1,
  },
  {
    slug: 'vip-5mg',
    name: 'VIP',
    compoundId: 'vip-vip',
    sizeValue: 5,
    sizeUnit: 'mg',
    priceCents: 3000,
    active: true,
    sortOrder: 2,
  },
  {
    slug: 'mots-c-10mg',
    name: 'MOTS-c',
    compoundId: 'mots-c',
    sizeValue: 10,
    sizeUnit: 'mg',
    priceCents: 3000,
    active: true,
    sortOrder: 3,
  },
  {
    slug: 'selank-5mg',
    name: 'Selank',
    compoundId: 'selank',
    sizeValue: 5,
    sizeUnit: 'mg',
    priceCents: 3000,
    active: true,
    sortOrder: 4,
  },
  {
    slug: 'semax-5mg',
    name: 'Semax',
    compoundId: 'semax',
    sizeValue: 5,
    sizeUnit: 'mg',
    priceCents: 3000,
    active: true,
    sortOrder: 5,
  },
  {
    // A blend, so no compoundId — it is four molecules, not one. blendOf points
    // at all four so the page can name what is in it.
    slug: 'klow-80mg',
    name: 'KLOW',
    compoundId: null,
    sizeValue: 80,
    sizeUnit: 'mg',
    priceCents: 10000,
    blendOf: ['ghk-cu-copper-peptide', 'bpc-157', 'tb-500', 'kpv'],
    active: true,
    sortOrder: 6,
  },
  {
    // NAD+ is a nucleotide coenzyme, not a peptide. It has a catalog entry, but
    // it sits outside the peptide framing the rest of the shop inherits.
    slug: 'nad-1000mg',
    name: 'NAD+',
    compoundId: 'nad',
    sizeValue: 1000,
    sizeUnit: 'mg',
    priceCents: 7500,
    active: true,
    sortOrder: 7,
  },
]

const COLD = 'USE WITHIN 28 DAYS · 2–8 °C'

/**
 * Placeholder. Karim has not set the real dates — spec §10 item 2. A date that
 * passes with nothing behind it is worse than no date at all, so this must be
 * replaced before the shop is public.
 */
const ASSAY_EXPECTED = '2026-10'

export const LOTS: ShopLot[] = [
  // GLP-3 — three consecutive batches, all 99.4%+. The launch's only track
  // record, and the strongest single asset on the site: anyone can post one
  // certificate, almost nobody can show a run of them.
  {
    productSlug: 'glp-3-30mg',
    lotCode: 'JA-102107',
    assayState: 'assayed',
    assayType: 'purity',
    purityPct: 99.62,
    labelMg: 30,
    measuredTotalMg: null,
    assayExpectedAt: null,
    mfg: '2026-01',
    exp: '2028-01',
    shelfLife: COLD,
    isCurrent: true,
  },
  {
    productSlug: 'glp-3-30mg',
    lotCode: 'JA-68243',
    assayState: 'assayed',
    assayType: 'purity',
    purityPct: 99.73,
    labelMg: 30,
    measuredTotalMg: null,
    assayExpectedAt: null,
    mfg: null,
    exp: null,
    shelfLife: COLD,
    isCurrent: false,
  },
  {
    productSlug: 'glp-3-30mg',
    lotCode: 'JA-63071',
    assayState: 'assayed',
    assayType: 'purity',
    purityPct: 99.46,
    labelMg: 30,
    measuredTotalMg: null,
    assayExpectedAt: null,
    mfg: null,
    exp: null,
    shelfLife: COLD,
    isCurrent: false,
  },

  {
    productSlug: 'mots-c-10mg',
    lotCode: 'JA-102111',
    assayState: 'assayed',
    assayType: 'purity',
    purityPct: 99.11,
    labelMg: 10,
    measuredTotalMg: null,
    assayExpectedAt: null,
    mfg: '2026-01',
    exp: '2028-01',
    shelfLife: COLD,
    isCurrent: true,
  },

  // KLOW — a composition assay, not a purity one, and it will never yield a
  // single percentage. Four measured actives totalling 90.65 mg against an
  // 80 mg label. Competitors sell "80 mg blend" and disclose no ratio at all.
  {
    productSlug: 'klow-80mg',
    lotCode: 'JA-102113',
    assayState: 'assayed',
    assayType: 'composition',
    purityPct: null,
    components: [
      { name: 'GHK-Cu', mg: 57.45 },
      { name: 'BPC-157', mg: 11.12 },
      { name: 'TB-500 (TB4)', mg: 10.88 },
      { name: 'KPV', mg: 11.2 },
    ],
    labelMg: 80,
    measuredTotalMg: 90.65,
    assayExpectedAt: null,
    mfg: '2026-01',
    exp: '2028-01',
    shelfLife: COLD,
    isCurrent: true,
  },

  // Pending — the vials are real, the assay is not back, and no lot code has
  // been recorded. lotCode stays null rather than inventing one: a fabricated
  // code on a physical batch is the exact thing this brand is positioned
  // against. It also means these four have no recall path until codes exist.
  {
    productSlug: 'vip-5mg',
    lotCode: null,
    assayState: 'pending',
    assayType: 'purity',
    purityPct: null,
    labelMg: 5,
    measuredTotalMg: null,
    assayExpectedAt: ASSAY_EXPECTED,
    mfg: null,
    exp: null,
    shelfLife: COLD,
    isCurrent: true,
  },
  {
    productSlug: 'selank-5mg',
    lotCode: null,
    assayState: 'pending',
    assayType: 'purity',
    purityPct: null,
    labelMg: 5,
    measuredTotalMg: null,
    assayExpectedAt: ASSAY_EXPECTED,
    mfg: null,
    exp: null,
    shelfLife: COLD,
    isCurrent: true,
  },
  {
    productSlug: 'semax-5mg',
    lotCode: null,
    assayState: 'pending',
    assayType: 'purity',
    purityPct: null,
    labelMg: 5,
    measuredTotalMg: null,
    assayExpectedAt: ASSAY_EXPECTED,
    mfg: null,
    exp: null,
    shelfLife: COLD,
    isCurrent: true,
  },
  {
    productSlug: 'nad-1000mg',
    lotCode: null,
    assayState: 'pending',
    assayType: 'purity',
    purityPct: null,
    labelMg: 1000,
    measuredTotalMg: null,
    assayExpectedAt: ASSAY_EXPECTED,
    mfg: null,
    exp: null,
    shelfLife: COLD,
    isCurrent: true,
  },
]

export function lotsFor(productSlug: string): ShopLot[] {
  return LOTS.filter((lot) => lot.productSlug === productSlug)
}

export function currentLot(productSlug: string): ShopLot | undefined {
  return lotsFor(productSlug).find((lot) => lot.isCurrent)
}

/**
 * Every assayed batch for a product, current first. Renders as the lot history —
 * and is deliberately empty rather than one-long for products with a single
 * batch, because an archive of one is not a record.
 */
export function assayHistory(productSlug: string): ShopLot[] {
  const assayed = lotsFor(productSlug).filter((lot) => lot.assayState === 'assayed')
  return assayed.length > 1 ? assayed : []
}
