import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import babel from "@rollup/plugin-babel";
import image from "@rollup/plugin-image";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import path from "path";
import css from "rollup-plugin-css-only";
import pkg from "./package.json";
// import analyze from "rollup-plugin-analyzer";

const projectRootDir = path.resolve(__dirname);

const input = ["src/index.js"];
export default [
  {
    // UMD
    input,
    plugins: [
      alias({
        entries: [
          { find: "@", replacement: path.resolve(projectRootDir, "src") },
        ],
      }),
      commonjs(),
      nodeResolve({
        extensions: [".js", ".jsx"],
        preferBuiltins: false,
        browser: true,
      }),
      babel({
        babelHelpers: "bundled",
      }),
      terser(),
      image(),
    ],
    output: {
      file: `dist/${pkg.name}.min.js`,
      format: "umd",
      name: "myLibrary", // this is the name of the global object
      esModule: false,
      exports: "named",
      sourcemap: true,
    },
  },
  // ESM and CJS
  {
    input,
    external: ["react", "react-dom", "recoil", "@scripters/use-socket.io"],
    plugins: [
      alias({
        entries: [
          { find: "@", replacement: path.resolve(projectRootDir, "src") },
        ],
      }),
      commonjs(),
      babel({ babelHelpers: "bundled" }),
      nodeResolve({
        extensions: [".js", ".jsx"],
        preferBuiltins: false,
        browser: true,
      }),
      css({ output: "bundle.css" }),
      image(),
      // analyze({ summaryOnly: true }),
    ],
    output: [
      {
        dir: "dist/esm",
        format: "esm",
        exports: "named",
        sourcemap: true,
        globals: {
          crypto: "crypto",
        },
      },
      {
        dir: "dist/cjs",
        format: "cjs",
        exports: "named",
        sourcemap: true,
        globals: {
          crypto: "crypto",
        },
      },
    ],
  },
];
