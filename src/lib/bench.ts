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
// is no reminder there is no cadence, so the caption falls back to what is
// left in the vial rather than inventing a rate of use. A wrong "4 days left"
// is worse than no number, because someone reorders on it.

import { COMPOUNDS } from '@/lib/catalog'
import { doseState } from '@/lib/dosing'

export interface BenchVial {
  id: string
  name: string
  /** The library entry, where the name resolves. */
  compoundId: string | null
  href: string
  /** Opens the add/edit form for this compound in the Mirror. */
  editHref: string
  /** '5 mg', or null where no size is recorded. */
  size: string | null
  /** 0-100. How full the glyph draws. Null where nothing is known. */
  fill: number | null
  /** What sits under the glyph. Never blank. */
  caption: string
  /** False for a peptide on the schedule with no vial recorded yet. */
  recorded: boolean
}

export interface BenchRow {
  id: string
  name: string
  /** The italic line beneath — what it is, not what to do with it. */
  subtitle: string
  /**
   * Where the name goes: this compound in the Mirror, where the person's own
   * record and every write path live. The library page is `libraryHref`.
   */
  href: string
  /** The library entry for this compound — read-only reference. */
  libraryHref: string
  /** Opens the add/edit form for this compound in the Mirror. */
  editHref: string
  /** Opens this compound in the Mirror with the dose logger already open. */
  logHref: string
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
  /** The add form writes "20 units per shot · 5 mg in 2 mL" here. */
  notes?: string | null
}

export interface RawInventoryItem {
  id: string
  name: string
  compoundId: string | null
  vialSizeMg: number | null
  /**
   * Milligrams left in the vial — the Mirror's add form writes it that way and
   * its supply arithmetic reads it that way. It was once read here as a count
   * of vials, which printed "5 on hand" for a full 5 mg vial.
   */
  quantityRemaining: number | null
}

function fmtMg(mg: number): string {
  return Number.isInteger(mg) ? String(mg) : String(Number(mg.toFixed(2)))
}

function sizeOf(mg: number | null): string | null {
  if (mg === null || !Number.isFinite(mg) || mg <= 0) return null
  return `${fmtMg(mg)} mg`
}

export function editHref(compoundId: string | null): string {
  return compoundId ? `/mirror?compound=${encodeURIComponent(compoundId)}&edit=1` : '/mirror'
}

/** This compound in the Mirror, where its record lives. */
export function mirrorHref(compoundId: string | null): string {
  return compoundId ? `/mirror?compound=${encodeURIComponent(compoundId)}` : '/mirror'
}

/**
 * This compound in the Mirror with the dose logger already open. Logging from
 * the bench used to be five steps — open the field, find the region, find the
 * compound, scroll to the button, open it. LogDoseButton reads `log=1`, opens
 * itself and scrolls into view. An unresolved name has no compound view to
 * land on, so it falls back to the field like editHref does.
 */
export function logHref(compoundId: string | null): string {
  return compoundId ? `/mirror?compound=${encodeURIComponent(compoundId)}&log=1` : '/mirror'
}

function libraryHref(compoundId: string | null): string {
  return compoundId ? `/reference/${compoundId}` : '/reference'
}

const UNITS_NOTE = /^\s*([\d.]+)\s*units per shot/i

function vialFrom(item: RawInventoryItem): BenchVial {
  const compound = item.compoundId ? COMPOUNDS[item.compoundId] : undefined
  const size = sizeOf(item.vialSizeMg)
  const left = item.quantityRemaining
  const known = left !== null && Number.isFinite(left)

  return {
    id: item.id,
    name: compound?.name ?? item.name,
    compoundId: item.compoundId,
    href: item.compoundId ? `/reference/${item.compoundId}` : '/reference',
    editHref: editHref(item.compoundId),
    size,
    // A level only where both ends are known; nothing is drawn from a guess.
    fill:
      known && item.vialSizeMg !== null && item.vialSizeMg > 0
        ? Math.max(0, Math.min(100, (left / item.vialSizeMg) * 100))
        : null,
    caption: !known ? (size ?? 'on file') : left > 0 ? `${fmtMg(left)} mg left` : 'empty',
    recorded: true,
  }
}

function sameCompound(
  a: { compoundId: string | null; name: string },
  b: { compoundId: string | null; name: string },
): boolean {
  return a.compoundId && b.compoundId ? a.compoundId === b.compoundId : a.name === b.name
}

export function benchView(
  stack: RawStackItem[],
  inventory: RawInventoryItem[],
  isPro: boolean,
): BenchView {
  // Free sees one. See the note above about why it is the first and not a rank.
  const visibleStack = isPro ? stack : stack.slice(0, 1)

  // One vial per peptide on the schedule. A peptide with no vial recorded
  // shows an outline that opens the form, rather than being left off the
  // shelf. Then, on Pro, any vial whose peptide has since left the schedule.
  const scheduled: BenchVial[] = visibleStack.map((item) => {
    const stock = inventory.find((v) => sameCompound(v, item))
    if (stock) return vialFrom(stock)
    const compound = item.compoundId ? COMPOUNDS[item.compoundId] : undefined
    return {
      id: `none-${item.id}`,
      name: compound?.name ?? item.name,
      compoundId: item.compoundId,
      href: item.compoundId ? `/reference/${item.compoundId}` : '/reference',
      editHref: editHref(item.compoundId),
      size: null,
      fill: null,
      caption: 'no vial recorded',
      recorded: false,
    }
  })
  const offSchedule = isPro
    ? inventory.filter((v) => !stack.some((item) => sameCompound(v, item))).map(vialFrom)
    : []
  const vials =
    isPro || scheduled.length > 0 ? [...scheduled, ...offSchedule] : inventory.slice(0, 1).map(vialFrom)

  const rows: BenchRow[] = visibleStack.map((item) => {
    const compound = item.compoundId ? COMPOUNDS[item.compoundId] : undefined
    const dose = item.dose?.trim()
    const units = item.notes?.match(UNITS_NOTE)?.[1]
    const recorded = dose ? `${dose}${item.unit ? ` ${item.unit}` : ''}` : ''

    return {
      id: item.id,
      name: compound?.name ?? item.name,
      subtitle: compound?.purpose ?? 'Not in the library',
      href: mirrorHref(item.compoundId),
      libraryHref: libraryHref(item.compoundId),
      editHref: editHref(item.compoundId),
      logHref: logHref(item.compoundId),
      // A recorded amount is what the person typed, so it prints as typed. Where
      // there is none, the grade — never a number this app chose.
      right: recorded
        ? units
          ? `${units} units · ${recorded}`
          : recorded
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
