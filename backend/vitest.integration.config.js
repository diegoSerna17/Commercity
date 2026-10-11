import { defineConfig } from "vitest/config";

// TASK-3.9 (auditoria 2026-10-11): runner de integracion. SOLO corre contra un
// MySQL local DESECHABLE apuntado por TEST_DB_* (jamas la BD compartida).
// Si faltan TEST_DB_* los tests se saltan (describe.skipIf) y el comando
// termina en verde, de modo que un clon limpio no necesita BD.
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.js"],
    include: ["src/server/__tests__/integration/**/*.test.js"],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: { enabled: false },
  },
});
