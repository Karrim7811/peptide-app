/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Peptide Cortex brand palette
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
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:    ['Jost', 'sans-serif'],
      },
    }
  },
  plugins: [],
}
