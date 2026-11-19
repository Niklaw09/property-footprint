/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', "./src/**/*.{js,ts,jsx,tsx}", "./supabase/functions/_shared/**/*.ts"],
  theme: {
    extend: {
      colors: {
        // Ink: text, borders, dark panels (kept under the old "navy" name so every page restyles at once)
        navy: {
          50: '#f2f5f8',
          100: '#e2e8ef',
          200: '#c9d3de',
          300: '#9eaec0',
          400: '#6c7f95',
          500: '#4d6178',
          600: '#3a4d63',
          700: '#2a3b50',
          800: '#1a2a3d',
          900: '#0f1b2b',
          950: '#08111d',
        },
        // Accent: calm teal-green (kept under the old "sage" name)
        sage: {
          50: '#eefaf6',
          100: '#d5f2e7',
          200: '#ade3cf',
          300: '#79cdb0',
          400: '#43b190',
          500: '#209677',
          600: '#157b62',
          700: '#126451',
          800: '#115042',
          900: '#0f4237',
        },
        // Page backgrounds: cool off-white (kept under the old "cream" name)
        cream: {
          50: '#fbfcfd',
          100: '#f4f7f8',
          200: '#ebf0f2',
          300: '#dde4e8',
        },
      },
      fontFamily: {
        // "font-serif" is used for headings across the app; it now maps to the display face.
        serif: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,27,43,0.04), 0 4px 16px -4px rgba(15,27,43,0.08)',
        lift: '0 2px 4px rgba(15,27,43,0.04), 0 16px 40px -12px rgba(15,27,43,0.18)',
        glow: '0 0 0 1px rgba(32,150,119,0.25), 0 12px 32px -10px rgba(32,150,119,0.35)',
      },
    },
  },
  plugins: [],
};
