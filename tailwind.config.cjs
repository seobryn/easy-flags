/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,jsx,tsx,js,ts}"],
  theme: {
    extend: {
      colors: {
        slate: {
          900: "#0f172a",
          800: "#1e293b",
          950: "#020617",
        },
        cyan: {
          300: "#06b6d4",
          400: "#06b6d4",
          500: "#06b6d4",
          700: "#06b6d4",
          950: "#082f49",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-in",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
