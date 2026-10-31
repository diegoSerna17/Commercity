const { errorResponse } = require("../../shared/response");

// Valida el cuerpo con un esquema Zod antes de llegar al controlador.
function validate(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body);
    if (!resultado.success) {
      return errorResponse(res, "Solicitud invalida", 400, resultado.error.issues);
    }
    req.body = resultado.data;
    next();
  };
}

module.exports = { validate };
