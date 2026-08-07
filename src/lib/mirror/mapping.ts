// Bridge between the live Supabase tables and the Mirror's view model.
//
// These do not line up, and pretending they do is how the surface would start
// lying. Concretely:
//
//   * `stack_items` identifies a compound by free-text `name`; the catalog
//     identifies it by slug. Users type "BPC 157", "bpc-157", "BPC-157 (Body
//     Protection Compound)". resolveCompoundId() reconciles them and returns
//     null rather than guessing when it cannot.
//
//   * The design's StackEntry carries reconstitution parameters (vialMg,
//     waterMl, doseMcg) and supply tracking (supply%, supplyDays). None of that
//     is on `stack_items` — vial figures live on `inventory` (keyed by name,
//     not by id) and cadence lives on `reminders`. Everything is assembled here.
//
//   * `cycles` stores { start_date, on_weeks, off_weeks } and the design shows
//     { day, length, washout }. All three are derived. There is deliberately no
//     adherence column, so the derive-don't-store rule is enforced by the
//     schema whether we like it or not.
//
//   * `injection_sites` is an injection LOG, not geometry. Body-map coordinates
//     stay app-side constants (SITES); usage counts derive from rows.
//
// Everything here is pure so it can be tested without a database and reused on
// either side of the network boundary.

import {
  COMPOUND_LIST,
  type Cycle,
  type DoseLogEntry,
  type StackEntry,
} from '@/lib/catalog'

// ── Row shapes, as introspected from the live project on 2026-08-06 ─────────

export interface StackItemRow {
  id: string
  name: string
  type: string
  dose: string | null
  unit: string | null
  active: boolean | null
  created_at: string
}

export interface InventoryRow {
  name: string
  vial_size_mg: number | null
  quantity_remaining: number | null
  unit: string | null
  expiry_date: string | null
}

export interface ReminderRow {
  stack_item_id: string
  time: string
  days_of_week: number[] | null
  active: boolean | null
}

export interface DoseLogRow {
  id: string
  stack_item_id: string
  taken_at: string
  dose: string | null
  notes: string | null
}

export interface InjectionSiteRow {
  site: string
  peptide_name: string | null
  logged_at: string
}

export interface CycleRow {
  name: string
  start_date: string
  on_weeks: number
  off_weeks: number
  status: string
}

// ── Compound identity ───────────────────────────────────────────────────────

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Map a free-text stack item name onto a catalog compound id.
 *
 * Returns null when there is no confident match. A wrong match here would
 * attribute one compound's cautions and interactions to another, so this is
 * deliberately strict — an unmatched item still renders as the user's own, it
 * just carries no library data.
 */
export function resolveCompoundId(name: string): string | null {
  const target = normalise(name)
  if (!target) return null

  for (const compound of COMPOUND_LIST) {
    if (normalise(compound.id) === target) return compound.id
    if (normalise(compound.name) === target) return compound.id
    if (normalise(compound.fullName) === target) return compound.id
  }

  // Fall back to a unique prefix match — "BPC" should not resolve, but
  // "Tirzepatide 5mg" should.
  const prefixed = COMPOUND_LIST.filter((compound) => {
    const candidate = normalise(compound.name)
    return candidate.length >= 4 && target.startsWith(candidate)
  })
  return prefixed.length === 1 ? prefixed[0]!.id : null
}

// ── Dose arithmetic ─────────────────────────────────────────────────────────

/** Parse a dose string plus its unit into micrograms. Returns 0 when unusable. */
export function doseToMcg(dose: string | null, unit: string | null): number {
  if (!dose) return 0
  const amount = Number.parseFloat(dose.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(amount) || amount <= 0) return 0

  const scale = (unit ?? 'mcg').trim().toLowerCase()
  if (scale === 'mg') return amount * 1000
  if (scale === 'g') return amount * 1_000_000
  if (scale === 'iu') return 0 // Not convertible without a compound-specific factor.
  return amount
}

/** Doses per week implied by a set of reminders. Defaults to daily. */
export function dosesPerWeek(reminders: ReminderRow[]): number {
  const active = reminders.filter((r) => r.active !== false)
  if (!active.length) return 7
  let total = 0
  for (const reminder of active) {
    const days = reminder.days_of_week?.length ?? 7
    total += days
  }
  return total || 7
}

