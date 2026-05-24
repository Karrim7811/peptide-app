/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ── Editorial brand (marketing site / landing) ────────────────
        // Light parchment, Cormorant serif, deep teal. Do NOT use these
        // inside the authenticated app shell — that surface uses app.*.
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
        // ── App shell (authenticated dashboard / tracking / tools) ────
        // Dark canvas, Space Grotesk, cyan accent. Use these inside any
        // page that renders inside <AppShell>. Per-status hues sit beside
        // the accent and follow Linear/Vercel conventions.
        app: {
          bg:           '#09090b',
          surface:      '#18181b',
          elevated:     '#27272a',
          border:       '#27272a',
          'border-sub': '#1f1f23',
          accent:       '#06b6d4',
          'accent-dim': 'rgba(6, 182, 212, 0.10)',
          'accent-mid': 'rgba(6, 182, 212, 0.22)',
          emerald:      '#34d399',
          'emerald-dim':'rgba(52, 211, 153, 0.10)',
          amber:        '#fbbf24',
          'amber-dim':  'rgba(251, 191, 36, 0.10)',
          red:          '#f87171',
          'red-dim':    'rgba(248, 113, 113, 0.10)',
          violet:       '#a78bfa',
          'violet-dim': 'rgba(167, 139, 250, 0.10)',
          text:         '#fafafa',
          'text-sec':   '#a1a1aa',
          'text-mute':  '#52525b',
        },
      },
      fontFamily: {
        // Editorial site
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:    ['Jost', 'sans-serif'],
        // App shell
        app:     ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        // Data / dose / lab values (anywhere a column of numbers must align)
        mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
