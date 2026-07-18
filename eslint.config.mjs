import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "docs/archive/**",
      "public/**",
      "packages/**",
      "next-env.d.ts",
      "**/*.min.js",
      "**/*.refactored.tsx",
      "temp_header.tsx",
    ],
  },
  {
    rules: {
      // Gradual cleanup: treat as warnings so lint can gate on real defects
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "warn",
      // Widespread prop→state sync / localStorage hydrate patterns; fix incrementally
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "scripts/**/*.{js,ts}", "*.js", "*.mjs"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/rules-of-hooks": "off",
    },
  },
];

export default eslintConfig;
