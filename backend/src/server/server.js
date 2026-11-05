import dotenv from "dotenv";

import app from "./app.js";
import pool from "./config/db.js";
import pkg from "../../package.json" with { type: "json" };

dotenv.config();

// Regla api-seguridad.md: JWT_SECRET SIEMPRE desde .env; el servidor falla al
// arrancar si no existe (nunca un fallback hardcodeado).
if (!process.env.JWT_SECRET) {
    console.error("FATAL: JWT_SECRET es obligatorio en .env. El servidor no arranca.");
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

// B-12 (banner dinamico): la version se lee de backend/package.json, nunca a
// mano, para que el arranque siempre reporte la version real (VER-001).
const APP_VERSION = pkg.version || "0.0.0";

const server = app.listen(PORT, () => {
    console.log(`CommerCity API v${APP_VERSION} escuchando en http://localhost:${PORT}`);
});

// B2 (auditoria 2026-11-04): cierre ordenado. Docker/K8s envian SIGTERM: se
// dejan de aceptar conexiones, se espera a las en curso y se cierra el pool
// MySQL. El timeout evita que un keep-alive abierto bloquee el contenedor.
let cerrando = false;
const cerrar = (senal) => {
    if (cerrando) return;
    cerrando = true;
    console.log(`[shutdown] ${senal}: cerrando servidor y pool MySQL...`);
    server.close(async (error) => {
        try {
            await pool.end();
        } catch (err) {
            console.error(`[shutdown] error cerrando el pool: ${err.message}`);
        } finally {
            process.exit(error ? 1 : 0);
        }
    });
    setTimeout(() => {
        console.error("[shutdown] timeout de cierre: salida forzada");
        process.exit(1);
    }, 10000).unref();
};

process.on("SIGTERM", () => cerrar("SIGTERM"));
process.on("SIGINT", () => cerrar("SIGINT"));

// Un rechazo no capturado deja el proceso en estado desconocido: se registra
// sin datos sensibles y se cierra ordenadamente con codigo 1.
process.on("unhandledRejection", (motivo) => {
    const mensaje = motivo instanceof Error ? motivo.message : String(motivo);
    console.error(`[unhandledRejection] ${mensaje}`);
    cerrar("unhandledRejection");
});
