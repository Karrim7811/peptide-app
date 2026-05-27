'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import type { MotionValue } from 'framer-motion'

interface CrystalFieldProps {
  seed?: number
  children?: ReactNode
  /**
   * 0..1 scroll-progress MotionValue. When provided, the field drives camera
   * depth: outward parallax, size growth, cloud thinning, coalescence into
   * five molecule anchors, and final fade as the molecule resolves.
   */
  progress?: MotionValue<number>
}

// Five-node Ipamorelin topology in SVG coords (viewBox 0..580 x, ~180..220 y).
// Order: Aib · His · D-2-Nal · D-Phe · Lys.
const ANCHORS_X_SVG = [90, 190, 290, 390, 490]
const ANCHORS_Y_SVG = [220, 190, 180, 190, 220]
const MOLECULE_SVG_W = 580
const MOLECULE_SVG_H = 280
const MOLECULE_VIEWPORT_W_FRAC = 0.70
const MOLECULE_MAX_W = 720

function smoothstep(x: number, a: number, b: number): number {
  if (x <= a) return 0
  if (x >= b) return 1
  const t = (x - a) / (b - a)
  return t * t * (3 - 2 * t)
}

type Layer = 'back' | 'front'

type ParticleType =
  | 'mote-hex'
  | 'mote-pent'
  | 'mote-tri'
  | 'mote-needle'
  | 'letter'
  | 'frag-dipep'
  | 'frag-aromatic'
  | 'frag-tripep'

interface Particle {
  type: ParticleType
  // Stable identity (set once at generation)
  baseRNorm: number
  baseTheta: number
  size: number
  baseRotation: number
  opacity: number
  color: string
  letter?: string
  layer: Layer
  anchorIdx: number  // 0..4 — which of the 5 molecule anchors this particle coalesces into
  // Per-frame mutable state
  xNorm: number      // current x in cloud-local units of R (drift)
  yNorm: number
  vxNorm: number     // velocity per 60fps-frame, in units of R
  vyNorm: number
  rotationOffset: number
  omega: number      // rad per 60fps-frame
}

const AMINO_LETTERS = [
  'A', 'I', 'L', 'V', 'T', 'S', 'P', 'G', 'H', 'K',
  'R', 'N', 'D', 'Q', 'E', 'F', 'W', 'Y', 'M', 'C',
]
const BRASS = ['#C9A876', '#A88B5E', '#7D6638']
const CREAM = '#FFFEF8'
const TOTAL = 620
const FRONT_RATIO = 0.25
// Minimum normalized radius — particles cannot occupy the inner ring.
// 0.18 of the cloud R ≈ ~80px on a 1440-wide viewport, giving the wordmark breathing room.
const MIN_R_NORM = 0.18
// Cloud vertical center as a fraction of viewport height. Display type's optical
// center sits slightly above geometric center; cloud follows the wordmark.
const CLOUD_CY_FRAC = 0.45
// Reference R used to convert the brief's "px/frame at 60fps" velocity range to
// our normalized units. At typical viewports R ≈ 460, so actual pixel speeds land
// inside the 0.05–0.2 px/frame target.
const REF_R = 480

