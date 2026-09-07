import { describe, expect, it } from 'vitest'
import { LEVELS, LEVEL_LABEL, LEVEL_NOTE, readInteraction } from '@/lib/interaction'

const ok = { level: 'safe', summary: 'Nothing reported.', details: 'd', recommendations: ['a'] }

describe('readInteraction', () => {
  it('keeps a well-formed answer', () => {
    const result = readInteraction(ok)
    expect(result?.level).toBe('safe')
    expect(result?.summary).toBe('Nothing reported.')
    expect(result?.recommendations).toEqual(['a'])
  })

  // The single most important line in this file. Defaulting a malformed
  // response to "safe" turns every parsing failure into a reassurance.
  it('turns an unrecognised level into unknown, never safe', () => {
    for (const level of ['fine', '', null, 42, 'SAFE', undefined]) {
      expect(readInteraction({ ...ok, level })?.level, String(level)).toBe('unknown')
    }
  })

  it('renders nothing at all when there is no summary to reason from', () => {
    expect(readInteraction({ ...ok, summary: '' })).toBeNull()
    expect(readInteraction({ ...ok, summary: '   ' })).toBeNull()
    expect(readInteraction({ level: 'danger' })).toBeNull()
  })

  it('survives anything that is not an object', () => {
    for (const junk of [null, undefined, 'safe', 42, []]) {
      expect(readInteraction(junk)).toBeNull()
    }
  })

  it('drops non-string recommendations rather than rendering them', () => {
    const result = readInteraction({ ...ok, recommendations: ['real', 42, null, '  ', 'also'] })
    expect(result?.recommendations).toEqual(['real', 'also'])
  })

  it('treats a missing details field as absent, not empty', () => {
    expect(readInteraction({ ...ok, details: undefined })?.details).toBeNull()
  })
})

describe('how a level is described', () => {
  it('has a label and a note for every level', () => {
    for (const level of LEVELS) {
      expect(LEVEL_LABEL[level].trim()).not.toBe('')
      expect(LEVEL_NOTE[level].trim()).not.toBe('')
    }
  })

  // "Safe" as a bare word is read as a clearance. It is not one.
  it('never lets safe or unknown read as a clearance', () => {
    expect(LEVEL_NOTE.safe).toContain('not the same as a study having looked')
    expect(LEVEL_NOTE.unknown).toContain('not evidence of safety')
  })
})
