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
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Seguridad centralizada (regla api-seguridad.md)
// Fix helmet (imagenes): crossOriginResourcePolicy permite que el frontend
// muestre las imagenes/archivos servidos desde /uploads (RF45/RF49, chat RF105).
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "10mb" }));
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));

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
app.use("/api", productosRouter);

// Middleware de error centralizado al final de la cadena
app.use(errorHandler);

export default app;
