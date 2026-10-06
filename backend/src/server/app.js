import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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
import { errorHandler } from "./middleware/error.middleware.js";
import { authRequired } from "./middleware/auth.middleware.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Seguridad centralizada (regla api-seguridad.md)
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "10mb" }));
// CORS estricto (H5 auditoria 2026-10-05): allowlist explicita + funcion
// validadora. Los origenes de escritorio/movil (null, file://, capacitor)
// solo se aceptan si ALLOW_DESKTOP_ORIGINS=true (dev/entorno controlado);
// en produccion solo entran FRONTEND_URL y los esquemas Capacitor https.
// Nunca usar comodin "*". Las peticiones sin Origin (curl, apps nativas)
// se permiten porque no son navegadores.
const CORS_ALLOWLIST = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "https://localhost",      // Capacitor Android (androidScheme https por defecto)
  "http://localhost",       // Capacitor Android con esquema http / dev
  "capacitor://localhost",  // Capacitor iOS
];
const ALLOW_DESKTOP_ORIGINS = process.env.ALLOW_DESKTOP_ORIGINS === "true" || process.env.NODE_ENV !== "production";
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

// Rate limit para rutas de autenticacion (anti fuerza bruta / spam de correos).
// Un limitador independiente por ruta: cada una tiene su propio cupo de 10/min.
const opcionesRateLimit = {
    windowMs: 60 * 1000,
    max: 10,
    message: { success: false, error: { code: "RATE_LIMIT", message: "Demasiadas peticiones." } },
    standardHeaders: true,
    legacyHeaders: false,
};
// Rate limit general de escritura (H5): 200 req / 15 min por IP para /api.
// En NODE_ENV=test se desactiva para no romper Vitest/Supertest.
const limiteEscritura = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, error: { code: "RATE_LIMIT", message: "Demasiadas peticiones." } },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
});
app.use("/api/usuarios/login", rateLimit(opcionesRateLimit));
app.use("/api/usuarios/recover", rateLimit(opcionesRateLimit));
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
