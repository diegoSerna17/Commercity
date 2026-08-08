import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * Pool de conexiones MySQL para el backend de CommerCity.
 * Las credenciales se leen de variables de entorno (ver .env.example).
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "commercity",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
