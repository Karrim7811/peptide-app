'use client'

import { useEffect, useState } from 'react'

// Ports `setupModeObserver()` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 326).
//
// Watches every `[data-mode]` section in the document with an
// IntersectionObserver (multi-step thresholds so ratio changes are tracked
// smoothly while scrolling), keeps a running intersectionRatio per element,
// and reports the `data-mode` of whichever element currently has the
// highest ratio. Consumed by `ParticleNetwork` (to pick the formation/color)
// and `Nav` (to tint the status dot).
export function useSceneMode(): number {
  const [mode, setMode] = useState(0)

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-mode]'))
    if (els.length === 0) return

    const ratios = new Map<Element, number>()

    const io = new IntersectionObserver(
      (ents) => {
        ents.forEach((e) => {
          ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0)
        })
        let best: Element | null = null
        let bestR = 0
        const entries = Array.from(ratios.entries())
        for (let i = 0; i < entries.length; i++) {
          const [el, r] = entries[i]
          if (r > bestR) {
            bestR = r
            best = el
          }
        }
        if (best) {
          const m = parseInt(best.getAttribute('data-mode') || '0', 10)
          setMode(m)
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    els.forEach((el) => io.observe(el))

    return () => io.disconnect()
  }, [])

  return mode
}
