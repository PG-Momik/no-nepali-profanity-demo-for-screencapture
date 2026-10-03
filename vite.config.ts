import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5190,
    // The package is linked from ../js, which is outside this folder.
    fs: { allow: [".", "../js"] },
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        lms: resolve(__dirname, "lms/index.html"),
        thread: resolve(__dirname, "thread/index.html"),
      },
    },
  },
});
