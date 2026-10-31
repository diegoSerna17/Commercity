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
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "commercity_dev",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
