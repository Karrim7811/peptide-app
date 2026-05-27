'use client'

import { vialCapColor } from '@/lib/peptide-display'

type HeroVialProps = {
  /** Peptide name — drives cap color via vialCapColor(). */
  name: string
  /** Display name for the lower label line (e.g. "IPAMORELIN"). */
  peptideName?: string
  /** 0–1 — fraction of vial body filled with powder. */
  powderHeight?: number
  /** Powder tint. Defaults to apo-brass. */
  powderColor?: string
  /** 0–1 — strength of the animated glass glint. */
  glint?: number
  /** Scale multiplier; 1 = ~440px tall. */
  size?: number
  className?: string
}

// Apothecary intrinsic dimensions — 5× the inventory vial. Interior geometry
// uses these as a fixed viewBox so the SVG stays crisp at any scale.
const BASE_W = 280
const BASE_H = 440

// Glass body bounds inside the viewBox. The cap+neck sit above y=50.
const BODY_X = 22
const BODY_Y = 50
const BODY_W = BASE_W - 2 * BODY_X
const BODY_H = 370
const BODY_RX = 22

// Inner (clipped) bounds for powder & shine — sits just inside the glass walls.
const INNER_X = BODY_X + 6
const INNER_Y = BODY_Y + 6
const INNER_W = BODY_W - 12
const INNER_H = BODY_H - 12

