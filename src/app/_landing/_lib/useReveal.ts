'use client'

import { useEffect } from 'react'
import { prefersReducedMotion } from './tokens'

// Ports `setupReveal()` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~line 352).
//
// Attaches a single IntersectionObserver to every `[data-reveal]` element in
// the document. Each element fades/slides in (opacity 0 -> 1, translateY
// 30px -> 0) the first time it crosses the 0.15 intersection threshold, then
// is unobserved. `data-reveal-delay` (ms) staggers the transition per
// element. Honors `prefers-reduced-motion`: reduced-motion users get
// opacity 1 immediately with no animation and no observer.
//
// Call once from the page shell after mount.
export function useReveal(): void {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (els.length === 0) return

    const reduce = prefersReducedMotion()

    if (reduce) {
      els.forEach((el) => {
        el.style.opacity = '1'
      })
      return
    }

    els.forEach((el) => {
      const delay = el.getAttribute('data-reveal-delay') || '0'
      el.style.opacity = '0'
      el.style.transform = 'translateY(30px)'
      el.style.transition = `opacity 1s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 1s cubic-bezier(.2,.7,.2,1) ${delay}ms`
    })

    const io = new IntersectionObserver(
      (ents) => {
        ents.forEach((e) => {
          if (e.isIntersecting) {
            const target = e.target as HTMLElement
            target.style.opacity = '1'
            target.style.transform = 'none'
            io.unobserve(target)
          }
        })
      },
      { threshold: 0.15 }
    )
    els.forEach((el) => io.observe(el))

    return () => io.disconnect()
  }, [])
}
