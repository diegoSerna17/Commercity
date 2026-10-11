#!/usr/bin/env node
/**
 * aplicar-migraciones.mjs — aplica en ORDEN las migraciones SQL de
 * `backend/src/server/db/` y registra cada una en el ledger `schema_migrations`
 * (M-DB-3/M-DB-4, auditoria 2026-10-11).
 *
 * Uso (desde `backend/`):
 *   node scripts/aplicar-migraciones.mjs            # aplica las pendientes
 *   node scripts/aplicar-migraciones.mjs --check    # solo informa el estado
 *
 * Conexion: variables DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME
 * (por defecto `commercity_dev`, igual que schema/seed).
 *
 * Guarda SEC-003: si DB_NAME apunta a una base COMPARTIDA
 * (commercity_v2 / commercycity_v2 / commercy_v2) el script se niega a aplicar
 * salvo que se pase `--permitir-compartida` de forma explicita (decision humana,
 * nunca de un agente).
 *
 * Idempotencia: cada migracion del repositorio esta escrita para poder
 * re-ejecutarse; ademas el ledger evita repetirlas y detecta por checksum
 * SHA-256 si una migracion YA aplicada cambio de contenido (aborta en ese caso).
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.resolve(__dirname, "..", "src", "server", "db");
const COMPARTIDAS = ["commercity_v2", "commercycity_v2", "commercy_v2"];
const modoCheck = process.argv.includes("--check");
const permitirCompartida = process.argv.includes("--permitir-compartida");

const dbName = process.env.DB_NAME || "commercity_dev";
if (COMPARTIDAS.includes(dbName) && !permitirCompartida) {
  console.error(
    `FATAL: DB_NAME=${dbName} es una base compartida. Este script no la toca sin --permitir-compartida (SEC-003; decision humana explicita).`
  );
  process.exit(1);
}

function sha256(texto) {
  return crypto.createHash("sha256").update(texto, "utf8").digest("hex");
}

function archivosDeMigracion() {
  return fs
    .readdirSync(DB_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: dbName,
  charset: "utf8mb4",
  multipleStatements: true,
});

const [filasBd] = await conn.query(
  `SELECT COUNT(*) AS n FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schema_migrations'`
);
if (filasBd[0].n === 0) {
  await conn.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       id VARCHAR(120) PRIMARY KEY,
       aplicada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
       checksum CHAR(64) NOT NULL
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  console.log("[LEDGER] schema_migrations creada (no existia).");
}

const [aplicadas] = await conn.query(
  "SELECT id, checksum FROM schema_migrations ORDER BY id"
);
const ledger = new Map(aplicadas.map((r) => [r.id, r.checksum]));

let pendientes = 0;
for (const archivo of archivosDeMigracion()) {
  const sql = fs.readFileSync(path.join(DB_DIR, archivo), "utf8");
  const checksum = sha256(sql);
  const previo = ledger.get(archivo);

  if (previo !== undefined) {
    if (previo !== checksum) {
      console.error(
        `FATAL: ${archivo} ya estaba aplicada pero su contenido cambio (checksum distinto). Revisar manualmente antes de continuar.`
      );
      await conn.end();
      process.exit(1);
    }
    console.log(`[SKIP] ${archivo} (ya aplicada)`);
    continue;
  }

  if (modoCheck) {
    pendientes += 1;
    console.log(`[PENDIENTE] ${archivo}`);
    continue;
  }

  try {
    await conn.query(sql);
  } catch (e) {
    console.error(`FATAL: fallo la migracion ${archivo}: ${e.message}`);
    await conn.end();
    process.exit(1);
  }
  await conn.query(
    "INSERT INTO schema_migrations (id, checksum) VALUES (?, ?)",
    [archivo, checksum]
  );
  console.log(`[OK] ${archivo} aplicada y registrada en schema_migrations`);
}

if (modoCheck) {
  console.log(
    pendientes === 0
      ? "Estado: todas las migraciones del repositorio estan aplicadas."
      : `Estado: ${pendientes} migracion(es) pendiente(s).`
  );
} else {
  console.log("Migraciones al dia.");
}

await conn.end();
