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
import chatRouter from "./routes/chat.routes.js";
import notificacionesRouter from "./routes/notificaciones.routes.js";
import adminRouter from "./routes/admin.routes.js";
import reportesRouter from "./routes/reportes.routes.js";
import calificacionesRouter from "./routes/calificaciones.routes.js";
import seguidoresRouter from "./routes/seguidores.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Seguridad centralizada (regla api-seguridad.md)
// Fix helmet (imagenes): crossOriginResourcePolicy permite que el frontend
// muestre las imagenes/archivos servidos desde /uploads (RF45/RF49, chat RF105).
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "10mb" }));
// CORS: clientes que consumen la API.
// - Web (Vite) en FRONTEND_URL (por defecto http://localhost:5173).
// - Escritorio (Electron): el renderer carga desde file:// y llega sin cabecera
//   Origin o con Origin "null"; el main process no aplica CORS.
// - Movil (Ionic/Capacitor): esquemas capacitor://localhost (iOS) y
//   http(s)://localhost (WebView Android).
// Restringirlo a FRONTEND_URL bloquearia escritorio y movil (Fase 2).
const ORIGENES_PERMITIDOS = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ORIGENES_PERMITIDOS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  })
);

// Imagenes subidas por el vendedor (Perfil Vendedor RF45/RF49) y chat (RF105)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rate limit para rutas de autenticacion (anti fuerza bruta / spam de correos).
// Un limitador independiente por ruta: cada una tiene su propio cupo de 10/min.
const opcionesRateLimit = {
    windowMs: 60 * 1000,
    max: 10,
    message: { success: false, error: { code: "RATE_LIMIT", message: "Demasiadas peticiones." } },
    standardHeaders: true,
    legacyHeaders: false,
};
app.use("/api/usuarios/login", rateLimit(opcionesRateLimit));
app.use("/api/usuarios/recover", rateLimit(opcionesRateLimit));

// Routers por modulo
app.use("/", router);
app.use("/api/carrito", carritoRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/historial", historialRouter);
app.use("/api/pedidos", pedidosRouter);
app.use("/api/tienda", tiendaRouter);
app.use("/api/chat", chatRouter);
app.use("/api/notificaciones", notificacionesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/reportes", reportesRouter);
app.use("/api/calificaciones", calificacionesRouter);
app.use("/api/seguidores", seguidoresRouter);
app.use("/api", productosRouter);

// Middleware de error centralizado al final de la cadena
app.use(errorHandler);

export default app;
