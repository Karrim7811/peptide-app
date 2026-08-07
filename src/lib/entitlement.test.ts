// One test per paywall-leak shape documented in the design handoff.
//
// These run against the REAL catalog sample data rather than fixtures, because
// every leak found during design came from a real combination of stack order,
// dose-log contents and site labels — not from a synthetic edge case.

import { describe, expect, it } from 'vitest'
import { createEntitlements, FREE_RESOLVED_ALLOWANCE } from '@/lib/entitlement'
import {
  COMPOUNDS,
  CYCLE,
  DOSE_LOG,
  SITES,
  STACK,
  assertGradeIntegrity,
  mismatchedCompounds,
  COMPOUND_LIST,
  CATEGORIES,
  gradeFor,
} from '@/lib/catalog'
import type { SubscriptionTier } from '@/types'

function build(tier: SubscriptionTier, hasLabs = true) {
  return createEntitlements({
    tier,
    stack: STACK,
    doseLog: DOSE_LOG,
    sites: SITES,
    cycle: CYCLE,
    compounds: COMPOUNDS,
    hasLabs,
  })
}

const free = () => build('free')
const pro = () => build('pro')

// The first stack entry is what Free resolves; the rest are owned-but-locked.
const RESOLVED_ID = STACK[0]!.id
const LOCKED_ID = STACK[1]!.id

describe('the one gate', () => {
  it('resolves exactly the free allowance on free', () => {
    expect(free().resolvedCount).toBe(FREE_RESOLVED_ALLOWANCE)
    expect(free().held(RESOLVED_ID)).toBe(true)
    expect(free().held(LOCKED_ID)).toBe(false)
  })

  it('resolves the whole stack on pro', () => {
    expect(pro().resolvedCount).toBe(STACK.length)
    expect(pro().lockedCount).toBe(0)
    expect(STACK.every((entry) => pro().held(entry.id))).toBe(true)
  })

  it('treats lifetime identically to pro', () => {
    const lifetime = build('lifetime')
    expect(lifetime.isFree).toBe(false)
    expect(lifetime.resolvedCount).toBe(STACK.length)
  })

  it('derives the counts rather than hardcoding them', () => {
    expect(free().resolvedCount + free().lockedCount).toBe(STACK.length)
  })
})

describe('locked is not the same as not-owned', () => {
  it('still reports a locked compound as owned', () => {
    expect(free().ownedEntry(LOCKED_ID)).not.toBeNull()
  })

  it('reports region membership tier-blind', () => {
    const catId = COMPOUNDS[LOCKED_ID]!.catId
    expect(free().ownedIn(catId).map((e) => e.id)).toContain(LOCKED_ID)
  })

  it('separates locked from resolved within a region', () => {
    const catId = COMPOUNDS[LOCKED_ID]!.catId
    expect(free().lockedIn(catId).map((e) => e.id)).toContain(LOCKED_ID)
    expect(free().resolvedIn(catId).map((e) => e.id)).not.toContain(LOCKED_ID)
  })

  it('exposes lockedEntry only on free, and only for withheld compounds', () => {
    expect(free().lockedEntry(LOCKED_ID)).not.toBeNull()
    expect(free().lockedEntry(RESOLVED_ID)).toBeNull()
    expect(pro().lockedEntry(LOCKED_ID)).toBeNull()
  })
})

