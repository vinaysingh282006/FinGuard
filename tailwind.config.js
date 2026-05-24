/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand colors — safe to extend, don't conflict with Tailwind defaults
        "risk-critical": "#ff2d55",
        "risk-high":     "#ff6a00",
        "risk-medium":   "#f5c400",
        "risk-low":      "#00d68f",
        "bg-base":       "#04070f",
        "bg-sunken":     "#060b18",
        "bg-surface":    "#0b1525",
        "bg-raised":     "#111e33",
        "cyan-500":      "#00d4f5",
        "violet-500":    "#7c5cfc",
        "emerald-500":   "#00d68f",
        "text-1":        "#eef2ff",
        "text-2":        "#8892b0",
        "text-3":        "#4a566d",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body:    ["Inter", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
