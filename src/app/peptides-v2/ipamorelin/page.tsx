'use client'

import CrystalField from '@/components/peptides-v2/CrystalField'
import HeroVial from '@/components/peptides-v2/HeroVial'
import {
  ActionSection,
  CautionsSection,
  IdentitySection,
  MoleculeOverlay,
  UseSection,
} from '@/components/peptides-v2/Overlays'
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { useState } from 'react'

// Total scroll length — 5 viewport-heights gives each of the five zoom states
// roughly one viewport of scroll travel. Long enough to feel like descent,
// short enough that nobody loses the thread.
const SCROLL_VH = 500

/**
 * Vial wrapper. Subscribes to the powderHeight MotionValue and re-renders
 * the SVG on change. Only visible for the vial-reveal scroll window, so the
 * extra render churn is bounded.
 */
function VialReveal({
  progress,
  powderHeight,
}: {
  progress: MotionValue<number>
  powderHeight: MotionValue<number>
}) {
  const vialY = useTransform(progress, [0.88, 0.95], ['60vh', '0vh'])
  const vialOpacity = useTransform(progress, [0.88, 0.92, 0.95], [0, 0.7, 1])
  const vialScale = useTransform(progress, [0.88, 0.95], [1.2, 1.0])

  // Glint: 0 until the vial appears, settles to a 0.3 baseline that oscillates
  // slowly post-reveal. Driven by a self-incrementing timer rather than scroll,
  // since glint shouldn't reverse when the user scrolls up.
  const [powder, setPowder] = useState<number>(0)
  useMotionValueEvent(powderHeight, 'change', (v) => setPowder(v))

  return (
    // Two nested motion.divs so vialY (rise from below) and the -50% centering
    // translate live on different elements — framer-motion can't compose them
    // into one transform string otherwise.
    <motion.div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        x: '-50%',
        y: '-50%',
        zIndex: 4,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        style={{
          y: vialY,
          opacity: vialOpacity,
          scale: vialScale,
          transformOrigin: 'center center',
        }}
      >
        <HeroVial
          name="Ipamorelin"
          peptideName="IPAMORELIN"
          powderHeight={powder}
          powderColor="#A88B5E"
          glint={0.3}
          size={1}
        />
      </motion.div>
    </motion.div>
  )
}

export default function IpamorelinV2Page() {
  const { scrollYProgress } = useScroll()
  // Spring-smooth the raw scroll progress so jumpy wheel input and trackpad
  // momentum read as optical depth, not as snap-jumps.
  const progress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 })

  // Wordmark: scale 1 → 1.3 and fade out 1 → 0 over scroll 0–25%.
  const wordmarkScale = useTransform(progress, [0, 0.25], [1, 1.3])
  const wordmarkOpacity = useTransform(progress, [0, 0.10, 0.25], [1, 1, 0])

  // Powder fills 0 → 0.35 over scroll 0.90 → 0.97 — slightly behind the
  // particle pour so the heap feels like it accumulates as dust arrives.
  const powderHeight = useTransform(progress, [0.90, 0.97], [0, 0.35])

  return (
    <>
      {/* Scroll spacer — provides scroll travel. The visual layer below is
          position:fixed so it sits over this and stays put while we scroll. */}
      <div
        style={{
          height: `${SCROLL_VH}vh`,
          width: '100%',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Fixed visual surface — canvases, wordmark, content overlays, molecule, vial */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#EDE3D0',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <CrystalField progress={progress}>
          <motion.h1
            style={{
              position: 'fixed',
              top: '45%',
              left: '50%',
              x: '-50%',
              y: '-50%',
              margin: 0,
              padding: 0,
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontWeight: 300,
              fontStyle: 'normal',
              fontSize: 'clamp(4rem, 12vw, 16rem)',
              letterSpacing: '0.04em',
              lineHeight: 1,
              color: '#1A1915',
              whiteSpace: 'nowrap',
              zIndex: 1,
              pointerEvents: 'none',
              userSelect: 'none',
              scale: wordmarkScale,
              opacity: wordmarkOpacity,
            }}
          >
            IPAMORELIN
          </motion.h1>
        </CrystalField>

        <IdentitySection progress={progress} />
        <ActionSection progress={progress} />
        <UseSection progress={progress} />
        <CautionsSection progress={progress} />
        <MoleculeOverlay progress={progress} />

        <VialReveal progress={progress} powderHeight={powderHeight} />
      </div>
    </>
  )
}
