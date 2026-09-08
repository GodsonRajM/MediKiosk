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
        ayush: {
          50: "#fbf8ef",
          100: "#f6efda",
          200: "#eddcb6",
          500: "#b3862b",
          600: "#986d21",
          700: "#76511a",
          900: "#442e10"
        },
        kiosk: {
          primary: "#0ea5e9", // Vivid Teal/Sky
          accent: "#10b981",  // Emerald
          danger: "#ef4444",  // Red flag alert
          warning: "#f59e0b",
          surface: "#0f172a", // Dark modern surface
          panel: "#1e293b"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
