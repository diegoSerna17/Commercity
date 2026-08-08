import dotenv from "dotenv";

import app from "./app.js";

dotenv.config();

// Regla api-seguridad.md: JWT_SECRET SIEMPRE desde .env; el servidor falla al
// arrancar si no existe (nunca un fallback hardcodeado).
if (!process.env.JWT_SECRET) {
    console.error("FATAL: JWT_SECRET es obligatorio en .env. El servidor no arranca.");
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor creado con puerto http://localhost:${PORT}`);
});
