'use client'

import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import IpamorelinMolecule from './IpamorelinMolecule'

// The Microscope.
//
// One molecule SVG, anchored to the page, scroll-linked so it grows and
// drifts as the reader descends through the specimen sheet. A barely-
// perceptible continuous rotation (~0.1 RPM, one full turn every ~10
// minutes) keeps it alive without ever feeling like "motion."

export default function Microscope() {
  const { scrollYProgress } = useScroll()

  // Spring-smooth the raw scroll progress so transforms aren't jittery.
  const sp = useSpring(scrollYProgress, { stiffness: 60, damping: 24, mass: 0.6 })

  // Scale curve: starts at 1 in the hero (~0% scroll), grows to 1.5 at
  // mid-scroll (~35%), then shrinks down past the bookplate to a small
  // spec mark by the footer (~95%).
  const scale = useTransform(sp, [0, 0.35, 0.7, 1], [1, 1.5, 0.55, 0.25])

  // Horizontal drift: centered in hero, drifts right ~22vw by mid-scroll,
  // returns to center near the footer where it becomes the spec mark.
  const x = useTransform(sp, [0, 0.35, 0.7, 1], ['0vw', '22vw', '18vw', '0vw'])

  // Vertical drift: stays roughly viewport-centered (translateY relative
  // to its sticky anchor), then sinks toward the footer at the end.
  const y = useTransform(sp, [0, 0.5, 1], ['-2vh', '4vh', '12vh'])

  // Opacity: fully visible in hero & mid-page, fades a touch around the
  // paywall so it doesn't compete, returns at the footer.
  const opacity = useTransform(sp, [0, 0.5, 0.75, 1], [0.92, 0.78, 0.45, 0.6])

  // Continuous slow rotation (~0.1 RPM = 6 deg/sec ÷ 60 = 0.1 turn/min ⇒
  // 600s per turn). Animated independently of scroll.
  const [rot, setRot] = useState(0)
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setRot(r => (r + dt * 0.6) % 360) // 0.6 deg/sec ≈ 0.1 RPM
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
    >
      <motion.div
        style={{ scale, x, y, opacity, rotate: rot }}
        className="will-change-transform"
      >
        <IpamorelinMolecule
          className="w-[min(78vw,560px)] h-auto text-apo-brass/45"
          stroke="currentColor"
          accent="#A88B5E"
          label={false}
        />
      </motion.div>
    </div>
  )
}
