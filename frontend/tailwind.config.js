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
        'v-black': '#0A0806',
        'v-raised': '#14110D',
        'v-card': '#181410',
        'v-text': '#FAF6EF',
        'v-muted': '#8C8478',
        'v-orange': '#FF5C00',
        'v-orange-deep': '#D44900',
        'v-orange-glow': 'rgba(255, 92, 0, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Big Shoulders Display', 'sans-serif'],
      },
      boxShadow: {
        'orange-glow': '0 0 20px rgba(255, 92, 0, 0.45)',
        'card-glow': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
      },
    },
  },
  plugins: [],
};
