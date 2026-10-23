/** @type {import("prettier").Config} */
export default {
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind 4 has no JS config, the plugin reads the theme from this file.
  tailwindStylesheet: "./src/app/globals.css",
};
