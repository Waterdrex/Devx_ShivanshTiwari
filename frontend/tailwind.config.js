/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        surface: 'var(--bg-surface)',
        'surface-secondary': 'var(--bg-surface-secondary)',
        elevated: 'var(--bg-elevated)',
        'hover-surface': 'var(--bg-hover)',
        main: 'var(--text-main)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        theme: 'var(--border-theme)',
        'theme-subtle': 'var(--border-subtle)',
        brand: {
          DEFAULT: 'var(--brand-purple)',
          hover: 'var(--brand-purple-hover)',
          light: 'var(--brand-purple-light)',
          tint: 'var(--brand-purple-tint)',
        },
        status: {
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
        },
        navy: {
          950: '#0A0D18',
          900: '#111627',
          850: '#171E32',
          800: '#202943',
          700: '#29324A',
          600: '#3D4A6E'
        },
        violet: {
          50: '#F0EEFF',
          100: '#EBE8FE',
          200: '#DDD7FE',
          300: '#C4B8FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#6546F5',
          700: '#5135DC',
          800: '#4329B8',
          900: '#321D8D',
          950: '#1F1259',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        }
      },
      boxShadow: {
        'card': 'var(--card-shadow)',
        'card-hover': 'var(--card-shadow-hover)',
        'subtle': '0 2px 8px -1px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
