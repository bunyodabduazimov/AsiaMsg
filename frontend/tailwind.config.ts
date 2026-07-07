import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4f7fb',
          100: '#e8eef7',
          200: '#cddbee',
          300: '#a2bddf',
          400: '#6e93c5',
          500: '#466da5',
          600: '#325182',
          700: '#274165',
          800: '#1c2e48',
          900: '#101b2c'
        },
        mint: {
          400: '#6ef3c5',
          500: '#28d39a',
          600: '#15b27e'
        },
        sunrise: {
          400: '#ffb56d',
          500: '#ff8a3d'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(110, 243, 197, 0.15), 0 24px 60px rgba(16, 27, 44, 0.28)'
      },
      backgroundImage: {
        'hero-grid':
          'radial-gradient(circle at top left, rgba(40, 211, 154, 0.18), transparent 28%), radial-gradient(circle at 90% 10%, rgba(255, 181, 109, 0.16), transparent 20%), linear-gradient(180deg, rgba(16, 27, 44, 1), rgba(15, 23, 42, 0.96))'
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        fade: 'fade 0.5s ease-out both'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        fade: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0px)' }
        }
      }
    }
  },
  plugins: []
} satisfies Config;
