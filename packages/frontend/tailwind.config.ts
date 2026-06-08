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
  safelist: [
    "bg-green-700", "bg-green-800", "bg-green-900",
    "border-green-700", "border-green-800",
    "text-green-100", "text-green-200", "text-green-300",
    "hover:bg-green-800", "hover:bg-green-900"
  ],
  plugins: []
};