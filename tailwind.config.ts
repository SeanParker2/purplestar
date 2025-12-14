import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "var(--color-void)",
        "nebula-purple": "var(--color-nebula-purple)",
        "nebula-blue": "var(--color-nebula-blue)",
        "gold-primary": "var(--color-gold-primary)",
        "gold-light": "var(--color-gold-light)",
        "gold-dark": "var(--color-gold-dark)",
        "glass-surface": "var(--color-glass-surface)",
        "glass-border": "var(--color-glass-border)",
        "text-main": "var(--color-text-main)",
        "text-muted": "var(--color-text-muted)",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"],
      },
      animation: {
        float: "float 20s infinite ease-in-out",
        "spin-slow": "spin 60s linear infinite",
        "spin-reverse": "spin 40s linear infinite reverse",
        "spin-medium": "spin 20s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
