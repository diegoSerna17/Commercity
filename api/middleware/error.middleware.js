const { errorResponse } = require("../../shared/response");

// Ultimo middleware: nunca devuelve el detalle interno al cliente.
function errorHandler(err, _req, res, _next) {
  console.error("Error no controlado:", err?.message || "sin mensaje");
  return errorResponse(res, "Error interno del servidor", 500);
}

module.exports = { errorHandler };
