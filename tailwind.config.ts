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
  "bg-previous_fret_marker_match-light",
  "bg-previous_fret_marker_match-dark",
  "bg-previous_fret_marker-light",
  "bg-previous_fret_marker-dark",
  "bg-fret_marker_match-light",
  "bg-fret_marker_match-dark",
  "bg-fret_marker-light",
  "bg-fret_marker-dark",
  "bg-background-light",
  "bg-background-dark",
  "bg-foreground-light", // for selects
  "bg-foreground-dark",
  "bg-accentedbackground-light",
  "bg-accentedbackground-dark",
  "bg-button-light",
  "bg-button-dark",
  "bg-button_pressed-light",
  "bg-button_pressed-dark",
  "bg-select_background-light",
  "bg-select_background-dark",
  "text-select_foreground-light",
  "text-select_foreground-dark",
  "accent-primary-light",
  "accent-primary-dark",
  "text-foreground-light",
  "text-foreground-dark",
  "text-background-light", // for selects
  "text-background-dark",
  "border-border-light",
  "border-border-dark",
  "border-border_accent-light",
  "border-border_accent-dark",
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
          dark: "#b3cde4",
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
          light: "#4E342E", // French Roast
          dark: "#F2F2F2",
        },
        background: {
          light: "#FDF6F1", // Light Cream
          dark: "#001b2e",
        },
        accentedbackground: {
          light: "#ECE0D9", // Light Mocha
          dark: "#333333",
        },
        hover: {
          light: "#F6E7D2", // Cream
          dark: "#666666",
        },
        border: {
          light: "#8D6E63", // Coffee Bean
          dark: "#999999",
        },
        border_accent: {
          light: "#65a300",
          dark: "#bf5337",
        },
        select_background: {
          light: "#F2F2F2",
          dark: "#F2F2F2",
        },
        select_foreground: {
          light: "#4E342E",
          dark: "#001b2e",
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
