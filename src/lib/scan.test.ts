import { describe, expect, it } from 'vitest'
import { amountNote, libraryNote, nearestNames, parseMg, readingsFrom } from '@/lib/scan'

describe('parseMg', () => {
  it('reads the forms a label actually prints', () => {
    expect(parseMg('5mg')).toBe(5)
    expect(parseMg('10 mg')).toBe(10)
    expect(parseMg('  2.5 MG ')).toBe(2.5)
    expect(parseMg('30mg per vial')).toBe(30)
  })

  it('converts micrograms and grams to milligrams', () => {
    expect(parseMg('1000 mcg')).toBe(1)
    expect(parseMg('500µg')).toBe(0.5)
    expect(parseMg('1 g')).toBe(1000)
  })

  it('accepts a comma decimal, which European labels use', () => {
    expect(parseMg('2,5 mg')).toBe(2.5)
  })

  // Potency per IU is compound-specific. Converting would be inventing.
  it('refuses an IU vial rather than converting it', () => {
    expect(parseMg('100 IU')).toBeNull()
  })

  it('returns null rather than zero for anything unparseable', () => {
    expect(parseMg('')).toBeNull()
    expect(parseMg('one vial')).toBeNull()
    expect(parseMg('0 mg')).toBeNull()
    expect(parseMg('mg')).toBeNull()
  })
})

describe('readingsFrom', () => {
  it('survives anything that is not an array', () => {
    expect(readingsFrom(null)).toEqual([])
    expect(readingsFrom('[]')).toEqual([])
    expect(readingsFrom({ vials: [] })).toEqual([])
    expect(readingsFrom(undefined)).toEqual([])
  })

  it('drops a nameless row, which is noise rather than a vial', () => {
    expect(readingsFrom([{ amount: '5mg' }, { name: '   ' }])).toHaveLength(0)
  })

  it('ignores non-string fields instead of rendering them', () => {
    const [reading] = readingsFrom([{ name: 'BPC-157', amount: 5, notes: { a: 1 } }])
    expect(reading.readAmount).toBeNull()
    expect(reading.notes).toBeNull()
  })

  it('resolves a name that is in the library', () => {
    const [reading] = readingsFrom([{ name: 'BPC-157', amount: '5mg' }])
    expect(reading.compoundId).toBe('bpc-157')
    expect(reading.compoundName).toBe('BPC-157')
    expect(reading.mg).toBe(5)
  })

  // A scanner that silently drops half a shelf is worse than one that admits it
  // could not place a name.
  it('keeps a reading it cannot resolve rather than discarding the photo', () => {
    const [reading] = readingsFrom([{ name: 'Zzzq-9', amount: '5mg' }])
    expect(reading.compoundId).toBeNull()
    expect(reading.readName).toBe('Zzzq-9')
    expect(reading.mg).toBe(5)
  })
})

describe('the notes a row always carries', () => {
  it('never leaves the library column blank', () => {
    const [matched] = readingsFrom([{ name: 'BPC-157', amount: '5mg' }])
    const [unmatched] = readingsFrom([{ name: 'Zzzq-9', amount: '5mg' }])
    expect(libraryNote(matched)).toBe('BPC-157')
    expect(libraryNote(unmatched)).toContain('Not matched')
  })

  it('never leaves the amount column blank, and never prints a figure it did not read', () => {
    const [mg] = readingsFrom([{ name: 'BPC-157', amount: '5mg' }])
    const [iu] = readingsFrom([{ name: 'BPC-157', amount: '100 IU' }])
    const [none] = readingsFrom([{ name: 'BPC-157' }])

    expect(amountNote(mg)).toBe('5 mg')
    expect(amountNote(iu)).toContain('not in milligrams')
    expect(amountNote(none)).toBe('No amount read')
    // The unparsed ones must not have acquired a number.
    expect(iu.mg).toBeNull()
    expect(none.mg).toBeNull()
  })
})

describe('nearestNames', () => {
  it('offers corrections for a near miss', () => {
    expect(nearestNames('BPC157').length).toBeGreaterThan(0)
  })

  it('offers nothing for an empty name', () => {
    expect(nearestNames('')).toEqual([])
  })
})
