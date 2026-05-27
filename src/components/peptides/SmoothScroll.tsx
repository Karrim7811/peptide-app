'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

// Mounts a Lenis instance for buttery scroll-linked motion on the
// specimen-sheet routes. Self-contained — no global side effects on
// legacy routes, since this only mounts inside the redesign layout.

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    })

    let raf = 0
    const tick = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  return null
}
