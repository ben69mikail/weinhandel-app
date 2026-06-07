/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        wine: "#8B1A1A",
        gold: "#C9A84C"
      }
    }
  },
  plugins: []
};