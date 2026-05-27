'use client'

// Stylized topology of Ipamorelin (Aib-His-D-2-Nal-D-Phe-Lys-NH₂).
// Five residues as brass nodes on a shallow dome arc, threaded by a
// single quadratic curve. A constellation map for a pentapeptide —
// not chemistry, just sequence.

type Props = {
  className?: string
  stroke?: string
  accent?: string
  label?: boolean
}

const NODES = [
  { x: 90, y: 220, code: 'Aib' },
  { x: 190, y: 190, code: 'His' },
  { x: 290, y: 180, code: 'D-2-Nal' },
  { x: 390, y: 190, code: 'D-Phe' },
  { x: 490, y: 220, code: 'Lys' },
] as const

// Cream-paper fill for the node disc so the connecting arc reads as
// passing behind each stop. Matches `apo.cream` in tailwind.config.js.
const PAPER = '#F5F0E8'

export default function IpamorelinMolecule({
  className,
  stroke = 'currentColor',
  accent = '#A88B5E',
  label = true,
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
      {/* Connecting arc — a single quadratic Bezier whose midpoint and
          quartile points coincide with the five node positions. */}
      <path d="M 90 220 Q 290 140 490 220" />

      {/* Nodes: outer ring with paper fill (masks the arc), inner brass dot. */}
      {NODES.map(n => (
        <g key={`node-${n.code}`}>
          <circle cx={n.x} cy={n.y} r={8} fill={PAPER} strokeWidth={1} />
          <circle cx={n.x} cy={n.y} r={3.25} fill={stroke} stroke="none" />
        </g>
      ))}

      {/* Three-letter codes, aligned on a single baseline below the arc. */}
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
