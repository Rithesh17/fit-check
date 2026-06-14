import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PULSE palette
        sand: "#F1ECE3", // app background
        paper: "#FAF7F2", // sidebar / soft surfaces
        card: "#FFFFFF",
        ink: "#1A1712", // primary text / near-black
        ink2: "#3A352C",
        muted: "#A39B8B",
        muted2: "#7E776A",
        faint: "#C3BBAC",
        line: "#E7E0D3",
        line2: "#EEE8DC",
        pulse: "#FF5A3C", // signature coral
        pulseSoft: "#FFEDE8",
        pulseTint: "#FF8B73",
        cardio: "#2F6BFF",
        cardioSoft: "#E8EFFF",
        racquet: "#7A4DFF",
        racquetSoft: "#EFE9FF",
        good: "#6FB52B",
        goodSoft: "#EEF7DD",
      },
      fontFamily: {
        display: ["var(--font-bricolage)", "system-ui", "sans-serif"],
        sans: ["var(--font-hanken)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "22px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,18,12,.03),0 18px 40px -28px rgba(20,18,12,.18)",
        fab: "0 8px 18px -6px rgba(255,90,60,.6)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(.96)", opacity: ".7" },
          "50%": { transform: "scale(1.04)", opacity: "1" },
          "100%": { transform: "scale(.96)", opacity: ".7" },
        },
        popIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        pulseRing: "pulseRing 2.4s ease-in-out infinite",
        popIn: "popIn .35s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
