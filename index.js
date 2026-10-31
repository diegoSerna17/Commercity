require("dotenv").config();
const express = require("express");
const pool = require("./config/database");
const usuariosRoutes = require("./routes/usuarios.routes");
const { errorHandler } = require("./middleware/error.middleware");
const { errorResponse } = require("./utils/response");

const app = express();
app.use(express.json());

// Salud: comprueba que la base responda.
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ success: true, data: { status: "ok", db: "ok" } });
  } catch {
    return errorResponse(res, "Base de datos no disponible", 503);
  }
});

// Modulo de usuarios
app.use("/api/usuarios", usuariosRoutes);

// 404 uniforme
app.use((_req, res) => errorResponse(res, "Endpoint no encontrado", 404));

// Error central
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API minima CommerCity escuchando en http://localhost:${PORT}`);
});
