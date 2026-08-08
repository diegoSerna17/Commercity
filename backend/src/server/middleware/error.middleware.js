import { errorResponse } from "../utils/response.js";

/**
 * Middleware de error centralizado: ultimo de la cadena Express.
 * Nunca expone stack traces ni detalles internos al cliente (regla gestion-errores).
 * Si el error trae httpStatus (errores de validacion Zod, etc.), se respeta el
 * codigo; de lo contrario responde 500 generico.
 */
export const errorHandler = (err, _req, res, _next) => {
    console.error("Error no controlado:", err.message);
    if (err?.httpStatus) {
        return errorResponse(res, err.message, err.httpStatus);
    }
    return errorResponse(res, "Error interno del servidor", 500);
};

/**
 * Envuelve un controlador async para propagar los errores al errorHandler.
 */
export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
