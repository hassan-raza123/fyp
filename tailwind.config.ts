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
        // Define your custom color palette
        primary: {
          DEFAULT: '#1E3A8A', // Dark blue
          light: '#3B82F6', // Bright blue
        },
        secondary: {
          DEFAULT: '#EFF6FF', // Light blue background
        },
        accent: {
          DEFAULT: '#FFFFFF', // White
        },
        text: {
          DEFAULT: '#1E3A8A', // Dark blue for text
          light: '#6B7280', // Gray for secondary text
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
