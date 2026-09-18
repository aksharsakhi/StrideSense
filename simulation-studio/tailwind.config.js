/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0d14',
          panel: '#111726',
          panelBorder: '#1e293b',
          cyan: '#06b6d4',
          neonGreen: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          purple: '#8b5cf6'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.4)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.4)',
        'glow-danger': '0 0 25px rgba(239, 68, 68, 0.5)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
