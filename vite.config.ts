import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const projectRootDir = resolve(__dirname);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: "@", replacement: resolve(projectRootDir, "src/lib") }],
  },
  optimizeDeps: {
    exclude: ["wire.io"],
  },
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/lib/index.js"),
      name: "React-sync-board",
      // the proper extensions will be added
      fileName: "react-sync-board",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["react", "react-dom", "recoil", "@scripters/use-socket.io"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          react: "React",
          recoil: "recoil",
        },
      },
    },
  },
});
