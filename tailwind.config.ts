import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Pokemon-inspired color palette
        pokemon: {
          red: '#FF1C1C',
          blue: '#3B4CCA',
          yellow: '#FFDE00',
          gold: '#B3A125',
        },
        // Kid-friendly UI colors
        kid: {
          primary: '#6366F1', // Indigo
          secondary: '#EC4899', // Pink
          success: '#10B981', // Green
          warning: '#F59E0B', // Amber
          info: '#3B82F6', // Blue
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        celebrate: 'celebrate 0.5s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(99, 102, 241, 0)' },
        },
        celebrate: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
