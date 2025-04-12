import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B5CF6', // Purple 500 (Tailwind - Mid Purple)
          light: '#A78BFA',  // Purple 300 (Lighter Purple)
          dark: '#6366F1',   // Indigo 500 (Tailwind - Blue-Purple Blend)
        },
       
        secondary: {
          DEFAULT: '#E5E7EB', // Gray-200
          light: '#F3F4F6',   // Gray-100
        },
        accent: {
          DEFAULT: '#FFFFFF',
        },
        text: {
          DEFAULT: '#7C3AED', // Purple 600 (Balanced Purple-Blue Text)
          light: '#798499',   // Neutral grayish light text (unchanged)
          muted: '#A5B4FC',   // Indigo 300 (Muted soft blue text)
        },
        background: {
          DEFAULT: '#FFFFFF',
          soft: '#F9FAFB', // Gray 100 - Soft Neutral BG
        },
      },
     
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(139, 92, 246, 0.1), 0 2px 4px -1px rgba(99, 102, 241, 0.06)', // Purple-Blue Blend
        'hover': '0 10px 15px -3px rgba(139, 92, 246, 0.2), 0 4px 6px -2px rgba(99, 102, 241, 0.1)', // Purple-Blue Hover
      },
    },
  },
  plugins: [],
} satisfies Config;
