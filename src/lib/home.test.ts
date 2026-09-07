import { describe, expect, it } from 'vitest'
import { VIALS } from '@/lib/catalog'
import { libraryFigures, shopLine, vialTally } from '@/lib/home'
import { historyRows } from '@/lib/shop/view'

describe('vialTally', () => {
  const tally = vialTally()

  it('accounts for every vial across the assayed and unassayed rows', () => {
    const withFigure = Number(tally.rows[1].n)
    const without = Number(tally.rows[2].n)
    expect(withFigure + without).toBe(VIALS.length)
    expect(tally.rows[0].n).toBe(String(VIALS.length))
  })

  // The second number is what makes the first one honest. If a future edit drops
  // the "print no purity" row, the grid becomes a boast.
  it('publishes the count of batches with no purity figure', () => {
    expect(tally.rows[2].label).toContain('no purity')
    expect(Number(tally.rows[2].n)).toBeGreaterThan(0)
  })

  it('states the purity range across the assayed batches', () => {
    expect(tally.note).toMatch(/runs 9\d\.\d\d–9\d\.\d\d%/)
  })
})

describe('libraryFigures', () => {
  const figures = libraryFigures()

  it('reports the live catalogue size', () => {
    expect(figures.compounds).toBe(124)
    expect(figures.categories).toBe(12)
  })

  // The home page prints noDose. It must be the reconciled figure, and it must
  // never silently become the count of entries carrying an actual amount.
  it('keeps the no-dose count separate from the published-figure count', () => {
    expect(figures.noDose).toBe(73)
    expect(figures.published).toBe(26)
    expect(figures.noDose).not.toBe(figures.published)
  })
})

// The home page states, in prose, that the GLP-3 ledger spans nine months and
// that every batch is above 99.4%. That is a claim about data, not a slogan, and
// a fourth batch assayed at 99.3% would make the page a liar without anything
// failing. This is the guard.
describe('the ledger claim on the home page', () => {
  const rows = historyRows('glp-3-30mg')

  it('has batches to show', () => {
    expect(rows.length).toBeGreaterThan(1)
  })

  it('is still true that every batch is above 99.4%', () => {
    for (const row of rows) {
      const purity = Number((row.purity ?? '').replace('%', ''))
      expect(purity, `${row.lot} is below the 99.4% the home page claims`).toBeGreaterThan(99.4)
    }
  })

  it('is still true that the run spans nine months', () => {
    const months = rows
      .map((row) => row.mfg)
      .filter((month): month is string => Boolean(month))
      .sort()
    const [first, last] = [months[0], months[months.length - 1]]
    const span =
      (Number(last.slice(0, 4)) - Number(first.slice(0, 4))) * 12 +
      (Number(last.slice(5, 7)) - Number(first.slice(5, 7)))
    expect(span, 'the home page says nine months of consecutive batches').toBe(9)
  })
})

describe('shopLine', () => {
  it('states how many of the seven are assayed and how many are pending', () => {
    expect(shopLine()).toBe('3 of 7 assayed · 4 pending, stated on the card')
  })
})
