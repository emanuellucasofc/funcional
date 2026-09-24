import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#eefcf1',
          100: '#d7f6df',
          200: '#b2ebc4',
          300: '#7dd99b',
          400: '#4abd71',
          500: '#2A8C43', // Verde Foliagem (Brand)
          600: '#1e7334',
          700: '#106037', // Verde Escuro (Brand)
          800: '#114c2e',
          900: '#0f3f27',
          950: '#072314',
        },
        orange: {
          50: '#fdf7ee',
          100: '#f9ebd6',
          200: '#f2d3aa',
          300: '#eab477',
          400: '#e89045',
          500: '#E57921', // Laranja (Brand)
          600: '#ca5c16',
          700: '#a84214',
          800: '#863316',
          900: '#6c2b14',
          950: '#3a1308',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
