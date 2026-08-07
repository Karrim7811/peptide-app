// Pricing derivation. Everything on the card comes from two constants, so
// these tests exist to catch the two ways that goes wrong: a derived figure
// drifting from the constants, and the headline showing anything other than
// the amount actually charged.

import { describe, expect, it } from 'vitest'
import {
  ANNUAL_PRICE,
  MONTHLY_PRICE,
  TRIAL_DAYS,
  TRIAL_MONTHS,
  annualPerMonth,
  annualSaving,
  annualSavingPct,
  money,
  priceEquivalent,
  priceFootnote,
  priceLabel,
  priceUnit,
  saveLabel,
} from '@/lib/pricing'

describe('money', () => {
  it('drops a trailing .00 and keeps real cents', () => {
    expect(money(60)).toBe('$60')
    expect(money(9.99)).toBe('$9.99')
    expect(money(119.88)).toBe('$119.88')
  })
})

describe('derived figures', () => {
  it('annual divides to a clean monthly figure', () => {
    expect(annualPerMonth).toBeCloseTo(9.99, 2)
  })

  it('states the saving in money and percent consistently', () => {
    expect(annualSaving).toBeCloseTo(MONTHLY_PRICE * 12 - ANNUAL_PRICE, 2)
    expect(saveLabel).toBe(`SAVE ${money(annualSaving)}`)
    expect(annualSavingPct).toBe(
      Math.round((1 - ANNUAL_PRICE / (MONTHLY_PRICE * 12)) * 100),
    )
  })

  it('keeps the Stripe trial in step with the advertised one', () => {
    // The page promises "no card charged for a month"; TRIAL_DAYS is what
    // actually configures the subscription. If these drift, the promise breaks.
    expect(TRIAL_DAYS).toBe(TRIAL_MONTHS * 30)
  })
})

describe('the headline is always the amount charged', () => {
  // The annual card used to headline "$9.99 per month" while charging $119.88.
  // The number fell as the charge rose, and the real figure was the smallest
  // text on the card.
  it('shows the yearly price on annual, not the monthly equivalent', () => {
    expect(priceLabel('annual')).toBe(money(ANNUAL_PRICE))
    expect(priceLabel('annual')).not.toBe(money(annualPerMonth))
    expect(priceUnit('annual')).toBe('per year')
  })

  it('shows the monthly price on monthly', () => {
    expect(priceLabel('monthly')).toBe(money(MONTHLY_PRICE))
    expect(priceUnit('monthly')).toBe('per month')
  })

  it('restates the monthly equivalent on annual, and nothing on monthly', () => {
    expect(priceEquivalent('annual')).toContain(money(annualPerMonth))
    expect(priceEquivalent('monthly')).toBeNull()
  })
})

describe('the footnote discloses amount, frequency and cancellation', () => {
  // California's auto-renewal law wants all three visible before the Pay
  // click (CLAUDE.md §16.12).
  it.each(['monthly', 'annual'] as const)('for %s', (cycle) => {
    const note = priceFootnote(cycle)
    const amount = cycle === 'annual' ? money(ANNUAL_PRICE) : money(MONTHLY_PRICE)
    expect(note).toContain(amount)
    expect(note).toMatch(cycle === 'annual' ? /YEARLY/ : /MONTHLY/)
    expect(note).toContain('CANCEL ANY TIME')
  })

  it('leads with the trial while one exists', () => {
    expect(priceFootnote('annual')).toMatch(/^FREE FOR ONE MONTH/)
  })
})
