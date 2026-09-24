import dotenv from "dotenv";
dotenv.config();

const requiredEnv = ["DB_HOST", "DB_USER", "DB_NAME"];
for (const name of requiredEnv) {
  if (!process.env[name]?.trim()) throw new Error(`Configuración obligatoria ausente: ${name}`);
}
if (process.env.DB_PASSWORD === undefined) throw new Error("Configuración obligatoria ausente: DB_PASSWORD (puede ser una cadena vacía)");
const port = Number(process.env.PORT || 3000);
const dbPort = Number(process.env.DB_PORT || 3306);
const poolSize = Number(process.env.DB_POOL_SIZE || 10);
const sessionDays = Number(process.env.SESSION_DAYS || 7);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT debe ser un puerto válido");
if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) throw new Error("DB_PORT debe ser un puerto válido");
if (!Number.isInteger(poolSize) || poolSize < 1 || poolSize > 100) throw new Error("DB_POOL_SIZE debe estar entre 1 y 100");
if (!Number.isInteger(sessionDays) || sessionDays < 1 || sessionDays > 3650) throw new Error("SESSION_DAYS debe estar entre 1 y 3650");
if (process.env.COOKIE_SECURE !== undefined && !["true", "false"].includes(process.env.COOKIE_SECURE)) throw new Error("COOKIE_SECURE debe ser true o false");

const [{ default: express }, { default: cors }, { default: router }, { default: pool }, { ApiError }] = await Promise.all([
  import("express"), import("cors"), import("./routes/routes.js"), import("./db.js"), import("./validation.js"),
]);

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((origin) => origin.trim()).filter(Boolean);
if (allowedOrigins.includes("*")) throw new Error("CORS_ORIGIN no puede permitir todos los orígenes");
app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origen no permitido"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(router);
app.use((req, res) => res.status(404).json({ error: "No encontrado" }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
  if (error.type === "entity.parse.failed") return res.status(400).json({ error: "Solicitud inválida" });
  if (error.type === "entity.too.large") return res.status(413).json({ error: "Solicitud demasiado grande" });
  if (error.message === "Origen no permitido") return res.status(403).json({ error: "Origen no permitido" });
  console.error("Error interno de API");
  return res.status(500).json({ error: "Error interno del servidor" });
});

try {
  await pool.query("SELECT 1");
} catch (error) {
  console.error(`No se pudo conectar a MySQL (${error.code || "error de conexión"}). Verifica DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME.`);
  process.exitCode = 1;
  await pool.end();
}

if (!process.exitCode) {
  const host = process.env.HOST || "127.0.0.1";
  app.listen(port, host, () => console.log(`API disponible en http://${host}:${port}`));
}
