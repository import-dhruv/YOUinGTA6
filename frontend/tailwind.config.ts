import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#05020f",
        ink: "#0b0618",
        violet: "#7c3aed",
        neon: "#ff2d95",
        sunset: "#ff7a1a",
        cyanx: "#22d3ee",
      },
      fontFamily: {
        display: ["Anton", "Impact", "sans-serif"],
        condensed: ["'Bebas Neue'", "'Arial Narrow'", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
        flicker: "flicker 3s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "94%": { opacity: "0.7" },
          "96%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
