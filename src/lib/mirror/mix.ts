// The chemistry of a reconstituted vial — what the add form converts with.
//
// Solution chemistry only (CLAUDE.md §16.9): how much peptide is in each unit
// of the syringe for a given vial and water volume. It never proposes an
// amount to take. The water choices are named by what they do to measuring,
// not by experience level — "advanced" would imply taking more.

/** U-100 insulin syringe: 100 units per mL. */
export const UNITS_PER_ML = 100

export const VIAL_SIZES_MG = [5, 10] as const

export const WATER_CHOICES: ReadonlyArray<{ ml: number; label: string }> = [
  { ml: 1, label: 'Most concentrated' },
  { ml: 2, label: 'Most common' },
  { ml: 3, label: 'Finest measuring' },
]

export const DEFAULT_WATER_ML = 2

export type Measure = 'units' | 'mcg'

/** mcg of peptide in one syringe unit. 0 when either input is missing. */
export function mcgPerUnit(vialMg: number, waterMl: number): number {
  if (!(vialMg > 0) || !(waterMl > 0)) return 0
  return (vialMg * 1000) / waterMl / UNITS_PER_ML
}

/** The amount taken, in mcg. Units need the mix; mcg passes through. */
export function amountToMcg(amount: number, measure: Measure, vialMg: number, waterMl: number): number {
  if (!(amount > 0)) return 0
  if (measure === 'mcg') return amount
  return amount * mcgPerUnit(vialMg, waterMl)
}

/** Rounded for display: whole mcg above 10, one decimal below. */
export function fmtMcg(mcg: number): string {
  if (mcg >= 10) return Math.round(mcg).toLocaleString('en-US')
  return (Math.round(mcg * 10) / 10).toString()
}
