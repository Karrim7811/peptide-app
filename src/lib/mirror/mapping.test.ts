import { describe, expect, it } from 'vitest'
import {
  doseToMcg,
  dosesPerWeek,
  parseDateOnly,
  resolveCompoundId,
  resolveStack,
  toCycle,
  toDoseLog,
  toStackEntries,
  type CycleRow,
  type DoseLogRow,
  type InjectionSiteRow,
  type InventoryRow,
  type ReminderRow,
  type StackItemRow,
} from '@/lib/mirror/mapping'

const NOW = new Date('2026-08-06T12:00:00Z')

function item(overrides: Partial<StackItemRow> = {}): StackItemRow {
  return {
    id: 'row-1',
    name: 'BPC-157',
    type: 'peptide',
    dose: '250',
    unit: 'mcg',
    active: true,
    created_at: '2026-06-27T00:00:00Z',
    ...overrides,
  }
}

describe('resolveCompoundId', () => {
  it('matches the catalog slug, name and full name', () => {
    expect(resolveCompoundId('bpc-157')).toBe('bpc-157')
    expect(resolveCompoundId('BPC-157')).toBe('bpc-157')
    expect(resolveCompoundId('Semaglutide (Wegovy/Ozempic)')).toBe('semaglutide')
  })

  it('tolerates the punctuation and spacing users actually type', () => {
    expect(resolveCompoundId('BPC 157')).toBe('bpc-157')
    expect(resolveCompoundId('  bpc157  ')).toBe('bpc-157')
  })

  it('returns null rather than guessing', () => {
    // A wrong match would attribute one compound's cautions to another.
    expect(resolveCompoundId('')).toBeNull()
    expect(resolveCompoundId('something entirely invented')).toBeNull()
    expect(resolveCompoundId('BPC')).toBeNull()
  })
})

describe('doseToMcg', () => {
  it('converts the units the app actually stores', () => {
    expect(doseToMcg('250', 'mcg')).toBe(250)
    expect(doseToMcg('0.5', 'mg')).toBe(500)
    expect(doseToMcg('2', 'MG')).toBe(2000)
  })

  it('tolerates units embedded in the value', () => {
    expect(doseToMcg('250 mcg', 'mcg')).toBe(250)
  })

  it('refuses to invent a conversion it cannot make', () => {
    // IU has no compound-independent conversion; returning a number would be a lie.
    expect(doseToMcg('10', 'iu')).toBe(0)
    expect(doseToMcg('', 'mcg')).toBe(0)
    expect(doseToMcg('abc', 'mcg')).toBe(0)
  })
})

describe('dosesPerWeek', () => {
  it('defaults to daily when nothing is scheduled', () => {
    expect(dosesPerWeek([])).toBe(7)
  })

  it('counts scheduled days across reminders', () => {
    const reminders: ReminderRow[] = [
      { stack_item_id: 'a', time: '07:30', days_of_week: [1, 3, 5], active: true },
    ]
    expect(dosesPerWeek(reminders)).toBe(3)
  })

  it('ignores inactive reminders', () => {
    const reminders: ReminderRow[] = [
      { stack_item_id: 'a', time: '07:30', days_of_week: [1, 3, 5], active: true },
      { stack_item_id: 'a', time: '21:00', days_of_week: [0, 6], active: false },
    ]
    expect(dosesPerWeek(reminders)).toBe(3)
  })
})

describe('resolveStack', () => {
  it('drops inactive rows', () => {
    const resolved = resolveStack([item(), item({ id: 'row-2', active: false })])
    expect(resolved).toHaveLength(1)
  })

  it('keeps unmatched rows with a null compound id rather than discarding them', () => {
    const resolved = resolveStack([item({ name: 'Some Custom Blend' })])
    expect(resolved).toHaveLength(1)
    expect(resolved[0]!.compoundId).toBeNull()
  })
})

