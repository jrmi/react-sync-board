import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const projectRootDir = resolve(import.meta.dirname);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const buildWebsite = env.BUILD_WEBSITE === "true";
  const defaultConfig = {
    plugins: [react()],
    resolve: {
      alias: [{ find: "@", replacement: resolve(projectRootDir, "src/lib") }],
    },
    build: {
      chunkSizeWarningLimit: 1000,
      lib: {
        // Could also be a dictionary or array of multiple entry points
        entry: resolve(import.meta.dirname, "src/lib/index.js"),
        name: "React-sync-board",
        // the proper extensions will be added
        fileName: "react-sync-board",
      },
      sourcemap: true,
      rollupOptions: {
        // make sure to externalize deps that shouldn't be bundled
        // into your library
        external: [
          "react",
          "react-dom",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "@scripters/use-socket.io",
          "zustand",
          "zustand/traditional",
          "zustand/shallow",
          "@react-hookz/web",
        ],
        output: {
          // Provide global variables to use in the UMD build
          // for externalized deps
          globals: {
            react: "React",
          },
        },
      },
    },
  };
  if (buildWebsite) {
    delete defaultConfig.build.lib;
    delete defaultConfig.build.rollupOptions;
  }
  return defaultConfig;
});
