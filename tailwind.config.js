/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          dark: 'rgb(var(--color-accent-dark) / <alpha-value>)',
          light: 'rgb(var(--color-accent-light) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        logo: ['"Grand Hotel"', 'cursive'],
      },
    },
  },
  plugins: [],
};
