const path = require("path");

const projectRootDir = path.resolve(__dirname);

module.exports = {
  parser: "babel-eslint",
  extends: [
    "airbnb-base",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  root: true,
  env: {
    browser: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["prettier"],
  rules: {
    "no-unused-vars": "warn",
    "class-methods-use-this": "off",
    "react/prop-types": "off",
    "import/extensions": [
      "warn",
      {
        js: "never",
        jsx: "never",
      },
    ],
    "import/no-unresolved": "error",
    "prettier/prettier": ["error"],
  },
  settings: {
    "import/resolver": {
      alias: {
        map: [["@", path.resolve(projectRootDir, "src")]],
      },
      node: {
        extensions: [".js", ".jsx"],
      },
    },
  },
};
