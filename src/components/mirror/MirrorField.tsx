'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { layoutLabels } from '@/lib/mirror/labels'
import type { FieldGeometry } from '@/lib/mirror/geometry'

interface MirrorFieldProps {
  geometry: FieldGeometry
  /** Layer 4 drops all atmosphere. It is the verify surface. */
  atmosphere: boolean
  onSelectNode?: (id: string) => void
  handlers: {
    onWheel: (event: React.WheelEvent) => void
    onPointerDown: (event: React.PointerEvent) => void
    onPointerMove: (event: React.PointerEvent) => void
    onPointerUp: (event: React.PointerEvent) => void
    onPointerCancel: (event: React.PointerEvent) => void
    style: { cursor: string }
  }
  footerNote?: string
  footerSub?: string
  /**
   * Reports the measured field size upward so the caller can build geometry
   * against the size actually rendered. The field owns the measurement — a
   * caller guessing it is how labels end up on chrome the placer thinks is
   * elsewhere.
   */
  onMeasure?: (size: { width: number; height: number }) => void
}

/**
 * Measures the field element and keeps the size fresh.
 *
 * A stale size silently pushes the SVG's bottom edge past the visible pane, and
 * labels then land on chrome the placer thinks is elsewhere — so this observes
 * rather than measuring once on mount.
 */
function useFieldSize() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    function measure() {
      const rect = element!.getBoundingClientRect()
      setSize((prev) =>
        Math.round(prev.width) === Math.round(rect.width) &&
        Math.round(prev.height) === Math.round(rect.height)
          ? prev
          : { width: rect.width, height: rect.height },
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return { ref, size }
}

export default function MirrorField({
  geometry,
  atmosphere,
  onSelectNode,
  handlers,
  footerNote,
  footerSub,
  onMeasure,
}: MirrorFieldProps) {
  const { ref, size } = useFieldSize()

  useEffect(() => {
    onMeasure?.(size)
  }, [size, onMeasure])

  const labels = useMemo(
    () => layoutLabels(geometry.labels, geometry.nodes, size),
    [geometry.labels, geometry.nodes, size],
  )

  return (
    <div
      ref={ref}
      {...handlers}
      className="relative h-full max-h-full min-h-[260px] w-full overflow-hidden"
    >
      {atmosphere && (
        <>
          {/* Two particle layers drifting in opposition. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, var(--glowA), transparent 55%),' +
                'radial-gradient(circle at 75% 65%, var(--glowB), transparent 55%)',
              animation: 'cxbreathe 11s ease-in-out infinite',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'radial-gradient(var(--dotB) 0.5px, transparent 0.5px)',
              backgroundSize: '26px 26px',
              animation: 'cxdriftA 26s linear infinite alternate',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage: 'radial-gradient(var(--dotA) 0.5px, transparent 0.5px)',
              backgroundSize: '34px 34px',
              animation: 'cxdriftB 34s linear infinite alternate',
            }}
          />
        </>
      )}

      <svg
        className="absolute inset-0 h-full w-full"
        width={size.width}
        height={size.height}
        aria-hidden
      >
        {geometry.edges.map((edge, i) => (
          <line
            key={`e${i}`}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={edge.stroke}
            strokeOpacity={edge.opacity}
            strokeWidth={1}
            strokeDasharray={edge.dashed ? '6 6' : undefined}
            style={
              edge.dashed && atmosphere
                ? { animation: 'cxmarch 1.5s linear infinite' }
                : undefined
            }
          />
        ))}

        {geometry.molecule.map((bond, i) => (
          <line
            key={`m${i}`}
            x1={bond.x1}
            y1={bond.y1}
            x2={bond.x2}
            y2={bond.y2}
            stroke={bond.stroke}
            strokeOpacity={0.35}
            strokeWidth={1}
          />
        ))}
        {geometry.atoms.map((atom, i) => (
          <circle key={`a${i}`} cx={atom.x} cy={atom.y} r={atom.r} fill={atom.fill} fillOpacity={0.7} />
        ))}

        {geometry.nodes.map((node) => (
          <g
            key={node.id}
            onClick={onSelectNode ? () => onSelectNode(node.id) : undefined}
            style={{ cursor: onSelectNode ? 'pointer' : undefined }}
          >
            {node.ringOpacity > 0 && (
              <circle
                cx={node.x}
                cy={node.y}
                r={node.ringR}
                fill="none"
                stroke={node.color}
                strokeOpacity={node.ringOpacity}
                strokeWidth={1}
                strokeDasharray={node.ringDash === '0' ? undefined : node.ringDash}
                style={
                  atmosphere && node.ringDash !== '0'
                    ? { animation: 'cxmarch 1.5s linear infinite' }
                    : undefined
                }
              />
            )}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill={node.color}
              fillOpacity={node.fillOpacity}
              stroke={node.color}
              strokeOpacity={node.strokeOpacity}
              strokeWidth={node.strokeWidth}
              style={
                // Thinning supply is the fastest motion in the system, because
                // it is the thing that needs attention.
                atmosphere && node.thinning
                  ? { animation: 'cxthin 3.4s ease-in-out infinite' }
                  : undefined
              }
            />
            <title>{node.label}</title>
          </g>
        ))}
      </svg>

      {labels.map((label, i) => (
        <div
          key={`${label.label}-${i}`}
          className="pointer-events-none absolute flex flex-col gap-[3px]"
          style={{
            left: label.left,
            top: label.top,
            alignItems: label.align,
            textAlign: label.textAlign,
            ...(label.wraps ? { width: label.width } : { whiteSpace: 'nowrap' }),
          }}
        >
          <span className="font-mono text-[10.5px] leading-[1.25] tracking-[0.18em] text-ink whitespace-nowrap">
            {label.label}
          </span>
          <span className="font-mono text-[9.5px] leading-[1.3] tracking-[0.12em] text-faint">
            {label.sub}
          </span>
        </div>
      ))}

      {(footerNote || footerSub) && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-12 flex-col justify-center gap-1 px-3">
          {footerNote && (
            <span className="font-mono text-[10px] tracking-[0.1em] text-faint">{footerNote}</span>
          )}
          {footerSub && (
            <span className="font-mono text-[10px] tracking-[0.1em] text-faintest">{footerSub}</span>
          )}
        </div>
      )}
    </div>
  )
}
