import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#111111",
        surfaceHover: "#1A1A1A",
        border: "#222222",
        borderHover: "#444444",
        primaryText: "#F0F0F0",
        mutedText: "#666666",
        accent: "#F5C518",
        success: "#22C55E",
        error: "#EF4444",
        running: "#F97316",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
        lg: "6px",
        md: "6px",
        sm: "6px",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        pulseDot: "pulseDot 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
