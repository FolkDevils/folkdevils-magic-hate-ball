/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#ffd000",
        black: "#000000",
      },
      fontFamily: {
        rubik: ['Rubik', 'sans-serif'],
      },
      spacing: {
        '32': '8rem',
        '16': '4rem',
        '8': '2rem',
      },
    },
  },
  plugins: [],
};
