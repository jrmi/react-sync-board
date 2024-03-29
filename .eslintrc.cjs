const path = require("path");

const projectRootDir = path.resolve(__dirname);

module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  env: {
    browser: true,
    node: true,
  },
  settings: {
    react: {
      pragma: "React", // Pragma to use, default to "React"
      version: "detect", // React version. "detect" automatically picks the version you have installed.
    },
  },
  rules: {
    "react/prop-types": "off",
    "@typescript-eslint/no-empty-function": "off",
    "no-unused-vars": "warn",
    "class-methods-use-this": "off",
    "react-hooks/exhaustive-deps": [
      "warn",
      {
        additionalHooks: "(useRecoilCallback|useRecoilTransaction_UNSTABLE)",
      },
    ],
  },
};
