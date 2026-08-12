import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Jade brand palette
        jade: {
          dark:    "#404E3B",
          primary: "#1A5C3A",
          teal:    "#6C8480",
          muted:   "#BAC8B1",
          light:   "#E6E6E6",
          bg:      "#F4F7F2",
        },
        // Clinical semantic colors
        status: {
          critical: "#E53935",
          warning:  "#F57C00",
          normal:   "#1B8A5A",
          info:     "#1565C0",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body:    ["var(--font-body)", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        "page-h":    ["24px", { fontWeight: "600", lineHeight: "1.3" }],
        "section-h": ["18px", { fontWeight: "600", lineHeight: "1.4" }],
        "card-h":    ["15px", { fontWeight: "500", lineHeight: "1.4" }],
        "body":      ["14px", { fontWeight: "400", lineHeight: "1.6" }],
        "caption":   ["12px", { fontWeight: "400", lineHeight: "1.5" }],
        "data":      ["14px", { fontWeight: "500", lineHeight: "1.4" }],
      },
      borderRadius: {
        card: "12px",
        btn:  "8px",
        pill: "100px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
