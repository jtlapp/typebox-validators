import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [],
  test: {
    include: ["**/*.test.ts", "**/*.spec.ts"],
    globals: true,
  },
});
