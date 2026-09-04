// VIALS is a hand-carried port of design/vial-labels/peptides.json — the same
// 27 batches the label generator prints artwork for. Nothing derives it at
// build time, so these tests are the only thing standing between a typo and a
// vial that points at a compound the catalog has never heard of.
//
// The invariants that matter: every id resolves, every batch is unique, and
// the report code still matches the slug the printed label was written to.

import { describe, expect, it } from 'vitest'
import {
  CATEGORY_BY_ID,
  COMPOUNDS,
  COMPOUND_LIST,
  COUNTS,
  VIALS,
  vialsFor,
} from '@/lib/catalog'
import { PEPTIDE_KNOWLEDGE } from '@/lib/peptide-knowledge'

describe('VIALS', () => {
  it('carries every label the generator prints', () => {
    expect(VIALS).toHaveLength(27)
  })

  // COUNTS is what the UI puts on screen. It is a hand-written literal, so it
  // can drift from the array it claims to count — this is the tripwire.
  it('agrees with the count the UI advertises', () => {
    expect(COUNTS.vials).toBe(VIALS.length)
  })

  it('resolves every compoundId against the catalog', () => {
    const unresolved = VIALS.filter(
      (vial) => vial.compoundId !== null && !COMPOUNDS[vial.compoundId],
    )
    expect(unresolved.map((vial) => vial.slug)).toEqual([])
  })

  it('resolves every blend component against the catalog', () => {
    const unresolved = VIALS.flatMap((vial) =>
      (vial.blendOf ?? []).filter((id) => !COMPOUNDS[id]).map((id) => `${vial.slug}:${id}`),
    )
    expect(unresolved).toEqual([])
  })

  it('gives blends components and a null compoundId, and never both', () => {
    for (const vial of VIALS) {
      if (vial.compoundId === null) {
        expect(vial.blendOf?.length, `${vial.slug} is unattributed`).toBeGreaterThan(0)
      } else {
        expect(vial.blendOf, `${vial.slug} is both a compound and a blend`).toBeUndefined()
      }
    }
  })

  it('keeps slugs and lots unique', () => {
    expect(new Set(VIALS.map((vial) => vial.slug)).size).toBe(VIALS.length)
    expect(new Set(VIALS.map((vial) => vial.lot)).size).toBe(VIALS.length)
  })

  // The slug-ends-in-its-report-code check moved to vial-reports.test.ts on
  // 2026-09-04, when reportCode left Vial for a server-only module. Vial no
  // longer knows its code, so this file can no longer make that assertion.

  it('states a positive quantity in a unit the app can read', () => {
    for (const vial of VIALS) {
      expect(vial.qty, vial.slug).toBeGreaterThan(0)
      expect(['mg', 'IU'], vial.slug).toContain(vial.unit)
    }
  })

  it('carries purity as a percentage or not at all', () => {
    for (const vial of VIALS) {
      if (vial.purity === null) continue
      expect(vial.purity, vial.slug).toBeGreaterThan(90)
      expect(vial.purity, vial.slug).toBeLessThanOrEqual(100)
    }
  })

  // Six batches ship without a purity figure — the two blends, which were never
  // assayed as a blend, and the four JA-2050xx vials the generator emitted
  // blank. That gap is real and carried through deliberately rather than
  // invented; if it closes at the source, this test is the thing to update.
  it('records the six batches with no assay', () => {
    const unassayed = VIALS.filter((vial) => vial.purity === null).map((vial) => vial.lot)
    expect(unassayed.sort()).toEqual([
      'JA-102113',
      'JA-205037',
      'JA-205038',
      'JA-205039',
      'JA-205040',
      'JA-70756',
    ])
  })

  // The same four JA-2050xx labels also went out with no dates. A vial with a
  // manufacture date and no expiry (or the reverse) would be a transcription
  // slip, so the two are asserted to travel together.
  it('dates a batch fully or not at all', () => {
    for (const vial of VIALS) {
      expect(vial.mfg === null, vial.slug).toBe(vial.exp === null)
      if (vial.mfg) expect(vial.mfg, vial.slug).toMatch(/^\d{4}-\d{2}$/)
      if (vial.exp) expect(vial.exp, vial.slug).toMatch(/^\d{4}-\d{2}$/)
    }
  })

  it('expires every dated batch after it was made', () => {
    for (const vial of VIALS) {
      if (!vial.mfg || !vial.exp) continue
      expect(vial.exp > vial.mfg, vial.slug).toBe(true)
    }
  })
})

