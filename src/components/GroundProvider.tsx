'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_GROUND,
  groundVars,
  isGround,
  type Ground,
} from '@/lib/design/grounds'

const STORAGE_KEY = 'cortex-ground'
const TRANSITION_MS = 420

interface GroundContextValue {
  ground: Ground
  setGround: (next: Ground) => void
}

const GroundContext = createContext<GroundContextValue | null>(null)

/**
 * Writes the active ground's custom properties onto the root element.
 *
 * Components never branch on the ground — they read `var(--panel)` and friends.
 * The server renders Midnight inline (see `groundStyleString` in the layout), so
 * the first paint is already correct and this only takes over on hydration.
 */
export default function GroundProvider({ children }: { children: ReactNode }) {
  const [ground, setGroundState] = useState<Ground>(DEFAULT_GROUND)

  // Restore the stored ground after mount. Reading localStorage during render
  // would desync server and client markup.
  useEffect(() => {
    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      // Private mode / storage disabled — the default ground is fine.
    }
    if (isGround(stored) && stored !== DEFAULT_GROUND) {
      setGroundState(stored)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    for (const [property, value] of Object.entries(groundVars(ground))) {
      root.style.setProperty(property, value)
    }
    root.dataset.ground = ground
  }, [ground])

  const setGround = useCallback((next: Ground) => {
    const root = document.documentElement
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!reduced) {
      root.style.setProperty(
        'transition',
        `background-color ${TRANSITION_MS}ms ease, color ${TRANSITION_MS}ms ease`,
      )
      window.setTimeout(() => root.style.removeProperty('transition'), TRANSITION_MS)
    }

    setGroundState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Non-fatal: the ground still applies for this session.
    }
  }, [])

  const value = useMemo(() => ({ ground, setGround }), [ground, setGround])

  return <GroundContext.Provider value={value}>{children}</GroundContext.Provider>
}

export function useGround(): GroundContextValue {
  const context = useContext(GroundContext)
  if (!context) {
    throw new Error('useGround must be used within a GroundProvider')
  }
  return context
}