// Deterministic stipple positions — fixed seed so the powder doesn't shimmer
// between renders. Positions are normalized (0..1) inside the inner body box.
function seededRand(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const STIPPLES: Array<{ nx: number; ny: number; r: number; a: number }> = (() => {
  const rand = seededRand(2026)
  const out: Array<{ nx: number; ny: number; r: number; a: number }> = []
  for (let i = 0; i < 42; i++) {
    out.push({
      nx: rand(),
      ny: rand(),
      r: 0.6 + rand() * 1.4, // px in viewBox units
      a: 0.10 + rand() * 0.22,
    })
  }
  return out
})()

// Slightly irregular top edge for the powder heap — a 9-point sampled path.
// Deterministic bumps so the heap feels hand-poured, not stamped.
const TOP_BUMPS = (() => {
  const rand = seededRand(9001)
  const points: number[] = []
  for (let i = 0; i < 9; i++) points.push((rand() - 0.5) * 4) // ±2px
  return points
})()

export default function HeroVial({
  name,
  peptideName,
  powderHeight = 0,
  powderColor = '#A88B5E',
  glint = 0.3,
  size = 1,
  className = '',
}: HeroVialProps) {
  const colors = vialCapColor(name)
  // Aged-apothecary cap shadow: blend the GH-axis gold toward iron-oxide brown
  // so it reads as patinated brass rather than clinical plastic.
  const capShadowAged = '#7A5A1F'
  const powder = Math.max(0, Math.min(1, powderHeight))
  const glintAmt = Math.max(0, Math.min(1, glint))

  const width = BASE_W * size
  const height = BASE_H * size

  const powderPx = powder * INNER_H
  const powderTopY = INNER_Y + (INNER_H - powderPx)

  // Build an irregular top edge for the heap. Sample 9 x-positions across the
  // inner width and offset y by the deterministic bumps.
  const buildHeapTopPath = () => {
    if (powderPx <= 1) return ''
    const x0 = INNER_X
    const x1 = INNER_X + INNER_W
    const y0 = powderTopY
    const y1 = INNER_Y + INNER_H
    const n = TOP_BUMPS.length
    let d = `M ${x0} ${y1} L ${x0} ${y0}`
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / (n + 1)
      const x = x0 + t * (x1 - x0)
      const y = y0 + TOP_BUMPS[i] * Math.min(1, powderPx / 30)
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`
    }
    d += ` L ${x1} ${y0} L ${x1} ${y1} Z`
    return d
  }

  const heapPath = buildHeapTopPath()
  const capGradId = `hv-cap-${name.replace(/[^a-z0-9]/gi, '')}`
  const labelClip = `hv-label-clip`
  const innerClip = `hv-inner-clip`

  // The "Cortex Peptide" mark — small caps brass, Cormorant medium.
  // Peptide name — Cormorant 400, ink, larger.
  const apoBrass = '#A88B5E'
  const ink = '#1A1915'

  return (
    <span
      style={{ width, height, display: 'inline-block' }}
      className={className}
      aria-hidden="true"
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${BASE_W} ${BASE_H}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={peptideName ?? name}
      >
        <defs>
          {/* Cap gradient — aged-brass cap. */}
          <linearGradient id={capGradId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={colors.cap} stopOpacity="0.78" />
            <stop offset="48%" stopColor={colors.cap} stopOpacity="1" />
            <stop offset="100%" stopColor={capShadowAged} stopOpacity="1" />
          </linearGradient>

          {/* Glass — much more transparent than inventory vial so powder reads. */}
          <linearGradient id="hv-glass" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#F0EBE0" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.35" />
          </linearGradient>

          {/* Vertical glass tint — slight cool-warm shift bottom to top. */}
          <linearGradient id="hv-glass-v" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#E2DAC8" stopOpacity="0.20" />
          </linearGradient>

          {/* Powder gradient — slight depth from top (lighter) to bottom (denser). */}
          <linearGradient id="hv-powder" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={powderColor} stopOpacity="0.78" />
            <stop offset="60%" stopColor={powderColor} stopOpacity="0.92" />
            <stop offset="100%" stopColor={powderColor} stopOpacity="0.96" />
          </linearGradient>

          {/* Glass shine — left-side specular. Animates via glint prop. */}
          <linearGradient id="hv-shine" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.55 * glintAmt} />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Label paper — slightly aged cream, with a faint warm tint. */}
          <linearGradient id="hv-label-paper" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FAF4E5" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#F0E6CE" stopOpacity="0.96" />
          </linearGradient>

          {/* Clip for inner body so powder + shine stay inside the glass. */}
          <clipPath id={innerClip}>
            <rect
              x={INNER_X}
              y={INNER_Y}
              width={INNER_W}
              height={INNER_H}
              rx={BODY_RX - 6}
              ry={BODY_RX - 6}
            />
          </clipPath>

          {/* Clip for the label paper area so text stays bounded. */}
          <clipPath id={labelClip}>
            <rect x={BODY_X + 14} y={232} width={BODY_W - 28} height={108} rx="3" ry="3" />
          </clipPath>
        </defs>

        {/* === Cap === */}
        {/* Cap top — rounded rectangle reading as a screw-cap with shoulder. */}
        <rect
          x={BODY_X + 26}
          y={6}
          width={BODY_W - 52}
          height={26}
          rx={4}
          ry={4}
          fill={`url(#${capGradId})`}
        />
        {/* Cap shoulder — slightly wider band at base of cap. */}
        <rect
          x={BODY_X + 20}
          y={28}
          width={BODY_W - 40}
          height={6}
          rx={1.5}
          ry={1.5}
          fill={capShadowAged}
          fillOpacity="0.85"
        />
        {/* Two faint ridges on the cap to suggest knurling, very subtle. */}
        <rect x={BODY_X + 30} y={12} width={BODY_W - 60} height={1} fill="#000" fillOpacity="0.10" />
        <rect x={BODY_X + 30} y={20} width={BODY_W - 60} height={1} fill="#000" fillOpacity="0.10" />

        {/* === Neck === */}
        <rect x={BODY_X + 34} y={34} width={BODY_W - 68} height={16} rx={1} ry={1} fill="#B7AE9C" fillOpacity="0.78" />

        {/* === Glass body — back layer, vertical tint === */}
        <rect
          x={BODY_X}
          y={BODY_Y}
          width={BODY_W}
          height={BODY_H}
          rx={BODY_RX}
          ry={BODY_RX}
          fill="url(#hv-glass-v)"
        />
        <rect
          x={BODY_X}
          y={BODY_Y}
          width={BODY_W}
          height={BODY_H}
          rx={BODY_RX}
          ry={BODY_RX}
          fill="url(#hv-glass)"
          stroke="#9A9082"
          strokeOpacity="0.42"
          strokeWidth={0.8}
        />

        {/* === Powder (clipped to inner body so it never bleeds past the glass) === */}
        {powderPx > 1 && (
          <g clipPath={`url(#${innerClip})`}>
            <path d={heapPath} fill="url(#hv-powder)" />
            {/* Stipples — only those whose y falls inside the heap. */}
            {STIPPLES.map((s, i) => {
              const stipX = INNER_X + s.nx * INNER_W
              const stipY = powderTopY + s.ny * powderPx
              // Skip stipples that would render below the heap.
              if (stipY < powderTopY + 1) return null
              return (
                <circle
                  key={i}
                  cx={stipX}
                  cy={stipY}
                  r={s.r}
                  fill={powderColor}
                  fillOpacity={s.a * 0.55}
                />
              )
            })}
            {/* A few brighter grain highlights near the heap top. */}
            {STIPPLES.slice(0, 14).map((s, i) => {
              const stipX = INNER_X + s.nx * INNER_W
              const stipY = powderTopY + (s.ny * 0.15) * powderPx + 2
              return (
                <circle
                  key={`hl-${i}`}
                  cx={stipX}
                  cy={stipY}
                  r={s.r * 0.6}
                  fill="#FFFEF8"
                  fillOpacity={0.12 + s.a * 0.18}
                />
              )
            })}
            {/* Faint horizontal settling line slightly below heap top. */}
            <line
              x1={INNER_X + 4}
              x2={INNER_X + INNER_W - 4}
              y1={powderTopY + Math.min(8, powderPx * 0.12)}
              y2={powderTopY + Math.min(8, powderPx * 0.12)}
              stroke={powderColor}
              strokeOpacity={0.16}
              strokeWidth={0.6}
            />
          </g>
        )}

        {/* === Label === */}
        <g clipPath={`url(#${labelClip})`}>
          <rect
            x={BODY_X + 14}
            y={232}
            width={BODY_W - 28}
            height={108}
            rx={3}
            ry={3}
            fill="url(#hv-label-paper)"
            stroke="#C7B996"
            strokeOpacity="0.55"
            strokeWidth={0.6}
          />
          {/* Tiny apothecary border lines — top + bottom hairlines. */}
          <line
            x1={BODY_X + 22}
            x2={BODY_X + BODY_W - 22}
            y1={249}
            y2={249}
            stroke={apoBrass}
            strokeOpacity={0.55}
            strokeWidth={0.4}
          />
          <line
            x1={BODY_X + 22}
            x2={BODY_X + BODY_W - 22}
            y1={326}
            y2={326}
            stroke={apoBrass}
            strokeOpacity={0.55}
            strokeWidth={0.4}
          />

          {/* "Cortex Peptide" — small caps, brass. */}
          <text
            x={BASE_W / 2}
            y={269}
            textAnchor="middle"
            fontFamily='"Cormorant Garamond", Georgia, serif'
            fontSize={14}
            fontWeight={500}
            letterSpacing="0.18em"
            fill={apoBrass}
            style={{ fontVariant: 'small-caps', textTransform: 'lowercase' as const }}
          >
            Cortex Peptide
          </text>

          {/* Peptide name — Cormorant, ink, large. */}
          {peptideName && (
            <text
              x={BASE_W / 2}
              y={310}
              textAnchor="middle"
              fontFamily='"Cormorant Garamond", Georgia, serif'
              fontSize={28}
              fontWeight={400}
              letterSpacing="0.04em"
              fill={ink}
            >
              {peptideName}
            </text>
          )}
        </g>

        {/* === Glass shine — left-side specular highlight, modulated by glint === */}
        <g clipPath={`url(#${innerClip})`}>
          <rect
            x={INNER_X}
            y={INNER_Y}
            width={INNER_W * 0.4}
            height={INNER_H}
            fill="url(#hv-shine)"
            pointerEvents="none"
          />
        </g>

        {/* A subtle hand-blown irregularity: faint vertical line on the right side
            suggesting the seam of a hand-poured glass body. */}
        <line
          x1={BODY_X + BODY_W - 6}
          x2={BODY_X + BODY_W - 6}
          y1={BODY_Y + 18}
          y2={BODY_Y + BODY_H - 18}
          stroke="#FFFFFF"
          strokeOpacity={0.15}
          strokeWidth={0.5}
        />
      </svg>
    </span>
  )
}
