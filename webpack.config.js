const packageJson = require("./package.json");
const version = packageJson.version;
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
const ESLintPlugin = require("eslint-webpack-plugin");

module.exports = (env, argv) => {
  const conf = {
    mode: "development",
    devServer: {
      open: true,
      openPage: "index.html",
      contentBase: path.join(__dirname, "example"),
      watchContentBase: true,
      port: 3033,
      host: argv.mode === "production" ? `localhost` : `localhost`,
      disableHostCheck: true,
    },
    entry: {
      "react-sync-board": ["./src/index.js"],
    },
    output: {
      path: path.join(__dirname, "lib"),
      publicPath: "/",
      filename: argv.mode === "production" ? `[name].js` : `[name].js`,
      library: "react-sync-board",
      libraryExport: "default",
      libraryTarget: "umd", //for both browser and node.js
      globalObject: "this", //for both browser and node.js
      umdNamedDefine: true,
      auxiliaryComment: {
        root: "for Root",
        commonjs: "for CommonJS environment",
        commonjs2: "for CommonJS2 environment",
        amd: "for AMD environment",
      },
    },

    optimization: {
      minimizer: [
        new TerserPlugin({
          //extractComments: true,
          //cache: true,
          //parallel: true,
          //sourceMap: true,
          terserOptions: {
            compress: {
              drop_console: true,
            },
          },
          extractComments: false,
        }),
      ],
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /(node_modules|bower_components)/,
          use: [
            {
              loader: "babel-loader",
              options: {
                presets: ["@babel/preset-env", "@babel/preset-react"],
              },
            },
          ],
        },
        {
          test: /\.(gif|png|jpe?g|svg)$/i,
          use: [
            "file-loader",
            {
              loader: "image-webpack-loader",
              options: {
                disable: true, // webpack@2.x and newer
              },
            },
          ],
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    resolve: {
      extensions: ["...", ".js", ".jsx"],
      alias: {},
    },
    plugins: [
      new webpack.BannerPlugin(
        `[name] v${version} Copyright (c) 2020 Jérémie Pardou`
      ),
      new ESLintPlugin({
        extensions: [".js", ".jsx", ".json"],
      }),
    ],
  };

  if (argv.mode !== "production") {
    conf.devtool = "inline-source-map";
  }

  return conf;
};
