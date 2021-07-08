module.exports = {
  // presets: ["@babel/preset-env", "@babel/preset-react"],
  presets: [["@babel/env", { modules: false }], "@babel/preset-react"],
  env: {
    test: {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-react",
      ],
    },
  },
};
