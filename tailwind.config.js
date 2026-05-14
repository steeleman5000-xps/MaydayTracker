/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        team: {
          a: '#3b82f6',
          b: '#ef4444',
        },
      },
    },
  },
  plugins: [],
}
