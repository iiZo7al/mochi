import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true
  },
  build: {
    target: "chrome120",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        island: resolve(__dirname, "island.html")
      }
    }
  }
});
