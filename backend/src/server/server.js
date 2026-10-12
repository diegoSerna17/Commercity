import dotenv from "dotenv";

import app from "./app.js";
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

app.listen(PORT, () => {
    console.log(`CommerCity API v${APP_VERSION} escuchando en http://localhost:${PORT}`);
});
