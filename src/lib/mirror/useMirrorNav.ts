'use client'

// Navigation for the Mirror: four zoom layers over one field.
//
//   1 WHOLE    your regions as glowing nodes          (default)
//   2 REGION   compounds in one category, on rings    (click a region / scroll down)
//   3 COMPOUND one compound centred, partners orbiting (click a compound)
//   4 VERIFY   THE MATH / THE RECORD / ROTATION / CYCLE (click a tool)
//
// The breadcrumb is the only nav. Scrolling over the field zooms; Esc goes one
// layer out, or closes the Ledger first. Drag rotates the orbit — layer 3 only,
// because that is the only layer with an orbit to turn, and the footer
// advertises it, so it has to exist.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/** Wheel events closer together than this are ignored. */
const WHEEL_THROTTLE_MS = 480
/** Trackpad jitter below this is not a zoom intent. */
const WHEEL_DEADZONE_PX = 12
/** Horizontal drag distance to orbit-radians. */
const DRAG_TO_RADIANS = 0.009

export type MirrorLayer = 1 | 2 | 3 | 4
export type VerifyTab = 'math' | 'record' | 'rotation' | 'cycle'

export const VERIFY_TABS: ReadonlyArray<{ id: VerifyTab; label: string }> = [
  { id: 'math', label: 'THE MATH' },
  { id: 'record', label: 'THE RECORD' },
  { id: 'rotation', label: 'ROTATION' },
  { id: 'cycle', label: 'CYCLE' },
]

export interface MirrorNavState {
  layer: MirrorLayer
  regionId: string | null
  compoundId: string | null
  verifyTab: VerifyTab
  ledgerOpen: boolean
  bloodworkOpen: boolean
  /** Orbit rotation in radians, layer 3 only. */
  orbit: number
}

export interface MirrorNavTargets {
  /** Category to enter when zooming in from layer 1 — the one under tension. */
  tensionRegionId: () => string | null
  /** Compound to enter when zooming in from layer 2 — the thinnest resolved one. */
  leadCompoundId: (regionId: string | null) => string | null
}

export interface MirrorNav extends MirrorNavState {
  openRegion(id: string): void
  openCompound(id: string): void
  openVerify(tab: VerifyTab): void
  setVerifyTab(tab: VerifyTab): void
  setLedgerOpen(open: boolean): void
  setBloodworkOpen(open: boolean): void
  zoomIn(): void
  zoomOut(): void
  /** Bind to the field element. */
  fieldHandlers: {
    onWheel: (event: React.WheelEvent) => void
    onPointerDown: (event: React.PointerEvent) => void
    onPointerMove: (event: React.PointerEvent) => void
    onPointerUp: (event: React.PointerEvent) => void
    onPointerCancel: (event: React.PointerEvent) => void
    style: { cursor: string }
  }
}

const INITIAL: MirrorNavState = {
  layer: 1,
  regionId: null,
  compoundId: null,
  verifyTab: 'math',
  ledgerOpen: false,
  bloodworkOpen: false,
  orbit: 0,
}

export function useMirrorNav(targets: MirrorNavTargets): MirrorNav {
  const [state, setState] = useState<MirrorNavState>(INITIAL)

  // Kept in refs so the wheel handler stays referentially stable and does not
  // re-subscribe the key listener on every state change.
  const lastWheelAt = useRef(0)
  const drag = useRef<{ startX: number; startOrbit: number } | null>(null)
  const targetsRef = useRef(targets)
  targetsRef.current = targets

  const openRegion = useCallback((id: string) => {
    setState((prev) => ({ ...prev, layer: 2, regionId: id, compoundId: null, ledgerOpen: false }))
  }, [])

  const openCompound = useCallback((id: string) => {
    setState((prev) => ({ ...prev, layer: 3, compoundId: id, ledgerOpen: false }))
  }, [])

  const openVerify = useCallback((tab: VerifyTab) => {
    setState((prev) => ({ ...prev, layer: 4, verifyTab: tab, ledgerOpen: false }))
  }, [])

  const setVerifyTab = useCallback((tab: VerifyTab) => {
    setState((prev) => ({ ...prev, verifyTab: tab }))
  }, [])

  const setLedgerOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, ledgerOpen: open, bloodworkOpen: false }))
  }, [])

  const setBloodworkOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, bloodworkOpen: open, ledgerOpen: false }))
  }, [])

  const zoomIn = useCallback(() => {
    setState((prev) => {
      if (prev.layer === 1) {
        const next = targetsRef.current.tensionRegionId()
        return next ? { ...prev, layer: 2, regionId: next, compoundId: null, ledgerOpen: false } : prev
      }
      if (prev.layer === 2) {
        const next = targetsRef.current.leadCompoundId(prev.regionId)
        return next ? { ...prev, layer: 3, compoundId: next, ledgerOpen: false } : prev
      }
      if (prev.layer === 3) return { ...prev, layer: 4 }
      return prev
    })
  }, [])

  const zoomOut = useCallback(() => {
    setState((prev) => {
      if (prev.layer === 4) return { ...prev, layer: 3 }
      if (prev.layer === 3) return { ...prev, layer: 2, compoundId: null }
      if (prev.layer === 2) return { ...prev, layer: 1, regionId: null }
      return prev
    })
  }, [])

  // Esc closes the Ledger first, then walks out one layer at a time.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setState((prev) => {
        // Overlays close before the layer walks out.
        if (prev.bloodworkOpen) return { ...prev, bloodworkOpen: false }
        if (prev.ledgerOpen) return { ...prev, ledgerOpen: false }
        if (prev.layer === 4) return { ...prev, layer: 3 }
        if (prev.layer === 3) return { ...prev, layer: 2, compoundId: null }
        if (prev.layer === 2) return { ...prev, layer: 1, regionId: null }
        return prev
      })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const onWheel = useCallback(
    (event: React.WheelEvent) => {
      const now = Date.now()
      if (now - lastWheelAt.current < WHEEL_THROTTLE_MS) return
      if (Math.abs(event.deltaY) < WHEEL_DEADZONE_PX) return
      lastWheelAt.current = now
      if (event.deltaY < 0) zoomIn()
      else zoomOut()
    },
    [zoomIn, zoomOut],
  )

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      // Layer 3 is the only layer with an orbit to turn.
      if (state.layer !== 3) return
      drag.current = { startX: event.clientX, startOrbit: state.orbit }
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Older engines without pointer capture — dragging still works, it just
        // stops if the pointer leaves the element.
      }
    },
    [state.layer, state.orbit],
  )

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const active = drag.current
    if (!active) return
    const delta = (event.clientX - active.startX) * DRAG_TO_RADIANS
    setState((prev) => (prev.layer === 3 ? { ...prev, orbit: active.startOrbit + delta } : prev))
  }, [])

  const onPointerUp = useCallback(() => {
    drag.current = null
  }, [])

  const fieldHandlers = useMemo(
    () => ({
      onWheel,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      style: { cursor: state.layer === 3 ? 'grab' : 'default' },
    }),
    [onWheel, onPointerDown, onPointerMove, onPointerUp, state.layer],
  )

  return {
    ...state,
    openRegion,
    openCompound,
    openVerify,
    setVerifyTab,
    setLedgerOpen,
    setBloodworkOpen,
    zoomIn,
    zoomOut,
    fieldHandlers,
  }
}
