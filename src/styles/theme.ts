export const theme = {
  colors: {
    primary: {
      DEFAULT: '#7C3AED', // Purple-600
      light: '#A78BFA', // Purple-400
      dark: '#5B21B6', // Purple-800
    },
    accent: {
      DEFAULT: '#FFFFFF',
      light: '#F3F4F6', // Gray-100
      dark: '#1F2937', // Gray-800
    },
    text: {
      DEFAULT: '#111827', // Gray-900
      light: '#6B7280', // Gray-500
      dark: '#1F2937', // Gray-800
    },
    background: {
      DEFAULT: '#FFFFFF',
      secondary: '#F9FAFB', // Gray-50
    },
  },
  gradients: {
    primary: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    secondary: 'bg-gradient-to-b from-secondary to-white',
  },
  shadows: {
    DEFAULT: 'shadow-lg shadow-primary-light/20',
    hover: 'hover:shadow-xl hover:shadow-primary-light/30',
  },
  transitions: {
    DEFAULT: 'transition-all duration-300',
    fast: 'transition-all duration-200',
  },
  rounded: {
    DEFAULT: 'rounded-xl',
    large: 'rounded-2xl',
    extra: 'rounded-3xl',
  },
  hover: {
    scale: 'hover:scale-110',
    translate: 'hover:-translate-y-0.5',
    rotate: 'hover:rotate-12',
  },
}; 