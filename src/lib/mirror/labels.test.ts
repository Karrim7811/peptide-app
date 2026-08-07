// The label placer's failure modes, as documented in the design handoff.
// Each test here corresponds to a bug the design hit and fixed.

import { describe, expect, it } from 'vitest'
import { layoutLabels, measureLabel, type LabelRequest, type Rect } from '@/lib/mirror/labels'

const FIELD = { width: 800, height: 600 }

function request(overrides: Partial<LabelRequest> = {}): LabelRequest {
  return { x: 400, y: 300, ring: 40, label: 'BPC-157', sub: '4 DAYS', size: 12, ...overrides }
}

function overlaps(a: Rect, b: Rect): number {
  const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
  const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  return w * h
}

function toRect(l: { left: number; top: number; width: number; height: number }): Rect {
  return { left: l.left, right: l.left + l.width, top: l.top, bottom: l.top + l.height }
}

describe('measureLabel', () => {
  it('never reserves a box narrower than the title', () => {
    // A long title with a short sub and a tight cap: capping to the sub width
    // would make the placer trust a box the nowrap title overflows.
    const long = measureLabel(request({ label: 'TESAMORELIN-EXTENDED', sub: 'A', maxWidth: 10 }))
    const titleWidth = Math.round('TESAMORELIN-EXTENDED'.length * 12 * 0.78)
    expect(long.width).toBeGreaterThanOrEqual(titleWidth)
  })

  it('grows the box vertically when the sub line wraps', () => {
    const oneLine = measureLabel(request({ sub: 'SHORT' }))
    const wrapped = measureLabel(
      request({ sub: 'A MUCH LONGER SUBTITLE THAT MUST WRAP ACROSS LINES', maxWidth: 60 }),
    )
    expect(wrapped.height).toBeGreaterThan(oneLine.height)
  })
})

describe('layoutLabels', () => {
  it('returns nothing for a zero-sized field rather than placing at NaN', () => {
    expect(layoutLabels([request()], [], { width: 0, height: 0 })).toEqual([])
  })

  it('keeps every label inside the pane', () => {
    // Nodes pushed hard into all four corners — the case where an unclamped
    // candidate would land outside the field.
    const corners = [
      { x: 5, y: 5 },
      { x: 795, y: 5 },
      { x: 5, y: 595 },
      { x: 795, y: 595 },
    ]
    const placed = layoutLabels(
      corners.map((c) => request({ ...c, label: 'EDGE-CASE-COMPOUND' })),
      corners.map((c) => ({ ...c, ringR: 50 })),
      FIELD,
    )
    for (const label of placed) {
      expect(label.left).toBeGreaterThanOrEqual(0)
      expect(label.top).toBeGreaterThanOrEqual(0)
      expect(label.left + label.width).toBeLessThanOrEqual(FIELD.width)
      expect(label.top + label.height).toBeLessThanOrEqual(FIELD.height)
    }
  })

  it('clamps before scoring, so a clamped winner is not pushed onto chrome', () => {
    // A node hard against the right edge: the naive "prefer right" pick would be
    // clamped back over the zoom rail. Clamping first makes that cost visible.
    const [label] = layoutLabels(
      [request({ x: 790, y: 300, ux: 1, uy: 0, label: 'RIGHT-EDGE' })],
      [{ x: 790, y: 300, ringR: 50 }],
      FIELD,
    )
    const rail: Rect = { left: FIELD.width - 34, right: FIELD.width, top: 0, bottom: FIELD.height }
    expect(overlaps(toRect(label!), rail)).toBe(0)
  })

  it('keeps labels off the field footer', () => {
    const footer: Rect = {
      left: 0,
      right: FIELD.width,
      top: FIELD.height - 48,
      bottom: FIELD.height,
    }
    const placed = layoutLabels(
      [request({ x: 400, y: 580, uy: 1, label: 'BOTTOM-NODE' })],
      [{ x: 400, y: 580, ringR: 40 }],
      FIELD,
    )
    expect(overlaps(toRect(placed[0]!), footer)).toBe(0)
  })

  it('does not stack labels on top of each other on a dense ring', () => {
    // Twelve nodes on one ring — the case that motivated the diagonal candidates.
    const nodes = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2
      return { x: 400 + Math.cos(angle) * 160, y: 300 + Math.sin(angle) * 120, ringR: 26 }
    })
    const placed = layoutLabels(
      nodes.map((n, i) =>
        request({
          x: n.x,
          y: n.y,
          ring: n.ringR,
          label: `CMP-${i}`,
          ux: n.x - 400,
          uy: n.y - 300,
        }),
      ),
      nodes,
      FIELD,
    )

    expect(placed).toHaveLength(12)
    let collisions = 0
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        if (overlaps(toRect(placed[i]!), toRect(placed[j]!)) > 0) collisions++
      }
    }
    expect(collisions).toBe(0)
  })

  it('biases placement away from the field centre', () => {
    const [right] = layoutLabels(
      [request({ x: 600, y: 300, ux: 1, uy: 0 })],
      [{ x: 600, y: 300, ringR: 40 }],
      FIELD,
    )
    const [left] = layoutLabels(
      [request({ x: 200, y: 300, ux: -1, uy: 0 })],
      [{ x: 200, y: 300, ringR: 40 }],
      FIELD,
    )
    expect(right!.left).toBeGreaterThan(600)
    expect(left!.left + left!.width).toBeLessThan(200)
  })

  it('is deterministic', () => {
    const nodes = [{ x: 300, y: 250, ringR: 30 }, { x: 500, y: 350, ringR: 30 }]
    const reqs = [request({ x: 300, y: 250 }), request({ x: 500, y: 350, label: 'TB-500' })]
    expect(layoutLabels(reqs, nodes, FIELD)).toEqual(layoutLabels(reqs, nodes, FIELD))
  })
})
