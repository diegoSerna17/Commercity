import { defineConfig } from "vitest/config";

// TASK-1.3 (auditoria 2026-10-11): configuracion del runner en archivo propio
// (la clave "vitest" de package.json ya no la toma Vitest 4). El setup fija
// NODE_ENV=test y un JWT_SECRET de prueba para clones limpios.
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.js"],
    // TASK-3.9: la integracion con MySQL real vive en su propio runner
    // (vitest.integration.config.js + `npm run test:integration`).
    exclude: ["**/node_modules/**", "**/dist/**", "**/__tests__/integration/**"],
    coverage: {
      provider: "v8",
      include: ["src/server/**/*.js"],
      // El entrypoint (app.listen) no se ejerce en las pruebas: el arranque y
      // toda la app viven en app.js (100% cubierto).
      exclude: ["src/server/server.js"],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
