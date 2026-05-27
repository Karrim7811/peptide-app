'use client'

import { useEffect, useRef, type ReactNode } from 'react'

interface CrystalFieldProps {
  seed?: number
  children?: ReactNode
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
      type, baseRNorm, baseTheta, size, baseRotation, opacity, color, letter, layer,
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

export default function CrystalField({ seed = 1337, children }: CrystalFieldProps) {
  const backRef = useRef<HTMLCanvasElement>(null)
  const frontRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const particles = generateParticles(seed)
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

        // 3. Cloud projection — Reference R picks up viewport size each frame
        // (resize handled by recomputing here, no per-particle state to rescale).
        const R = Math.max(Math.min(viewportW, viewportH) * 0.46, viewportW * 0.32)
        const drawX = cx + p.xNorm * R
        const drawY = cy + p.yNorm * R

        if (p.opacity < 0.01) continue
        const isFront = p.layer === 'front'
        const alpha = isFront ? p.opacity * 0.75 : p.opacity

        const ctx = isFront ? frontCtx : backCtx
        const rotation = p.baseRotation + p.rotationOffset
        drawParticle(ctx, p, drawX, drawY, p.size, rotation, alpha)
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
