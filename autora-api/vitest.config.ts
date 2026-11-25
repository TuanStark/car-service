import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    root: "./",
    environment: "node",
    include: ["test/unit/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/main.ts", "src/**/*.module.ts", "src/**/*.dto.ts"],
    },
  },
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