describe('site usage is derived, not stored', () => {
  // The documented leak: a stored `uses` count cannot respond to a tier filter,
  // so the free tier printed a locked compound's injection history.
  it('counts only injections of resolved compounds on free', () => {
    const total = free().siteUsage().reduce((sum, site) => sum + site.uses, 0)
    const expected = DOSE_LOG.filter(
      (row) => row.id === RESOLVED_ID && SITES.some((s) => s.label === row.site.replace(/^ABD\b/, 'ABDOMEN')),
    ).length
    expect(total).toBe(expected)
  })

  it('counts every mapped injection on pro', () => {
    const total = pro().siteUsage().reduce((sum, site) => sum + site.uses, 0)
    const mapped = DOSE_LOG.filter((row) =>
      SITES.some((s) => s.label === row.site.replace(/^ABD\b/, 'ABDOMEN')),
    ).length
    expect(total).toBe(mapped)
  })

  it('reveals strictly more on pro than on free', () => {
    const freeTotal = free().siteUsage().reduce((sum, s) => sum + s.uses, 0)
    const proTotal = pro().siteUsage().reduce((sum, s) => sum + s.uses, 0)
    expect(proTotal).toBeGreaterThan(freeTotal)
  })

  it('never reports a last-used date sourced from a locked compound', () => {
    const lockedSites = new Set(
      DOSE_LOG.filter((row) => !free().held(row.id)).map((row) =>
        row.site.replace(/^ABD\b/, 'ABDOMEN'),
      ),
    )
    const resolvedSites = new Set(
      DOSE_LOG.filter((row) => free().held(row.id)).map((row) =>
        row.site.replace(/^ABD\b/, 'ABDOMEN'),
      ),
    )
    for (const site of free().siteUsage()) {
      if (lockedSites.has(site.label) && !resolvedSites.has(site.label)) {
        expect(site.last).toBe('—')
        expect(site.uses).toBe(0)
      }
    }
  })
})

describe('cycle reporting has a single source', () => {
  it('withholds adherence on free and says why', () => {
    const report = free().cycleReport()!
    expect(report.adherenceLine).toContain('withholding')
    expect(report.adherenceLine).not.toContain(`${CYCLE.adherence}%`)
  })

  it('reports adherence on pro', () => {
    expect(pro().cycleReport()!.adherenceLine).toContain(`${CYCLE.adherence}%`)
  })

  it('reports cycle geometry tier-blind', () => {
    expect(free().cycleReport()!.daysLeft).toBe(pro().cycleReport()!.daysLeft)
  })
})

describe('labs', () => {
  it('requires both attachment and pro', () => {
    expect(build('pro', true).labsOn).toBe(true)
    expect(build('pro', false).labsOn).toBe(false)
    expect(build('free', true).labsOn).toBe(false)
  })

  it('returns no markers when labs are off', () => {
    expect(build('free', true).markers([{ key: 'x' } as never])).toHaveLength(0)
  })
})

describe('tension maths filter by tier', () => {
  it('considers only resolved compounds', () => {
    expect(free().tensionCatId()).toBe(COMPOUNDS[RESOLVED_ID]!.catId)
  })

  it('finds the genuinely thinnest compound on pro', () => {
    const thinnest = [...STACK].sort((a, b) => a.supplyDays - b.supplyDays)[0]!
    expect(pro().tensionCatId()).toBe(COMPOUNDS[thinnest.id]!.catId)
  })
})

describe('catalog integrity', () => {
  it('maps every grade one-to-one from evidence, with no cv tiebreaker', () => {
    expect(() => assertGradeIntegrity()).not.toThrow()
  })

  it('does not let cv co-vary with grade', () => {
    // Semaglutide (cv 5) and Somatropin (cv 1) share an evidence level; an
    // earlier revision used cv as a tiebreaker and fabricated a distinction.
    const a = COMPOUNDS['semaglutide']!
    const b = COMPOUNDS['somatropin']!
    expect(a.evidence).toBe(b.evidence)
    expect(a.grade).toBe(b.grade)
    expect(a.cv).not.toBe(b.cv)
  })

  it('carries the expected library shape', () => {
    expect(COMPOUND_LIST).toHaveLength(58)
    expect(CATEGORIES).toHaveLength(12)
  })

  it('derives grades only through gradeFor', () => {
    for (const entry of COMPOUND_LIST) {
      expect(entry.grade).toBe(gradeFor(entry.evidence))
    }
  })

  it('flags the library disagreeing with itself without flooding', () => {
    const flagged = mismatchedCompounds()
    expect(flagged.map((e) => e.id)).toContain('ghk-cu-copper-peptide')
    // A detector that fires on more than a handful is noise, not a signal.
    expect(flagged.length).toBeLessThan(6)
  })
})
