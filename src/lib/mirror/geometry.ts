// Field geometry for the Mirror's first three layers.
//
// Every layer resolves to the same shapes — nodes, edges, and queued label
// requests — so the field renderer stays layer-agnostic and the label placer
// runs once over whatever the active layer produced.
//
// Node treatment encodes the three tier states, which must stay visually
// distinct (see entitlement.ts):
//   Resolved   solid fill, full-opacity stroke
//   Locked     dashed ring at its own hue, low opacity — YOURS, withheld
//   Not yours  faint, no ring
// A locked compound still DRAWS ITS EDGES to unheld neighbours. That is the
// entire argument for a one-compound free tier, and the pricing page
// illustrates it, so the field has to keep the promise.

import type { Category, Compound, StackEntry } from '@/lib/catalog'
import type { Entitlements } from '@/lib/entitlement'
import type { LabelRequest } from '@/lib/mirror/labels'

/** Supply at or below this many days is "thinning" and recolours to the tension hue. */
export const TENSION_DAYS = 7

/** Beyond this many compounds a region resolves onto two concentric rings. */
const TWO_RING_THRESHOLD = 8

/** Most compounds a region will draw. The rest live in the panel list. */
const MAX_REGION_NODES = 12

export interface FieldNode {
  id: string
  x: number
  y: number
  r: number
  color: string
  fillOpacity: number
  strokeWidth: number
  strokeOpacity: number
  ringR: number
  ringOpacity: number
  /** SVG dash array. '0' is solid. Dashed means tension or locked. */
  ringDash: string
  /** Thinning supply animates on cxthin — the fastest motion, because it needs attention. */
  thinning: boolean
  label: string
}

export interface FieldEdge {
  x1: number
  y1: number
  x2: number
  y2: number
  stroke: string
  opacity: number
  /** Dashed edge = interrupted relationship; animates on cxmarch. */
  dashed: boolean
}

export interface MoleculeBond {
  x1: number
  y1: number
  x2: number
  y2: number
  stroke: string
}

export interface Atom {
  x: number
  y: number
  r: number
  fill: string
}

export interface FieldGeometry {
  nodes: FieldNode[]
  edges: FieldEdge[]
  molecule: MoleculeBond[]
  atoms: Atom[]
  labels: LabelRequest[]
}

export interface GeometryPalette {
  hueFor(catId: string): string
  tension: string
  faint: string
  faintest: string
}

export interface GeometryInput {
  width: number
  height: number
  entitlements: Entitlements
  categories: Category[]
  compounds: Record<string, Compound>
  palette: GeometryPalette
}

const EMPTY: FieldGeometry = { nodes: [], edges: [], molecule: [], atoms: [], labels: [] }

/** The field needs real dimensions before anything can be positioned. */
function tooSmall(width: number, height: number): boolean {
  return !(width > 80 && height > 80)
}

/**
 * Short display name. A ring of ten nodes has no room for full catalog names,
 * so strip the parenthetical and cap the stem. Long names truncate on BOTH ring
 * layers — a nowrap title sets the reserved box width, so an untruncated one
 * crowds its neighbours. Full names are right there in the panel list.
 */
export function shortName(name: string, max: number): string {
  const stem = name.split(' (')[0] ?? name
  if (stem.length <= max) return stem
  const cut = stem.lastIndexOf(' ', max)
  return (cut > 5 ? stem.slice(0, cut) : stem.slice(0, max)) + '…'
}

// ── Layer 1 · WHOLE ─────────────────────────────────────────────────────────

/**
 * The user's regions as glowing nodes.
 *
 * Locked regions still occupy the field. An empty map would misrepresent the
 * product; a dimmed one shows the shape of what the tier is withholding.
 */
