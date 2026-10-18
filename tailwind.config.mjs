/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core design system tokens
        sand: {
          DEFAULT: '#D9D28B',
          50: '#FAF9F5',
          100: '#F6F4EB',
          200: '#EDE9D1',
          300: '#D9D28B', // warm_sand_gold
          400: '#C8BE72',
          500: '#B5A958',
        },
        sage: {
          DEFAULT: '#B2BD7E',
          100: '#EFF2E5',
          200: '#DFE5CB',
          300: '#CAD3A5',
          400: '#B2BD7E', // soft_sage_green
          500: '#9BA764',
          600: '#84904F',
        },
        olive: {
          DEFAULT: '#8E9162',
          100: '#EDEEE5',
          200: '#DADDCB',
          300: '#C2C6A9',
          400: '#A8AC83',
          500: '#8E9162', // muted_olive
          600: '#73764E',
          700: '#585A3B',
        },
        moss: {
          DEFAULT: '#6A795D',
          100: '#EAECE7',
          200: '#D4D8CF',
          300: '#B4BCAC',
          400: '#8F9B85',
          500: '#6A795D', // deep_forest_moss
          600: '#54614A',
          700: '#404A37',
          800: '#2C3426',
        },
        studio: {
          DEFAULT: '#121412', // dark_studio_background
          dark: '#121412',
          surface: '#1A1D1A',
          card: '#222622',
          border: '#2E352E',
          accent: '#394239',
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'glow-sand': '0 0 25px -5px rgba(217, 210, 139, 0.25)',
        'glow-sage': '0 0 25px -5px rgba(178, 189, 126, 0.25)',
        'luxury-light': '0 10px 30px -10px rgba(106, 121, 93, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'luxury-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(217, 210, 139, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
    },
  },
  plugins: [],
};
