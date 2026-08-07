import 'server-only'

// Server-side read path for the Mirror.
//
// Loads the user's live rows and runs them through the pure mapping layer. The
// Mirror's own accessors (entitlement.ts) then decide what is resolved, so
// nothing here filters by tier — a loader that pre-filtered would put a second
// gate in the system, which is precisely the shape of every paywall leak the
// design hit.

import { createClient } from '@/lib/supabase/server'
import {
  expectedDosesOver,
  resolveCompoundId,
  toCycle,
  toDoseLog,
  toStackEntries,
  unmatchedNames,
  type CycleRow,
  type DoseLogRow,
  type InjectionSiteRow,
  type InventoryRow,
  type ReminderRow,
  type StackItemRow,
} from '@/lib/mirror/mapping'
import { resolveTier } from '@/lib/tier'
import type { Cycle, DoseLogEntry, StackEntry } from '@/lib/catalog'
import type { SubscriptionTier } from '@/types'

/** Per-compound records, keyed by catalog compound id. */
export interface CompoundRecords {
  reminders: Array<{ id: string; time: string; daysOfWeek: number[]; dose: string }>
  notes: Array<{ id: string; note: string; url: string; createdAt: string }>
  sideEffects: Array<{ id: string; effect: string; severity: number; notes: string; loggedAt: string }>
}

export interface MirrorData {
  tier: SubscriptionTier
  stack: StackEntry[]
  doseLog: DoseLogEntry[]
  cycle: Cycle | null
  hasLabs: boolean
  /** Stack rows whose name matched nothing in the library, surfaced not hidden. */
  unmatched: string[]
  /** Keyed by compound id. Tier-blind — these are the user's own records. */
  records: Record<string, CompoundRecords>
}

export const EMPTY_MIRROR_DATA: MirrorData = {
  tier: 'free',
  stack: [],
  doseLog: [],
  cycle: null,
  hasLabs: false,
  unmatched: [],
  records: {},
}

function emptyRecords(): CompoundRecords {
  return { reminders: [], notes: [], sideEffects: [] }
}

export async function loadMirrorData(): Promise<MirrorData> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return EMPTY_MIRROR_DATA

  const [
    profile,
    stackItems,
    inventory,
    reminders,
    doseLogs,
    injectionSites,
    cycles,
    bloodwork,
    notes,
    sideEffects,
  ] = await Promise.all([
      supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at')
        .eq('id', user.id)
        .single(),
      supabase.from('stack_items').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('inventory').select('*').eq('user_id', user.id),
      supabase.from('reminders').select('*').eq('user_id', user.id),
      supabase
        .from('dose_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false })
        .limit(500),
      supabase
        .from('injection_sites')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(500),
      supabase
        .from('cycles')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'on')
        .order('start_date', { ascending: false })
        .limit(1),
      supabase
        .from('bloodwork_results')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('research_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('side_effects')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false }),
    ])

  const stackRows = (stackItems.data ?? []) as StackItemRow[]
  const inventoryRows = (inventory.data ?? []) as InventoryRow[]
  const reminderRows = (reminders.data ?? []) as ReminderRow[]
  const doseRows = (doseLogs.data ?? []) as DoseLogRow[]
  const siteRows = (injectionSites.data ?? []) as InjectionSiteRow[]
  const cycleRow = ((cycles.data ?? [])[0] ?? null) as CycleRow | null

  const source = {
    stackItems: stackRows,
    inventory: inventoryRows,
    reminders: reminderRows,
    doseLogs: doseRows,
    injectionSites: siteRows,
    cycle: cycleRow,
  }

  const stack = toStackEntries(source)
  const elapsedDays = cycleRow ? (stack[0]?.days ?? 0) : 0

  // Per-compound records. Reminders key off stack_item_id; notes and side
  // effects key off the free-text peptide_name, so both go back through the
  // same resolver the rest of the read path uses.
  const records: Record<string, CompoundRecords> = {}
  const bucket = (compoundId: string) => (records[compoundId] ??= emptyRecords())
  const compoundByItemId = new Map(
    stackRows.map((row) => [row.id, resolveCompoundId(row.name)] as const),
  )

  for (const row of reminderRows as Array<ReminderRow & { id: string; dose: string | null }>) {
    const compoundId = compoundByItemId.get(row.stack_item_id)
    if (!compoundId || row.active === false) continue
    bucket(compoundId).reminders.push({
      id: row.id,
      time: row.time.slice(0, 5),
      daysOfWeek: row.days_of_week ?? [0, 1, 2, 3, 4, 5, 6],
      dose: row.dose ?? '',
    })
  }

  for (const row of (notes.data ?? []) as Array<{
    id: string
    peptide_name: string
    note: string
    url: string | null
    created_at: string
  }>) {
    const compoundId = resolveCompoundId(row.peptide_name)
    if (!compoundId) continue
    bucket(compoundId).notes.push({
      id: row.id,
      note: row.note,
      url: row.url ?? '',
      createdAt: row.created_at,
    })
  }

  for (const row of (sideEffects.data ?? []) as Array<{
    id: string
    peptide_name: string
    effect: string
    severity: number
    notes: string | null
    logged_at: string
  }>) {
    const compoundId = resolveCompoundId(row.peptide_name)
    if (!compoundId) continue
    bucket(compoundId).sideEffects.push({
      id: row.id,
      effect: row.effect,
      severity: row.severity,
      notes: row.notes ?? '',
      loggedAt: row.logged_at,
    })
  }

  return {
    tier: resolveTier(profile.data),
    stack,
    doseLog: toDoseLog(doseRows, stackRows, siteRows),
    cycle: toCycle(cycleRow, doseRows, expectedDosesOver(source, elapsedDays)),
    hasLabs: (bloodwork.count ?? 0) > 0,
    unmatched: unmatchedNames(stackRows),
    records,
  }
}
