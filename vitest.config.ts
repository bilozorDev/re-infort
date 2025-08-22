import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: "./test/setup.ts",
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "test/",
        ".next/",
        "tailwind.config.ts",
        "next.config.ts",
        "*.config.ts",
        "*.config.js",
        "app/**/*.stories.tsx",
        "app/**/layout.tsx",
        "app/**/page.tsx",
        "**/__tests__/**",
        "**/__mocks__/**",
        "**/test/**",
        "**/tests/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "test-utils/**",
        "mocks/**",
      ],
    },
    exclude: ["node_modules", ".next", "supabase/tests/**"],
  },
  resolve: {
    alias: {
      "@/app": path.resolve(__dirname, "./app"),
      "@/test": path.resolve(__dirname, "./test"),
      "@": path.resolve(__dirname, "./"),
    },
  },
});
