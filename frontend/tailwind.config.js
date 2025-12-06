/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#ff7aa2',
          DEFAULT: '#ff7aa2',
          dark: '#ff7aa2',
        },
        background: {
          light: '#ffe6f0',
          dark: '#111',
        },
        text: {
          light: '#1a1a1a',
          dark: '#fff',
        },
      },
      fontFamily: {
        jakarta: ['JakartaDisplay', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