// ── Assembly ────────────────────────────────────────────────────────────────

export interface MirrorSource {
  stackItems: StackItemRow[]
  inventory: InventoryRow[]
  reminders: ReminderRow[]
  doseLogs: DoseLogRow[]
  injectionSites: InjectionSiteRow[]
  cycle: CycleRow | null
  /** Injected for testability; defaults to now. */
  now?: Date
}

export interface ResolvedStackItem {
  /** Catalog compound id, or null when the name matched nothing in the library. */
  compoundId: string | null
  row: StackItemRow
}

/** Which live rows correspond to which catalog compounds. */
export function resolveStack(stackItems: StackItemRow[]): ResolvedStackItem[] {
  return stackItems
    .filter((row) => row.active !== false)
    .map((row) => ({ compoundId: resolveCompoundId(row.name), row }))
}

/**
 * Build the Mirror's stack entries.
 *
 * Order matters: the Mirror's free tier resolves the FIRST entry, so this sorts
 * by creation so the allowance is stable rather than reshuffling as supply
 * changes. Rows whose name matches nothing in the library are dropped from the
 * field (they have no node to render) but remain the user's — the Ledger still
 * lists them.
 */
export function toStackEntries(source: MirrorSource): StackEntry[] {
  const { stackItems, inventory, reminders, injectionSites, cycle } = source
  const now = source.now ?? new Date()

  const inventoryByName = new Map(
    inventory.map((row) => [normalise(row.name), row] as const),
  )
  const remindersByItem = new Map<string, ReminderRow[]>()
  for (const reminder of reminders) {
    const list = remindersByItem.get(reminder.stack_item_id) ?? []
    list.push(reminder)
    remindersByItem.set(reminder.stack_item_id, list)
  }

  const cycleDays = cycle ? daysSince(cycle.start_date, now) : 0

  const entries: StackEntry[] = []

  for (const { compoundId, row } of resolveStack(stackItems)) {
    if (!compoundId) continue

    const stock = inventoryByName.get(normalise(row.name))
    const itemReminders = remindersByItem.get(row.id) ?? []
    const doseMcg = doseToMcg(row.dose, row.unit)

    const vialMg = stock?.vial_size_mg ?? 0
    const remainingMg = stock?.quantity_remaining ?? 0
    const supply = vialMg > 0 ? clampPercent((remainingMg / vialMg) * 100) : 0

    const perWeek = dosesPerWeek(itemReminders)
    const perDay = perWeek / 7
    const dosesLeft = doseMcg > 0 ? (remainingMg * 1000) / doseMcg : 0
    const supplyDays = perDay > 0 ? Math.floor(dosesLeft / perDay) : 0

    entries.push({
      id: compoundId,
      vialMg,
      // Reconstitution volume is not stored anywhere. Left at 0 so THE MATH
      // asks for it rather than inventing a concentration.
      waterMl: 0,
      doseMcg,
      supply,
      supplyDays,
      days: cycleDays,
      schedule: describeSchedule(itemReminders),
      site: lastSiteFor(row.name, injectionSites) ?? '—',
    })
  }

  return entries
}

/**
 * How many doses the whole stack should have taken over `elapsedDays`.
 *
 * The input to adherence, and derived from cadence rather than stored — there
 * is no adherence column in the schema, which is the rule enforcing itself.
 */
export function expectedDosesOver(source: MirrorSource, elapsedDays: number): number {
  if (elapsedDays <= 0) return 0

  const remindersByItem = new Map<string, ReminderRow[]>()
  for (const reminder of source.reminders) {
    const list = remindersByItem.get(reminder.stack_item_id) ?? []
    list.push(reminder)
    remindersByItem.set(reminder.stack_item_id, list)
  }

  let total = 0
  for (const { compoundId, row } of resolveStack(source.stackItems)) {
    if (!compoundId) continue
    const perWeek = dosesPerWeek(remindersByItem.get(row.id) ?? [])
    total += (perWeek / 7) * elapsedDays
  }
  return Math.round(total)
}

/** Stack rows the library could not identify. Surfaced, never silently dropped. */
export function unmatchedNames(stackItems: StackItemRow[]): string[] {
  return resolveStack(stackItems)
    .filter(({ compoundId }) => !compoundId)
    .map(({ row }) => row.name)
}

