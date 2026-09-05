// The view model is where the shop's rules become renderable, so it is where
// they are worth testing. A component can be restyled freely; if these hold, the
// restyle cannot quietly break a rule.

import { describe, expect, it } from 'vitest'
import { historyRows, mg, monthName, pct, productView, shopCard, shopCards } from '@/lib/shop/view'
import { PRODUCTS } from '@/lib/shop/catalogue'

const card = (slug: string) => shopCards().find((c) => c.slug === slug)!

describe('formatters', () => {
  it('drops trailing zeros from a measured figure', () => {
    expect(mg(11.2)).toBe('11.2')
    expect(mg(11.0)).toBe('11')
    expect(mg(90.65)).toBe('90.65')
  })

  it('returns null rather than a placeholder for an absent figure', () => {
    expect(mg(null)).toBeNull()
    expect(pct(null)).toBeNull()
    expect(monthName(null)).toBeNull()
    expect(monthName('nonsense')).toBeNull()
  })

  it('keeps three decimals of purity, because the lab reported three', () => {
    expect(pct(99.623)).toBe('99.623%')
    expect(pct(99.11)).toBe('99.11%')
  })

  it('names a month', () => {
    expect(monthName('2026-10')).toBe('October 2026')
  })
})

describe('the catalogue', () => {
  it('returns the seven active products in sortOrder', () => {
    expect(shopCards().map((c) => c.slug)).toEqual([
      'glp-3-30mg', 'vip-5mg', 'mots-c-10mg', 'selank-5mg',
      'semax-5mg', 'klow-80mg', 'nad-1000mg',
    ])
  })

  it('numbers the cards from 01', () => {
    expect(shopCards().map((c) => c.index)).toEqual(['01','02','03','04','05','06','07'])
  })

  // There is deliberately no way to reorder by price. If a comparator argument
  // ever appears here, it is the "best value" badge arriving by the back door.
  it('exposes no way to sort by price or unit price', () => {
    expect(shopCards.length).toBe(0) // arity: takes no arguments
  })
})

describe('the rules a restyle must not break', () => {
  it('gives a blend no unit price, and a reason instead', () => {
    const klow = card('klow-80mg')
    expect(klow.unitPrice).toBeNull()
    expect(klow.unitPriceNote).toBe('no per-mg · blend')
  })

  it('gives every single compound a unit price and no note', () => {
    for (const c of shopCards().filter((c) => !c.isBlend)) {
      expect(c.unitPrice, c.slug).toBeTruthy()
      expect(c.unitPriceNote, c.slug).toBeNull()
    }
  })

  it('publishes no purity figure for a pending product', () => {
    for (const c of shopCards().filter((c) => c.state === 'pending')) {
      expect(c.purity, c.slug).toBeNull()
      expect(c.measured, c.slug).toBeNull()
    }
  })

  it('gives every pending product the month it is waiting for', () => {
    for (const c of shopCards().filter((c) => c.state === 'pending')) {
      expect(c.expected, c.slug).toMatch(/^[A-Z][a-z]+ \d{4}$/)
    }
  })

  // Null, never '—' or 'N/A' or ''. The component decides how to render an
  // absence; the model must not decide for it by supplying a dash.
  it('uses null for an absent lot code rather than a dash', () => {
    const pendingLots = shopCards().filter((c) => c.state === 'pending').map((c) => c.lot)
    expect(pendingLots.every((l) => l === null)).toBe(true)
  })
})

describe('the assayed products', () => {
  it('carries GLP-3 with its exact reported figures', () => {
    const glp3 = card('glp-3-30mg')
    expect(glp3.name).toBe('GLP-3')
    expect(glp3.subtitle).toBe('Retatrutide')
    expect(glp3.purity).toBe('99.623%')
    expect(glp3.measured).toBe('35.95')
    expect(glp3.labelled).toBe('30')
    expect(glp3.unitPrice).toBe('$4.17 / mg')
    expect(glp3.lot).toBe('JA-102107')
  })

  it('carries KLOW as four measured components, not a percentage', () => {
    const klow = card('klow-80mg')
    expect(klow.isBlend).toBe(true)
    expect(klow.purity).toBeNull()
    expect(klow.components.map((c) => c.name)).toEqual([
      'GHK-Cu', 'BPC-157', 'TB-500 (TB4)', 'KPV',
    ])
    expect(klow.measured).toBe('90.65')
    expect(klow.labelled).toBe('80')
  })
})

describe('lot history', () => {
  it('gives GLP-3 three rows, current first', () => {
    const rows = historyRows('glp-3-30mg')
    expect(rows.map((r) => r.lot)).toEqual(['JA-102107', 'JA-68243', 'JA-63071'])
    expect(rows.map((r) => r.purity)).toEqual(['99.623%', '99.736%', '99.466%'])
    expect(rows[0].isCurrent).toBe(true)
  })

  it('is empty for a product with one batch — an archive of one is not a record', () => {
    expect(historyRows('mots-c-10mg')).toEqual([])
    expect(historyRows('klow-80mg')).toEqual([])
  })
})

describe('the product view', () => {
  it('returns null for an unknown slug', () => {
    expect(productView('not-a-product')).toBeNull()
  })

  it('names the blend components and what each is for', () => {
    const klow = productView('klow-80mg')!
    expect(klow.blendParts).toHaveLength(4)
    expect(klow.blendParts.every((p) => p.name && p.purpose)).toBe(true)
  })

  it('says so where an entry is not actually a peptide', () => {
    expect(productView('nad-1000mg')!.notAPeptide).toBe('a dinucleotide coenzyme')
    expect(productView('glp-3-30mg')!.notAPeptide).toBeNull()
  })

  it('covers every product without throwing', () => {
    for (const p of PRODUCTS) expect(productView(p.slug), p.slug).not.toBeNull()
  })
})
