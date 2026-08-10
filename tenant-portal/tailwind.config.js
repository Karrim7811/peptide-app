/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        tp: {
          bg: '#F8FAF9',
          card: '#FFFFFF',
          border: '#E4E9E7',
          ink: '#16211C',
          muted: '#6B7A73',
          accent: '#0E7C5B',
          accentDark: '#0A5C44',
          danger: '#B4423A',
        },
      },
    },
  },
  plugins: [],
}
