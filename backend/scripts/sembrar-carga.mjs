#!/usr/bin/env node
/**
 * backend/scripts/sembrar-carga.mjs
 * Siembra datos de volumen para las pruebas de rendimiento (cien mil filas).
 *
 * Reglas de seguridad:
 *  - Solo corre contra una base LOCAL y desechable.
 *  - Aborta si DB_NAME es una base compartida o de produccion.
 *  - Sin `--si` no escribe: muestra el plan.
 *  - `--limpiar` borra solo filas con prefijo PERF- (nunca TRUNCATE).
 *
 * Uso (desde backend/):
 *   node scripts/sembrar-carga.mjs --filas 100000 --si
 *   node scripts/sembrar-carga.mjs --limpiar --si
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const BACKEND = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(BACKEND, ".env") });

const args = process.argv.slice(2);
function valor(nombre, defecto) {
  const i = args.indexOf(nombre);
  return i >= 0 && args[i + 1] ? args[i + 1] : defecto;
}
const filas = Number(valor("--filas", "100000"));
const lote = Number(valor("--lote", "5000"));
const limpiar = args.includes("--limpiar");
const confirmado = args.includes("--si");
const ayuda = args.includes("--help") || args.includes("-h");

const BASES_PROHIBIDAS = ["commercity_v2", "commercycity_v2", "commercy_v2"];
const PREFIJO = "PERF-";

function salir(msg) {
  console.error(`SEMILLA: ${msg}`);
  process.exit(1);
}

if (ayuda) {
  console.log("Uso: node scripts/sembrar-carga.mjs [--filas N] [--lote N] [--limpiar] [--si]");
  console.log("  --filas N   Filas a sembrar (por defecto 100000).");
  console.log("  --lote N    Filas por INSERT (por defecto 5000).");
  console.log("  --limpiar   Borra solo las filas con prefijo PERF-.");
  console.log("  --si        Confirma la escritura. Sin esto solo se muestra el plan.");
  process.exit(0);
}

const dbName = process.env.DB_NAME || "commercity_dev";
const dbHost = process.env.DB_HOST || "localhost";
if (BASES_PROHIBIDAS.includes(dbName) || /prod|shared|compartida/i.test(dbName)) {
  salir(`DB_NAME="${dbName}" parece una base compartida o de produccion. Usa una base local desechable.`);
}
if (!Number.isInteger(filas) || filas <= 0) salir(`--filas invalido: ${filas}`);
if (!Number.isInteger(lote) || lote <= 0) salir(`--lote invalido: ${lote}`);

console.log(`SEMILLA: base ${dbName} en ${dbHost}`);
console.log(`SEMILLA: accion ${limpiar ? "LIMPIAR" : `sembrar ${filas} filas`} en lotes de ${lote}`);
if (!confirmado) {
  console.log("SEMILLA: modo plan (sin --si). No se escribio nada.");
  process.exit(0);
}

let pool;
try {
  pool = mysql.createPool({
    host: dbHost,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: dbName,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
  });

  const [[tabla]] = await pool.query("SHOW TABLES LIKE 'productos'");
  if (!tabla) salir("la tabla productos no existe. Carga schema_commercity.sql primero.");

  if (limpiar) {
    const [res] = await pool.query("DELETE FROM productos WHERE nombre LIKE ?", [`${PREFIJO}%`]);
    console.log(`SEMILLA: borradas ${res.affectedRows} filas con prefijo ${PREFIJO}`);
    process.exit(0);
  }

  const [categorias] = await pool.query("SELECT id FROM categorias ORDER BY id ASC LIMIT 5");
  const [vendedores] = await pool.query(
    "SELECT id FROM usuarios WHERE activo = 1 ORDER BY id ASC LIMIT 20"
  );
  if (categorias.length === 0) salir("no hay categorias. Carga seed_commercity.sql primero.");
  if (vendedores.length === 0) salir("no hay usuarios activos. Carga seed_commercity.sql primero.");

  const [[antes]] = await pool.query("SELECT COUNT(*) AS total FROM productos");
  console.log(`SEMILLA: productos antes: ${antes.total}`);
  console.log(`SEMILLA: ${vendedores.length} vendedores y ${categorias.length} categorias disponibles`);

  const inicio = Date.now();
  let insertadas = 0;
  for (let desde = 0; desde < filas; desde += lote) {
    const hasta = Math.min(desde + lote, filas);
    const valores = [];
    for (let i = desde; i < hasta; i += 1) {
      const numero = String(i + 1).padStart(6, "0");
      const vendedor = vendedores[i % vendedores.length].id;
      const categoria = categorias[i % categorias.length].id;
      valores.push([
        vendedor,
        categoria,
        `${PREFIJO}Producto ${numero}`,
        `Producto de carga para pruebas de rendimiento #${numero}`,
        "/uploads/perf.png",
        1000 + (i % 90000),
        i % 50, // 1 de cada 50 queda Agotado por la columna generada
        0,
      ]);
    }
    await pool.query(
      "INSERT INTO productos (vendedor_id, categoria_id, nombre, descripcion, imagen_url, precio, stock, descuento_porcentaje) VALUES ?",
      [valores]
    );
    insertadas += valores.length;
    if (insertadas % (lote * 5) === 0 || insertadas === filas) {
      console.log(`SEMILLA: ${insertadas}/${filas} filas`);
    }
  }

  const [[despues]] = await pool.query("SELECT COUNT(*) AS total FROM productos");
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`SEMILLA: productos despues: ${despues.total} (+${despues.total - antes.total}) en ${segundos}s`);
  console.log("SEMILLA: OK. Para limpiar: node scripts/sembrar-carga.mjs --limpiar --si");
} catch (error) {
  salir(error.code ? `${error.code}: ${error.message}` : error.message);
} finally {
  if (pool) await pool.end();
}
