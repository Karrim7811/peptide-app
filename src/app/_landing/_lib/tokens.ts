// Landing page V4 dark-theme design tokens — ported from the design prototype
// (`design_handoff_peptide_cortex_v4/Peptide Cortex v4.dc.html`).
//
// These are raw hex values for use in canvas drawing code (ParticleNetwork)
// and anywhere else a JS string hex is needed rather than a Tailwind class.
// The equivalent Tailwind tokens (`cx.ink`, `cx.cy`, etc.) already exist in
// `tailwind.config.js` — keep both in sync if the palette ever changes.

export const CX = {
  ink: '#050505',
  panel: '#09111F',
  panel2: '#070A10',
  panel3: '#0A1421',
  cy: '#00E5FF',
  pu: '#7C3AED',
  go: '#F7B731',
  cymid: '#3BA7F0',
  pumid: '#B06BE0',
  dim: '#B8C5D6',
  muted: '#8A97AC',
  faint: '#6B7688',
  faintest: '#4A5568',
} as const

export function modeColor(m: number): string {
  return m === 2 ? CX.pu : m === 4 ? CX.go : CX.cy
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  // Dev-only preview override: `?motion=1` forces animations ON, `?motion=0`
  // forces the reduced-motion (static) path — handy for previewing on a machine
  // whose OS has "reduce motion" enabled. Never active in a production build, so
  // it can't override a real visitor's accessibility preference.
  if (process.env.NODE_ENV !== 'production') {
    const m = new URLSearchParams(window.location.search).get('motion')
    if (m === '1' || m === 'on') return false
    if (m === '0' || m === 'off') return true
  }
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}