describe('toStackEntries', () => {
  const inventory: InventoryRow[] = [
    { name: 'BPC-157', vial_size_mg: 5, quantity_remaining: 3.5, unit: 'mg', expiry_date: null },
  ]
  const reminders: ReminderRow[] = [
    { stack_item_id: 'row-1', time: '07:30', days_of_week: [0, 1, 2, 3, 4, 5, 6], active: true },
  ]

  function build(overrides: Partial<Parameters<typeof toStackEntries>[0]> = {}) {
    return toStackEntries({
      stackItems: [item()],
      inventory,
      reminders,
      doseLogs: [],
      injectionSites: [],
      cycle: null,
      now: NOW,
      ...overrides,
    })
  }

  it('derives supply percent from inventory', () => {
    expect(build()[0]!.supply).toBe(70) // 3.5 of 5 mg
  })

  it('derives days of supply from dose size and cadence', () => {
    // 3.5 mg = 3500 mcg; at 250 mcg daily that is 14 days.
    expect(build()[0]!.supplyDays).toBe(14)
  })

  it('halves the burn rate when the cadence halves', () => {
    const everyOtherDay: ReminderRow[] = [
      { stack_item_id: 'row-1', time: '07:30', days_of_week: [1, 3, 5], active: true },
    ]
    const entry = build({ reminders: everyOtherDay })[0]!
    expect(entry.supplyDays).toBeGreaterThan(14)
  })

  it('does not fabricate a reconstitution volume', () => {
    // Nothing stores water volume. Reporting a number here would make THE MATH
    // print a concentration the user never mixed.
    expect(build()[0]!.waterMl).toBe(0)
  })

  it('reports zero supply rather than NaN when inventory is missing', () => {
    const entry = build({ inventory: [] })[0]!
    expect(entry.supply).toBe(0)
    expect(entry.supplyDays).toBe(0)
    expect(Number.isNaN(entry.supply)).toBe(false)
  })

  it('omits rows that match nothing in the library', () => {
    expect(build({ stackItems: [item({ name: 'Mystery Blend' })] })).toHaveLength(0)
  })

  it('counts cycle days from the cycle start', () => {
    const cycle: CycleRow = {
      name: 'Recovery',
      start_date: '2026-06-27',
      on_weeks: 8,
      off_weeks: 4,
      status: 'on',
    }
    expect(build({ cycle })[0]!.days).toBe(40)
  })
})

describe('toCycle', () => {
  const row: CycleRow = {
    name: 'Recovery',
    start_date: '2026-06-27',
    on_weeks: 8,
    off_weeks: 4,
    status: 'on',
  }

  it('derives length and washout from on_weeks', () => {
    const cycle = toCycle(row, [], 0, NOW)!
    expect(cycle.length).toBe(56)
    expect(cycle.washout).toBe('22 AUG')
  })

  it('never reports a day beyond the cycle length', () => {
    const cycle = toCycle(row, [], 0, new Date('2027-01-01T00:00:00Z'))!
    expect(cycle.day).toBeLessThanOrEqual(cycle.length)
  })

  it('caps adherence at 100', () => {
    const logs = Array.from({ length: 90 }, (_, i) => ({
      id: `d${i}`,
      stack_item_id: 'row-1',
      taken_at: NOW.toISOString(),
      dose: '250',
      notes: null,
    }))
    expect(toCycle(row, logs, 40, NOW)!.adherence).toBe(100)
  })

  it('returns null when there is no cycle', () => {
    expect(toCycle(null, [], 0, NOW)).toBeNull()
  })

  it('treats the start date as a calendar day, not a UTC instant', () => {
    // Regression: `new Date('2026-06-27')` parses as UTC midnight while
    // getDate()/getMonth() read local time, so west of UTC the cycle day and
    // washout date both landed one day early.
    const start = parseDateOnly('2026-06-27')!
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(5) // June
    expect(start.getDate()).toBe(27)

    // Day 1 of the cycle is the day after it starts, in local terms.
    const nextDay = new Date(2026, 5, 28, 3, 0, 0)
    expect(toCycle(row, [], 0, nextDay)!.day).toBe(1)
  })
})

describe('toDoseLog', () => {
  const logs: DoseLogRow[] = [
    { id: 'd1', stack_item_id: 'row-1', taken_at: '2026-08-06T07:34:00Z', dose: '250 mcg', notes: null },
  ]

  it('resolves the compound behind each dose', () => {
    const out = toDoseLog(logs, [item()], [])
    expect(out).toHaveLength(1)
    expect(out[0]!.id).toBe('bpc-157')
  })

  it('credits a site only when one was logged near the dose', () => {
    const near: InjectionSiteRow[] = [
      { site: 'ABDOMEN L', peptide_name: 'BPC-157', logged_at: '2026-08-06T07:40:00Z' },
    ]
    const far: InjectionSiteRow[] = [
      { site: 'ABDOMEN L', peptide_name: 'BPC-157', logged_at: '2026-08-01T07:40:00Z' },
    ]
    expect(toDoseLog(logs, [item()], near)[0]!.site).toBe('ABDOMEN L')
    expect(toDoseLog(logs, [item()], far)[0]!.site).toBe('—')
  })

  it('drops doses whose stack item resolves to nothing', () => {
    expect(toDoseLog(logs, [item({ name: 'Mystery' })], [])).toHaveLength(0)
  })
})
