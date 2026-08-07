'use client'

import { useEffect, useRef } from 'react'
import { modeColor, prefersReducedMotion } from './tokens'

// Ports `startNetwork()` / `drawStatic()` and helpers `vial` / `anchors` /
// `lerp` / `hexToArr` / `mixHex` / `modeColor` from the V4 design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`, ~lines 617-698).
//
// Full-viewport fixed canvas behind the landing page content. Draws a
// particle network whose formation and accent color respond to the active
// `mode` (0-5, driven by `useSceneMode`). Falls back to a single static
// network render (no rAF loop) when reduced motion is requested via prop or
// `prefers-reduced-motion`.

type NetNode = {
  x: number
  y: number
  hx: number
  hy: number
  vx: number
  vy: number
  r: number
}

type Anchor = { x: number; y: number; label: string }

const MECH = ['VEGF', 'mTOR', 'IGF-1', 'FGF', 'TGF-β', 'GH', 'Inflammation', 'Angiogenesis']
const PEP = [
  'BPC-157',
  'TB-500',
  'GHK-Cu',
  'AOD-9604',
  'CJC-1295',
  'Ipamorelin',
  'Tesamorelin',
  'Semaglutide',
  'Retatrutide',
  'Selank',
  'Epithalon',
  'MOTS-c',
]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function hexToArr(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Ported for fidelity with the prototype; unused there too (dead code in the
// original `startNetwork` — `mixHex` is defined but never invoked).
function mixHex(h1: string, h2: string, t: number): [number, number, number] {
  const a = hexToArr(h1)
  const b = hexToArr(h2)
  return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))]
}
void mixHex

function anchors(labels: string[], radius: number, W: number, H: number): Anchor[] {
  const cx = W / 2
  const cy = H * 0.46
  return labels.map((l, i) => {
    const a = (i / labels.length) * Math.PI * 2 - Math.PI / 2
    return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius * 0.8, label: l }
  })
}

function vial(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, acc: string) {
  ctx.save()
  ctx.shadowColor = `rgba(${acc},0.8)`
  ctx.shadowBlur = 14
  ctx.fillStyle = `rgba(${acc},1)`
  ctx.fillRect(x - 4 * s, y - 11 * s, 8 * s, 4 * s)
  ctx.shadowBlur = 0
  ctx.strokeStyle = `rgba(${acc},0.9)`
  ctx.lineWidth = 1
  ctx.fillStyle = `rgba(${acc},0.12)`
  ctx.beginPath()
  ctx.rect(x - 5 * s, y - 6 * s, 10 * s, 15 * s)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = `rgba(${acc},0.45)`
  ctx.fillRect(x - 4.2 * s, y + 2 * s, 8.4 * s, 6.5 * s)
  ctx.restore()
}

function drawStatic(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = window.innerWidth
  const H = window.innerHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < 70; i++) pts.push({ x: Math.random() * W, y: Math.random() * H })
  ctx.strokeStyle = 'rgba(0,229,255,0.18)'
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)
      if (d < 130) {
        ctx.beginPath()
        ctx.moveTo(pts[i].x, pts[i].y)
        ctx.lineTo(pts[j].x, pts[j].y)
        ctx.stroke()
      }
    }
  }
  ctx.fillStyle = 'rgba(0,229,255,0.7)'
  pts.forEach((p) => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 1.4, 0, 6.283)
    ctx.fill()
  })
}

