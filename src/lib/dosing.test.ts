import { describe, expect, it } from 'vitest'
import { COMPOUND_LIST } from '@/lib/catalog'
import {
  NO_DOSE_LINE,
  doseCounts,
  doseSource,
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

describe('doseSource', () => {
  const entry = (patch: Record<string, string>) => ({
    dosage: '', fullName: '', name: 'X', grade: 'D', ...patch,
  })

  it('says there is nothing to cite for a no-dose entry', () => {
    const source = doseSource(entry({ dosage: 'N/A' }))
    expect(source.kind).toBe('Nothing to cite')
    expect(source.ref).toBe('research-tier · no approval')
  })

  it('names the FDA label for a grade A entry and prefers the named brand', () => {
    const source = doseSource(
      entry({ dosage: '0.25 mg weekly up to 2.4 mg weekly (Wegovy)', grade: 'A', name: 'Semaglutide' }),
    )
    expect(source.kind).toBe('FDA label')
    expect(source.ref).toBe('Wegovy')
  })

  it('falls back to the entry name when nothing is parenthesised', () => {
    const source = doseSource(entry({ dosage: '1.4 mg SC once daily', grade: 'A', name: 'Tesamorelin' }))
    expect(source.ref).toBe('Tesamorelin')
  })

  it('points at the prescribing information rather than inventing a figure', () => {
    expect(doseSource(entry({ dosage: 'Product-specific dosing (endocrinology)' })).kind).toBe('PI')
    expect(doseSource(entry({ dosage: 'Hospital protocols only' })).kind).toBe('PI')
  })

  it('calls a regional approval regional, not FDA', () => {
    expect(doseSource(entry({ dosage: '0.5 mg daily', grade: 'B' })).kind).toBe('Regional label')
  })

  // Every row on the dosing reference prints one of these. A blank would read
  // as missing data when the absence is itself the finding.
  it('never returns an empty kind or ref for any entry in the catalogue', () => {
    for (const compound of COMPOUND_LIST) {
      const source = doseSource(compound)
      expect(source.kind.trim(), compound.id).not.toBe('')
      expect(source.ref.trim(), compound.id).not.toBe('')
    }
  })

  it('only ever cites a real source for an entry that has a figure', () => {
    for (const compound of COMPOUND_LIST) {
      if (doseState(compound) !== 'none') continue
      expect(doseSource(compound).kind, compound.id).toBe('Nothing to cite')
    }
  })
})
