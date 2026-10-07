import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * Pool de conexiones MySQL para el backend de CommerCity.
 * Las credenciales se leen de variables de entorno (ver .env.example).
 * H5 (P2): los defaults (root sin clave, localhost) solo son para dev/test.
 * En produccion se exige DB_USER/DB_PASSWORD explicitos y se advierte si se
 * usan los valores por defecto.
 */
const usandoDefaultsInseguros =
  (!process.env.DB_USER || process.env.DB_USER === "root") &&
  !process.env.DB_PASSWORD;
if (usandoDefaultsInseguros && process.env.NODE_ENV === "production") {
  console.error("FATAL: en produccion defina DB_USER y DB_PASSWORD (sin defaults root).");
  process.exit(1);
}
if (usandoDefaultsInseguros && process.env.NODE_ENV !== "test") {
  console.warn("[WARN] BD con credenciales por defecto (root sin clave): solo apto para desarrollo local.");
}
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "commercity_v2",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
