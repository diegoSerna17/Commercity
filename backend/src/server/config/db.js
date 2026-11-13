import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * Pool de conexiones MySQL para el backend de CommerCity.
 * Las credenciales se leen de variables de entorno (ver .env.example).
 * H5 (P2): los defaults (root sin clave, localhost) solo son para test.
 * H9 (TASK-4.8): las credenciales por defecto NO se aceptan en ningun entorno
 * real: el proceso aborta fuera de NODE_ENV=test (antes solo en produccion).
 * A-2: el default de BD es commercity_dev (local/desechable). La base
 * compartida commercity_v2 solo se usa con DB_NAME explicito y aprobacion.
 */
const usandoDefaultsInseguros =
  (!process.env.DB_USER || process.env.DB_USER === "root") &&
  !process.env.DB_PASSWORD;
if (usandoDefaultsInseguros && process.env.NODE_ENV !== "test") {
  console.error(
    "FATAL: defina DB_USER y DB_PASSWORD propios (no se permiten los defaults root/sin clave fuera de test)."
  );
  process.exit(1);
}
/**
 * A-1 (auditoria backend 1.5.5): la cola del pool es FINITA. Con queueLimit=0
 * las peticiones esperaban indefinidamente y una fuga de conexiones (pool.query
 * con una conexion retenida) terminaba en timeouts sin senal clara. Al llenarse
 * la cola, mysql2 rechaza con "Queue limit reached." y la API responde 503.
 * 1.5.9: el default sube a 100 (una cola de 20 cortaba rafagas legitimas).
 */
const LIMITE_COLA_DEFECTO = 100;
const limiteColaConfigurado = Number(process.env.DB_QUEUE_LIMIT ?? LIMITE_COLA_DEFECTO);

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "commercity_dev",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit:
    Number.isFinite(limiteColaConfigurado) && limiteColaConfigurado > 0
      ? limiteColaConfigurado
      : LIMITE_COLA_DEFECTO,
});

/**
 * Detecta el agotamiento del pool (cola llena o limite de conexiones del
 * servidor MySQL). Permite responder 503 en vez de un 500 generico.
 * @param {unknown} error
 * @returns {boolean}
 */
export function esPoolSaturado(error) {
  const codigo = String(error?.code || "");
  const mensaje = String(error?.message || "");
  return codigo === "ER_CON_COUNT_ERROR" || /queue limit reached/i.test(mensaje);
}

export default pool;
