require("dotenv").config();
const express = require("express");
const pool = require("./config/database");
const usuariosRoutes = require("./api/routes/usuarios.routes");
const { errorHandler } = require("./api/middleware/error.middleware");
const { errorResponse } = require("./shared/response");

// Aqui se arma la aplicacion: seguridad basica, rutas y manejo de errores.
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

// Modulo de usuarios (API)
app.use("/api/usuarios", usuariosRoutes);

// 404 uniforme
app.use((_req, res) => errorResponse(res, "Endpoint no encontrado", 404));

// Error central
app.use(errorHandler);

module.exports = app;
