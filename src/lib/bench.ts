// The bench, as data.
//
// What the signed-in landing screen shows: the vials on file, what is on the
// schedule, and — for a free account — the one entry it is allowed to keep.
//
// ── The free tier shows one peptide, not a teaser of many ─────────────────
//
// Showing five rows greyed out with a lock on four is a pattern that reads as
// punishment. One real, working row reads as an invitation. The design picks
// the first entry rather than "the best one", because ranking someone's own
// bench is a judgement this product does not make.
//
// ── Supply days are omitted, not estimated ────────────────────────────────
//
// Days-of-supply needs a cadence, and cadence lives on reminders. Where there
// is no reminder there is no cadence, so the caption falls back to the lot
// rather than inventing a rate of use. A wrong "4 days left" is worse than no
// number, because someone reorders on it.

import { COMPOUNDS } from '@/lib/catalog'
import { doseState } from '@/lib/dosing'

export interface BenchVial {
  id: string
  name: string
  /** The library entry, where the name resolves. */
  compoundId: string | null
  href: string
  /** '5 mg', or null where no size is recorded. */
  size: string | null
  /** 0-100. How full the glyph draws. Null where nothing is known. */
  fill: number | null
  /** What sits under the glyph. Never blank. */
  caption: string
}

export interface BenchRow {
  id: string
  name: string
  /** The italic line beneath — what it is, not what to do with it. */
  subtitle: string
  href: string
  /** The right-hand mono column. Never blank. */
  right: string
}

export interface BenchView {
  isPro: boolean
  title: string
  subtitle: string
  vials: BenchVial[]
  rows: BenchRow[]
  /** How many entries the tier is hiding. Zero on Pro. */
  hidden: number
  tableTitle: string
  tableNote: string
}

export interface RawStackItem {
  id: string
  name: string
  compoundId: string | null
  dose: string | null
  unit: string | null
}

export interface RawInventoryItem {
  id: string
  name: string
  compoundId: string | null
  vialSizeMg: number | null
  quantityRemaining: number | null
}

function sizeOf(mg: number | null): string | null {
  if (mg === null || !Number.isFinite(mg) || mg <= 0) return null
  return `${Number.isInteger(mg) ? mg : mg.toFixed(2)} mg`
}

export function benchView(
  stack: RawStackItem[],
  inventory: RawInventoryItem[],
  isPro: boolean,
): BenchView {
  // Free sees one. See the note above about why it is the first and not a rank.
  const visibleStack = isPro ? stack : stack.slice(0, 1)
  const visibleInventory = isPro ? inventory : inventory.slice(0, 1)

  const vials: BenchVial[] = visibleInventory.map((item) => {
    const compound = item.compoundId ? COMPOUNDS[item.compoundId] : undefined
    const size = sizeOf(item.vialSizeMg)
    const qty = item.quantityRemaining

    return {
      id: item.id,
      name: compound?.name ?? item.name,
      compoundId: item.compoundId,
      href: item.compoundId ? `/reference/${item.compoundId}` : '/reference',
      size,
      // Quantity is a count of vials, not a percentage. One vial draws full;
      // none draws empty. Nothing is interpolated from a number that is not a
      // level.
      fill: qty === null ? null : qty > 0 ? 100 : 0,
      caption: qty === null ? (size ?? 'on file') : qty > 0 ? `${qty} on hand` : 'empty',
    }
  })

  const rows: BenchRow[] = visibleStack.map((item) => {
    const compound = item.compoundId ? COMPOUNDS[item.compoundId] : undefined
    const dose = item.dose?.trim()

    return {
      id: item.id,
      name: compound?.name ?? item.name,
      subtitle: compound?.purpose ?? 'Not in the library',
      href: item.compoundId ? `/reference/${item.compoundId}` : '/reference',
      // A recorded amount is what the person typed, so it prints as typed. Where
      // there is none, the grade — never a number this app chose.
      right: dose
        ? `${dose}${item.unit ? ` ${item.unit}` : ''}`
        : compound
          ? `grade ${compound.grade}${doseState(compound) === 'published' ? '' : ' · no published dose'}`
          : 'no entry',
    }
  })

  const hidden = isPro ? 0 : Math.max(0, stack.length - visibleStack.length)

  return {
    isPro,
    title: isPro ? 'Your bench.' : 'Your bench, one compound.',
    subtitle: isPro
      ? `${stack.length} on the schedule · ${inventory.length} ${
          inventory.length === 1 ? 'vial' : 'vials'
        } on file`
      : stack.length === 0
        ? 'Nothing on the bench yet · reading is free'
        : '1 shown · reading is free',
    vials,
    rows,
    hidden,
    tableTitle: isPro ? 'On the bench' : 'On the bench · free tier',
    tableNote: isPro
      ? 'Amounts are what you recorded. Nothing here is a recommendation.'
      : 'Reading the library is free and always will be. Keeping a bench is what Pro is for.',
  }
}
