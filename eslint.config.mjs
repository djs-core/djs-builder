import globals from "globals";
import js from "@eslint/js";
import ts from "typescript-eslint";
import headers from "eslint-plugin-headers";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ["dist/**/*", "playground/**/*"] },
  { files: ["**/*.ts"] },
  { languageOptions: { globals: globals.node } },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    plugins: {
      headers,
    },
    files: ["src/**/*.ts"],
    ignores: ["dist/**/*"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='log']",
          message: "Use console.log() instead of log()",
        },
      ],
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "function", next: "function" },
      ],
      "headers/header-format": [
        "error",
        {
          source: "file",
          path: "header.txt",
          trailingNewlines: 2,
          variables: {
            year: new Date().getFullYear().toString(),
            author: "Cleboost",
          },
        },
      ],
    },
  },
];
