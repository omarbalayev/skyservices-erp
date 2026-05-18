import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1A355A",
          blue: "#109DD9",
        },
      },
    },
  },
  plugins: [],
};

export default config;
