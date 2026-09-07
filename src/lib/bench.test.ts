import { describe, expect, it } from 'vitest'
import { benchView } from '@/lib/bench'
import type { RawInventoryItem, RawStackItem } from '@/lib/bench'

const stackItem = (patch: Partial<RawStackItem> = {}): RawStackItem => ({
  id: 's1',
  name: 'BPC-157',
  compoundId: 'bpc-157',
  dose: null,
  unit: null,
  ...patch,
})

const vial = (patch: Partial<RawInventoryItem> = {}): RawInventoryItem => ({
  id: 'v1',
  name: 'BPC-157',
  compoundId: 'bpc-157',
  vialSizeMg: 5,
  quantityRemaining: 2,
  ...patch,
})

describe('tier', () => {
  const stack = [stackItem({ id: 'a' }), stackItem({ id: 'b' }), stackItem({ id: 'c' })]

  it('shows a free account one entry and says how many it is holding back', () => {
    const view = benchView(stack, [vial({ id: 'x' }), vial({ id: 'y' })], false)
    expect(view.rows).toHaveLength(1)
    expect(view.vials).toHaveLength(1)
    expect(view.hidden).toBe(2)
    expect(view.title).toBe('Your bench, one compound.')
  })

  it('shows a Pro account everything and hides nothing', () => {
    const view = benchView(stack, [vial()], true)
    expect(view.rows).toHaveLength(3)
    expect(view.hidden).toBe(0)
    expect(view.title).toBe('Your bench.')
  })

  it('never claims to be hiding something from an empty bench', () => {
    expect(benchView([], [], false).hidden).toBe(0)
    expect(benchView([], [], false).subtitle).toContain('Nothing on the bench yet')
  })
})

describe('what a row prints on the right', () => {
  it('prints the amount the person recorded, as they recorded it', () => {
    const [row] = benchView([stackItem({ dose: '250', unit: 'mcg' })], [], true).rows
    expect(row.right).toBe('250 mcg')
  })

  // The bench must not become a back door to a dose figure this app chose.
  it('falls back to the grade, never to a number, when no amount was recorded', () => {
    const [row] = benchView([stackItem()], [], true).rows
    expect(row.right).toContain('grade')
    expect(row.right).toContain('no published dose')
    expect(row.right).not.toMatch(/\d+\s*(mg|mcg)/)
  })

  it('says so plainly for an entry that is not in the library', () => {
    const [row] = benchView([stackItem({ compoundId: null, name: 'Zzzq-9' })], [], true).rows
    expect(row.right).toBe('no entry')
    expect(row.subtitle).toBe('Not in the library')
    expect(row.name).toBe('Zzzq-9')
  })

  it('marks a peptide that does have a published figure without printing one', () => {
    const [row] = benchView(
      [stackItem({ compoundId: 'semaglutide', name: 'Semaglutide' })],
      [],
      true,
    ).rows
    expect(row.right).toBe('grade A')
  })
})

describe('vial glyphs', () => {
  it('never leaves a caption blank', () => {
    for (const item of [
      vial(),
      vial({ quantityRemaining: 0 }),
      vial({ quantityRemaining: null }),
      vial({ quantityRemaining: null, vialSizeMg: null }),
    ]) {
      const [glyph] = benchView([], [item], true).vials
      expect(glyph.caption.trim()).not.toBe('')
    }
  })

  // Quantity counts vials; it is not a fill level. Interpolating one from the
  // other would draw a half-full vial from a number that never meant that.
  it('draws full or empty from a count, and nothing from an unknown', () => {
    expect(benchView([], [vial({ quantityRemaining: 2 })], true).vials[0].fill).toBe(100)
    expect(benchView([], [vial({ quantityRemaining: 0 })], true).vials[0].fill).toBe(0)
    expect(benchView([], [vial({ quantityRemaining: null })], true).vials[0].fill).toBeNull()
  })

  it('omits a size it does not have rather than printing zero', () => {
    expect(benchView([], [vial({ vialSizeMg: null })], true).vials[0].size).toBeNull()
    expect(benchView([], [vial({ vialSizeMg: 0 })], true).vials[0].size).toBeNull()
  })

  it('links a resolved vial to its library entry and an unresolved one to the library', () => {
    expect(benchView([], [vial()], true).vials[0].href).toBe('/reference/bpc-157')
    expect(benchView([], [vial({ compoundId: null })], true).vials[0].href).toBe('/reference')
  })
})
