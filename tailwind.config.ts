import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#111318',
          900: '#1C1F24',
          800: '#262A31',
          700: '#363B44',
        },
        safety: {
          DEFAULT: '#FF5A1F',
          dark: '#E24710',
          light: '#FFB088',
        },
        steel: {
          50: '#F6F5F1',
          100: '#EDECE6',
          400: '#8A8F98',
          500: '#6B7280',
          600: '#4B5058',
        },
        done: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
        },
        warn: {
          DEFAULT: '#F5A524',
          light: '#FEF3C7',
        },
      },
      fontFamily: {
        display: ['var(--font-oswald)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jbmono)', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
};
export default config;
