import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--color-paper-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        ink: 'rgb(var(--color-ink-rgb) / <alpha-value>)',
        muted: 'rgb(var(--color-muted-rgb) / <alpha-value>)',
        hairline: 'rgb(var(--color-hairline-rgb) / <alpha-value>)',
        primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
        highlight: 'rgb(var(--color-highlight-rgb) / <alpha-value>)',
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
