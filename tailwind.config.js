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
        table: "#f6f6ef"
      },
      fontSize: {
        ssm: "0.9rem",
      },
      fontFamily: {
        'sans': ['Verdana', 'Geneva', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
