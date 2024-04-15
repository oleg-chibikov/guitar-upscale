import type { Config } from "tailwindcss";
const safelist = [
  "text-white",
  "text-black",
  "bg-gray-600",
  "bg-gray-300",
  "bg-neutral-800",
  "bg-neutral-100",
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
];
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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
