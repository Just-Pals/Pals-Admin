import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "#141416",
        "surface-hover": "#1C1C1E",
        gold: {
          DEFAULT: "#F7CE45",
          dark: "#E8B923",
          darker: "#9B7213",
        },
        success: "#00C853",
        danger: "#FF1744",
        info: "#38BDF8",
        violet: "#8B5CF6",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;


