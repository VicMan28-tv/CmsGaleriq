// tailwind.config.js  (ESM)
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        galeriq: {
          primary: "#8b5cf6",
          secondary: "#f5f3ff",
          accent: "#a78bfa",
          bg: "#faf5ff",
          text: "#1f2937",
        },
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(139, 92, 246, .35)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
