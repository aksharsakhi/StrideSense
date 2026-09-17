/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        themed: {
          bg: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          subcard: 'var(--bg-subcard)',
          border: 'var(--border-card)',
          text: 'var(--text-primary)',
          subtext: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        slate: {
          950: '#080c14',
          900: '#0d1322',
          850: '#111827',
          800: '#1e293b',
          700: '#334155'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
