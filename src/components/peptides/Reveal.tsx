'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, ReactNode } from 'react'

// Subtle section-entry animation: fade + 12px lift, 600ms ease-out-quart.
// Fires once when the element enters the viewport.

type Props = {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'header' | 'article'
}

export default function Reveal({ children, delay = 0, className, as = 'div' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-8% 0px -8% 0px' })
  const MotionTag = motion[as] as typeof motion.div

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.6, delay, ease: [0.165, 0.84, 0.44, 1] }}
    >
      {children}
    </MotionTag>
  )
}
