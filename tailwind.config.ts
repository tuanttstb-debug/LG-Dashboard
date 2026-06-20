import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F4C81',
          50: '#EEF5FB',
          100: '#D5E8F5',
          200: '#AACFEB',
          300: '#7BB4DF',
          400: '#4D99D2',
          500: '#2280C4',
          600: '#1D6FAD',
          700: '#0F4C81',
          800: '#0A3560',
          900: '#0A2744',
          950: '#071A30',
        },
        accent: {
          DEFAULT: '#F97316',
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA6C10',
          700: '#C2550B',
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
          dark: '#15803D',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#D97706',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          dark: '#B91C1C',
        },
      },
      borderRadius: {
        card: '20px',
        input: '12px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 2px 10px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 20px rgba(15,76,129,0.10)',
        btn: '0 2px 8px rgba(15,76,129,0.20)',
        'btn-accent': '0 2px 8px rgba(249,115,22,0.24)',
      },
      width: {
        sidebar: '252px',
      },
      height: {
        topbar: '64px',
      },
      spacing: {
        'content-padding': '24px',
      },
    },
  },
  plugins: [],
};

export default config;