describe('vialsFor', () => {
  it('finds the eight Retatrutide batches', () => {
    expect(vialsFor('retatrutide')).toHaveLength(8)
  })

  it('counts a blend under each of its components', () => {
    // GLOW is GHK-Cu + BPC-157 + TB-500, so it answers to all three without
    // being any of them.
    const held = vialsFor('tb-500')
    expect(held.some((vial) => vial.label === 'GLOW')).toBe(true)
    expect(held.every((vial) => vial.compoundId !== 'tb-500' || vial.blendOf === undefined)).toBe(
      true,
    )
  })

  it('returns nothing for a compound no vial covers', () => {
    expect(vialsFor('oxytocin')).toEqual([])
  })

  it('returns nothing for an id the catalog does not know', () => {
    expect(vialsFor('not-a-compound')).toEqual([])
  })
})

// The 32 compounds added since the original port differ from the 92 ported out
// of the master spreadsheet: their fields were researched against named trials
// and drug labels, and for most of them the honest finding was that no human dose
// exists. These tests exist to keep that honesty from eroding — the failure
// mode being guarded against is a future edit quietly replacing "no established
// dose" with a plausible-looking number extrapolated from animal data.

describe('researched compounds', () => {
  const researched = COMPOUND_LIST.filter((entry) => entry.sourced === 'researched')

  // 18 from Peptides.xlsx, then 14 the coverage audit found missing from both
  // datasets — the incretin pipeline and the rest of the Khavinson family.
  it('added all thirty-two', () => {
    expect(researched).toHaveLength(32)
  })

  it('counts them in the total the UI advertises', () => {
    expect(COMPOUND_LIST.length).toBe(COUNTS.compounds)
  })

  it('files each one in a real category', () => {
    for (const entry of researched) {
      expect(CATEGORY_BY_ID[entry.catId], entry.id).toBeDefined()
    }
  })

  it('fills every prose field', () => {
    const fields = ['name', 'fullName', 'purpose', 'action', 'effects', 'dosage',
      'cautions', 'interactions', 'bottomLine', 'cvNotes'] as const
    for (const entry of researched) {
      for (const field of fields) {
        expect(entry[field].trim(), `${entry.id}.${field}`).not.toBe('')
      }
    }
  })

  // The load-bearing one. Anything with no approval anywhere must say outright
  // that no dose is established, rather than printing a figure. Entries with a
  // real approval — FDA, or region-specific like tesofensine in Mexico — are
  // exempt because they have a genuine labelled dose to state.
  const APPROVED = [
    'FDA-approved Rx (labeled use)',
    'Region-specific approval (not US FDA)',
  ]
  it('states plainly when no human dose exists', () => {
    const unapproved = researched.filter((entry) => !APPROVED.includes(entry.evidence))
    expect(unapproved.length).toBeGreaterThan(0)
    for (const entry of unapproved) {
      expect(entry.dosage, `${entry.id} must disclaim an established dose`).toMatch(
        /\bno\b[^.]{0,45}\bdos(e|ing)\b/i,
      )
    }
  })

  it('leaves stacking empty rather than inventing it', () => {
    for (const entry of researched) {
      expect(entry.stacksWith, entry.id).toEqual([])
    }
  })

  it('keeps cv within the catalog’s 0-5 scale', () => {
    for (const entry of researched) {
      expect(entry.cv, entry.id).toBeGreaterThanOrEqual(0)
      expect(entry.cv, entry.id).toBeLessThanOrEqual(5)
    }
  })
})

// The app carries two peptide datasets and they feed different surfaces:
// catalog.ts drives the Mirror, peptide-knowledge.ts drives /reference,
// /regulatory, /stack-finder and all six AI routes. Nothing links them in
// code, so a peptide added to one is invisible on the other — which is exactly
// what happened when the 18 researched compounds landed in catalog.ts alone
// and the AI could not see them. These tests are the link.
describe('catalog and peptide-knowledge stay in step', () => {
  const catalogNames = new Set(COMPOUND_LIST.map((entry) => entry.fullName))
  const knowledgeNames = new Set(PEPTIDE_KNOWLEDGE.map((entry) => entry.name))

  it('holds the same number of peptides in both', () => {
    expect(PEPTIDE_KNOWLEDGE).toHaveLength(COMPOUND_LIST.length)
  })

  it('has no peptide the reference page and AI cannot see', () => {
    const missing = Array.from(catalogNames).filter((name) => !knowledgeNames.has(name))
    expect(missing).toEqual([])
  })

  it('has no peptide the Mirror cannot see', () => {
    const missing = Array.from(knowledgeNames).filter((name) => !catalogNames.has(name))
    expect(missing).toEqual([])
  })

  it('keeps the evidence level identical across both', () => {
    const byName = new Map(PEPTIDE_KNOWLEDGE.map((entry) => [entry.name, entry]))
    for (const entry of COMPOUND_LIST) {
      const twin = byName.get(entry.fullName)
      expect(twin?.evidenceLevel, entry.id).toBe(entry.evidence)
    }
  })
})
