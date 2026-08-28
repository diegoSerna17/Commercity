import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
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

const PASS = "123456";

async function main() {
  // 1. Dos usuarios activos reales
  const [usuarios] = await pool.query(
    "SELECT id, email FROM usuarios WHERE activo = 1 ORDER BY id LIMIT 2"
  );
  if (usuarios.length < 2) throw new Error("Necesitas al menos 2 usuarios activos");
  const [emisor, receptor] = usuarios;

  // 2. Login real (mismo flujo que el frontend)
  const login = await request(app)
    .post("/api/usuarios/login")
    .send({ email: emisor.email, password: PASS });
  console.log(`✔ Login ${emisor.email} ->`, login.status);
  if (login.status !== 200 || !login.body.data?.token) {
    throw new Error(`Login falló: ${JSON.stringify(login.body)}`);
  }
  const token = login.body.data.token;

  // 3. Listar conversaciones
  const conv = await request(app)
    .get("/api/chat/conversaciones")
    .set("Authorization", `Bearer ${token}`);
  console.log(`✔ GET /api/chat/conversaciones ->`, conv.status);

  // 4. Enviar mensaje
  const send = await request(app)
    .post("/api/chat")
    .set("Authorization", `Bearer ${token}`)
    .send({ receptor_id: receptor.id, mensaje: "E2E login + chat" });
  console.log(`✔ POST /api/chat ->`, send.status, send.body);
  if (send.status !== 201) throw new Error(`Envío falló: ${JSON.stringify(send.body)}`);

  // 5. Recibir historial
  const msgs = await request(app)
    .get(`/api/chat/mensajes/${receptor.id}`)
    .set("Authorization", `Bearer ${token}`);
  console.log(`✔ GET /api/chat/mensajes/${receptor.id} ->`, msgs.status, `(${msgs.body.data?.mensajes?.length || 0} mensajes)`);

  // 6. Limpiar
  await pool.query("DELETE FROM mensajes_chat WHERE id = ?", [send.body.data.id]);

  console.log("\n✅ E2E COMPLETO: login + listar + enviar + recibir contra la BD real");
  await pool.end();
  process.exit(0);
}

main().catch(async (e) => {
  console.error("\n❌ E2E FALLÓ:", e.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