export function buildWholeLayer(input: GeometryInput): FieldGeometry {
  const { width: fw, height: fh, entitlements: ent, categories, palette } = input
  if (tooSmall(fw, fh)) return EMPTY

  const cx = fw * 0.5
  const cy = fh * 0.44
  const m = Math.min(fw, fh)

  const mine = categories
    .filter((c) => ent.ownedIn(c.id).length > 0)
    .sort((a, b) => a.order - b.order)

  const lockedOnly = ent.isFree
    ? categories
        .filter((c) => ent.lockedIn(c.id).length > 0 && ent.resolvedIn(c.id).length === 0)
        .sort((a, b) => a.order - b.order)
    : []

  const ordered = [
    ...mine.map((c) => ({ category: c, locked: false })),
    ...lockedOnly.map((c) => ({ category: c, locked: true })),
  ]

  const n = ordered.length || 1
  const rr = Math.max(22, Math.min(fw * 0.07, fh * 0.14, 54))
  const ring = Math.max(rr * 2.2, Math.min(fw * 0.28, m * 0.4))

  const nodes: FieldNode[] = []
  const labels: LabelRequest[] = []

  ordered.forEach(({ category, locked }, i) => {
    const list = locked ? ent.lockedIn(category.id) : ent.resolvedIn(category.id)
    const worst = [...list].sort((a, b) => a.supplyDays - b.supplyDays)[0]
    const tense = !locked && Boolean(worst) && worst!.supplyDays <= TENSION_DAYS
    const color = tense ? palette.tension : palette.hueFor(category.id)

    const angle = -Math.PI / 2 + i * ((2 * Math.PI) / n)
    const x = n === 1 ? cx : cx + Math.cos(angle) * ring
    const y = n === 1 ? cy : cy + Math.sin(angle) * ring * 0.62
    const r = rr * (0.7 + Math.min(list.length, 4) * 0.12)

    nodes.push({
      id: category.id,
      x,
      y,
      r,
      color,
      fillOpacity: locked ? 0.03 : 0.15,
      strokeWidth: locked ? 1 : 1.5,
      strokeOpacity: locked ? 0.34 : 1,
      ringR: r + 11,
      ringOpacity: locked ? 0.2 : tense ? 0.55 : 0.14,
      ringDash: locked || tense ? '8 7' : '0',
      thinning: tense,
      label: category.label,
    })

    const count = list.length
    labels.push({
      x,
      y,
      ring: r + 11,
      label: category.label,
      sub: locked
        ? `${count} LOCKED`
        : tense
          ? `${worst!.supplyDays}D LEFT`
          : `${count} RESOLVED`,
      size: 10.5,
      maxWidth: 104,
      ux: n === 1 ? 0 : Math.cos(angle),
      uy: n === 1 ? 1 : Math.sin(angle) * 0.62,
    })
  })

  return { nodes, edges: [], molecule: [], atoms: [], labels }
}

// ── Layers 2 and 3 · REGION and COMPOUND ────────────────────────────────────

interface Positioned {
  compound: Compound
  x: number
  y: number
  r: number
  ux: number
  uy: number
}

/**
 * Compounds in one region, on one or two rings — or one compound centred with
 * its stacking partners in orbit.
 */
