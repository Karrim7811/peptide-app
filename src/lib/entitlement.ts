// Tier entitlements for the Mirror.
//
// Free resolves ONE compound. Pro resolves all of them. Everything else on Free
// stays open: the full 58-compound library, every evidence grade and source, the
// dose log, and the reconstitution arithmetic.
//
// ── Why this module exists ──────────────────────────────────────────────────
// Eight separate paywall leaks appeared during the design of this surface. Every
// one had the same shape: a second consumer of a gated claim that gated itself,
// slightly differently, and drifted. Three rules prevent all of them, and this
// file is where they are enforced:
//
//   1. ONE ACCESSOR PER GATED CLAIM. `held`, `labsOn`, `siteUsage`,
//      `cycleReport` each own an answer that several surfaces read. Gating at
//      display sites reproduces the bug every time.
//
//   2. NEVER CONFLATE "LOCKED" WITH "NOT OWNED". The tier withholds
//      *resolution*; it never revokes *ownership*. Ownership-facing surfaces —
//      history, reconstitution maths, region membership, "regions holding
//      nothing of yours" — must be tier-blind. Only comparison and tension
//      maths filter by tier.
//
//   3. DERIVE, DON'T STORE. No aggregate is persisted. `siteUsage()` counts
//      from the filtered dose log at read time; a stored count cannot respond
//      to a filter, and that is precisely how the free tier leaked a locked
//      compound's injection history during design.
//
// ── Never gated, at any tier ────────────────────────────────────────────────
// Reconstitution arithmetic, cautions, contraindications, and interaction text —
// for locked compounds too. The pricing page prints this as a promise; this code
// has to keep it. There is deliberately no accessor here that would let a caller
// withhold them.
//
// This module is pure and framework-free so the same logic runs in a Server
// Component, a route handler, and the client without forking.

import type {
  Compound,
  Cycle,
  DoseLogEntry,
  Marker,
  Site,
  StackEntry,
} from '@/lib/catalog'
import type { SubscriptionTier } from '@/types'
import { isProTier } from '@/lib/tier'

/** How many compounds Free resolves. The allowance lives here and nowhere else. */
export const FREE_RESOLVED_ALLOWANCE = 1

export interface EntitlementInput {
  tier: SubscriptionTier
  stack: StackEntry[]
  doseLog: DoseLogEntry[]
  sites: Site[]
  cycle: Cycle | null
  compounds: Record<string, Compound>
  /** Whether the user has bloodwork attached at all. Pro additionally required. */
  hasLabs?: boolean
}

export interface SiteUsage {
  id: string
  label: string
  x: number
  y: number
  /** Derived from the tier-filtered dose log at read time. Never stored. */
  uses: number
  last: string
}

export interface CycleReport {
  day: number
  length: number
  start: string
  washout: string
  daysLeft: number
  /** The single sanctioned phrasing of the adherence claim. */
  adherenceLine: string
}

export interface Entitlements {
  tier: SubscriptionTier
  isFree: boolean

  /** Is this compound RESOLVED for this user? The only tier gate in the system. */
  held(id: string): boolean
  /** Is this compound the user's? Tier-blind, always. */
  ownedEntry(id: string): StackEntry | null
  /** Owned but withheld by tier — a third state, not "not yours". */
  lockedEntry(id: string): StackEntry | null
  /** The user's whole stack, tier-blind. Ownership, not resolution. */
  owned(): StackEntry[]
  /** Every stack entry in a category, tier-blind. Region membership is ownership. */
  ownedIn(catId: string): StackEntry[]
  /** Resolved stack entries in a category. For comparison/tension maths only. */
  resolvedIn(catId: string): StackEntry[]
  /** Owned-but-locked entries in a category, so a region can disclose both. */
  lockedIn(catId: string): StackEntry[]

  resolvedCount: number
  lockedCount: number
  stackCount: number

  /**
   * The user's dose history, optionally for one compound.
   *
   * TIER-BLIND, deliberately. History is an ownership-facing surface, and the
   * tier withholds resolution rather than ownership — the pricing page lists
   * "dose log and injection-site record" as open on Free. Only the maths BUILT
   * on the history (rotation, supply comparison) filters by tier; see
   * siteUsage(), which does.
   */
  history(compoundId?: string): DoseLogEntry[]

  /** Bloodwork readable: attached AND Pro. */
  labsOn: boolean
  /** Markers, or none when labs are off. */
  markers(all: Marker[]): Marker[]

