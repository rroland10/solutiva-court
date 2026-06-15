import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
      },
      colors: {
        gold: {
          DEFAULT: "#C9A962",
          light: "#E8D5A3",
          dark: "#A68B3F",
        },
        primary: {
          DEFAULT: "#5B52E8",
          dark: "#4338CA",
          light: "#8B85F0",
        },
        success: {
          DEFAULT: "#10b981",
          light: "#d1fae5",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fef3c7",
        },
        danger: {
          DEFAULT: "#ef4444",
          light: "#fee2e2",
        },
        info: {
          DEFAULT: "#3b82f6",
          light: "#dbeafe",
        },
      },
      boxShadow: {
        luxury: "0 4px 24px -4px rgba(67, 56, 202, 0.18), 0 8px 32px -8px rgba(0, 0, 0, 0.1)",
        "luxury-lg": "0 8px 40px -8px rgba(67, 56, 202, 0.22), 0 16px 48px -12px rgba(0, 0, 0, 0.14)",
        glow: "0 0 24px rgba(201, 169, 98, 0.35)",
      },
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(145deg, #312e81 0%, #4c1d95 40%, #5b21b6 75%, #3730a3 100%)",
        "gradient-luxury":
          "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(201,169,98,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(139,133,240,0.15), transparent 50%), linear-gradient(160deg, #1e1b4b 0%, #312e81 30%, #4c1d95 65%, #3730a3 100%)",
        "gradient-luxury-dark":
          "radial-gradient(ellipse 90% 55% at 50% -5%, rgba(201,169,98,0.1), transparent 55%), radial-gradient(ellipse 55% 40% at 100% 0%, rgba(91,82,232,0.12), transparent 50%), linear-gradient(165deg, #050508 0%, #0c0a18 28%, #12102a 58%, #080612 100%)",
        "gradient-btn":
          "linear-gradient(135deg, #A68B3F 0%, #6366f1 28%, #5B52E8 55%, #4338CA 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
