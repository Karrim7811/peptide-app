// The Janoshik report code is the one field on a vial that must never reach a
// browser. It resolves to a public page naming the client, the manufacturer and
// a supplier-prefixed batch number — see docs/superpowers/specs/2026-09-04-peptide-shop-design.md
// decision D3. catalog.ts is imported by nine 'use client' components, so a
// field living there is a field in the public bundle whether anything renders
// it or not. Nothing did; all 27 shipped anyway.

import { describe, expect, it } from 'vitest'
import { VIALS } from '@/lib/catalog'
import { REPORT_CODES } from '@/lib/vial-reports.server'

describe('report codes', () => {
  it('are not present on any client-reachable vial', () => {
    const leaked = VIALS.filter((vial) => 'reportCode' in vial)
    expect(leaked.map((vial) => vial.lot)).toEqual([])
  })

  it('cover every batch, keyed by slug', () => {
    expect(Object.keys(REPORT_CODES).sort()).toEqual(VIALS.map((vial) => vial.slug).sort())
  })

  it('still match the slug each printed label was written to', () => {
    const mismatched = VIALS.filter((vial) => !vial.slug.endsWith(REPORT_CODES[vial.slug]))
    expect(mismatched.map((vial) => vial.slug)).toEqual([])
  })
})
