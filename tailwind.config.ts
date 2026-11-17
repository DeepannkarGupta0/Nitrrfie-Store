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
        cream: "#F5F0E8",
        "brutal-black": "#0A0A0A",
        accent: "#FF3E00",
        toxic: "#00FF88",
      },
      fontFamily: {
        mono: ["var(--font-space-mono)", "monospace"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
        display: ["var(--font-barlow-condensed)", "sans-serif"],
      },
      boxShadow: {
        brutal: "4px 4px 0 #0A0A0A",
        "brutal-lg": "8px 8px 0 #0A0A0A",
      },
      borderWidth: {
        brutal: "3px",
      },
    },
  },
  plugins: [],
};

export default config;