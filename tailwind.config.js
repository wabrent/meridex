/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Surfaces — Raycast-matched near-black scale (canvas #040506) */
        ink: {
          950: '#020304',
          900: '#040506', // page canvas — Void Black
          850: '#050608',
          800: '#07080A', // card surfaces — Ink
          700: '#0B0C0E', // raised / hover
          600: '#363739', // hairline borders — Raycast border
          500: '#454647', // strong borders — Iron
        },
        /* Semantic trading colors — Raycast Success Green / Coral Pulse */
        up: '#59d499',
        down: '#ff6363',
        /* Brand accent: neutral-first like Raycast (coral reserved for brand) */
        accent: '#ffffff',
        accent2: '#e6e6e6',
        /* Text — Raycast Ash / Smoke */
        muted: '#9c9c9d',
        dim: '#6a6b6c',
      },
      fontFamily: {
        /* Same system stack as the landing page — one type voice across the app */
        display: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          "'Segoe UI'",
          'Roboto',
          "'Helvetica Neue'",
          'Arial',
          'sans-serif',
        ],
        /* JetBrains Mono = Raycast's stated Geist Mono substitute (data + labels) */
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        /* 'Keyboard key' treatment: inset highlights, no drop shadows */
        card: 'rgba(255, 255, 255, 0.05) 0px 1px 0px 0px inset, rgba(255, 255, 255, 0.08) 0px 0px 0px 1px, rgba(0, 0, 0, 0.2) 0px -1px 0px 0px inset',
        'glow-up': '0 0 18px -8px rgba(89, 212, 153, 0.5)',
        'glow-up-sm': '0 0 10px -5px rgba(89, 212, 153, 0.55)',
        'glow-down': '0 0 18px -8px rgba(255, 99, 99, 0.5)',
        'glow-down-sm': '0 0 10px -5px rgba(255, 99, 99, 0.55)',
        'glow-accent': '0 0 0 1px rgba(255, 255, 255, 0.16), 0 0 14px -8px rgba(255, 255, 255, 0.4)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        blink: 'blink 1.1s step-end infinite',
      },
    },
  },
  plugins: [],
};
