'use client'

import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import IpamorelinMolecule from './IpamorelinMolecule'

// The Microscope.
//
// Five discrete zoom states tied to scroll progress through the specimen
// sheet. The molecule stays centered — like a specimen on a fixed stage —
// while the lens progressively magnifies, reveals sub-structure, then
// pulls back to context and finally collapses to a spec mark.
//
//   State 1 (0–15%)   — 0.6×, full topology, no HUD
//   State 2 (15–35%)  — 2×,   faint reticle, "100× MAG"
//   State 3 (35–60%)  — 4×,   sub-structure visible, scale bar, "400× MAG"
//   State 4 (60–85%)  — 1.5×, side annotations, "PROFILE VIEW"
//   State 5 (85–100%) — 0.25×, HUD fades, spec mark
//
// A continuous ~0.6°/sec (~0.1 RPM) rotation runs independently of scroll
// so the molecule never feels frozen between states.

export default function Microscope() {
  const { scrollYProgress } = useScroll()

  // Spring smoothing — "focus-found" settle rather than a linear pan.
  // Brief specifies stiffness 80 / damping 30; on framer-motion's spring
  // this lands slightly over-damped (smooth settle, no overshoot), which
  // reads as confident-optics rather than springy.
  const sp = useSpring(scrollYProgress, { stiffness: 80, damping: 30 })

  // Zoom curve threaded through the five states.
  const scale = useTransform(
    sp,
    [0, 0.15, 0.35, 0.6, 0.85, 1.0],
    [0.6, 0.6, 2.0, 4.0, 1.5, 0.25]
  )

  // Detail layer: faint suggestion in state 2, full at state 3, fades
  // through state 4, gone by state 5.
  const subDetailOp = useTransform(
    sp,
    [0.15, 0.22, 0.4, 0.58, 0.72, 0.85],
    [0, 0.5, 1.0, 1.0, 0.35, 0]
  )

  // Side annotations — appear only during the pull-back (state 4).
  const annotationsOp = useTransform(
    sp,
    [0.58, 0.65, 0.82, 0.88],
    [0, 0.55, 0.55, 0]
  )

  // Cross-hair reticle — states 2 (lighter) and 3 (slightly heavier).
  const reticleOp = useTransform(
    sp,
    [0.13, 0.18, 0.35, 0.42, 0.58, 0.65],
    [0, 0.15, 0.15, 0.2, 0.2, 0]
  )

  // Scale bar — state 3 only.
  const scaleBarOp = useTransform(
    sp,
    [0.35, 0.42, 0.58, 0.65],
    [0, 0.6, 0.6, 0]
  )

  // Soft radial vignette — intensifies at deep zoom, fades for distant
  // states and the pull-back.
  const vignetteOp = useTransform(
    sp,
    [0.15, 0.25, 0.45, 0.6, 0.85],
    [0, 0.35, 0.55, 0.2, 0]
  )

  // Mag readouts — three overlapping spans, only one visible per state.
  const mag100Op = useTransform(sp, [0.13, 0.18, 0.33, 0.37], [0, 1, 1, 0])
  const mag400Op = useTransform(sp, [0.35, 0.4, 0.58, 0.62], [0, 1, 1, 0])
  const profileOp = useTransform(sp, [0.6, 0.65, 0.82, 0.87], [0, 1, 1, 0])

  // Continuous slow rotation — independent of scroll so the molecule
  // breathes between zoom states.
  const [rot, setRot] = useState(0)
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setRot(r => (r + dt * 0.6) % 360)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 text-apo-brass"
    >
      {/* Vignette — soft radial brass darkening at the viewport edges. */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: vignetteOp,
          background:
            'radial-gradient(circle at center, transparent 35%, rgba(168,139,94,0.18) 100%)',
        }}
      />

      {/* Reticle — long cross-hairs through viewport center, with a
          small focus-ring at the crossing. Fixed in screen space; the
          molecule moves under the lens, never with it. */}
      <motion.div className="absolute inset-0" style={{ opacity: reticleOp }}>
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-current" />
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-current" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-current rounded-full" />
      </motion.div>

      {/* Molecule — centered, scale + slow rotation only. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          style={{ scale, rotate: rot }}
          className="will-change-transform"
        >
          <IpamorelinMolecule
            className="w-[min(78vw,560px)] h-auto text-apo-brass/55"
            label={false}
            subDetailOpacity={subDetailOp}
            annotationOpacity={annotationsOp}
          />
        </motion.div>
      </div>

      {/* Scale bar — bottom-left, state 3 only. */}
      <motion.div
        className="absolute bottom-10 left-8 flex flex-col items-start gap-1.5"
        style={{ opacity: scaleBarOp }}
      >
        <div className="h-px w-12 bg-current" />
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase">
          50 Å
        </span>
      </motion.div>

      {/* Mag readout — bottom-right, three overlapping spans hand off
          between states. The invisible longest label sets the box width. */}
      <div className="absolute bottom-10 right-8 font-mono text-[11px] tracking-[0.22em] uppercase">
        <div className="relative inline-block text-right">
          <span className="invisible">PROFILE VIEW</span>
          <motion.span
            className="absolute right-0 top-0"
            style={{ opacity: mag100Op }}
          >
            100× MAG
          </motion.span>
          <motion.span
            className="absolute right-0 top-0"
            style={{ opacity: mag400Op }}
          >
            400× MAG
          </motion.span>
          <motion.span
            className="absolute right-0 top-0"
            style={{ opacity: profileOp }}
          >
            PROFILE VIEW
          </motion.span>
        </div>
      </div>
    </div>
  )
}
