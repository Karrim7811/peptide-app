// Reading a vial label into something the bench can hold.
//
// The model returns free text off a photograph: a name as printed, an amount
// like "5mg" or "10 mg", and whatever else was legible. None of that is
// trustworthy enough to write to a bench unedited, so this module's job is to
// turn it into a *proposal* — resolved where it can be, flagged where it
// cannot, and never silently guessed.
//
// Two rules the UI depends on:
//
//   • A reading that does not resolve to a library entry is still shown. The
//     person can correct the name; discarding it would lose a photograph they
//     already took, and a scanner that silently drops half a shelf is worse
//     than one that says "not in the library".
//   • An amount that cannot be parsed is null, never 0. Zero milligrams is a
//     claim about a vial; null is an admission about a photograph.

import { COMPOUND_LIST, COMPOUNDS } from '@/lib/catalog'
import { resolveCompoundId } from '@/lib/mirror/mapping'

/** One entry as the model returned it. Every field is untrusted. */
export interface RawReading {
  name?: unknown
  amount?: unknown
  type?: unknown
  notes?: unknown
}

export interface Reading {
  /** The name as printed on the label, trimmed. */
  readName: string
  /** The library entry this resolves to, or null. */
  compoundId: string | null
  /** The library's own name, where it resolved. Null otherwise. */
  compoundName: string | null
  /** Milligrams, or null where the label did not give a parseable amount. */
  mg: number | null
  /** The amount exactly as read, for display beside the parsed figure. */
  readAmount: string | null
  notes: string | null
}

/**
 * '5mg' → 5 · '10 mg' → 10 · '1000 mcg' → 1 · '2 IU' → null.
 *
 * Only milligrams come back, because that is the unit `setInventory` stores.
 * An IU vial is a real thing the scanner may see and cannot convert — potency
 * per IU is compound-specific — so it returns null and the row says so rather
 * than inventing a conversion.
 */
export function parseMg(value: string): number | null {
  const text = value.trim().toLowerCase()
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(mg|mcg|µg|ug|g)\b/)
  if (!match) return null

  const amount = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(amount) || amount <= 0) return null

  switch (match[2]) {
    case 'mg':
      return amount
    case 'g':
      return amount * 1000
    // mcg/µg/ug
    default:
      return amount / 1000
  }
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Turn whatever the model returned into readings, dropping only what has no
 * name at all — a nameless row is not a vial, it is noise.
 */
export function readingsFrom(raw: unknown): Reading[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((entry: RawReading) => {
      const readName = asString(entry?.name)
      if (!readName) return null

      const readAmount = asString(entry?.amount) || null
      const compoundId = resolveCompoundId(readName)

      return {
        readName,
        compoundId,
        compoundName: compoundId ? (COMPOUNDS[compoundId]?.name ?? null) : null,
        mg: readAmount ? parseMg(readAmount) : null,
        readAmount,
        notes: asString(entry?.notes) || null,
      }
    })
    .filter((reading): reading is Reading => reading !== null)
}

/** What the row says under "In the library". Never blank. */
export function libraryNote(reading: Reading): string {
  if (reading.compoundName) return reading.compoundName
  // Said plainly. The person can retype the name and it will resolve.
  return 'Not matched — check the name'
}

/** What the row says under the amount. Never blank, never a fabricated figure. */
export function amountNote(reading: Reading): string {
  if (reading.mg !== null) return `${reading.mg} mg`
  if (reading.readAmount) return `Read “${reading.readAmount}” · not in milligrams`
  return 'No amount read'
}

/** Suggestions for a name that did not resolve, so correcting it is a click. */
export function nearestNames(readName: string, limit = 5): string[] {
  const target = readName.trim().toLowerCase()
  if (!target) return []
  const initial = target.slice(0, 3)

  return COMPOUND_LIST.filter((compound) => {
    const name = compound.name.toLowerCase()
    return name.startsWith(initial) || name.includes(target) || target.includes(name)
  })
    .slice(0, limit)
    .map((compound) => compound.name)
}
