import { describe, expect, it } from 'vitest'
import { COMPOUND_LIST } from '@/lib/catalog'
import { NO_DOSE_LINE, doseState } from '@/lib/dosing'
import { categoryChips, compoundView, searchLibrary } from '@/lib/library'

describe('searchLibrary', () => {
  it('returns the whole library for an empty query', () => {
    expect(searchLibrary('')).toHaveLength(COMPOUND_LIST.length)
  })

  it('matches on name regardless of case', () => {
    const hits = searchLibrary('semaglutide')
    expect(hits.length).toBeGreaterThan(0)
    expect(searchLibrary('SEMAGLUTIDE').length).toBe(hits.length)
  })

  // People arrive with a symptom, not a molecule.
  it('matches on what an entry is for, not only what it is called', () => {
    expect(searchLibrary('sleep').length).toBeGreaterThan(0)
  })

  it('narrows to a category and stays within it', () => {
    const chips = categoryChips()
    const metabolic = chips.find((chip) => chip.id === 'metabolic')
    if (!metabolic) return
    const rows = searchLibrary('', metabolic.id)
    expect(rows).toHaveLength(metabolic.n)
  })

  it('returns nothing rather than everything for a miss', () => {
    expect(searchLibrary('zzzznotathing')).toHaveLength(0)
  })
})

describe('categoryChips', () => {
  const chips = categoryChips()

  it('leads with All, counting the whole library', () => {
    expect(chips[0].id).toBeNull()
    expect(chips[0].n).toBe(COMPOUND_LIST.length)
  })

  it('accounts for every entry across the categories', () => {
    const total = chips.slice(1).reduce((sum, chip) => sum + chip.n, 0)
    expect(total).toBe(COMPOUND_LIST.length)
  })
})

describe('compoundView', () => {
  it('returns null for an id that is not in the library', () => {
    expect(compoundView('not-a-real-compound')).toBeNull()
  })

  // The rule the whole product rests on.
  it('prints the no-dose line for every entry without a published figure', () => {
    for (const entry of COMPOUND_LIST) {
      if (doseState(entry) === 'published') continue
      const view = compoundView(entry.id)
      const dosing = view?.facts.find((fact) => fact.label === 'Dosing')
      expect(dosing?.value, entry.id).toBe(NO_DOSE_LINE)
    }
  })

  it('never renders a dash, an N/A or an empty dosing field', () => {
    for (const entry of COMPOUND_LIST) {
      const dosing = compoundView(entry.id)?.facts.find((fact) => fact.label === 'Dosing')
      expect(dosing?.value.trim(), entry.id).not.toBe('')
      expect(dosing?.value, entry.id).not.toMatch(/^\s*(?:—|-|N\/A)\s*$/i)
    }
  })

  it('keeps the real published figure where there is one', () => {
    const semaglutide = COMPOUND_LIST.find((entry) => doseState(entry) === 'published')
    expect(semaglutide).toBeDefined()
    const dosing = compoundView(semaglutide!.id)?.facts.find((f) => f.label === 'Dosing')
    expect(dosing?.value).toBe(semaglutide!.dosage)
  })

  it('fills the CV dots up to the score and no further', () => {
    for (const entry of COMPOUND_LIST.slice(0, 20)) {
      const view = compoundView(entry.id)!
      expect(view.cvDots).toHaveLength(5)
      expect(view.cvDots.filter(Boolean)).toHaveLength(Math.min(entry.cv, 5))
    }
  })

  it('says which entries are not peptides, and says nothing for the rest', () => {
    expect(compoundView('nad')?.notPeptideLine).toContain('Not a peptide')
    const peptide = COMPOUND_LIST.find((entry) => entry.id === 'bpc-157')
    if (peptide) expect(compoundView(peptide.id)?.notPeptideLine).toBeNull()
  })

  it('prints a batch with no purity as a state, never as a gap', () => {
    const withBatches = COMPOUND_LIST.map((e) => compoundView(e.id)!).filter(
      (view) => view.batches.length > 0,
    )
    expect(withBatches.length).toBeGreaterThan(0)
    for (const view of withBatches) {
      for (const batch of view.batches) {
        expect(batch.purity.trim()).not.toBe('')
        if (!batch.hasPurity) expect(batch.purity).toBe('no purity figure')
        else expect(batch.purity).toMatch(/^\d+\.\d{2}%$/)
      }
      // An undated batch says so rather than trailing a bare separator.
      for (const batch of view.batches) expect(batch.lot).not.toMatch(/·\s*$/)
    }
  })

  it('links to the shop only where the same thing is actually sold', () => {
    expect(compoundView('retatrutide')?.shopHref ?? compoundView('nad')?.shopHref).toBeTruthy()
    const unsold = COMPOUND_LIST.find((entry) => !compoundView(entry.id)?.shopHref)
    expect(unsold).toBeDefined()
  })
})
