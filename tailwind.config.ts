import type { Config } from "tailwindcss";
const safelist: string[] = [];

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        maxhmd: { raw: "(max-height: 600px)" },
        maxhlg: { raw: "(max-height: 800px)" },
        // => @media (min-height: 800px) { ... }
      },
      //https://paperheartdesign.com/blog/color-palette-dark-moody
      colors: {
        primary: {
          light: "#E6B39A", // Mocha
          dark: "#b3cde4",
        },
        secondary: {
          light: "#F6E7D2", // Cappuccino
          dark: "#1d3f58",
        },
        previous_fret_marker: {
          light: "#333333", // Cappuccino
          dark: "#b3cde4",
        },
        previous_fret_marker_match: {
          light: "#4E342E", // Coffee Bean
          dark: "#a2cef5",
        },
        fret_marker_match: {
          light: "#D2A179", // Latte
          dark: "#1d3f58",
        },
        fret_marker: {
          light: "#F6E7D2", // Cream
          dark: "#537692",
        },
        button: {
          light: "#D2A179", // Latte
          dark: "#537692",
        },
        button_pressed: {
          light: "#F9C2A8", // Cappuccino
          dark: "#849db3",
        },
        foreground: {
          light: "#2E1F1B", // French Roast
          dark: "#F2F2F2",
        },
        background: {
          light: "#FDF6F1", // Light Cream
          dark: "#001b2e",
        },
        accented_background: {
          light: "#e5cdbf", // Light Mocha
          dark: "#333333",
        },
        panel: {
          light: "#F6E7D2", // Cream
          dark: "#666666",
        },
        border: {
          light: "#8D6E63", // Coffee Bean
          dark: "#999999",
        },
        chord_detection: {
          light: "#B8505C",
          dark: "#F9C2A8",
        },
        accent: {
          light: "#D48CA7",
          dark: "#9567DB",
        },
        accent_stronger: {
          light: "#B8505C",
          dark: "#9932CC",
        },
        accent_strongest: {
          light: "#9B3320",
          dark: "#B103BC",
        },
        select_background: {
          light: "#F2F2F2",
          dark: "#F2F2F2",
        },
        select_foreground: {
          light: "#2E1F1B",
          dark: "#001b2e",
        },
        disabled: {
          light: "#dadada",
          dark: "#8c8c8c",
        },
        disabled_match: {
          light: "#8a8888",
          dark: "#5c5c5c",
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
