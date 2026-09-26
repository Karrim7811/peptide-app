import { describe, expect, it } from 'vitest'
import { amountToMcg, fmtMcg, mcgPerUnit } from './mix'

describe('mix', () => {
  it('5 mg in 2 mL is 25 mcg per unit', () => {
    expect(mcgPerUnit(5, 2)).toBe(25)
  })

  it('20 units of 5 mg in 2 mL is 500 mcg', () => {
    expect(amountToMcg(20, 'units', 5, 2)).toBe(500)
  })

  it('mcg passes through without a mix', () => {
    expect(amountToMcg(250, 'mcg', 0, 0)).toBe(250)
  })

  it('units without a mix convert to nothing rather than a guess', () => {
    expect(amountToMcg(20, 'units', 5, 0)).toBe(0)
    expect(amountToMcg(20, 'units', 0, 2)).toBe(0)
  })

  it('formats', () => {
    expect(fmtMcg(1666.67)).toBe('1,667')
    expect(fmtMcg(2.345)).toBe('2.3')
  })
})
