/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7f9',
          100: '#b8eaef',
          200: '#8adde5',
          300: '#5cd0db',
          400: '#3ac2d0',
          500: '#1DA2B4', // Main primary color
          600: '#18919f',
          700: '#147f8a',
          800: '#106d75',
          900: '#0c4b52',
        },
        accent: {
          50: '#e6fffb',
          100: '#b3fff4',
          200: '#80ffed',
          300: '#4dffe6',
          400: '#26ffdf',
          500: '#00C6AE', // Main accent color (aqua green)
          600: '#00b29c',
          700: '#009e8a',
          800: '#008a78',
          900: '#006256',
        },
        surface: {
          light: '#E3E8F2',
          DEFAULT: '#E3E8F2',
        },
        brand: {
          bgLight: '#F7FAFC',
          bgDark: '#0D1117',
          textLight: '#1C1C1C',
          textDark: '#E5E7EB',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