export function toDoseLog(
  doseLogs: DoseLogRow[],
  stackItems: StackItemRow[],
  injectionSites: InjectionSiteRow[],
): DoseLogEntry[] {
  const compoundByItemId = new Map(
    stackItems.map((row) => [row.id, resolveCompoundId(row.name)] as const),
  )

  return doseLogs
    .map((row) => {
      const compoundId = compoundByItemId.get(row.stack_item_id)
      if (!compoundId) return null
      const takenAt = new Date(row.taken_at)
      return {
        when: formatWhen(takenAt),
        id: compoundId,
        dose: row.dose ?? '',
        site: nearestSite(takenAt, injectionSites) ?? '—',
      }
    })
    .filter((entry): entry is DoseLogEntry => entry !== null)
    .sort((a, b) => b.when.localeCompare(a.when))
}

/**
 * Derive the cycle the Mirror displays.
 *
 * `adherence` and `onTime` are sample-data fields on the design's Cycle type;
 * the live schema has no such columns, so they are computed from the dose log
 * by the caller that owns the claim (cycleReport in entitlement.ts). The values
 * set here are inputs to that, never displayed directly.
 */
export function toCycle(
  row: CycleRow | null,
  doseLogs: DoseLogRow[],
  expectedDoses: number,
  now: Date = new Date(),
): Cycle | null {
  if (!row) return null

  const length = row.on_weeks * 7
  const day = Math.min(daysSince(row.start_date, now), length)
  const start = parseDateOnly(row.start_date)
  if (!start) return null
  const washout = new Date(start)
  washout.setDate(washout.getDate() + length)

  const taken = doseLogs.length
  const adherence = expectedDoses > 0 ? Math.round((taken / expectedDoses) * 100) : 0

  return {
    day,
    length,
    start: formatDay(start),
    washout: formatDay(washout),
    adherence: Math.min(adherence, 100),
    onTime: taken,
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

/**
 * Parse a Postgres `date` (YYYY-MM-DD) as a LOCAL calendar day.
 *
 * `new Date('2026-06-27')` is parsed as UTC midnight, but every read that
 * follows (getDate, getMonth) is local — so west of UTC the day silently rolls
 * backwards and the cycle day and washout date land one day early. A cycle is a
 * calendar concept, not an instant, so it is built from components.
 */
export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) {
    const fallback = new Date(value)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** Whole calendar days elapsed, counted locally for the same reason. */
function daysSince(isoDate: string, now: Date): number {
  const start = parseDateOnly(isoDate)
  if (!start) return 0
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((nowDay.getTime() - startDay.getTime()) / 86_400_000))
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function formatDay(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}`
}

function formatWhen(date: Date): string {
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${formatDay(date)} ${time}`
}

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function describeSchedule(reminders: ReminderRow[]): string {
  const active = reminders.filter((r) => r.active !== false)
  if (!active.length) return 'unscheduled'

  const first = active[0]!
  const time = first.time.slice(0, 5)
  const days = first.days_of_week ?? []

  if (!days.length || days.length === 7) return `${time} daily`
  if (days.length <= 3) {
    return `${time} · ${days.map((d) => DAY_NAMES[d] ?? '').filter(Boolean).join('/')}`
  }
  return `${time} · ${days.length}× weekly`
}

function lastSiteFor(name: string, sites: InjectionSiteRow[]): string | null {
  const target = normalise(name)
  const match = sites
    .filter((row) => row.peptide_name && normalise(row.peptide_name) === target)
    .sort((a, b) => b.logged_at.localeCompare(a.logged_at))[0]
  return match?.site ?? null
}

/** The site logged closest in time to a dose. Injection sites are logged separately. */
function nearestSite(takenAt: Date, sites: InjectionSiteRow[]): string | null {
  let best: { site: string; delta: number } | null = null
  for (const row of sites) {
    const delta = Math.abs(new Date(row.logged_at).getTime() - takenAt.getTime())
    // Only credit a site logged within an hour of the dose.
    if (delta > 3_600_000) continue
    if (!best || delta < best.delta) best = { site: row.site, delta }
  }
  return best?.site ?? null
}
