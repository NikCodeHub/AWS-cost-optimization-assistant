// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Important: include all your React files here
    "./src/**/*.css", // <--- ADD THIS LINE if not already present, or ensure it's covered
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
