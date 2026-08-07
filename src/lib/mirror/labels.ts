// Node-label placement for the Mirror field.
//
// Labels are laid out AFTER every node position is known, not at fixed offsets.
// A fixed offset cannot avoid a neighbour it has not seen yet, which is why the
// design's earlier attempts kept overprinting circles.
//
// Each label tests 16 candidate positions — four sides at two distances, plus
// four diagonals at each distance — scored against every node's ring, the field
// footer and the zoom rail as real rects, already-placed labels, and the pane
// edges. Cheapest wins.
//
// ── Details that are load-bearing (all learned the hard way; see the handoff
//    README, "Label placement — non-trivial, read before reimplementing") ────
//
//  * CLAMP BEFORE SCORING. Clamping a winner afterwards can shove it back onto
//    something it had specifically avoided. The score must describe the
//    position actually used.
//
//  * THE RESERVED BOX IS NEVER NARROWER THAN THE TITLE. The title renders
//    `nowrap`; capping its width would make the placer trust a box the text
//    overflows. Only the sub line wraps, inside whatever width the title
//    already demands.
//
//  * THE OVERLAYS ARE HARD CHROME. Node rings are soft — grazing one is
//    survivable — so they score at weight 1. The footer and rail are chrome:
//    printing over them is always wrong, so they carry weight 6. The footer's
//    width tracks its own copy, so guessing it is how a label slips onto it;
//    the whole bottom strip is reserved instead. Cheap, and it cannot be wrong.
//
//  * THE FIELD SIZE MUST BE FRESH. A stale cached size silently pushes the
//    SVG's bottom edge past the visible pane, and labels land on chrome the
//    engine thinks is elsewhere. Callers re-measure via ResizeObserver.

/** Reserved chrome, in px, measured from the pane edges. */
const ZOOM_RAIL_WIDTH = 34
const FIELD_FOOTER_HEIGHT = 48

/** Candidate stand-off distances. A denser ring needs the option to stand further off. */
const GAPS = [10, 30] as const

/** Diagonal candidates sit at this fraction of (ring + gap) on both axes. */
const DIAGONAL_FACTOR = 0.72

const SUB_FONT_SIZE = 9.5
/** Mean glyph width as a fraction of font size, for the monospace label face. */
const GLYPH_RATIO = 0.78

const PANE_MARGIN = 2
const EDGE_PENALTY = 30
const FAR_PENALTY = 3
const RANK_WEIGHT = 0.5
const PLACED_WEIGHT = 1.5
const CHROME_WEIGHT = 6

export interface Rect {
  left: number
  right: number
  top: number
  bottom: number
}

interface WeightedRect extends Rect {
  /** Collision weight. 1 for soft node rings, 6 for hard chrome. */
  weight: number
}

export interface LabelRequest {
  /** Node centre. */
  x: number
  y: number
  /** Radius to stand off from. */
  ring: number
  label: string
  sub: string
  /** Title font size in px. */
  size: number
  /** Optional wrap width for the sub line. 0 means no wrapping. */
  maxWidth?: number
  /** Unit vector pointing away from the field centre, used to bias direction. */
  ux?: number
  uy?: number
}

export type LabelSide = 'right' | 'left' | 'below' | 'above'

export interface PlacedLabel {
  label: string
  sub: string
  left: number
  top: number
  width: number
  height: number
  side: LabelSide
  /** flex `align-items` for the label stack. */
  align: 'flex-start' | 'flex-end' | 'center'
  textAlign: 'left' | 'right' | 'center'
  /** True when the sub line wraps and the box needs an explicit width. */
  wraps: boolean
}

export interface FieldSize {
  width: number
  height: number
}

/**
 * The box a label will occupy.
 *
 * Exported so geometry code can reason about label footprints without
 * duplicating the sizing rule.
 */
export function measureLabel(request: LabelRequest): { width: number; height: number } {
  const titleWidth = Math.round(request.label.length * request.size * GLYPH_RATIO)
  const subWidth = Math.round(request.sub.length * SUB_FONT_SIZE * GLYPH_RATIO)
  const cap = request.maxWidth ?? 0

  // Never narrower than the title — see the header.
  const width = Math.max(titleWidth, cap ? Math.min(subWidth, cap) : subWidth)
  const subLines = width > 0 ? Math.ceil(subWidth / width) : 1
  const height =
    Math.round(request.size * 1.3) + subLines * Math.round(SUB_FONT_SIZE * 1.3) + 3

  return { width, height }
}

/** Overlap area between two rects. Zero when they do not intersect. */
function overlap(a: Rect, b: Rect): number {
  const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
  const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  return w * h
}

/** Prefer the direction pointing away from the field's centre. */
function preferenceOrder(ux: number, uy: number): LabelSide[] {
  if (Math.abs(ux) > Math.abs(uy)) {
    return ux > 0
      ? ['right', 'below', 'above', 'left']
      : ['left', 'below', 'above', 'right']
  }
  return uy >= 0
    ? ['below', 'right', 'left', 'above']
    : ['above', 'right', 'left', 'below']
}

