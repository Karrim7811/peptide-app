'use client'

// Schematic line drawing of Ipamorelin: Aib-His-D-2-Nal-D-Phe-Lys-NH2.
// Drawn as a five-residue backbone with hanging side chains. Not
// stereochemically literal — an apothecary-notebook diagram, not a
// publication-grade Lewis structure.

type Props = {
  className?: string
  stroke?: string
  accent?: string
  label?: boolean
}

export default function IpamorelinMolecule({
  className,
  stroke = 'currentColor',
  accent = '#A88B5E',
  label = true,
}: Props) {
  // Backbone Y-axis (horizontal zigzag for peptide bonds)
  const baseY = 180
  const upY = 150
  const dnY = 210

  // Residue anchor X positions
  const xs = [80, 180, 280, 380, 480]

  return (
    <svg
      viewBox="0 0 560 380"
      className={className}
      fill="none"
      stroke={stroke}
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Ipamorelin molecular schematic"
      role="img"
    >
      {/* ── Backbone zigzag ───────────────────────────────────────── */}
      <polyline
        points={`
          40,${baseY}
          ${xs[0]},${upY}
          ${xs[0] + 50},${dnY}
          ${xs[1]},${upY}
          ${xs[1] + 50},${dnY}
          ${xs[2]},${upY}
          ${xs[2] + 50},${dnY}
          ${xs[3]},${upY}
          ${xs[3] + 50},${dnY}
          ${xs[4]},${upY}
          520,${dnY}
        `}
      />

      {/* N-terminus + C-terminus end markers */}
      <text x={28} y={baseY - 14} fontFamily="JetBrains Mono, monospace" fontSize={10} fill={stroke} stroke="none" textAnchor="end">H₂N</text>
      <text x={532} y={dnY + 4} fontFamily="JetBrains Mono, monospace" fontSize={10} fill={stroke} stroke="none">NH₂</text>

      {/* ── Carbonyl ticks on each peptide bond ──────────────────── */}
      {[0, 1, 2, 3, 4].map(i => {
        const cx = xs[i] + 50
        return (
          <g key={`co-${i}`}>
            <line x1={cx} y1={dnY} x2={cx} y2={dnY + 16} />
            <text
              x={cx + 4}
              y={dnY + 18}
              fontFamily="JetBrains Mono, monospace"
              fontSize={9}
              fill={stroke}
              stroke="none"
            >O</text>
          </g>
        )
      })}

      {/* ── Residue 1: Aib (α-aminoisobutyric acid) — gem-dimethyl ── */}
      <g>
        {/* two methyls */}
        <line x1={xs[0]} y1={upY} x2={xs[0] - 18} y2={upY - 26} />
        <line x1={xs[0]} y1={upY} x2={xs[0] + 18} y2={upY - 26} />
        <text x={xs[0] - 20} y={upY - 30} fontFamily="JetBrains Mono, monospace" fontSize={9} fill={stroke} stroke="none" textAnchor="end">CH₃</text>
        <text x={xs[0] + 20} y={upY - 30} fontFamily="JetBrains Mono, monospace" fontSize={9} fill={stroke} stroke="none">CH₃</text>
        {label && <text x={xs[0]} y={300} fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize={14} fill={accent} stroke="none" textAnchor="middle">Aib</text>}
      </g>

      {/* ── Residue 2: His — imidazole (5-membered ring, 2 N) ──── */}
      <g>
        <line x1={xs[1]} y1={upY} x2={xs[1]} y2={upY - 24} />
        {/* imidazole pentagon */}
        <polygon
          points={`
            ${xs[1]},${upY - 24}
            ${xs[1] - 16},${upY - 36}
            ${xs[1] - 10},${upY - 56}
            ${xs[1] + 10},${upY - 56}
            ${xs[1] + 16},${upY - 36}
          `}
        />
        {/* inner double-bond hint */}
        <line x1={xs[1] - 12} y1={upY - 39} x2={xs[1] + 12} y2={upY - 39} strokeDasharray="2 2" />
        <text x={xs[1] - 18} y={upY - 36} fontFamily="JetBrains Mono, monospace" fontSize={8} fill={stroke} stroke="none" textAnchor="end">N</text>
        <text x={xs[1] + 18} y={upY - 36} fontFamily="JetBrains Mono, monospace" fontSize={8} fill={stroke} stroke="none">N</text>
        {label && <text x={xs[1]} y={300} fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize={14} fill={accent} stroke="none" textAnchor="middle">His</text>}
      </g>

      {/* ── Residue 3: D-2-Nal — naphthalene (two fused hexagons) ─ */}
      <g>
        <line x1={xs[2]} y1={upY} x2={xs[2]} y2={upY - 22} />
        {/* hexagon 1 (lower) */}
        <polygon
          points={`
            ${xs[2]},${upY - 22}
            ${xs[2] - 14},${upY - 30}
            ${xs[2] - 14},${upY - 46}
            ${xs[2]},${upY - 54}
            ${xs[2] + 14},${upY - 46}
            ${xs[2] + 14},${upY - 30}
          `}
        />
        {/* hexagon 2 (upper, sharing the right edge) */}
        <polygon
          points={`
            ${xs[2] + 14},${upY - 46}
            ${xs[2] + 14},${upY - 30}
            ${xs[2] + 28},${upY - 38}
            ${xs[2] + 42},${upY - 30}
            ${xs[2] + 42},${upY - 46}
            ${xs[2] + 28},${upY - 54}
          `}
        />
        {/* aromaticity hint */}
        <circle cx={xs[2]} cy={upY - 38} r={5} strokeDasharray="2 2" />
        <circle cx={xs[2] + 28} cy={upY - 38} r={5} strokeDasharray="2 2" />
        {label && <text x={xs[2] + 14} y={300} fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize={14} fill={accent} stroke="none" textAnchor="middle">D-2-Nal</text>}
      </g>

      {/* ── Residue 4: D-Phe — benzene (single hexagon) ─────────── */}
      <g>
        <line x1={xs[3]} y1={upY} x2={xs[3]} y2={upY - 24} />
        <polygon
          points={`
            ${xs[3]},${upY - 24}
            ${xs[3] - 14},${upY - 32}
            ${xs[3] - 14},${upY - 48}
            ${xs[3]},${upY - 56}
            ${xs[3] + 14},${upY - 48}
            ${xs[3] + 14},${upY - 32}
          `}
        />
        <circle cx={xs[3]} cy={upY - 40} r={5} strokeDasharray="2 2" />
        {label && <text x={xs[3]} y={300} fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize={14} fill={accent} stroke="none" textAnchor="middle">D-Phe</text>}
      </g>

      {/* ── Residue 5: Lys — 4-carbon chain ending in NH3+/NH2 ── */}
      <g>
        <polyline
          points={`
            ${xs[4]},${upY}
            ${xs[4] - 8},${upY - 14}
            ${xs[4] + 4},${upY - 28}
            ${xs[4] - 8},${upY - 42}
            ${xs[4] + 4},${upY - 56}
          `}
        />
        <text x={xs[4] + 8} y={upY - 58} fontFamily="JetBrains Mono, monospace" fontSize={9} fill={stroke} stroke="none">NH₂</text>
        {label && <text x={xs[4]} y={300} fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize={14} fill={accent} stroke="none" textAnchor="middle">Lys</text>}
      </g>

      {/* ── Brass underline beneath all residue labels ────────── */}
      {label && (
        <line
          x1={xs[0] - 20}
          y1={310}
          x2={xs[4] + 20}
          y2={310}
          stroke={accent}
          strokeWidth={0.5}
          opacity={0.6}
        />
      )}

      {/* ── Spec caption ───────────────────────────────────────── */}
      {label && (
        <text
          x={280}
          y={336}
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
