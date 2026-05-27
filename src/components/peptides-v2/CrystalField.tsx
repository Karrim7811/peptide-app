'use client'

import { useEffect, useRef } from 'react'

type Layer = 'back' | 'front'

interface CrystalFieldProps {
  layer: Layer
  seed?: number
}

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
  r: number
  theta: number
  size: number
  rotation: number
  opacity: number
  color: string
  letter?: string
  layer: Layer
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
    const r = MIN_R_NORM + (1 - MIN_R_NORM) * rRaw
    const theta = rand() * Math.PI * 2

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

    const rotation = rand() * Math.PI * 2

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

    out.push({ type, r, theta, size, rotation, opacity, color, letter, layer })
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
  isFront: boolean,
) {
  ctx.globalAlpha = isFront ? p.opacity * 0.75 : p.opacity
  ctx.strokeStyle = p.color
  ctx.fillStyle = p.color
  ctx.lineWidth = 0.7

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(p.rotation)

  const s = p.size

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
      ctx.rotate(-p.rotation)
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

export default function CrystalField({ layer, seed = 1337 }: CrystalFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    let mounted = true
    const particles = generateParticles(seed)

    const draw = () => {
      if (!mounted) return
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const cx = w / 2
      const cy = h * CLOUD_CY_FRAC
      const R = Math.max(Math.min(w, h) * 0.46, w * 0.32)

      for (const p of particles) {
        if (p.layer !== layer) continue
        const rNoise = boundaryNoise(p.theta)
        const px = cx + p.r * R * rNoise * Math.cos(p.theta)
        const py = cy + p.r * R * rNoise * Math.sin(p.theta)
        drawParticle(ctx, p, px, py, layer === 'front')
      }
    }

    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(draw)
    }

    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (mounted) draw()
      })
    } else {
      draw()
    }

    window.addEventListener('resize', onResize)
    return () => {
      mounted = false
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [layer, seed])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: layer === 'back' ? 0 : 2,
      }}
    />
  )
}
