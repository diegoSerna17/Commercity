/**
 * C1 (plan 1.5.5): la integracion no debe saltarse en silencio.
 *
 * Las suites de integracion usan `describe.skipIf(!habilitado)` con
 * TEST_DB_HOST/TEST_DB_USER/TEST_DB_NAME. En un clon limpio eso es correcto
 * (verde sin MySQL), pero en CI un borrado accidental de las variables dejaria
 * las suites "skipped" y el job igualmente en verde.
 *
 * Con REQUIRE_TEST_DB=true este archivo falla si falta alguna variable. El CI
 * lo define en el job `backend`; en local, sin la variable, se salta igual que
 * el resto de la integracion.
 */
import { describe, it, expect } from "vitest";

const REQUERIDO = process.env.REQUIRE_TEST_DB === "true";

const TEST_DB = {
  host: process.env.TEST_DB_HOST,
  user: process.env.TEST_DB_USER,
  database: process.env.TEST_DB_NAME,
};

const faltantes = Object.entries({
  TEST_DB_HOST: TEST_DB.host,
  TEST_DB_USER: TEST_DB.user,
  TEST_DB_NAME: TEST_DB.database,
})
  .filter(([, valor]) => !valor)
  .map(([nombre]) => nombre);

describe.skipIf(!REQUERIDO)("requisitos de la integracion (REQUIRE_TEST_DB=true)", () => {
  it("define TEST_DB_HOST, TEST_DB_USER y TEST_DB_NAME", () => {
    expect(faltantes).toEqual([]);
  });
});

// Modo local/clon limpio: deja constancia de que la integracion esta
// deshabilitada a proposito, sin romper el comando.
if (!REQUERIDO) {
  describe("requisitos de la integracion (opcional)", () => {
    it.skip("define REQUIRE_TEST_DB=true para exigir TEST_DB_* (lo hace el CI)", () => {});
  });
}
