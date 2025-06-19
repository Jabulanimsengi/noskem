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
        background: '#F2F2F2', // Light gray background
        surface: '#FFFFFF',    // White for cards and surfaces
        brand: {
          light: '#0eb9e0',
          DEFAULT: '#0891B2', // Your main brand color
          dark: '#0a7a9a',
        },
        text: {
          primary: '#333333',  // Dark gray for primary text
          secondary: '#666666', // Lighter gray for secondary text
        }
      },
    },
  },
  plugins: [],
};