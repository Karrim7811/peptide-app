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

export interface MirrorData {
  tier: SubscriptionTier
  stack: StackEntry[]
  doseLog: DoseLogEntry[]
  cycle: Cycle | null
  hasLabs: boolean
  /** Stack rows whose name matched nothing in the library, surfaced not hidden. */
  unmatched: string[]
}

export const EMPTY_MIRROR_DATA: MirrorData = {
  tier: 'free',
  stack: [],
  doseLog: [],
  cycle: null,
  hasLabs: false,
  unmatched: [],
}

export async function loadMirrorData(): Promise<MirrorData> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return EMPTY_MIRROR_DATA

  const [profile, stackItems, inventory, reminders, doseLogs, injectionSites, cycles, bloodwork] =
    await Promise.all([
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

  return {
    tier: resolveTier(profile.data),
    stack,
    doseLog: toDoseLog(doseRows, stackRows, siteRows),
    cycle: toCycle(cycleRow, doseRows, expectedDosesOver(source, elapsedDays)),
    hasLabs: (bloodwork.count ?? 0) > 0,
    unmatched: unmatchedNames(stackRows),
  }
}
