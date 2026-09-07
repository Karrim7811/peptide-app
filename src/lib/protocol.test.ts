import { describe, expect, it } from 'vitest'
import { NO_DOSE_LINE } from '@/lib/dosing'
import { DAYS, planDose, readPlan } from '@/lib/protocol'

describe('planDose', () => {
  // The load-bearing test. The prompt asks the model not to do this; this is
  // what happens when it does it anyway. The design handoff names BPC-157 in
  // the sample plan as exactly this case.
  it('replaces a number the model invented for a peptide with no published dose', () => {
    const dose = planDose({ peptide: 'BPC-157', dose: '250 mcg', time: 'Morning' })
    expect(dose?.amount).toBe(NO_DOSE_LINE)
    expect(dose?.isFigure).toBe(false)
    expect(dose?.source).toContain('nothing to cite')
    expect(dose?.wasOverridden).toBe(true)
  })

  it('does the same for every un-dosed peptide, not just the famous one', () => {
    for (const name of ['TB-500', 'Epitalon / Epithalon', 'MOTS-c', 'Selank']) {
      const dose = planDose({ peptide: name, dose: '500 mcg daily' })
      expect(dose?.amount, name).toBe(NO_DOSE_LINE)
      expect(dose?.isFigure, name).toBe(false)
    }
  })

  // A name this codebase cannot resolve is a name whose dosing status it
  // cannot vouch for.
  it('treats a peptide it cannot resolve as un-dosed rather than trusting the model', () => {
    const dose = planDose({ peptide: 'Zzzq-9', dose: '10 mg' })
    expect(dose?.amount).toBe(NO_DOSE_LINE)
    expect(dose?.source).toContain('not in the library')
    expect(dose?.wasOverridden).toBe(true)
  })

  it('keeps a real published figure and cites it from the catalogue', () => {
    const dose = planDose({ peptide: 'Semaglutide', dose: 'whatever the model said' })
    expect(dose?.isFigure).toBe(true)
    expect(dose?.amount).not.toBe(NO_DOSE_LINE)
    expect(dose?.amount).toMatch(/mg/)
    expect(dose?.source).toContain('FDA label')
    // The catalogue's figure, not the model's — even where a figure is allowed.
    expect(dose?.wasOverridden).toBe(true)
  })

  it('drops a row with no peptide name', () => {
    expect(planDose({ dose: '250 mcg' })).toBeNull()
    expect(planDose({ peptide: '  ' })).toBeNull()
    expect(planDose(null)).toBeNull()
    expect(planDose('BPC-157')).toBeNull()
  })

  it('says the time is unspecified rather than leaving it blank', () => {
    expect(planDose({ peptide: 'BPC-157' })?.time).toBe('Unspecified')
  })
})

describe('readPlan', () => {
  it('survives anything', () => {
    for (const junk of [null, undefined, 'plan', 42, [], { weeklySchedule: 'nope' }]) {
      const plan = readPlan(junk)
      expect(plan.week).toHaveLength(7)
      expect(plan.interactions).toEqual([])
      expect(plan.warnings).toEqual([])
    }
  })

  // A week with Thursday missing is a rendering bug that looks like a plan.
  it('always returns seven days in order, whatever the model sent', () => {
    const plan = readPlan({
      weeklySchedule: [
        { day: 'Friday', doses: [{ peptide: 'BPC-157', dose: '250 mcg' }] },
        { day: 'Monday', doses: [] },
      ],
    })
    expect(plan.week.map((day) => day.day)).toEqual([...DAYS])
    expect(plan.week.find((day) => day.day === 'Friday')?.doses).toHaveLength(1)
    expect(plan.week.find((day) => day.day === 'Sunday')?.doses).toHaveLength(0)
  })

  it('ignores a day that is not a day', () => {
    const plan = readPlan({ weeklySchedule: [{ day: 'Blursday', doses: [{ peptide: 'BPC-157' }] }] })
    expect(plan.week.every((day) => day.doses.length === 0)).toBe(true)
  })

  it('counts the amounts it had to remove, so the page can say so', () => {
    const plan = readPlan({
      weeklySchedule: [
        {
          day: 'Monday',
          doses: [
            { peptide: 'BPC-157', dose: '250 mcg' },
            { peptide: 'TB-500', dose: '2 mg' },
            { peptide: 'BPC-157' },
          ],
        },
      ],
    })
    expect(plan.overrides).toBe(2)
  })

  // Failing open on a safety label is the wrong direction to fail.
  it('downgrades an unrecognised interaction level to caution, never to safe', () => {
    const plan = readPlan({
      interactions: [
        { peptideA: 'A', peptideB: 'B', level: 'totally fine', note: 'n' },
        { peptideA: 'A', peptideB: 'B', level: 'safe', note: 'n' },
        { peptideA: 'A', peptideB: 'B', note: 'n' },
      ],
    })
    expect(plan.interactions.map((row) => row.level)).toEqual(['caution', 'safe', 'caution'])
  })

  it('drops an interaction missing either peptide or its note', () => {
    const plan = readPlan({
      interactions: [{ peptideA: 'A', level: 'safe', note: 'n' }, { peptideA: 'A', peptideB: 'B' }],
    })
    expect(plan.interactions).toEqual([])
  })

  it('keeps only warnings that are strings', () => {
    const plan = readPlan({ warnings: ['real', 42, null, '  ', 'also real'] })
    expect(plan.warnings).toEqual(['real', 'also real'])
  })
})
