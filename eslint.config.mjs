import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [".next/**", "out/**", "dist/**", "public/**", "next-env.d.ts"] },
  js.configs.recommended,
  ...nextVitals,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { projectService: true },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
    },
  },
  {
    rules: {
      eqeqeq: ["error", "always"],
      // React Compiler rules from eslint-plugin-react-hooks 7. Existing effects predate them.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  {
    files: ["**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // Last, so it turns off every style rule that fights Prettier.
  prettier,
);