export default function ParticleNetwork({
  mode,
  reduceMotion,
}: {
  mode: number
  reduceMotion?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modeRef = useRef(mode)

  // Keep the rAF loop's mode reference current without tearing down/rebuilding
  // the whole canvas setup (node array, listeners) on every scroll-driven
  // mode change.
  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reduce = reduceMotion === true || prefersReducedMotion()

    if (reduce) {
      drawStatic(canvas)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    let dpr = 1
    let nodes: NetNode[] = []
    let mx = -9999
    let my = -9999
    let t = 0
    let curRGB: [number, number, number] = [0, 229, 255]
    let rafId = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(150, Math.max(60, (W * H) / 14000)))
      if (nodes.length !== count) {
        nodes = []
        for (let i = 0; i < count; i++) {
          nodes.push({
            x: Math.random() * W,
            y: Math.random() * H,
            hx: Math.random() * W,
            hy: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 1.6 + 0.9,
          })
        }
      }
    }
    resize()

    const onResize = () => resize()
    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
    }
    const onLeave = () => {
      mx = -9999
      my = -9999
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseout', onLeave)

    const loop = () => {
      t += 0.01
      const m = modeRef.current || 0
      const tgt = hexToArr(modeColor(m))
      curRGB = [lerp(curRGB[0], tgt[0], 0.05), lerp(curRGB[1], tgt[1], 0.05), lerp(curRGB[2], tgt[2], 0.05)]
      const acc = `${Math.round(curRGB[0])},${Math.round(curRGB[1])},${Math.round(curRGB[2])}`

      let anchorSet: Anchor[] | null = null
      const radius = Math.min(W, H) * 0.3
      if (m === 2) anchorSet = anchors(MECH, radius, W, H)
      else if (m === 3) anchorSet = anchors(PEP, radius * 0.92, W, H)

      ctx.clearRect(0, 0, W, H)
      const cx = W / 2
      const cy = H * 0.46

      nodes.forEach((n, i) => {
        let tx: number
        let ty: number
        let ease = 0.045
        if (m === 0) {
          const a = (i / nodes.length) * Math.PI * 2
          const rr = 90 + (i % 5) * 22
          tx = cx + Math.cos(a + t * 0.2) * rr
          ty = cy + Math.sin(a + t * 0.2) * rr
          ease = 0.06
        } else if (m === 1) {
          n.hx += n.vx
          n.hy += n.vy
          if (n.hx < 0 || n.hx > W) n.vx *= -1
          if (n.hy < 0 || n.hy > H) n.vy *= -1
          tx = n.hx
          ty = n.hy
          ease = 0.05
        } else if ((m === 2 || m === 3) && anchorSet) {
          const an = anchorSet[i % anchorSet.length]
          const off = 34 + (i % 7) * 8
          const a = i * 2.4
          tx = an.x + Math.cos(a + t) * off
          ty = an.y + Math.sin(a + t) * off
          ease = 0.06
        } else if (m === 4) {
          const s = i % 5
          tx = cx + (i % 2 ? -1 : 1) * (18 + (i % 9) * 6)
          ty = H * 0.2 + s * (H * 0.13) + Math.sin(t + i) * 4
          ease = 0.07
        } else {
          n.hx += n.vx * 0.5
          n.hy += n.vy * 0.5
          if (n.hx < 0 || n.hx > W) n.vx *= -1
          if (n.hy < 0 || n.hy > H) n.vy *= -1
          tx = n.hx
          ty = n.hy
          ease = 0.03
        }
        n.x = lerp(n.x, tx, ease)
        n.y = lerp(n.y, ty, ease)

        const dxm = n.x - mx
        const dym = n.y - my
        const dm = Math.hypot(dxm, dym)
        if (dm < 130) {
          n.x += (dxm / dm) * 1.1
          n.y += (dym / dm) * 1.1
        }
      })

      const maxD = m === 1 ? 110 : 140
      const baseOp = m === 5 ? 0.12 : 0.4
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < maxD) {
            ctx.strokeStyle = `rgba(${acc},${(1 - d / maxD) * baseOp})`
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      const pulse = (Math.sin(t * 2) + 1) / 2
      nodes.forEach((n) => {
        const glow = m === 0 ? 0.6 + pulse * 0.4 : m === 5 ? 0.4 : 0.8
        ctx.fillStyle = `rgba(${acc},${glow})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, 6.283)
        ctx.fill()
      })

      if (anchorSet) {
        anchorSet.forEach((an) => {
          if (m === 3) {
            vial(ctx, an.x, an.y, 1.5, acc)
          } else {
            ctx.beginPath()
            ctx.arc(an.x, an.y, 4.5, 0, 6.283)
            ctx.fillStyle = `rgba(${acc},1)`
            ctx.shadowColor = `rgba(${acc},0.9)`
            ctx.shadowBlur = 16
            ctx.fill()
            ctx.shadowBlur = 0
          }
          ctx.font = "600 11px 'JetBrains Mono', monospace"
          ctx.fillStyle = 'rgba(255,255,255,0.92)'
          ctx.textAlign = 'center'
          ctx.fillText(an.label, an.x, an.y - (m === 3 ? 20 : 14))
        })
        ctx.strokeStyle = `rgba(${acc},0.18)`
        ctx.lineWidth = 0.7
        for (let i = 0; i < anchorSet.length; i++) {
          const a = anchorSet[i]
          const b = anchorSet[(i + 1) % anchorSet.length]
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseout', onLeave)
    }
  }, [reduceMotion])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
