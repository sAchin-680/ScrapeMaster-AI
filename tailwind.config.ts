import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'media',
  content: ['./app/**/*.{ts,tsx,mdx}', './components/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', md: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        paper: token('paper'),
        surface: token('surface'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        accent: {
          DEFAULT: token('accent'),
          ink: token('accent-ink'),
          soft: token('accent-soft'),
        },
        up: token('up'),
        down: token('down'),
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.25rem', '3xl': '1.75rem' },
      keyframes: {
        ticker: { to: { transform: 'translateX(-50%)' } },
        rise: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'none' },
        },
        draw: { to: { strokeDashoffset: '0' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.35' } },
        shimmer: { to: { backgroundPosition: '-200% 0' } },
      },
      animation: {
        ticker: 'ticker 40s linear infinite',
        rise: 'rise .6s cubic-bezier(.2,.7,.2,1) both',
        draw: 'draw 2.4s cubic-bezier(.6,0,.2,1) forwards',
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
