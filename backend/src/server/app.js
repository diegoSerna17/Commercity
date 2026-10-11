import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import router from "./routes/routes.js";
import carritoRouter from "./routes/carrito.routes.js";
import usuariosRouter from "./routes/usuarios.routes.js";
import historialRouter from "./routes/historial.routes.js";
import productosRouter from "./routes/productos.routes.js";
import pedidosRouter from "./routes/pedidos.routes.js";
import tiendaRouter from "./routes/tienda.routes.js";
import adminRouter from "./routes/admin.routes.js";
import reportesRouter from "./routes/reportes.routes.js";
import calificacionesRouter from "./routes/calificaciones.routes.js";
import chatRouter from "./routes/chat.routes.js";
import notificacionesRouter from "./routes/notificaciones.routes.js";
import seguidoresRouter from "./routes/seguidores.routes.js";
import docsRouter from "./docs/docs.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { authRequired } from "./middleware/auth.middleware.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Seguridad centralizada (regla api-seguridad.md)
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// M-9/H7: el limite del body JSON baja de 10mb a 100kb. Las subidas reales van
// por multipart/multer (no consumen este parser), asi que 100kb sobra para el
// resto de la API.
app.use(express.json({ limit: "100kb" }));

// M-9/H7: confianza en proxies inversos SOLO por entorno (TRUST_PROXY: numero
// de hops o valor de express). Sin variable no se confia en X-Forwarded-For.
const TRUST_PROXY = String(process.env.TRUST_PROXY || "").trim();
if (TRUST_PROXY) {
  app.set("trust proxy", /^\d+$/.test(TRUST_PROXY) ? Number(TRUST_PROXY) : TRUST_PROXY);
}

// CORS (M-16/H6): CERRADO por defecto.
//  - FRONTEND_URL (origen web principal) + CORS_ALLOWLIST (extra, coma-separado).
//  - Localhost y los esquemas Capacitor de desarrollo solo fuera de produccion.
//  - ALLOW_DESKTOP_ORIGINS=true habilita los origenes null/file:// de las apps
//    de escritorio/movil empaquetadas (por defecto false).
//  - Nunca comodin "*". Las peticiones sin Origin (curl, apps nativas) se
//    permiten porque no son navegadores.
const ES_PRODUCCION = process.env.NODE_ENV === "production";
const CORS_ALLOWLIST = [
  process.env.FRONTEND_URL,
  ...String(process.env.CORS_ALLOWLIST || "")
    .split(",")
    .map((origen) => origen.trim()),
].filter(Boolean);
if (!ES_PRODUCCION) {
  CORS_ALLOWLIST.push(
    "http://localhost:5173",  // Vite dev por defecto
    "https://localhost",      // Capacitor Android (androidScheme https por defecto)
    "http://localhost",       // Capacitor Android con esquema http / dev
    "capacitor://localhost"   // Capacitor iOS
  );
}
const ALLOW_DESKTOP_ORIGINS = process.env.ALLOW_DESKTOP_ORIGINS === "true";
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (CORS_ALLOWLIST.includes(origin)) return callback(null, true);
    if (ALLOW_DESKTOP_ORIGINS && (origin === "null" || origin === "file://" || origin.startsWith("file://"))) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));

// H2 (P0): /uploads ya no es totalmente publico. Las imagenes de producto
// (jpg/jpeg/png/webp/gif) siguen publicas para el catalogo (RF45/RF49);
// cualquier otro archivo (pdf/doc/xls/zip del chat, evidencias) exige JWT.
const IMAGEN_PUBLICA = /\.(jpg|jpeg|png|webp|gif)$/i;
app.use(
  "/uploads",
  (req, res, next) => {
    if (req.method === "GET" && IMAGEN_PUBLICA.test(req.path)) return next();
    return authRequired(req, res, next);
  },
  express.static(path.join(__dirname, "uploads"), { dotfiles: "deny", index: false })
);

// Rate limits (M-9/H7): por endpoint y por cuenta, ademas del general. Los
// limitadores con `skip` se desactivan en NODE_ENV=test para no romper
// Vitest/Supertest; el skip se evalua por peticion.
const MENSAJE_RATE_LIMIT = { success: false, error: { code: "RATE_LIMIT", message: "Demasiadas peticiones." } };
const limitePorVentana = ({ windowMs, max, keyGenerator }) => rateLimit({
    windowMs,
    max,
    keyGenerator,
    message: MENSAJE_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
});

// Anti fuerza bruta en login/recover: por IP (10/min) y ADEMAS por CUENTA
// (5 / 15 min sobre el email normalizado; sin email cae al IP seguro).
const opcionesRateLimit = {
    windowMs: 60 * 1000,
    max: 10,
    message: MENSAJE_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
};
const limitePorCuenta = limitePorVentana({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) =>
        req.body?.email
            ? `cuenta:${String(req.body.email).trim().toLowerCase()}`
            : ipKeyGenerator(req.ip),
});
app.use("/api/usuarios/login", rateLimit(opcionesRateLimit), limitePorCuenta);
app.use("/api/usuarios/recover", rateLimit(opcionesRateLimit), limitePorCuenta);

// Cupos especificos de endpoints sensibles.
app.use("/api/usuarios/register", limitePorVentana({ windowMs: 60 * 60 * 1000, max: 5 }));
app.use("/api/usuarios/reset-password", limitePorVentana({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use("/api/chat", limitePorVentana({ windowMs: 60 * 1000, max: 60 }));
app.use("/api/reportes", limitePorVentana({ windowMs: 60 * 60 * 1000, max: 20 }));
app.use("/api/seguidores", limitePorVentana({ windowMs: 60 * 1000, max: 30 }));

// Subidas multipart (productos/reportes): cupo propio; el limite por usuario
// se aplica ademas en config/multer.js (TASK-4.6).
const limiteSubidas = limitePorVentana({ windowMs: 60 * 60 * 1000, max: 30 });
app.use(["/api/productos", "/api/reportes"], (req, res, next) =>
    req.method === "POST" || req.method === "PUT"
        ? limiteSubidas(req, res, next)
        : next()
);

// Rate limit general de escritura (H5): 200 req / 15 min por IP para /api.
const limiteEscritura = limitePorVentana({ windowMs: 15 * 60 * 1000, max: 200 });
app.use("/api/", limiteEscritura);

// Routers por modulo
app.use("/", router);
app.use("/api/carrito", carritoRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/historial", historialRouter);
app.use("/api/pedidos", pedidosRouter);
app.use("/api/tienda", tiendaRouter);
app.use("/api/admin", adminRouter);
app.use("/api/reportes", reportesRouter);
app.use("/api/calificaciones", calificacionesRouter);
app.use("/api/chat", chatRouter);
app.use("/api/notificaciones", notificacionesRouter);
app.use("/api/seguidores", seguidoresRouter);
// Documentacion OpenAPI (Fase 3 docs-api): /api/openapi.json + /api/docs.
// Gate DOCS_ENABLED dentro del router; no toca helmet/CSP/CORS.
app.use("/api", docsRouter);
app.use("/api", productosRouter);

// Catch-all 404: cualquier ruta que no coincida con los routers anteriores
// responde JSON uniforme en vez del HTML por defecto de Express.
// Express 5 + path-to-regexp 8.x no soporta "*" en app.use(); se usa middleware sin ruta.
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: "Endpoint no encontrado. Revisa el método HTTP y la ruta."
        }
    });
});

// Middleware de error centralizado al final de la cadena
app.use(errorHandler);

export default app;
