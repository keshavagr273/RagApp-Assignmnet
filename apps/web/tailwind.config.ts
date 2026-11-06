import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F6F3EC',
        surface: '#FFFFFF',
        ink: '#1C1B19',
        muted: '#6B665C',
        hairline: '#DDD7CA',
        primary: '#1F4D3A',
        secondary: '#B4532A',
        highlight: '#E3B04B',
        // chart palette
        'chart-1': '#1F4D3A',
        'chart-2': '#B4532A',
        'chart-3': '#2F5D8A',
        'chart-4': '#C79A2B',
        'chart-5': '#6E5A7E',
        'chart-6': '#7A8B6F',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
