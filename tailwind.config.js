/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', "./src/**/*.{js,ts,jsx,tsx}", "./supabase/functions/_shared/**/*.ts"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#b3c5d9',
          300: '#8da8c5',
          400: '#5d83a8',
          500: '#3a6388',
          600: '#2a4d72',
          700: '#1f3d5e',
          800: '#162c47',
          900: '#0f1d31',
          950: '#0a1422',
        },
        sage: {
          50: '#f4f7f3',
          100: '#e6efe2',
          200: '#cee0c6',
          300: '#a9c79c',
          400: '#82a96f',
          500: '#638e50',
          600: '#4d733d',
          700: '#3d5c32',
          800: '#314a29',
          900: '#283c23',
        },
        cream: {
          50: '#fdfcf9',
          100: '#faf7f0',
          200: '#f5efe2',
          300: '#efe5d0',
        },
      },
      fontFamily: {
        // Headings: a warm serif. "display" is an alias so both names give the same face.
        serif: ['"Source Serif 4"', 'ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        display: ['"Source Serif 4"', 'ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,29,49,0.04), 0 4px 16px -4px rgba(15,29,49,0.08)',
        lift: '0 2px 4px rgba(15,29,49,0.04), 0 16px 40px -12px rgba(15,29,49,0.18)',
        glow: '0 0 0 1px rgba(99,142,80,0.30), 0 12px 32px -10px rgba(77,115,61,0.35)',
      },
    },
  },
  plugins: [],
};
