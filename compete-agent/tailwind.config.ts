import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./agents/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./prompts/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        border: "var(--border)",
        muted: "var(--muted)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(59, 130, 246, 0.25), 0 0 80px rgba(139, 92, 246, 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
