export const theme = {
  colors: {
    primary: {
      // Brand primary: deep royal blue from logo gear
      DEFAULT: '#0B4FAF',
      light: '#3B82F6',
      dark: '#062E73',
    },
    accent: {
      // Brand accent: factory red from logo
      DEFAULT: '#B3212D',
      light: '#F97373',
      dark: '#7F111A',
    },
    text: {
      DEFAULT: '#0F172A', // Slate-900
      light: '#64748B', // Slate-500
      dark: '#020617', // Slate-950
    },
    background: {
      DEFAULT: '#FFFFFF',
      secondary: '#F1F5F9', // Slate-50
    },
  },
  gradients: {
    // Primary gradient based on logo blue + cyan glow
    primary: 'bg-linear-to-br from-[#0B4FAF] via-[#1D4ED8] to-[#22D3EE]',
    secondary: 'bg-linear-to-b from-[#0B4FAF]/5 to-white',
  },
  shadows: {
    DEFAULT: 'shadow-lg shadow-blue-500/20',
    hover: 'hover:shadow-xl hover:shadow-blue-500/30',
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