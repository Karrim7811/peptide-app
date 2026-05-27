'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

// Brass small-caps section header with self-drawing left/right rules.
// Animates in once when scrolled into view.

type Props = {
  label: string
}

export default function SectionHeader({ label }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px -10% 0px' })

  return (
    <div ref={ref} className="my-14 flex items-center justify-center gap-4 select-none">
      <motion.span
        className="block h-px bg-apo-brass origin-right"
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.9, ease: [0.2, 0.6, 0.2, 1] }}
        style={{ flex: 1, maxWidth: 120 }}
      />
      <motion.span
        className="font-mono text-[11px] uppercase text-apo-brass tracking-specimen-caps"
        initial={{ opacity: 0, y: 6 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
        transition={{ duration: 0.6, delay: 0.25, ease: [0.2, 0.6, 0.2, 1] }}
      >
        {label}
      </motion.span>
      <motion.span
        className="block h-px bg-apo-brass origin-left"
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.9, ease: [0.2, 0.6, 0.2, 1] }}
        style={{ flex: 1, maxWidth: 120 }}
      />
    </div>
  )
}
