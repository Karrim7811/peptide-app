import { describe, expect, it } from 'vitest'
import { COMPOUND_LIST } from '@/lib/catalog'
import {
  NO_DOSE_LINE,
  doseCounts,
  doseState,
  hasPublishedDose,
  noDoseContext,
} from '@/lib/dosing'

const at = (dosage: string) => ({ dosage })

describe('doseState', () => {
  it('reads an amount with a unit as a published figure', () => {
    expect(doseState(at('0.25 mg weekly titration up to 1.7–2.4 mg weekly (Wegovy)'))).toBe(
      'published',
    )
    expect(doseState(at('2.5 mg weekly start → 5 mg; max 15 mg weekly'))).toBe('published')
  })

  it('does not treat a pointer to a label as a published figure', () => {
    // This is the middle state, and folding it into "published" is what
    // produced the 51 and the 81 that have been in the docs.
    expect(doseState(at('Product-specific dosing (endocrinology)'))).toBe('labelOnly')
    expect(doseState(at('Labeled dosing varies by product PI'))).toBe('labelOnly')
    expect(doseState(at('Hospital protocols only'))).toBe('labelOnly')
    expect(doseState(at('Topical product-dependent'))).toBe('labelOnly')
  })

  it('reads every form of no-dose as no dose', () => {
    expect(doseState(at('N/A'))).toBe('none')
    expect(doseState(at('N/A (no established labeled dosing)'))).toBe('none')
    expect(doseState(at('No human dose established.'))).toBe('none')
    expect(doseState(at('No established dose. The formulation has never been studied.'))).toBe(
      'none',
    )
  })

  // The failure that produced the wrong counts, in both directions.
  it('is anchored: a disclaimer mid-entry does not un-dose a dosed entry', () => {
    expect(
      doseState(at('0.6 mg daily up to 3 mg daily. No pediatric dose has been established.')),
    ).toBe('published')
  })

  it('keeps a no-dose entry no-dose even when it cites preclinical figures', () => {
    expect(
      doseState(at('No human dose exists. Rodent work used 30–50 mg/kg twice daily.')),
    ).toBe('none')
  })
})

describe('noDoseContext', () => {
  it('returns the cited figures that follow the disclaimer', () => {
    expect(
      noDoseContext(at('No human dose exists. Rodent work used 30–50 mg/kg twice daily.')),
    ).toBe('Rodent work used 30–50 mg/kg twice daily.')
  })

  it('returns null when the entry stops at the disclaimer', () => {
    expect(noDoseContext(at('N/A'))).toBeNull()
    expect(noDoseContext(at('No established dose. It has never been studied.'))).toBeNull()
  })

  it('returns null for anything that does have a dose', () => {
    expect(noDoseContext(at('0.25 mg weekly'))).toBeNull()
  })
})

describe('the catalogue, counted live', () => {
  const counts = doseCounts()

  it('accounts for every entry exactly once', () => {
    expect(counts.published + counts.labelOnly + counts.none).toBe(counts.total)
    expect(counts.total).toBe(COMPOUND_LIST.length)
  })

  // These are the reconciled figures. They are asserted so that a catalogue edit
  // which moves an entry between states has to be acknowledged rather than
  // silently changing a number printed on the home page.
  it('splits 26 published · 25 label-only · 73 with no dose', () => {
    expect(counts).toEqual({ total: 124, published: 26, labelOnly: 25, none: 73 })
  })

  // The rule the whole product rests on: nothing without a published figure may
  // ever render a number as a dose.
  it('never lets a no-dose entry be treated as dosed', () => {
    for (const entry of COMPOUND_LIST) {
      if (doseState(entry) !== 'published') {
        expect(hasPublishedDose(entry), entry.id).toBe(false)
      }
    }
  })

  it('holds the one sentence an un-dosed entry may render', () => {
    expect(NO_DOSE_LINE).toBe('No human dose established.')
  })
})
