import { nextui } from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        clash: ["ClashGrotesk-Variable", "sans-serif"],
      },
      colors: {
        creamy: {
          DEFAULT: "#F0EFEA",
          50: "#FDFDFC",
          100: "#FDFDFC",
          200: "#F9F8F6",
          300: "#F7F6F3",
          400: "#F2F1ED",
          500: "#F0EFEA",
          600: "#C8C4B2",
          700: "#A29B7C",
          800: "#6E694F",
          900: "#393628",
          950: "#1B1A13",
        },
        orangy: {
          DEFAULT: "#FF4D06",
          50: "#FFEDE5",
          100: "#FFDACC",
          200: "#FFB699",
          300: "#FF956B",
          400: "#FF7038",
          500: "#FF4D06",
          600: "#D13B00",
          700: "#9E2D00",
          800: "#661D00",
          900: "#330E00",
          950: "#190700",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};
