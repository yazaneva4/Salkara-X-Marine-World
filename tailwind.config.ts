import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette approximating the joint-coupon artwork
        salkara: {
          DEFAULT: "#8a1f2c", // maroon / food panel
          dark: "#6d1622",
          light: "#a83341",
        },
        marine: {
          DEFAULT: "#0e6fb8", // marine blue / ticket panel
          dark: "#0a2b4e", // deep navy background
          navy: "#08213c",
          light: "#2a95d6",
        },
        gold: {
          DEFAULT: "#f2b43a",
          dark: "#d99a22",
        },
        cream: "#f6efe3",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
