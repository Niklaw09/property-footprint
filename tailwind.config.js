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
        serif: [
          'ui-serif',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'serif',
        ],
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
