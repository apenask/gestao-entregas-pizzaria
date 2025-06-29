/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          650: '#4B5563',
          720: '#374151',
          750: '#2D3748',
        }
      },
      screens: {
        'xs': '475px',
      }
    },
  },
  plugins: [],
};