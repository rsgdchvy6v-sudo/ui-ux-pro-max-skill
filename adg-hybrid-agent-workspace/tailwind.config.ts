import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          200: "#bfd3fe",
          300: "#93b4fd",
          400: "#608bfa",
          500: "#3b63f5",
          600: "#2643e9",
          700: "#2032ce",
          800: "#212ba6",
          900: "#212a83",
        },
      },
    },
  },
  plugins: [],
};

export default config;
