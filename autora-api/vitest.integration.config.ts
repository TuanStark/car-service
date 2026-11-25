import { defineConfig } from "vitest/config";
import path from "node:path";
import swc from "unplugin-swc";

export default defineConfig({
  test: {
    globals: true,
    root: "./",
    environment: "node",
    include: ["test/integration/**/*.spec.ts"],
    testTimeout: 20000,
  },
  plugins: [swc.vite()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@infra": path.resolve(__dirname, "./src/infrastructure"),
      "@modules": path.resolve(__dirname, "./src/modules"),
    },
  },
});

