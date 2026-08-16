/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card-bg)',
          foreground: 'var(--text-primary)',
        },
        popover: {
          DEFAULT: 'var(--card-bg)',
          foreground: 'var(--text-primary)',
        },
        primary: {
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
          DEFAULT: 'var(--primary-600)',
          foreground: 'var(--white)',
        },
        secondary: {
          50: 'var(--secondary-50)',
          100: 'var(--secondary-100)',
          200: 'var(--secondary-200)',
          300: 'var(--secondary-300)',
          400: 'var(--secondary-400)',
          500: 'var(--secondary-500)',
          600: 'var(--secondary-600)',
          700: 'var(--secondary-700)',
          800: 'var(--secondary-800)',
          900: 'var(--secondary-900)',
          DEFAULT: 'var(--secondary-600)',
          foreground: 'var(--white)',
        },
        accent: {
          50: 'var(--accent-50)',
          100: 'var(--accent-100)',
          200: 'var(--accent-200)',
          300: 'var(--accent-300)',
          400: 'var(--accent-400)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
          800: 'var(--accent-800)',
          900: 'var(--accent-900)',
          DEFAULT: 'var(--accent-500)',
          foreground: 'var(--white)',
        },
        muted: {
          DEFAULT: 'var(--neutral-100)',
          foreground: 'var(--neutral-600)',
        },
        destructive: {
          DEFAULT: 'var(--error)',
          foreground: 'var(--white)',
        },
        border: 'var(--border-color)',
        input: 'var(--border-color)',
        ring: 'var(--primary-600)',

        // ---- Semantic surface + text scale ----------------------
        // Named so component code never needs a literal colour.
        // `bg-surface` / `text-muted-fg` / `border-subtle` replace
        // `bg-white` / `text-gray-500` / `border-gray-200`, and pick
        // up dark mode for free.
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        subtle: 'var(--border-color)',
        firm: 'var(--border-firm)',
        ink: {
          DEFAULT: 'var(--text-primary)',
          2: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },

        // ---- Attainment ----------------------------------------
        // Reserved. Never use these for branding, buttons or
        // decoration — they carry meaning in the PLO matrix and in
        // every attainment badge.
        good: {
          DEFAULT: 'var(--good)',
          wash: 'var(--good-wash)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          wash: 'var(--warn-wash)',
        },
        bad: {
          DEFAULT: 'var(--bad)',
          wash: 'var(--bad-wash)',
        },
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;


