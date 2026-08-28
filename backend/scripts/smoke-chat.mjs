import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import request from "supertest";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { default: app } = await import("../src/server/app.js");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function main() {
  const [tabla] = await pool.query("SHOW TABLES LIKE 'mensajes_chat'");
  if (tabla.length === 0) {
    throw new Error("La tabla mensajes_chat NO existe en la BD real");
  }
  console.log("✔ Tabla mensajes_chat existe");

  const [usuarios] = await pool.query(
    "SELECT id, email, activo FROM usuarios WHERE activo = 1 ORDER BY id LIMIT 2"
  );
  if (usuarios.length < 2) {
    throw new Error("Necesitas al menos 2 usuarios activos en la BD");
  }
  const [emisor, receptor] = usuarios;
  console.log(`✔ Emisor: #${emisor.id} / Receptor: #${receptor.id}`);

  const token = jwt.sign(
    { id: emisor.id, email: emisor.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const res = await request(app)
    .post("/api/chat")
    .set("Authorization", `Bearer ${token}`)
    .send({ receptor_id: receptor.id, mensaje: "Smoke test contra BD real" });

  console.log("✔ POST /api/chat ->", res.status, res.body);
  if (res.status !== 201) {
    throw new Error(`Fallo al enviar el mensaje: ${JSON.stringify(res.body)}`);
  }

  const [filas] = await pool.query(
    "SELECT * FROM mensajes_chat WHERE id = ?",
    [res.body.data.id]
  );
  if (filas.length === 0) {
    throw new Error("El mensaje NO quedó guardado en la BD");
  }
  console.log("✔ Fila guardada en BD:", JSON.stringify(filas[0], null, 2));

  await pool.query("DELETE FROM mensajes_chat WHERE id = ?", [res.body.data.id]);

  console.log("\n✅ 3/3 COMPLETO: código + pruebas en verde + verificación contra BD real");
  await pool.end();
  process.exit(0);
}

main().catch(async (e) => {
  console.error("\n❌ SMOKE TEST FALLÓ:", e.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
