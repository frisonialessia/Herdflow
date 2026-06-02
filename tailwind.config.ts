import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: { deep: "#3a5a40", DEFAULT: "#588157", light: "#a3b18a" },
        olive: "#6b7d4f",
        brown: { DEFAULT: "#7a5230", soft: "#e6dccd" },
        bg: "#f0f0e8",
        card: "#ffffff",
        cardsoft: "#f4f5ec",
        bord: "#e1e3d6",
        ink: "#232c22",
        muted: "#6e7568",
        faint: "#9aa091",
        healthy: "#588157",
        watch: "#9a9a5e",
        critical: "#8a4f32",
      },
      fontFamily: {
        sora: ["Sora", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
      },
      borderRadius: { xl2: "22px", xl3: "28px" },
    },
  },
  plugins: [],
};
export default config;
