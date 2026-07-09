import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FCFCFA",
        border: "rgba(0,0,0,0.08)",
        "text-primary": "#0d0d0d",
        "text-secondary": "#777",
        "text-tertiary": "#aaa",
        accent: "#e64036",
        claude: "#D97757",
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
