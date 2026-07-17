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
          50: "#f4f5f0",
          100: "#e6e9dc",
          200: "#ccd2bb",
          300: "#adb896",
          400: "#8a9970",
          500: "#6f7f56",
          600: "#5a6a44",
          700: "#495636",
          800: "#3c452d",
          900: "#333a27",
        },
        gold: {
          50: "#fbf7ec",
          100: "#f5eace",
          200: "#ead6a0",
          300: "#dcbb6c",
          400: "#cea146",
          500: "#b8863a",
          600: "#9c6d2f",
          700: "#7d5726",
          800: "#654823",
          900: "#553d20",
        },
        cream: {
          50: "#faf9f5",
          100: "#f4f2ea",
          200: "#e8e4d6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
