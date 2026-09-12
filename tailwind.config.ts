import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#fdf1ec",
          100: "#fbe0d3",
          500: "#d9531e",
          600: "#c04a1a",
          700: "#b84316",
        },
        navy: {
          DEFAULT: "#1b2838",
          deep: "#0f1824",
        },
      },
    },
  },
  plugins: [],
};
export default config;
