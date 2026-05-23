import { vialCapColor, vialShortName } from '@/lib/peptide-display'

type VialProps = {
  name: string
  /** e.g. "10" or "250" */
  dose?: string
  /** e.g. "mg" or "mcg" */
  unit?: string
  /** 0-1 — how much liquid the body shows. Defaults to 0.7. */
  fillPercent?: number
  /** Adds a soft glow ring around the cap. */
  dueNow?: boolean
  /** Scale multiplier; 1 = ~80px tall (compact list); 1.5 = stack tile; 2 = hero. */
  size?: number
  /** Optional click handler. When set, the vial renders as a button. */
  onClick?: () => void
  className?: string
}

// Base intrinsic dimensions. The SVG viewBox stays fixed and `size` scales
// via the wrapping <div>, so the vial stays crisp at any scale.
const BASE_W = 56
const BASE_H = 88

export default function Vial({
  name,
  dose,
  unit,
  fillPercent = 0.7,
  dueNow = false,
  size = 1,
  onClick,
  className = '',
}: VialProps) {
  const colors = vialCapColor(name)
  const fill = Math.max(0, Math.min(1, fillPercent))
  const shortName = vialShortName(name).toUpperCase()
  const doseText = dose && dose.trim() ? `${dose}${unit ? ` ${unit}` : ''}` : ''

  // Liquid fill height in viewBox units. Body spans y=20..84 (height 64).
  const FILL_TOP_Y = 20
  const FILL_MAX_H = 64
  const fillH = Math.max(4, FILL_MAX_H * fill)
  const fillY = FILL_TOP_Y + (FILL_MAX_H - fillH)

  const width = BASE_W * size
  const height = BASE_H * size

  const content = (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${BASE_W} ${BASE_H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${shortName}${doseText ? ' ' + doseText : ''}`}
    >
      <defs>
        <linearGradient id={`cap-${colors.cap.replace('#', '')}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={colors.cap} stopOpacity="0.75" />
          <stop offset="50%" stopColor={colors.cap} stopOpacity="1" />
          <stop offset="100%" stopColor={colors.capShadow} stopOpacity="1" />
        </linearGradient>
        <linearGradient id="glass" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#E8E5E0" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={`liquid-${colors.cap.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={colors.cap} stopOpacity="0.18" />
          <stop offset="100%" stopColor={colors.cap} stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id="shine" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Optional due-now glow */}
      {dueNow && (
        <rect
          x="4"
          y="2"
          width={BASE_W - 8}
          height={BASE_H - 4}
          rx="9"
          ry="9"
          fill="none"
          stroke={colors.cap}
          strokeOpacity="0.45"
          strokeWidth="2"
          filter="blur(2px)"
        >
          <animate attributeName="stroke-opacity" values="0.25;0.65;0.25" dur="1.6s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Cap */}
      <rect x="14" y="2" width={BASE_W - 28} height="10" rx="2" ry="2" fill={`url(#cap-${colors.cap.replace('#', '')})`} />

      {/* Neck */}
      <rect x="20" y="11" width={BASE_W - 40} height="7" rx="1" ry="1" fill="#BFB9B0" />

      {/* Glass body */}
      <rect x="8" y={FILL_TOP_Y} width={BASE_W - 16} height={FILL_MAX_H} rx="6" ry="6" fill="url(#glass)" stroke="#B0AAA0" strokeOpacity="0.35" strokeWidth="0.6" />

      {/* Liquid fill */}
      <rect
        x="10"
        y={fillY}
        width={BASE_W - 20}
        height={fillH}
        rx="4"
        ry="4"
        fill={`url(#liquid-${colors.cap.replace('#', '')})`}
      />

      {/* Label background */}
      <rect x="11" y={BASE_H - 38} width={BASE_W - 22} height="22" rx="2" ry="2" fill="#FFFFFF" fillOpacity="0.92" />

      {/* CORTEX wordmark on label */}
      <text
        x={BASE_W / 2}
        y={BASE_H - 28}
        textAnchor="middle"
        fontFamily="'Jost', sans-serif"
        fontSize="4.5"
        fontWeight="700"
        letterSpacing="0.7"
        fill={colors.cap}
      >
        CORTEX
      </text>

      {/* Peptide short name */}
      <text
        x={BASE_W / 2}
        y={BASE_H - 22}
        textAnchor="middle"
        fontFamily="'Jost', sans-serif"
        fontSize="5"
        fontWeight="700"
        fill="#1A1915"
        lengthAdjust="spacingAndGlyphs"
        textLength={shortName.length > 9 ? BASE_W - 26 : undefined}
      >
        {shortName}
      </text>

      {/* Dose, if present */}
      {doseText && (
        <text
          x={BASE_W / 2}
          y={BASE_H - 17}
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="4.2"
          fontWeight="500"
          fill="#3A3730"
        >
          {doseText}
        </text>
      )}

      {/* Glass shine */}
      <rect x="8" y={FILL_TOP_Y} width={(BASE_W - 16) * 0.45} height={FILL_MAX_H} rx="6" ry="6" fill="url(#shine)" pointerEvents="none" />
    </svg>
  )

  const wrapperStyle = { width, height, display: 'inline-block' as const }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={wrapperStyle}
        className={`appearance-none bg-transparent border-0 p-0 cursor-pointer transition-transform hover:scale-105 active:scale-95 ${className}`}
        aria-label={`${shortName}${doseText ? ' ' + doseText : ''}`}
      >
        {content}
      </button>
    )
  }

  return (
    <span style={wrapperStyle} className={className}>
      {content}
    </span>
  )
}
