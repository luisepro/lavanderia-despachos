import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        denim: {
          50: "#f4f7fb",
          100: "#e8eff7",
          200: "#ccdded",
          300: "#9fc1df",
          400: "#6b9fce",
          500: "#4782ba",
          600: "#35679d",
          700: "#2c5380",
          800: "#27476b",
          900: "#1b2e47",
          950: "#111d2e",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

