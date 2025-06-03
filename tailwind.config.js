/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        table: "#fafaf9",
        pink: {
          500: '#ec4899',
          600: '#db2777',
        },
        orange: {
          500: '#f97316',
          600: '#ea580c',
        },
        yellow: {
          500: '#eab308',
          600: '#ca8a04',
        },
        gray: {
          50: '#fafaf9',
          100: '#f4f4f3',
          200: '#e4e4e2',
          300: '#d4d4d1',
          400: '#a1a19c',
          500: '#71716a',
          600: '#52524b',
          700: '#3f3f37',
          800: '#27271f',
          900: '#18181b',
        }
      },
      fontSize: {
        ssm: "0.875rem",
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
