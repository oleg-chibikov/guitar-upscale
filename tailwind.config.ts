import type { Config } from "tailwindcss";
const safelist = [
  // Dynamically generating z-indexes for strings
  "z-10",
  "z-20",
  "z-30",
  "z-40",
  "z-50",
  "z-60",
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
        border_accent: {
          light: "#bf5337", // Red
          dark: "#65a300", // Green
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
