// The Janoshik report code is the one field on a vial that must never reach a
// browser. It resolves to a public page naming the client, the manufacturer and
// a supplier-prefixed batch number — decision D3 in
// docs/superpowers/specs/2026-09-04-peptide-shop-design.md.
//
// catalog.ts is imported by nine 'use client' components, so anything living on
// Vial is in the public bundle whether or not it renders. Until 2026-09-04 all
// 27 codes were there twice over: as a reportCode field, and as the tail of
// every slug. Both are gone; the last test here is what keeps them gone.

import { describe, expect, it } from 'vitest'
import { VIALS } from '@/lib/catalog'
import { REPORT_CODES } from '@/lib/vial-reports.server'

describe('report codes', () => {
  it('are not a field on any client-reachable vial', () => {
    const leaked = VIALS.filter((vial) => 'reportCode' in vial)
    expect(leaked.map((vial) => vial.lot)).toEqual([])
  })

  it('cover every batch, keyed by lot', () => {
    expect(Object.keys(REPORT_CODES).sort()).toEqual(VIALS.map((vial) => vial.lot).sort())
  })

  // The tripwire. Anything that puts a code back into the catalog — a restored
  // field, a slug that embeds it again, a stray comment — fails here.
  it('appear nowhere in the client-reachable catalog', () => {
    const serialized = JSON.stringify(VIALS)
    const found = Object.values(REPORT_CODES).filter((code) => serialized.includes(code))
    expect(found).toEqual([])
  })

  it('leaves every slug unique after the code was stripped', () => {
    expect(new Set(VIALS.map((vial) => vial.slug)).size).toBe(VIALS.length)
  })
})
