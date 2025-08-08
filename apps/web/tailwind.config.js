/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './styles/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@sakura-ui/core/**/*.{js,jsx,ts,tsx}',
    './node_modules/@sakura-ui/forms/**/*.{js,jsx,ts,tsx}',
    './node_modules/@sakura-ui/markdown/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@sakura-ui/tailwind-theme-plugin')],
}
