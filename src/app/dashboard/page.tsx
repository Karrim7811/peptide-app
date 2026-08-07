'use client'

// The Mirror — one continuous field the user zooms into, where relationships
// between compounds are the primary object and the old routes become
// contextual tools that appear when a compound makes them relevant.
//
// ── Data source ─────────────────────────────────────────────────────────────
// Currently reads the bundled sample stack from catalog.ts. Live Supabase reads
// are a separate step, and they are not a drop-in: the live `cycles` table
// stores none of the fields this surface displays (they must be derived from
// start_date / on_weeks), and `injection_sites` is an injection LOG rather than
// the site geometry the handoff describes. See
// supabase/mirror_schema_reconciliation.sql for the mapping.
//
// ── Legacy routes ───────────────────────────────────────────────────────────
// The handoff's build order ends with redirecting /stack, /log, /cycle, /sites,
// /reconstitution, /checker and the rest into this surface. That step is NOT
// done, deliberately: the Mirror is read-only today — it has no write path for
// adding a stack item, logging a dose, or editing inventory. Redirecting those
// routes now would delete the app's only data entry rather than replace it.
// They stay reachable until the Mirror grows the corresponding writes.

import { useCallback, useMemo, useState } from 'react'
import MirrorShell, { type Crumb } from '@/components/mirror/MirrorShell'
import MirrorField from '@/components/mirror/MirrorField'
import MirrorPanel from '@/components/mirror/MirrorPanel'
import VerifyTabs from '@/components/mirror/VerifyTabs'
import AskBar from '@/components/mirror/AskBar'
import Ledger from '@/components/ledger/Ledger'
import { useGround } from '@/components/GroundProvider'
import { useMirrorNav, type VerifyTab } from '@/lib/mirror/useMirrorNav'
import { buildRegionLayer, buildWholeLayer, type GeometryPalette } from '@/lib/mirror/geometry'
import { createEntitlements } from '@/lib/entitlement'
import { GROUND_DEFINITIONS } from '@/lib/design/grounds'
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  COMPOUNDS,
  CYCLE,
  DOSE_LOG,
  SITES,
  STACK,
} from '@/lib/catalog'
import type { SubscriptionTier } from '@/types'

export default function MirrorPage() {
  const { ground } = useGround()
  const [tier, setTier] = useState<SubscriptionTier>('free')

  const ent = useMemo(
    () =>
      createEntitlements({
        tier,
        stack: STACK,
        doseLog: DOSE_LOG,
        sites: SITES,
        cycle: CYCLE,
        compounds: COMPOUNDS,
        hasLabs: true,
      }),
    [tier],
  )

  const nav = useMirrorNav({
    tensionRegionId: useCallback(() => ent.tensionCatId(), [ent]),
    leadCompoundId: useCallback(
      (regionId: string | null) => {
        if (!regionId) return null
        const resolved = ent.resolvedIn(regionId)
        const pool = resolved.length ? [...resolved].sort((a, b) => a.supplyDays - b.supplyDays) : null
        if (pool?.[0]) return pool[0].id
        return Object.values(COMPOUNDS).find((c) => c.catId === regionId)?.id ?? null
      },
      [ent],
    ),
  })

  const palette: GeometryPalette = useMemo(() => {
    const definition = GROUND_DEFINITIONS[ground]
    return {
      hueFor: (catId) => {
        const family = CATEGORY_BY_ID[catId]?.hue
        return family ? definition.hues[family] : definition.vars['--faint']!
      },
      tension: definition.hues.go,
      faint: definition.vars['--faint']!,
      faintest: definition.vars['--faintest']!,
    }
  }, [ground])

  // The field measures itself, so geometry is rebuilt from the rendered size
  // rather than a guess. MirrorField owns the measurement; it passes the size
  // back in by re-rendering with a fresh geometry object each frame it changes.
  const [fieldSize, setFieldSize] = useState({ width: 0, height: 0 })

  const geometry = useMemo(() => {
    const input = {
      width: fieldSize.width,
      height: fieldSize.height,
      entitlements: ent,
      categories: CATEGORIES,
      compounds: COMPOUNDS,
      palette,
    }
    if (nav.layer === 1) return buildWholeLayer(input)
    const regionId = nav.regionId ?? ent.tensionCatId() ?? CATEGORIES[0]!.id
    return buildRegionLayer(input, regionId, nav.layer >= 3 ? nav.compoundId : null, nav.orbit)
  }, [fieldSize, ent, palette, nav.layer, nav.regionId, nav.compoundId, nav.orbit])

  const crumbs: Crumb[] = useMemo(() => {
    const out: Crumb[] = [
      { label: 'WHOLE', onClick: nav.layer > 1 ? () => nav.zoomOut() : undefined },
    ]
    if (nav.layer >= 2 && nav.regionId) {
      out.push({
        label: CATEGORY_BY_ID[nav.regionId]?.label ?? 'REGION',
        onClick: nav.layer > 2 ? () => nav.openRegion(nav.regionId!) : undefined,
      })
    }
    if (nav.layer >= 3 && nav.compoundId) {
      out.push({
        label: (COMPOUNDS[nav.compoundId]?.name ?? 'COMPOUND').toUpperCase(),
        onClick: nav.layer > 3 ? () => nav.openCompound(nav.compoundId!) : undefined,
      })
    }
    if (nav.layer === 4) out.push({ label: 'VERIFY' })
    return out
  }, [nav])

  const onSelectNode = useCallback(
    (id: string) => {
      if (nav.layer === 1) nav.openRegion(id)
      else nav.openCompound(id)
    },
    [nav],
  )

  const handleNavigate = useCallback(
    (target: { compoundId?: string; regionId?: string }) => {
      if (target.compoundId) nav.openCompound(target.compoundId)
      else if (target.regionId) nav.openRegion(target.regionId)
    },
    [nav],
  )

  return (
    <MirrorShell
      crumbs={crumbs}
      layer={nav.layer}
      verifyTab={nav.verifyTab}
      onSelectVerifyTab={(tab: VerifyTab) => nav.setVerifyTab(tab)}
      isFree={ent.isFree}
      onToggleTier={() => setTier((prev) => (prev === 'free' ? 'pro' : 'free'))}
      onOpenLedger={() => nav.setLedgerOpen(true)}
      field={
        <MirrorField
          geometry={geometry}
          // Layer 4 deliberately drops all atmosphere. It is the verify surface.
          atmosphere={nav.layer !== 4}
          onSelectNode={onSelectNode}
          handlers={nav.fieldHandlers}
          onMeasure={setFieldSize}
          footerNote={
            ent.isFree
              ? `FREE · ${ent.resolvedCount} OF ${ent.stackCount} RESOLVED · 58 IN LIBRARY, ALL READABLE`
              : undefined
          }
          footerSub={nav.layer === 3 ? 'DRAG TO ROTATE · SCROLL TO ZOOM · ESC TO STEP OUT' : undefined}
        />
      }
      panel={
        nav.layer === 4 ? (
          <VerifyTabs tab={nav.verifyTab} compoundId={nav.compoundId} ent={ent} />
        ) : (
          <MirrorPanel
            layer={nav.layer}
            regionId={nav.regionId}
            compoundId={nav.compoundId}
            ent={ent}
            onSelectCompound={nav.openCompound}
            onSelectRegion={nav.openRegion}
            onOpenVerify={nav.openVerify}
          />
        )
      }
      footer={<AskBar ent={ent} onNavigate={handleNavigate} />}
      ledger={nav.ledgerOpen ? <Ledger ent={ent} onClose={() => nav.setLedgerOpen(false)} /> : null}
    />
  )
}
