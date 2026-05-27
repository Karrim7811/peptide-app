'use client'

import { motion, type MotionValue, useTransform } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'

const INK = '#1A1915'
const BRASS = '#A88B5E'
const BRASS_DEEP = '#7D6638'
const BRASS_LIGHT = '#C9A876'

const MONO = 'var(--font-jetbrains-mono), ui-monospace, Menlo, monospace'
const SERIF = '"Cormorant Garamond", Georgia, serif'

/** Four-stop fade — opacity rises from 0 to 1 over [a,b], holds, falls 1 to 0 over [c,d]. */
function useFadeRange(
  progress: MotionValue<number>,
  a: number,
  b: number,
  c: number,
  d: number,
) {
  return useTransform(progress, [a, b, c, d], [0, 1, 1, 0])
}

interface SectionLabelProps {
  progress: MotionValue<number>
  label: string
  range: [number, number, number, number]
}

export function SectionLabel({ progress, label, range }: SectionLabelProps) {
  const opacity = useFadeRange(progress, ...range)
  return (
    <motion.div
      style={{
        position: 'fixed',
        top: '14%',
        left: '50%',
        x: '-50%',
        opacity,
        zIndex: 3,
        pointerEvents: 'none',
        fontFamily: MONO,
        fontWeight: 400,
        fontSize: '12px',
        letterSpacing: '0.7em',
        color: BRASS_DEEP,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </motion.div>
  )
}

interface FloatingFieldProps {
  progress: MotionValue<number>
  range: [number, number, number, number]
  /** Viewport-percent left position (50 = center). */
  x: number
  /** Viewport-percent top position. */
  y: number
  label: string
  /** ReactNode so values can mix mono and serif inline. */
  children: ReactNode
  /** Optional max width so prose wraps gracefully. */
  maxWidth?: number
  /** Horizontal text alignment within the block. */
  align?: 'left' | 'center' | 'right'
}

export function FloatingField({
  progress,
  range,
  x,
  y,
  label,
  children,
  maxWidth,
  align = 'center',
}: FloatingFieldProps) {
  const opacity = useFadeRange(progress, ...range)
  return (
    <motion.div
      style={{
        position: 'fixed',
        left: `${x}%`,
        top: `${y}%`,
        x: '-50%',
        y: '-50%',
        opacity,
        zIndex: 3,
        pointerEvents: 'none',
        textAlign: align,
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        width: maxWidth ? `${maxWidth}px` : undefined,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontWeight: 400,
          fontSize: '10.5px',
          letterSpacing: '0.22em',
          color: BRASS_DEEP,
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}
      >
        {label}
      </div>
      <div style={{ color: INK, lineHeight: 1.35 }}>{children}</div>
    </motion.div>
  )
}

const monoValue: CSSProperties = {
  fontFamily: MONO,
  fontWeight: 300,
  fontSize: '17px',
  letterSpacing: '0.02em',
  color: INK,
}

const serifValue: CSSProperties = {
  fontFamily: SERIF,
  fontWeight: 400,
  fontStyle: 'normal',
  fontSize: '22px',
  letterSpacing: '0.01em',
  color: INK,
}

const proseValue: CSSProperties = {
  fontFamily: SERIF,
  fontWeight: 300,
  fontStyle: 'italic',
  fontSize: '21px',
  lineHeight: 1.5,
  color: INK,
}

/* ----- Identity section ----- */

export function IdentitySection({ progress }: { progress: MotionValue<number> }) {
  // Section label visible 22%-48% (peak around 30-40%)
  // Field content visible 28%-48%
  const labelRange: [number, number, number, number] = [0.22, 0.28, 0.46, 0.52]
  const fieldRange: [number, number, number, number] = [0.30, 0.36, 0.46, 0.52]
  return (
    <>
      <SectionLabel progress={progress} label="IDENTITY" range={labelRange} />
      <FloatingField progress={progress} range={fieldRange} x={22} y={32} label="Formula" align="left">
        <span style={monoValue}>C₃₈H₄₉N₉O₅</span>
      </FloatingField>
      <FloatingField progress={progress} range={fieldRange} x={78} y={28} label="Weight" align="right">
        <span style={monoValue}>711.9 Da</span>
      </FloatingField>
      <FloatingField
        progress={progress}
        range={fieldRange}
        x={50}
        y={72}
        label="Sequence"
        align="center"
        maxWidth={520}
      >
        <span style={{ ...serifValue, letterSpacing: '0.03em' }}>
          Aib-His-D-2-Nal-D-Phe-Lys-NH₂
        </span>
      </FloatingField>
      <FloatingField progress={progress} range={fieldRange} x={72} y={62} label="Class" align="right">
        <span style={serifValue}>Pentapeptide · GHS-R1a agonist</span>
      </FloatingField>
    </>
  )
}

/* ----- Action section ----- */

export function ActionSection({ progress }: { progress: MotionValue<number> }) {
  const labelRange: [number, number, number, number] = [0.48, 0.54, 0.70, 0.76]
  const fieldRange: [number, number, number, number] = [0.54, 0.60, 0.70, 0.76]
  return (
    <>
      <SectionLabel progress={progress} label="ACTION" range={labelRange} />
      <FloatingField
        progress={progress}
        range={fieldRange}
        x={50}
        y={52}
        label="Mechanism"
        align="center"
        maxWidth={560}
      >
        <span style={proseValue}>
          A pentapeptide ghrelin-receptor agonist. Binds GHS-R1a on pituitary somatotrophs and
          hypothalamic neurons, eliciting pulsatile growth hormone release without significant
          cortisol, prolactin, or aldosterone perturbation — the selective signature that set it
          apart from earlier secretagogues.
        </span>
      </FloatingField>
    </>
  )
}

/* ----- Use section ----- */

export function UseSection({ progress }: { progress: MotionValue<number> }) {
  // Tightened so USE clears the stage before the vial dominates (was 0.78–0.98).
  const labelRange: [number, number, number, number] = [0.72, 0.78, 0.86, 0.90]
  const fieldRange: [number, number, number, number] = [0.78, 0.82, 0.86, 0.90]
  return (
    <>
      <SectionLabel progress={progress} label="USE" range={labelRange} />
      <FloatingField progress={progress} range={fieldRange} x={20} y={22} label="Clinical Use" align="left" maxWidth={260}>
        <span style={serifValue}>
          Investigational support of the somatotrophic axis; body-composition and recovery research.
        </span>
      </FloatingField>
      <FloatingField progress={progress} range={fieldRange} x={80} y={22} label="Typical Dose" align="right" maxWidth={240}>
        <span style={monoValue}>200–300 mcg SC, 1–3× daily</span>
      </FloatingField>
      <FloatingField progress={progress} range={fieldRange} x={22} y={78} label="Half-Life" align="left">
        <span style={monoValue}>~2 hours</span>
      </FloatingField>
      <FloatingField progress={progress} range={fieldRange} x={78} y={78} label="Route" align="right">
        <span style={serifValue}>Subcutaneous</span>
      </FloatingField>
    </>
  )
}

/* ----- Cautions section ----- */

export function CautionsSection({ progress }: { progress: MotionValue<number> }) {
  // Tightened so CAUTIONS clears before final rest (was 0.86–1.05).
  // The vial sits alone at 0.95+.
  const labelRange: [number, number, number, number] = [0.84, 0.87, 0.92, 0.95]
  const fieldRange: [number, number, number, number] = [0.85, 0.88, 0.92, 0.95]
  return (
    <>
      <SectionLabel progress={progress} label="CAUTIONS" range={labelRange} />
      <FloatingField
        progress={progress}
        range={fieldRange}
        x={26}
        y={88}
        label="Side Effects"
        align="left"
        maxWidth={300}
      >
        <span style={serifValue}>
          Transient flushing, headache, injection-site reactions.
        </span>
      </FloatingField>
      <FloatingField
        progress={progress}
        range={fieldRange}
        x={74}
        y={88}
        label="Contraindications"
        align="right"
        maxWidth={320}
      >
        <span style={serifValue}>
          Active malignancy — theoretical, via IGF-1 axis activation.
        </span>
      </FloatingField>
    </>
  )
}

/* ----- Molecule reveal ----- */

const NODES: Array<{ x: number; y: number; label: string }> = [
  { x: 90, y: 220, label: 'Aib' },
  { x: 190, y: 190, label: 'His' },
  { x: 290, y: 180, label: 'D-2-Nal' },
  { x: 390, y: 190, label: 'D-Phe' },
  { x: 490, y: 220, label: 'Lys' },
]

export function MoleculeOverlay({ progress }: { progress: MotionValue<number> }) {
  // Resolve by 0.85 (compressed from 0.96 to make room for the vial reveal),
  // hold for the brief beat at 0.85–0.88, then dissolve to 0 by 0.94 as the
  // dissolution particles fly into the vial.
  const opacity = useTransform(progress, [0.78, 0.85, 0.88, 0.94], [0, 1, 1, 0])
  const scale = useTransform(progress, [0.78, 0.85], [0.92, 1])
  return (
    <motion.div
      style={{
        position: 'fixed',
        top: '45%',
        left: '50%',
        x: '-50%',
        y: '-50%',
        width: 'min(70vw, 720px)',
        opacity,
        scale,
        zIndex: 3,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 580 280"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Smooth quadratic chain through the five nodes — control points
            interpolated so every node lies on the curve. */}
        <path
          d="M 90 220 Q 140 202 190 190 Q 240 184 290 180 Q 340 184 390 190 Q 440 202 490 220"
          fill="none"
          stroke={BRASS}
          strokeWidth="0.9"
          strokeOpacity="0.65"
        />
        {NODES.map((n) => (
          <g key={n.label}>
            <circle
              cx={n.x}
              cy={n.y}
              r="11"
              fill={BRASS_LIGHT}
              stroke={BRASS_DEEP}
              strokeWidth="0.9"
            />
            <text
              x={n.x}
              y={n.y + 30}
              textAnchor="middle"
              fontFamily={MONO}
              fontSize="11"
              fontWeight={400}
              letterSpacing="0.08em"
              fill={BRASS_DEEP}
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </motion.div>
  )
}