export function buildRegionLayer(
  input: GeometryInput,
  regionId: string,
  focusedId: string | null,
  orbit: number,
): FieldGeometry {
  const { width: fw, height: fh, entitlements: ent, compounds, palette } = input
  if (tooSmall(fw, fh)) return EMPTY

  const cx = fw * 0.5
  const cy = fh * 0.44
  const m = Math.min(fw, fh)
  const molecule: MoleculeBond[] = []
  const atoms: Atom[] = []

  const inRegion = Object.values(compounds)
    .filter((c) => c.catId === regionId)
    .slice(0, MAX_REGION_NODES)

  const focused = focusedId ? compounds[focusedId] : null
  const positions: Positioned[] = []

  if (focused) {
    // Layer 3: the compound centred, its stacking partners orbiting.
    const rr = Math.max(18, Math.min(fw * 0.06, fh * 0.12, 44))
    const orb = Math.max(rr * 2.8, Math.min(fw * 0.3, m * 0.42))
    const partners = focused.stacksWith
      .map((id) => compounds[id])
      .filter((c): c is Compound => Boolean(c))
      .slice(0, 10)

    positions.push({ compound: focused, x: cx, y: cy, r: rr, ux: 0, uy: 1 })

    partners.forEach((partner, i) => {
      const angle = orbit + i * ((2 * Math.PI) / Math.max(partners.length, 1))
      positions.push({
        compound: partner,
        x: cx + Math.cos(angle) * orb,
        y: cy + Math.sin(angle) * orb * 0.58,
        r: Math.max(14, rr * 0.5),
        ux: Math.cos(angle),
        uy: Math.sin(angle) * 0.58,
      })
    })

    // A seven-point scaffold behind the focused compound.
    const R = rr * 0.62
    const points = Array.from({ length: 7 }, (_, i) => {
      const a = -Math.PI / 2 + i * ((2 * Math.PI) / 7)
      return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R }
    })
    const accent = palette.hueFor(regionId)
    points.forEach((p, i) => {
      molecule.push({ x1: p.x, y1: p.y, x2: points[(i + 1) % 7]!.x, y2: points[(i + 1) % 7]!.y, stroke: accent })
      molecule.push({ x1: p.x, y1: p.y, x2: points[(i + 3) % 7]!.x, y2: points[(i + 3) % 7]!.y, stroke: palette.faintest })
      atoms.push({ x: p.x, y: p.y, r: i % 2 ? 3 : 4.4, fill: i % 3 === 2 ? palette.faint : accent })
    })
  } else {
    const n = inRegion.length
    const rr = Math.max(15, Math.min(fw * 0.05, fh * 0.1, 34))

    if (n <= 3) {
      const gap = Math.min(fw / (n + 0.6), rr * 4.6)
      inRegion.forEach((c, i) => {
        positions.push({
          compound: c,
          x: cx + (i - (n - 1) / 2) * gap,
          y: cy + (i % 2 ? rr * 0.9 : -rr * 0.5),
          r: rr,
          ux: 0,
          uy: 1,
        })
      })
    } else {
      const orb = Math.max(rr * 2.6, Math.min(fw * 0.3, m * 0.44))
      // Beyond eight compounds a single ring leaves no radial room for labels,
      // so the region resolves onto two rings instead of one crowded one.
      const twoRing = n > TWO_RING_THRESHOLD
      const innerCount = twoRing ? Math.ceil(n / 2) : n

      inRegion.forEach((c, i) => {
        const onInner = !twoRing || i < innerCount
        const count = onInner ? innerCount : n - innerCount
        const idx = onInner ? i : i - innerCount
        const angle =
          -Math.PI / 2 +
          idx * ((2 * Math.PI) / Math.max(count, 1)) +
          (onInner ? 0 : Math.PI / Math.max(count, 1))
        const radius = onInner ? orb * (twoRing ? 0.56 : 1) : orb * 1.04

        positions.push({
          compound: c,
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius * 0.6,
          r: twoRing ? rr * 0.82 : rr,
          ux: Math.cos(angle),
          uy: Math.sin(angle) * 0.6,
        })
      })
    }
  }

  const nodes: FieldNode[] = []
  const labels: LabelRequest[] = []

  // "Crowded" is about ROOM, not headcount: a 384x260 phone field cannot host
  // six 104px label boxes however few nodes there are.
  const room = (fw * fh) / Math.max(positions.length, 1)
  const crowded = positions.length > 6 || room < 20000

  for (const p of positions) {
    const { compound } = p
    const resolved = ent.held(compound.id) ? ent.ownedEntry(compound.id) : null
    const locked = ent.lockedEntry(compound.id)
    const isFocused = Boolean(focused) && compound.id === focused!.id
    const tense = Boolean(resolved) && resolved!.supplyDays <= TENSION_DAYS
    const color = tense ? palette.tension : palette.hueFor(compound.catId)

    nodes.push({
      id: compound.id,
      x: p.x,
      y: p.y,
      r: p.r,
      color,
      fillOpacity: isFocused ? 0.05 : resolved ? 0.14 : locked ? 0.05 : 0.04,
      strokeWidth: isFocused ? 2 : 1.4,
      strokeOpacity: resolved ? 1 : locked ? 0.55 : 0.4,
      ringR: p.r + 10,
      ringOpacity: tense ? 0.6 : locked ? 0.3 : isFocused ? 0.28 : 0,
      ringDash: tense || locked ? '8 7' : '0',
      thinning: tense,
      label: compound.name,
    })

    // Label the nodes that carry meaning. A dozen labels on one ring is noise,
    // so unheld compounds stay as dots and are named in the panel list instead.
    if (!(resolved || locked || isFocused || !crowded)) continue

    // At layer 3 the focused compound is already the panel's heading — a second
    // label on the canvas would sit inside its own orbit.
    if (focused && isFocused) continue

    const isRegionLayer = !focused
    const length = Math.hypot(p.ux, p.uy) || 1
    const sub = tense
      ? `${resolved!.supply}% · ${resolved!.supplyDays} DAYS LEFT`
      : resolved
        ? `${compound.grade} · ${resolved.supply}%`
        : locked
          ? `${compound.grade} · LOCKED`
          : `${compound.grade} · NOT YOURS`

    labels.push({
      x: p.x,
      y: p.y,
      ring: p.r + 10,
      label: shortName(compound.name, isRegionLayer ? 12 : 16).toUpperCase(),
      sub: isRegionLayer
        ? tense
          ? `${resolved!.supplyDays}D LEFT`
          : locked
            ? 'LOCKED'
            : compound.grade
        : sub,
      size: 10.5,
      maxWidth: 104,
      ux: p.ux / length,
      uy: p.uy / length,
    })
  }

  // Edges. A locked compound still draws to unheld neighbours — that promise is
  // the whole argument for the free tier.
  const edges: FieldEdge[] = []
  const seen = new Set<string>()
  const byId = new Map(positions.map((p) => [p.compound.id, p]))

  for (const p of positions) {
    for (const toId of p.compound.stacksWith) {
      const target = byId.get(toId)
      if (!target) continue
      const key = [p.compound.id, toId].sort().join('-')
      if (seen.has(key)) continue
      seen.add(key)

      const bothResolved = ent.held(p.compound.id) && ent.held(toId)
      const eitherOwned = Boolean(ent.ownedEntry(p.compound.id) || ent.ownedEntry(toId))

      edges.push({
        x1: p.x,
        y1: p.y,
        x2: target.x,
        y2: target.y,
        stroke: bothResolved ? palette.hueFor(p.compound.catId) : palette.faintest,
        opacity: bothResolved ? 0.5 : eitherOwned ? 0.28 : 0.12,
        // An edge reaching a compound the tier will not resolve is an
        // interrupted relationship, and reads as one.
        dashed: eitherOwned && !bothResolved,
      })
    }
  }

  return { nodes, edges, molecule, atoms, labels }
}
