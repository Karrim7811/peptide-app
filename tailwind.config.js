/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Peptide Cortex brand palette
        cx: {
          parchment: '#FAFAF8', off: '#F2F0ED', light: '#E8E5E0', stone: '#B0AAA0',
          dark: '#3A3730', black: '#1A1915', teal: '#1A8A9E', sidebar: '#1A1915',
          // V4 dark palette (2026-07-14)
          ink: '#050505', panel: '#09111F', panel2: '#070A10', panel3: '#0A1421',
          cy: '#00E5FF', pu: '#7C3AED', go: '#F7B731', cymid: '#3BA7F0', pumid: '#B06BE0',
          dim: '#B8C5D6', muted: '#8A97AC', faint: '#6B7688', faintest: '#4A5568',
        },

        // Mirror ground tokens. These resolve to whichever of the three grounds
        // (midnight / dusk / daylight) GroundProvider has written onto the root,
        // so components stay ground-agnostic — no `dark:` variants, no branching.
        // Definitions live in src/lib/design/grounds.ts.
        ground:   'var(--bg)',
        panel:    'var(--panel)',
        panelHi:  'var(--panelHi)',
        panelHot: 'var(--panelHot)',
        hair:     'var(--hair)',
        ink:      'var(--ink)',
        dim:      'var(--dim)',
        faint:    'var(--faint)',
        faintest: 'var(--faintest)',
        accent:   'var(--accent)',
        accentDim:  'var(--accentDim)',
        accentWash: 'var(--accentWash)',
        gold:     'var(--gold)',

        // Category hue families. `go` is also the tension colour — use
        // tensionHue()/hueVar() from grounds.ts rather than hard-coding `go`
        // where tension is meant.
        hue: {
          cy: 'var(--hue-cy)',
          pu: 'var(--hue-pu)',
          gr: 'var(--hue-gr)',
          go: 'var(--hue-go)',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:    ['Jost', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
    }
  },
  plugins: [],
}