interface Candidate {
  side: LabelSide
  left: number
  top: number
  align: PlacedLabel['align']
  textAlign: PlacedLabel['textAlign']
  far: boolean
}

function candidatesFor(
  request: LabelRequest,
  size: { width: number; height: number },
): Candidate[] {
  const { x, y, ring } = request
  const { width: w, height: h } = size
  const out: Candidate[] = []

  for (const gap of GAPS) {
    const far = gap > GAPS[0]
    out.push(
      { side: 'right', left: x + ring + gap, top: y - h / 2, align: 'flex-start', textAlign: 'left', far },
      { side: 'left', left: x - ring - gap - w, top: y - h / 2, align: 'flex-end', textAlign: 'right', far },
      { side: 'below', left: x - w / 2, top: y + ring + gap, align: 'center', textAlign: 'center', far },
      { side: 'above', left: x - w / 2, top: y - ring - gap - h, align: 'center', textAlign: 'center', far },
    )

    // Diagonals break ties on a dense ring where all four sides graze a neighbour.
    const d = (ring + gap) * DIAGONAL_FACTOR
    out.push(
      { side: 'right', left: x + d, top: y + d, align: 'flex-start', textAlign: 'left', far: true },
      { side: 'right', left: x + d, top: y - d - h, align: 'flex-start', textAlign: 'left', far: true },
      { side: 'left', left: x - d - w, top: y + d, align: 'flex-end', textAlign: 'right', far: true },
      { side: 'left', left: x - d - w, top: y - d - h, align: 'flex-end', textAlign: 'right', far: true },
    )
  }

  return out
}

/**
 * Place every label, cheapest-position-first, accounting for the nodes, the
 * chrome, and each label already placed.
 *
 * Order matters: earlier requests get first pick, so callers should queue the
 * labels that matter most (the user's own, the one under tension) first.
 */
export function layoutLabels(
  requests: LabelRequest[],
  nodes: Array<{ x: number; y: number; ringR: number }>,
  field: FieldSize,
): PlacedLabel[] {
  const { width: fw, height: fh } = field
  if (fw <= 0 || fh <= 0) return []

  const obstacles: WeightedRect[] = nodes.map((n) => ({
    left: n.x - n.ringR,
    right: n.x + n.ringR,
    top: n.y - n.ringR,
    bottom: n.y + n.ringR,
    weight: 1,
  }))

  // Hard chrome. Both live in the same box as the labels, so they get real
  // rects rather than ad-hoc clamps.
  obstacles.push({ left: fw - ZOOM_RAIL_WIDTH, right: fw, top: 0, bottom: fh, weight: CHROME_WEIGHT })
  obstacles.push({ left: 0, right: fw, top: fh - FIELD_FOOTER_HEIGHT, bottom: fh, weight: CHROME_WEIGHT })

  const placed: Rect[] = []
  const out: PlacedLabel[] = []

  for (const request of requests) {
    const size = measureLabel(request)
    const order = preferenceOrder(request.ux ?? 0, request.uy ?? 1)
    const candidates = candidatesFor(request, size)

    let best: { cost: number; candidate: Candidate; box: Rect } | null = null

    for (const candidate of candidates) {
      // Clamp BEFORE scoring — see the header.
      const left = Math.max(PANE_MARGIN, Math.min(candidate.left, fw - size.width - PANE_MARGIN))
      const top = Math.max(PANE_MARGIN, Math.min(candidate.top, fh - size.height - PANE_MARGIN))
      const box: Rect = {
        left,
        right: left + size.width,
        top,
        bottom: top + size.height,
      }

      let cost = order.indexOf(candidate.side) * RANK_WEIGHT + (candidate.far ? FAR_PENALTY : 0)
      for (const obstacle of obstacles) cost += overlap(box, obstacle) * obstacle.weight
      for (const prior of placed) cost += overlap(box, prior) * PLACED_WEIGHT

      if (box.left < PANE_MARGIN) cost += (PANE_MARGIN - box.left) * EDGE_PENALTY
      if (box.right > fw - PANE_MARGIN) cost += (box.right - (fw - PANE_MARGIN)) * EDGE_PENALTY
      if (box.top < PANE_MARGIN) cost += (PANE_MARGIN - box.top) * EDGE_PENALTY
      if (box.bottom > fh - PANE_MARGIN) cost += (box.bottom - (fh - PANE_MARGIN)) * EDGE_PENALTY

      if (!best || cost < best.cost) {
        best = { cost, candidate: { ...candidate, left, top }, box }
      }
    }

    if (!best) continue

    placed.push(best.box)
    out.push({
      label: request.label,
      sub: request.sub,
      left: best.box.left,
      top: best.box.top,
      width: size.width,
      height: size.height,
      side: best.candidate.side,
      align: best.candidate.align,
      textAlign: best.candidate.textAlign,
      wraps: Boolean(request.maxWidth),
    })
  }

  return out
}
