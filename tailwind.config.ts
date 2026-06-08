import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./store/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        command: {
          950: "#080b0d",
          900: "#0c1113",
          850: "#10171a",
          800: "#141d20",
          700: "#213035",
          copper: "#c87532",
          amber: "#d1a247",
          green: "#6f9f6b",
          red: "#b85c58"
        }
      },
      boxShadow: {
        panel: "0 18px 40px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
