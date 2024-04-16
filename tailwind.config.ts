import type { Config } from "tailwindcss";
const safelist = [
  "justify-end",
  "justify-start",
  "right-1",
  "left-1",
  "right-12",
  "left-12",
  "z-10",
  "z-20",
  "z-30",
  "z-40",
  "z-50",
  "z-60",
  "bg-primary-light",
  "bg-primary-dark",
  "bg-secondary-light",
  "bg-secondary-dark",
  "bg-accent-light",
  "bg-accent-dark",
  "bg-marker-light",
  "bg-marker-dark",
  "bg-background-light",
  "bg-background-dark",
  "bg-foreground-light", // for selects
  "bg-foreground-dark",
  "bg-accentedbackground-light",
  "bg-accentedbackground-dark",
  "bg-hover-light",
  "bg-hover-dark",
  "accent-primary-light",
  "accent-primary-dark",
  "text-foreground-light",
  "text-foreground-dark",
  "text-background-light", // for selects
  "text-background-dark",
];

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      //https://paperheartdesign.com/blog/color-palette-dark-moody
      colors: {
        primary: {
          light: "#E6B39A", // Mocha
          dark: "#c08b57", // Dark Charcoal with Cyan Tint
        },
        secondary: {
          light: "#F6E7D2", // Cream
          dark: "#5e7d78", // Dark Slate with Cyan Tint
        },
        accent: {
          light: "#F9C2A8", // Cappuccino
          dark: "#995b36", // Dark Silver with Cyan Tint
        },
        marker: {
          light: "#D2A179", // Latte
          dark: "#384b49", // Dark Steel Blue with Cyan Tint
        },
        foreground: {
          light: "#4E342E", // French Roast
          dark: "#F2F2F2", // Closer to White
        },
        background: {
          light: "#FDF6F1", // Light Cream
          dark: "#181819", // Midnight Black
        },
        accentedbackground: {
          light: "#ECE0D9", // Light Mocha
          dark: "#333333", // Dark Graphite
        },
        hover: {
          light: "#F6E7D2", // Cream
          dark: "#666666", // Dark Steel (Matching Secondary)
        },
        border: {
          light: "#8D6E63", // Coffee Bean
          dark: "#999999", // Medium Gray
        },
      },
      fontFamily: {
        mono: [
          "monospace",
          "Fira Code",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
        ],
      },
    },
  },
  plugins: [],
  safelist,
};
export default config;
