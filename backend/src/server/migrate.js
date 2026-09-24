import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
for (const name of ["DB_HOST", "DB_USER", "DB_NAME"]) {
  if (!process.env[name]?.trim()) throw new Error(`Configuración obligatoria ausente: ${name}`);
}
if (process.env.DB_PASSWORD === undefined) throw new Error("Configuración obligatoria ausente: DB_PASSWORD (puede ser una cadena vacía)");

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: false,
  charset: "utf8mb4",
});
const migrationDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../migrations");

try {
  await connection.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(255) NOT NULL PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
  const files = (await readdir(migrationDir)).filter((file) => /^\d+_[a-z0-9_-]+\.sql$/i.test(file)).sort();
  for (const file of files) {
    const [applied] = await connection.execute("SELECT version FROM schema_migrations WHERE version = ?", [file]);
    if (applied.length) continue;
    const source = await readFile(path.join(migrationDir, file), "utf8");
    const statements = source.split(";").map((statement) => statement.trim()).filter(Boolean);
    for (const statement of statements) await connection.query(statement);
    await connection.execute("INSERT INTO schema_migrations (version) VALUES (?)", [file]);
    console.log(`Migración aplicada: ${file}`);
  }
  console.log("Migraciones al día");
} catch (error) {
  console.error(`Falló la migración (${error.code || "error"}). Verifica la base ${process.env.DB_NAME} y los permisos del usuario de DB.`);
  process.exitCode = 1;
} finally {
  await connection.end();
}
