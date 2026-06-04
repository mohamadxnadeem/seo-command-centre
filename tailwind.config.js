/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#060c08',
        card: '#0b1410',
        border: '#162b1c',
        'border-light': '#1f4028',
        green: '#16a05a',
        gold: '#c9982a',
        blue: '#60a5fa',
        text: '#ddeae2',
        muted: '#5a7a64',
        white: '#f0f7f2',
        red: '#f87171'
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace']
      }
    }
  },
  plugins: []
}