function mulberry32(seedValue: number) {
  let state = seedValue >>> 0
  return function rand() {
    state = (state + 0x6D2B79F5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── Dissolution particles ────────────────────────────────────────────────
// As the molecule dissolves (scroll 0.88 → 0.94), a fresh batch of dust spawns
// at each molecule node and arcs toward the rising vial. Each particle has a
// quadratic bezier path with a per-particle control point so the streams curve
// and braid rather than running straight.

interface DustParticle {
  anchorIdx: number       // which molecule node it spawns from (0..4)
  jitterX: number         // px offset from anchor center (origin scatter)
  jitterY: number
  targetOffsetX: number   // px offset from viewport center (inside vial body)
  targetOffsetY: number
  ctrlOffsetMag: number   // perpendicular control-point magnitude in px
  ctrlOffsetSign: number  // -1 or +1 — which side the curve bows toward
  size: number            // base draw size (px)
  color: string           // starting color (brass family)
  opacityPeak: number     // peak alpha during travel
  startT: number          // scroll progress at which travel begins
  endT: number            // scroll progress at which particle is inside vial
}

// 40 particles per node × 5 nodes = 200 dust particles. Combined with the
// fast-fading cosmos at this scroll (≤~100 active by 0.88), total active
// particles stays well under the 750 budget.
const DUST_PER_ANCHOR = 40
const POWDER_TINT = '#A88B5E'

function generateDust(seed: number): DustParticle[] {
  const rand = mulberry32(seed ^ 0xDEC0DE)
  const out: DustParticle[] = []

  for (let a = 0; a < 5; a++) {
    for (let i = 0; i < DUST_PER_ANCHOR; i++) {
      // Origin jitter: small scatter so the stream looks like dust shedding
      // from the node, not a point source.
      const jitterR = 4 + rand() * 14
      const jitterTheta = rand() * Math.PI * 2

      // Target inside the vial body — biased to the lower portion so the
      // accumulation reads as "pouring in" rather than "settling at top".
      // Vial body half-width ≈ 110px; lower half spans ≈ 50..180px below
      // viewport center after the vial is in place.
      const tWidth = 90       // ± from center horizontally
      const tYMin = 40
      const tYMax = 170
      const targetOffsetX = (rand() * 2 - 1) * tWidth
      const targetOffsetY = tYMin + rand() * (tYMax - tYMin)

      // Curve: control-point magnitude is bigger for outer-anchor particles
      // (longer travel) so the arc reads regardless of distance.
      const ctrlOffsetMag = 40 + rand() * 90
      const ctrlOffsetSign = rand() < 0.5 ? -1 : 1

      // Stagger per particle so the stream isn't monolithic.
      const startT = 0.88 + rand() * 0.025
      const endT = 0.92 + rand() * 0.025

      // Size: tiny dust grain — smaller than cloud particles so they read
      // as residue rather than reborn cloud.
      const size = 1.4 + rand() * 1.8

      // Color: mostly brass; a few cream-flash grains.
      const cPick = rand()
      const color = cPick < 0.06 ? CREAM : BRASS[Math.floor(rand() * BRASS.length)]

      const opacityPeak = 0.55 + rand() * 0.30

      out.push({
        anchorIdx: a,
        jitterX: Math.cos(jitterTheta) * jitterR,
        jitterY: Math.sin(jitterTheta) * jitterR,
        targetOffsetX,
        targetOffsetY,
        ctrlOffsetMag,
        ctrlOffsetSign,
        size,
        color,
        opacityPeak,
        startT,
        endT,
      })
    }
  }

  return out
}

// Linearly blend two hex colors (#RRGGBB) by amount k ∈ [0, 1].
function lerpHex(a: string, b: string, k: number): string {
  const ah = a.replace('#', '')
  const bh = b.replace('#', '')
  const ar = parseInt(ah.slice(0, 2), 16)
  const ag = parseInt(ah.slice(2, 4), 16)
  const ab = parseInt(ah.slice(4, 6), 16)
  const br = parseInt(bh.slice(0, 2), 16)
  const bg = parseInt(bh.slice(2, 4), 16)
  const bb = parseInt(bh.slice(4, 6), 16)
  const r = Math.round(ar + (br - ar) * k)
  const g = Math.round(ag + (bg - ag) * k)
  const bl = Math.round(ab + (bb - ab) * k)
  return `rgb(${r}, ${g}, ${bl})`
}

function generateParticles(seed: number): Particle[] {
  const rand = mulberry32(seed)
  const out: Particle[] = []

  for (let i = 0; i < TOTAL; i++) {
    const u = rand()
    const rRaw = Math.pow(u, 1.7) * (0.95 + rand() * 0.10)
    const baseRNorm = MIN_R_NORM + (1 - MIN_R_NORM) * rRaw
    const baseTheta = rand() * Math.PI * 2

    const tRoll = rand()
    let type: ParticleType
    if (tRoll < 0.50) {
      const motePick = rand()
      if (motePick < 0.30) type = 'mote-hex'
      else if (motePick < 0.55) type = 'mote-pent'
      else if (motePick < 0.80) type = 'mote-tri'
      else type = 'mote-needle'
    } else if (tRoll < 0.80) {
      type = 'letter'
    } else {
      const fragPick = rand()
      if (fragPick < 0.40) type = 'frag-dipep'
      else if (fragPick < 0.75) type = 'frag-aromatic'
      else type = 'frag-tripep'
    }

    let size: number
    if (type === 'letter') size = 9 + rand() * 5
    else if (type.startsWith('frag')) size = 6 + rand() * 6
    else size = 3 + rand() * 4

    const baseRotation = rand() * Math.PI * 2

    let opacity: number
    if (type === 'letter') {
      opacity = 0.20 + rand() * 0.45
    } else if (type.startsWith('frag')) {
      opacity = 0.12 + rand() * 0.23
    } else {
      const p = rand()
      if (p < 0.85) opacity = 0.15 + rand() * 0.40
      else opacity = 0.55 + rand() * 0.20
    }

    let color: string
    if (type.startsWith('mote') && rand() < 0.05) {
      color = CREAM
      opacity = Math.max(opacity, 0.50)
    } else if (type === 'letter') {
      const cPick = rand()
      color = cPick < 0.20 ? BRASS[0] : cPick < 0.65 ? BRASS[1] : BRASS[2]
    } else {
      color = BRASS[Math.floor(rand() * BRASS.length)]
    }

    const letter =
      type === 'letter'
        ? AMINO_LETTERS[Math.floor(rand() * AMINO_LETTERS.length)]
        : undefined

    const layer: Layer = rand() < FRONT_RATIO ? 'front' : 'back'

    // Initial drift position == base position (in normalized cloud-local cartesian)
    const xNorm = baseRNorm * Math.cos(baseTheta)
    const yNorm = baseRNorm * Math.sin(baseTheta)

    // Anchor assignment: split the cloud into 5 vertical bands by base x.
    // Particles in the left band collapse to anchor 0 (Aib), rightmost to 4 (Lys).
    const anchorIdx = Math.min(4, Math.max(0, Math.floor((xNorm + 1) / 2 * 5)))

    // Velocity: small random vector. Brief target: 0.05–0.2 px/frame at 60fps.
    // Convert by dividing by REF_R so actual pixel speed lands near spec on typical viewports.
    const vMagPx = 0.05 + rand() * 0.15
    const vDir = rand() * Math.PI * 2
    const vxNorm = (vMagPx / REF_R) * Math.cos(vDir)
    const vyNorm = (vMagPx / REF_R) * Math.sin(vDir)

    // Rotation drift: only for crystals and fragments. Brief: 0.05–0.2 deg/frame.
    let omega = 0
    if (type !== 'letter') {
      const omegaMag = (0.05 + rand() * 0.15) * (Math.PI / 180) // deg → rad
      omega = (rand() < 0.5 ? -1 : 1) * omegaMag
    }

    out.push({
      type, baseRNorm, baseTheta, size, baseRotation, opacity, color, letter, layer, anchorIdx,
      xNorm, yNorm, vxNorm, vyNorm, rotationOffset: 0, omega,
    })
  }

  return out
}

function boundaryNoise(theta: number): number {
  return (
    1 +
    0.06 * Math.sin(3 * theta + 0.7) +
    0.04 * Math.sin(5 * theta + 1.9) +
    0.03 * Math.sin(7 * theta + 3.3)
  )
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  x: number,
  y: number,
  size: number,
  rotation: number,
  alpha: number,
) {
  ctx.globalAlpha = alpha
  ctx.strokeStyle = p.color
  ctx.fillStyle = p.color
  ctx.lineWidth = 0.7

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)

  const s = size

  switch (p.type) {
    case 'mote-hex': {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        const px = Math.cos(a) * s * 0.5
        const py = Math.sin(a) * s * 0.5
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
      break
    }
    case 'mote-pent': {
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2
        const px = Math.cos(a) * s * 0.5
        const py = Math.sin(a) * s * 0.5
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
      break
    }
    case 'mote-tri': {
      ctx.beginPath()
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2
        const rr = s * 0.5 * (0.82 + ((i * 0.41) % 0.30))
        const px = Math.cos(a) * rr
        const py = Math.sin(a) * rr
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
      break
    }
    case 'mote-needle': {
      ctx.lineWidth = 0.6
      ctx.beginPath()
      ctx.moveTo(0, -s)
      ctx.lineTo(0, s)
      ctx.stroke()
      break
    }
    case 'letter': {
      // Letters stay upright — undo rotation before stroking text.
      ctx.rotate(-rotation)
      ctx.font = `300 ${s}px "JetBrains Mono", ui-monospace, Menlo, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(p.letter ?? '', 0, 0)
      break
    }
    case 'frag-dipep': {
      const r = s * 0.18
      const d = s * 0.45
      ctx.beginPath()
      ctx.arc(-d, 0, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(d, 0, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-d + r, 0)
      ctx.lineTo(d - r, 0)
      ctx.stroke()
      break
    }
    case 'frag-aromatic': {
      const hs = s * 0.40
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        const px = Math.cos(a) * hs
        const py = Math.sin(a) * hs
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(hs, 0)
      ctx.lineTo(hs + s * 0.35, 0)
      ctx.stroke()
      break
    }
    case 'frag-tripep': {
      const r = s * 0.10
      const d = s * 0.42
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2
        ctx.beginPath()
        ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
  }

  ctx.restore()
}

export default function CrystalField({ seed = 1337, children, progress }: CrystalFieldProps) {
  const backRef = useRef<HTMLCanvasElement>(null)
  const frontRef = useRef<HTMLCanvasElement>(null)
  const progressRef = useRef<number>(0)

  // Keep a plain-number mirror of the MotionValue so the rAF loop can read
  // synchronously without invoking any framer-motion subscription machinery
  // per frame. The MotionValue updates progressRef.current via `on('change')`.
  useEffect(() => {
    if (!progress) {
      progressRef.current = 0
      return
    }
    progressRef.current = progress.get()
    const unsub = progress.on('change', (v) => {
      progressRef.current = v
    })
    return unsub
  }, [progress])

  useEffect(() => {
    const particles = generateParticles(seed)
    const dust = generateDust(seed)
    let raf = 0
    let mounted = true
    let lastT = performance.now()
    let viewportW = window.innerWidth
    let viewportH = window.innerHeight

    const sizeCanvas = (c: HTMLCanvasElement) => {
      const dpr = window.devicePixelRatio || 1
      const targetW = Math.floor(viewportW * dpr)
      const targetH = Math.floor(viewportH * dpr)
      if (c.width !== targetW) c.width = targetW
      if (c.height !== targetH) c.height = targetH
      c.style.width = `${viewportW}px`
      c.style.height = `${viewportH}px`
      return dpr
    }

    const tick = (now: number) => {
      if (!mounted) return
      const dtFrame = Math.min((now - lastT) / 16.67, 3)
      lastT = now

      const backCanvas = backRef.current
      const frontCanvas = frontRef.current
      if (!backCanvas || !frontCanvas) {
        raf = requestAnimationFrame(tick)
        return
      }

      // Resize check
      if (window.innerWidth !== viewportW || window.innerHeight !== viewportH) {
        viewportW = window.innerWidth
        viewportH = window.innerHeight
      }

      const dpr = sizeCanvas(backCanvas)
      sizeCanvas(frontCanvas)

      const backCtx = backCanvas.getContext('2d')
      const frontCtx = frontCanvas.getContext('2d')
      if (!backCtx || !frontCtx) {
        raf = requestAnimationFrame(tick)
        return
      }
      backCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      frontCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      backCtx.clearRect(0, 0, viewportW, viewportH)
      frontCtx.clearRect(0, 0, viewportW, viewportH)

      const cx = viewportW / 2
      const cy = viewportH * CLOUD_CY_FRAC
      const R = Math.max(Math.min(viewportW, viewportH) * 0.46, viewportW * 0.32)

      // Read current scroll progress once per frame
      const t = progressRef.current

      // Derive scroll-state factors. Smoothstep ranges chosen so transitions
      // overlap slightly — never a hard handoff between states.
      // Coalescence/shrink finish at 0.85 to leave clear room for the vial
      // reveal (0.88–0.97). Cosmos fade is now 0.80 → 0.90 so the cloud is
      // essentially gone by the time dissolution particles peak, keeping the
      // simultaneously-rendered particle count under the 750 budget.
      const parallaxT = smoothstep(t, 0.05, 0.65)
      const coalK = smoothstep(t, 0.55, 0.85)
      const centerThinT = smoothstep(t, 0.30, 0.55)
      const sizeGrowT = smoothstep(t, 0.0, 0.55)
      const sizeShrinkT = smoothstep(t, 0.55, 0.85)
      const fadeOutT = smoothstep(t, 0.80, 0.90)

      // Molecule anchor positions in viewport pixels. Computed once per frame
      // since viewport size + cy + R can change on resize.
      const moleculeWidth = Math.min(viewportW * MOLECULE_VIEWPORT_W_FRAC, MOLECULE_MAX_W)
      const moleculeScale = moleculeWidth / MOLECULE_SVG_W
      const moleculeLeft = cx - moleculeWidth / 2
      const anchorPx: Array<[number, number]> = [
        [moleculeLeft + ANCHORS_X_SVG[0] * moleculeScale, cy + (ANCHORS_Y_SVG[0] - 200) * moleculeScale],
        [moleculeLeft + ANCHORS_X_SVG[1] * moleculeScale, cy + (ANCHORS_Y_SVG[1] - 200) * moleculeScale],
        [moleculeLeft + ANCHORS_X_SVG[2] * moleculeScale, cy + (ANCHORS_Y_SVG[2] - 200) * moleculeScale],
        [moleculeLeft + ANCHORS_X_SVG[3] * moleculeScale, cy + (ANCHORS_Y_SVG[3] - 200) * moleculeScale],
        [moleculeLeft + ANCHORS_X_SVG[4] * moleculeScale, cy + (ANCHORS_Y_SVG[4] - 200) * moleculeScale],
      ]

      for (const p of particles) {
        // 1. Drift update — gentle wander in normalized cloud-local space
        p.xNorm += p.vxNorm * dtFrame
        p.yNorm += p.vyNorm * dtFrame
        p.rotationOffset += p.omega * dtFrame

        // 2. Soft bounce at the cloud boundary so particles stay in the lobed zone
        const rNorm = Math.hypot(p.xNorm, p.yNorm)
        if (rNorm > 0.001) {
          const angle = Math.atan2(p.yNorm, p.xNorm)
          const boundary = boundaryNoise(angle) * 0.98
          if (rNorm > boundary) {
            const nx = p.xNorm / rNorm
            const ny = p.yNorm / rNorm
            const dot = p.vxNorm * nx + p.vyNorm * ny
            if (dot > 0) {
              p.vxNorm -= 2 * dot * nx
              p.vyNorm -= 2 * dot * ny
              // gentle damping so bounces feel like settling, not pinball
              p.vxNorm *= 0.85
              p.vyNorm *= 0.85
            }
            p.xNorm = nx * boundary
            p.yNorm = ny * boundary
          }
        }

        // 3. Cloud-local drift position in viewport pixels
        const baseDrawX = cx + p.xNorm * R
        const baseDrawY = cy + p.yNorm * R

        // 4. Outward parallax — center particles barely move, edge particles
        // accelerate toward the viewport edge as we "fall into" the cloud.
        // Direction comes from base angle (stable), magnitude from base radius.
        const dirX = Math.cos(p.baseTheta)
        const dirY = Math.sin(p.baseTheta)
        const parallaxMag = parallaxT * R * 1.8 * Math.pow(p.baseRNorm, 0.7)
        let drawX = baseDrawX + dirX * parallaxMag
        let drawY = baseDrawY + dirY * parallaxMag

        // 5. Coalescence — past scroll 0.55, the remaining particles drift
        // toward their assigned molecule anchor. By scroll 0.92 they're
        // fully piled at 5 points; the molecule SVG then renders on top.
        if (coalK > 0) {
          const [ax, ay] = anchorPx[p.anchorIdx]
          drawX = drawX * (1 - coalK) + ax * coalK
          drawY = drawY * (1 - coalK) + ay * coalK
        }

        // 6. Size: grow as the cloud comes "closer" (state 2/3), then shrink
        // as particles converge on anchors (state 4/5) so 5 dense points
        // don't visually overwhelm the resolving molecule.
        const sizeScale = (1 + 0.5 * sizeGrowT) * (1 - 0.85 * sizeShrinkT)
        const size = p.size * sizeScale

        // 7. Opacity: thin out inner-cloud particles in state 3 (so cloud
        // "thins" near center), then global fade as the molecule overtakes.
        const centerThin = centerThinT * (1 - p.baseRNorm) * 0.65
        const fronAlpha = p.layer === 'front' ? 0.75 : 1
        const alpha = p.opacity * (1 - centerThin) * (1 - fadeOutT) * fronAlpha

        if (alpha < 0.01 || size < 0.4) continue

        const ctx = p.layer === 'front' ? frontCtx : backCtx
        const rotation = p.baseRotation + p.rotationOffset
        drawParticle(ctx, p, drawX, drawY, size, rotation, alpha)
      }

      // ─── Dust pass: molecule dissolution → vial ─────────────────────────
      // Only active in the 0.88–0.97 window. Each particle traces a quadratic
      // bezier from its anchor (with jitter) to a target inside the vial body.
      // As u → 1 the dot shrinks slightly and shifts toward the powder tint,
      // then fades on entry. Outside the window, the loop short-circuits.
      if (t >= 0.875 && t <= 1.0) {
        const targetCx = viewportW / 2
        const targetCy = viewportH / 2

        for (const d of dust) {
          if (t < d.startT) continue
          if (t > d.endT) continue

          const u = (t - d.startT) / (d.endT - d.startT)
          // Bezier endpoints in viewport pixels.
          const [ax, ay] = anchorPx[d.anchorIdx]
          const p0x = ax + d.jitterX
          const p0y = ay + d.jitterY
          const p2x = targetCx + d.targetOffsetX
          const p2y = targetCy + d.targetOffsetY

          // Control point: midpoint, offset perpendicular to p0→p2.
          const dx = p2x - p0x
          const dy = p2y - p0y
          const len = Math.hypot(dx, dy) || 1
          // Perpendicular unit vector (right-hand normal of travel direction).
          const px = -dy / len
          const py = dx / len
          const mx = (p0x + p2x) / 2
          const my = (p0y + p2y) / 2
          const p1x = mx + px * d.ctrlOffsetSign * d.ctrlOffsetMag
          const p1y = my + py * d.ctrlOffsetSign * d.ctrlOffsetMag

          const omu = 1 - u
          const bx = omu * omu * p0x + 2 * omu * u * p1x + u * u * p2x
          const by = omu * omu * p0y + 2 * omu * u * p1y + u * u * p2y

          // Size: starts at full, shrinks to 0.55× as it becomes a grain.
          const size = d.size * (1 - 0.45 * u)
          // Color: lerp from natural brass toward powder tint as it enters.
          const col = u < 0.6 ? d.color : lerpHex(d.color, POWDER_TINT, (u - 0.6) / 0.4)

          // Alpha: rise quickly (0..0.18), hold (0.18..0.75), fall as it
          // enters the vial (0.75..1.0). End alpha ~0 so the transition into
          // the powder volume is invisible.
          let alpha = d.opacityPeak
          if (u < 0.18) alpha *= u / 0.18
          else if (u > 0.75) alpha *= Math.max(0, 1 - (u - 0.75) / 0.25)

          if (alpha < 0.01) continue

          // Render onto the front canvas so dust sits above cloud remnants
          // but below the vial (which is at zIndex 4).
          frontCtx.globalAlpha = alpha
          frontCtx.fillStyle = col
          frontCtx.beginPath()
          frontCtx.arc(bx, by, size * 0.5, 0, Math.PI * 2)
          frontCtx.fill()
        }
      }

      raf = requestAnimationFrame(tick)
    }

    const startLoop = () => {
      lastT = performance.now()
      raf = requestAnimationFrame(tick)
    }

    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (mounted) startLoop()
      })
    } else {
      startLoop()
    }

    return () => {
      mounted = false
      cancelAnimationFrame(raf)
    }
  }, [seed])

  return (
    <>
      <canvas
        ref={backRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {children}
      <canvas
        ref={frontRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </>
  )
}
