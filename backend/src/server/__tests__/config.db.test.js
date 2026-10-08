import { describe, it, expect, vi, afterEach } from "vitest";

// Mock de mysql2/promise: db.js solo crea el pool, no conecta. La factory se
// re-ejecuta tras cada vi.resetModules(), por eso las referencias (createPool)
// se toman SIEMPRE despues del import dinamico, nunca a nivel de archivo.
vi.mock("mysql2/promise", () => {
  const pool = { query: vi.fn(), getConnection: vi.fn() };
  return {
    __esModule: true,
    default: { createPool: vi.fn(() => pool) },
    __pool: pool,
  };
});

// Base determinista: se fijan las 5 variables para que el .env local (si existe)
// no contamine los escenarios; dotenv.config() no sobreescribe valores ya puestos.
const ENTORNO_BASE = {
  DB_USER: "",
  DB_PASSWORD: "",
  DB_HOST: "",
  DB_PORT: "",
  DB_NAME: "",
};

async function importarDb(entorno) {
  vi.resetModules();
  for (const [clave, valor] of Object.entries({ ...ENTORNO_BASE, ...entorno })) {
    vi.stubEnv(clave, valor);
  }
  // El factory del mock de mysql2/promise se cachea entre resetModules, por lo
  // que createPool acumula llamadas de todos los escenarios. Se limpia justo
  // antes de importar db.js para que el recuento sea solo de ESTA importacion.
  const mysql = (await import("mysql2/promise")).default;
  mysql.createPool.mockClear();
  const modulo = await import("../config/db.js");
  return { pool: modulo.default, createPool: mysql.createPool };
}

function espiarSalida() {
  return {
    exit: vi.spyOn(process, "exit").mockImplementation(() => {}),
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("config/db.js - credenciales y defaults de conexion (H5)", () => {
  it("produccion con credenciales por defecto: FATAL, exit 1 y advierte", async () => {
    const spies = espiarSalida();
    await importarDb({ NODE_ENV: "production", DB_USER: "", DB_PASSWORD: "" });

    expect(spies.error).toHaveBeenCalledWith(expect.stringContaining("FATAL"));
    expect(spies.exit).toHaveBeenCalledWith(1);
    // La segunda condicion (NODE_ENV !== 'test') tambien aplica en produccion
    expect(spies.warn).toHaveBeenCalledWith(expect.stringContaining("credenciales por defecto"));
  });

  it("desarrollo con credenciales por defecto: solo advierte, no sale", async () => {
    const spies = espiarSalida();
    await importarDb({ NODE_ENV: "development", DB_USER: "", DB_PASSWORD: "" });

    expect(spies.warn).toHaveBeenCalledWith(expect.stringContaining("credenciales por defecto"));
    expect(spies.error).not.toHaveBeenCalled();
    expect(spies.exit).not.toHaveBeenCalled();
  });

  it("test con credenciales por defecto: sin advertencia ni exit", async () => {
    const spies = espiarSalida();
    await importarDb({ NODE_ENV: "test", DB_USER: "", DB_PASSWORD: "" });

    expect(spies.warn).not.toHaveBeenCalled();
    expect(spies.error).not.toHaveBeenCalled();
    expect(spies.exit).not.toHaveBeenCalled();
  });

  it("produccion con credenciales explicitas: crea el pool sin fatal", async () => {
    const spies = espiarSalida();
    const { createPool } = await importarDb({
      NODE_ENV: "production",
      DB_USER: "app_qa",
      DB_PASSWORD: "clave-segura-123",
    });

    expect(spies.error).not.toHaveBeenCalled();
    expect(spies.exit).not.toHaveBeenCalled();
    expect(spies.warn).not.toHaveBeenCalled();
    expect(createPool).toHaveBeenCalledWith(
      expect.objectContaining({ user: "app_qa", password: "clave-segura-123" })
    );
  });

  it("DB_USER=root con password definida no se considera inseguro", async () => {
    const spies = espiarSalida();
    await importarDb({ NODE_ENV: "production", DB_USER: "root", DB_PASSWORD: "clave-segura-123" });

    expect(spies.error).not.toHaveBeenCalled();
    expect(spies.exit).not.toHaveBeenCalled();
    expect(spies.warn).not.toHaveBeenCalled();
  });

  it("DB_USER distinto de root sin password no dispara la advertencia", async () => {
    const spies = espiarSalida();
    await importarDb({ NODE_ENV: "development", DB_USER: "app_qa", DB_PASSWORD: "" });

    expect(spies.warn).not.toHaveBeenCalled();
    expect(spies.error).not.toHaveBeenCalled();
  });

  it("usa los defaults de conexion cuando no hay variables de entorno", async () => {
    espiarSalida();
    const { createPool } = await importarDb({
      NODE_ENV: "test",
      DB_USER: "",
      DB_PASSWORD: "",
      DB_HOST: "",
      DB_PORT: "",
      DB_NAME: "",
    });

    expect(createPool).toHaveBeenCalledWith({
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      database: "commercity_v2",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  });

  it("lee DB_HOST/DB_PORT/DB_NAME del entorno", async () => {
    espiarSalida();
    const { createPool } = await importarDb({
      NODE_ENV: "test",
      DB_USER: "app_qa",
      DB_PASSWORD: "clave-segura-123",
      DB_HOST: "db-interno",
      DB_PORT: "3307",
      DB_NAME: "commercity_qa",
    });

    expect(createPool).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "db-interno",
        port: 3307,
        database: "commercity_qa",
      })
    );
  });

  it("exporta por defecto el pool que devuelve createPool (con query)", async () => {
    espiarSalida();
    const { pool, createPool } = await importarDb({ NODE_ENV: "test" });

    expect(createPool).toHaveBeenCalledTimes(1);
    expect(pool).toBe(createPool.mock.results[0].value);
    expect(typeof pool.query).toBe("function");
  });
});
