'use client'

import { motion, type MotionValue } from 'framer-motion'

// Stylized topology of Ipamorelin (Aib-His-D-2-Nal-D-Phe-Lys-NH₂).
// Five residues as brass nodes on a shallow dome arc, threaded by a
// single quadratic curve. Two optional detail layers ride along —
// driven by the Microscope as zoom-linked opacity values, dormant
// when the molecule is rendered as a static figure on the specimen
// sheet.

type ResidueCode = 'Aib' | 'His' | 'D-2-Nal' | 'D-Phe' | 'Lys'

type Props = {
  className?: string
  stroke?: string
  accent?: string
  label?: boolean
  subDetailOpacity?: number | MotionValue<number>
  annotationOpacity?: number | MotionValue<number>
}

const NODES: ReadonlyArray<{ x: number; y: number; code: ResidueCode }> = [
  { x: 90, y: 220, code: 'Aib' },
  { x: 190, y: 190, code: 'His' },
  { x: 290, y: 180, code: 'D-2-Nal' },
  { x: 390, y: 190, code: 'D-Phe' },
  { x: 490, y: 220, code: 'Lys' },
]

// Cream-paper fill on each node disc, so the connecting arc reads as
// passing behind the stop. Matches `apo.cream` in tailwind.config.js.
const PAPER = '#F5F0E8'

function ResidueGlyph({ code, x, y }: { code: ResidueCode; x: number; y: number }) {
  switch (code) {
    case 'Aib':
      return (
        <g>
          <line x1={x - 3} y1={y - 2.5} x2={x - 5} y2={y - 5.5} />
          <line x1={x + 3} y1={y - 2.5} x2={x + 5} y2={y - 5.5} />
        </g>
      )
    case 'His':
      return (
        <polygon
          points={`${x},${y - 4.5} ${x - 4.3},${y - 1.4} ${x - 2.7},${y + 3.6} ${x + 2.7},${y + 3.6} ${x + 4.3},${y - 1.4}`}
        />
      )
    case 'D-2-Nal':
      return (
        <g>
          <circle cx={x - 2.5} cy={y} r={2.2} />
          <circle cx={x + 2.5} cy={y} r={2.2} />
        </g>
      )
    case 'D-Phe':
      return (
        <polygon
          points={`${x - 4},${y - 2.3} ${x},${y - 4.6} ${x + 4},${y - 2.3} ${x + 4},${y + 2.3} ${x},${y + 4.6} ${x - 4},${y + 2.3}`}
        />
      )
    case 'Lys':
      return (
        <polyline
          points={`${x - 4},${y + 2} ${x - 1.5},${y - 2} ${x + 1.5},${y + 2} ${x + 4},${y - 2}`}
        />
      )
  }
}

function BondTicks({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={y - 10} x2={x} y2={y - 13} />
      <line x1={x} y1={y + 10} x2={x} y2={y + 13} />
      <line x1={x - 10} y1={y} x2={x - 13} y2={y} />
      <line x1={x + 10} y1={y} x2={x + 13} y2={y} />
    </g>
  )
}

export default function IpamorelinMolecule({
  className,
  stroke = 'currentColor',
  accent = '#A88B5E',
  label = true,
  subDetailOpacity = 0,
  annotationOpacity = 0,
}: Props) {
  return (
    <svg
      viewBox="0 0 560 380"
      className={className}
      fill="none"
      stroke={stroke}
      strokeWidth={0.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Ipamorelin pentapeptide topology"
      role="img"
    >
      {/* Connecting arc — single quadratic Bezier touching all five nodes. */}
      <path d="M 90 220 Q 290 140 490 220" />

      {/* Outer rings (cream fill masks the arc passing behind each stop). */}
      {NODES.map(n => (
        <circle key={`ring-${n.code}`} cx={n.x} cy={n.y} r={8} fill={PAPER} strokeWidth={1} />
      ))}

      {/* Sub-structure layer — bond-angle ticks + residue-specific interior
          glyphs. Revealed by the Microscope at high zoom. */}
      <motion.g style={{ opacity: subDetailOpacity }}>
        {NODES.map(n => (
          <g key={`subd-${n.code}`}>
            <BondTicks x={n.x} y={n.y} />
            <ResidueGlyph code={n.code} x={n.x} y={n.y} />
          </g>
        ))}
      </motion.g>

      {/* Inner brass dots — always visible, sit on top of the sub-glyphs so
          the center of each node reads as a solid mark at all zoom levels. */}
      {NODES.map(n => (
        <circle key={`dot-${n.code}`} cx={n.x} cy={n.y} r={3.25} fill={stroke} stroke="none" />
      ))}

      {/* Side-annotation layer — activity-site callouts. Revealed at the
          pull-back zoom when the full molecule is back in frame. */}
      <motion.g style={{ opacity: annotationOpacity }}>
        {/* D-2-Nal → GHS-R1a */}
        <line x1={302} y1={170} x2={358} y2={108} strokeWidth={0.6} />
        <text
          x={364}
          y={108}
          fontFamily="JetBrains Mono, monospace"
          fontSize={9}
          fill={stroke}
          stroke="none"
          letterSpacing="0.14em"
        >
          → GHS-R1a
        </text>

        {/* His → pituitary */}
        <line x1={178} y1={180} x2={122} y2={118} strokeWidth={0.6} />
        <text
          x={116}
          y={118}
          fontFamily="JetBrains Mono, monospace"
          fontSize={9}
          fill={stroke}
          stroke="none"
          textAnchor="end"
          letterSpacing="0.14em"
        >
          → pituitary
        </text>
      </motion.g>

      {/* Three-letter codes, single baseline below the arc. */}
      {label &&
        NODES.map(n => (
          <text
            key={`label-${n.code}`}
            x={n.x}
            y={255}
            fontFamily="JetBrains Mono, monospace"
            fontSize={10}
            fill={accent}
            stroke="none"
            textAnchor="middle"
            letterSpacing="0.16em"
          >
            {n.code}
          </text>
        ))}

      {/* Brass underline beneath the codes. */}
      {label && (
        <line
          x1={NODES[0].x - 20}
          y1={290}
          x2={NODES[NODES.length - 1].x + 20}
          y2={290}
          stroke={accent}
          strokeWidth={0.5}
          opacity={0.6}
        />
      )}

      {/* Formula caption. */}
      {label && (
        <text
          x={280}
          y={316}
          fontFamily="JetBrains Mono, monospace"
          fontSize={9}
          fill={accent}
          stroke="none"
          textAnchor="middle"
          letterSpacing="0.18em"
        >
          C₃₈H₄₉N₉O₅  ·  711.9 Da
        </text>
      )}
    </svg>
  )
}
