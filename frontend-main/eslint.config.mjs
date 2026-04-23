import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // Global ignores — must cover .next and node_modules under any resolved path.
  globalIgnores([
    ".next/**",
    "**/.next/**",
    "node_modules/**",
    "**/node_modules/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "**/next-env.d.ts",
    "docs/next-env.d.ts",
  ]),
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Calling an async fetchData() inside useEffect is a standard React pattern.
      // The rule fires false positives when setState is inside an async function
      // called (not awaited) from the effect body.
      "react-hooks/set-state-in-effect": "off",
      // Guide and doc pages contain Thai content that intentionally uses straight
      // double-quotes as part of the text. Only keep the truly dangerous entities
      // (>, }, bare apostrophe) forbidden.
      "react/no-unescaped-entities": [
        "error",
        { forbid: [">", "}", { char: "'", alternatives: ["&apos;"] }] },
      ],
    },
  },
]);

export default eslintConfig;
