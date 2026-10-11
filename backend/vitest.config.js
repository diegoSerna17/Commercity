import { defineConfig } from "vitest/config";

// TASK-1.3 (auditoria 2026-10-11): configuracion del runner en archivo propio
// (la clave "vitest" de package.json ya no la toma Vitest 4). El setup fija
// NODE_ENV=test y un JWT_SECRET de prueba para clones limpios.
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.js"],
    coverage: {
      provider: "v8",
      include: ["src/server/**/*.js"],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
