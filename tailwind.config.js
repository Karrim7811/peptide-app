/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Peptide Cortex brand palette (existing — unchanged for legacy surfaces)
        cx: {
          parchment: '#FAFAF8',
          off:       '#F2F0ED',
          light:     '#E8E5E0',
          stone:     '#B0AAA0',
          dark:      '#3A3730',
          black:     '#1A1915',
          teal:      '#1A8A9E',
          sidebar:   '#1A1915',
        },
        // Apothecary specimen-sheet redesign palette (2026-05-27).
        // Used on the new /peptides/* routes. Do not retrofit onto existing
        // legacy pages without a deliberate migration pass.
        apo: {
          cream:    '#F5F0E8', // light-mode page background
          deep:     '#0A0908', // dark-mode page background (deep warm black)
          brass:    '#A88B5E', // section dividers, rule lines, filled stars
          'brass-dim': 'rgba(168,139,94,0.30)',
          ink:      '#1A1915', // primary text on cream
          mute:     '#6B665C', // secondary text on cream
          neural:   '#00C9B1', // Neural Teal — interactive only
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:    ['Jost', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      maxWidth: {
        specimen: '720px',
      },
      letterSpacing: {
        'specimen-caps': '0.22em',
      },
    }
  },
  plugins: [],
}