  siteUsage(): SiteUsage[]
  cycleReport(): CycleReport | null
  /** Category under the most supply tension, across resolved compounds. */
  tensionCatId(): string | null
}

export function createEntitlements(input: EntitlementInput): Entitlements {
  const { tier, stack, doseLog, sites, cycle, compounds, hasLabs = false } = input
  const isFree = !isProTier(tier)

  // ── Rule 1: the one gate ──────────────────────────────────────────────────
  // Free resolves the first `FREE_RESOLVED_ALLOWANCE` entries of the stack.
  // Every derived view (nodes, edges, supply, cycle, ledger, rotation) narrows
  // through this, so nothing can leak a paid value through a side door.
  const resolvedIds = new Set(
    isFree
      ? stack.slice(0, FREE_RESOLVED_ALLOWANCE).map((entry) => entry.id)
      : stack.map((entry) => entry.id),
  )

  function held(id: string): boolean {
    return resolvedIds.has(id)
  }

  // ── Rule 2: ownership is tier-blind ───────────────────────────────────────
  function ownedEntry(id: string): StackEntry | null {
    return stack.find((entry) => entry.id === id) ?? null
  }

  function lockedEntry(id: string): StackEntry | null {
    if (!isFree) return null
    const entry = ownedEntry(id)
    return entry && !held(id) ? entry : null
  }

  function owned(): StackEntry[] {
    return stack
  }

  function ownedIn(catId: string): StackEntry[] {
    return stack.filter((entry) => compounds[entry.id]?.catId === catId)
  }

  function resolvedIn(catId: string): StackEntry[] {
    return ownedIn(catId).filter((entry) => held(entry.id))
  }

  function lockedIn(catId: string): StackEntry[] {
    if (!isFree) return []
    return ownedIn(catId).filter((entry) => !held(entry.id))
  }

  // Derived, never hardcoded. Copy that writes "1 of 6" by hand becomes a lie
  // the moment the allowance changes.
  const resolvedCount = stack.filter((entry) => held(entry.id)).length
  const lockedCount = isFree ? stack.length - resolvedCount : 0

  function history(compoundId?: string): DoseLogEntry[] {
    return compoundId ? doseLog.filter((row) => row.id === compoundId) : doseLog
  }

  const labsOn = hasLabs && !isFree

  function markers(all: Marker[]): Marker[] {
    return labsOn ? all : []
  }

  // ── Rule 3: derive, don't store ───────────────────────────────────────────
  function siteUsage(): SiteUsage[] {
    const visible = doseLog.filter((row) => held(row.id))
    return sites.map((site) => {
      const hits = visible.filter((row) => normaliseSite(row.site) === site.label)
      return {
        id: site.id,
        label: site.label,
        x: site.x,
        y: site.y,
        uses: hits.length,
        last: hits.length ? stripTime(hits[0]!.when) : '—',
      }
    })
  }

  // THE single source for how the cycle is reported. The tab and the ask bar
  // previously derived the adherence claim separately, which is exactly how one
  // came to print what the other withheld.
  function cycleReport(): CycleReport | null {
    if (!cycle) return null
    return {
      day: cycle.day,
      length: cycle.length,
      start: cycle.start,
      washout: cycle.washout,
      daysLeft: cycle.length - cycle.day,
      adherenceLine: isFree
        ? `Adherence is measured across your whole stack, so I am withholding it while ` +
          `${lockedCount} ${lockedCount === 1 ? 'compound is' : 'compounds are'} locked.`
        : `${cycle.adherence}% adherence with ${cycle.onTime} doses on time.`,
    }
  }

  function tensionCatId(): string | null {
    const pool = stack.filter((entry) => held(entry.id))
    const lowest = [...pool].sort((a, b) => a.supplyDays - b.supplyDays)[0]
    return lowest ? compounds[lowest.id]?.catId ?? null : null
  }

  return {
    tier,
    isFree,
    held,
    ownedEntry,
    lockedEntry,
    owned,
    ownedIn,
    resolvedIn,
    lockedIn,
    resolvedCount,
    lockedCount,
    stackCount: stack.length,
    history,
    labsOn,
    markers,
    siteUsage,
    cycleReport,
    tensionCatId,
  }
}

/** Dose logs abbreviate the site; SITES spells it out. */
function normaliseSite(value: string): string {
  return String(value).replace(/^ABD\b/, 'ABDOMEN').trim()
}

function stripTime(when: string): string {
  return when.replace(/\s+\d{1,2}:\d{2}$/, '')
}
