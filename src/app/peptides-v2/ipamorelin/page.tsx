'use client'

import CrystalField from '@/components/peptides-v2/CrystalField'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

// Total scroll length — 5 viewport-heights gives each of the five zoom states
// roughly one viewport of scroll travel. Long enough to feel like descent,
// short enough that nobody loses the thread.
const SCROLL_VH = 500

export default function IpamorelinV2Page() {
  const { scrollYProgress } = useScroll()
  // Spring-smooth the raw scroll progress so jumpy wheel input and trackpad
  // momentum read as optical depth, not as snap-jumps.
  const progress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 })

  // Wordmark: scale 1 → 1.3 and fade out 1 → 0 over scroll 0–25%.
  const wordmarkScale = useTransform(progress, [0, 0.25], [1, 1.3])
  const wordmarkOpacity = useTransform(progress, [0, 0.10, 0.25], [1, 1, 0])

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

      {/* Fixed visual surface — canvases, wordmark, content overlays */}
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
      </div>
    </>
  )
}
