/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        surface: {
          base: "#09090b", // Deepest black/charcoal
          card: "#121215", // Card surface
          highlight: "#1c1c22", // Elevated hover surface
          border: "#272730", // Subtle borders
        },
      },
    },
  },
  plugins: [],
};
