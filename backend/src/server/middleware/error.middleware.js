import { errorResponse } from "../utils/response.js";

/**
 * Middleware de error centralizado: ultimo de la cadena Express.
 * Nunca expone stack traces ni detalles internos al cliente (regla gestion-errores).
 * Si el error trae httpStatus (errores de validacion Zod, etc.), se respeta el
 * codigo; de lo contrario responde 500 generico.
 *
 * TASK-4.9 (B-*): ademas de `httpStatus` propio se respetan `status` /
 * `statusCode` (body-parser, multer, Express), para que un JSON malformado
 * responda 400 y un cuerpo demasiado grande 413 en vez de un 500 generico.
 */
export const errorHandler = (err, _req, res, _next) => {
    console.error("Error no controlado:", err?.message || "error sin mensaje");
    const status = err?.httpStatus || err?.status || err?.statusCode;
    if (Number.isInteger(status) && status >= 400 && status < 600 && status !== 500) {
        // Los errores propios (httpStatus) y los de cliente con `expose` llevan
        // su mensaje; el resto usa uno generico.
        const mensaje = err?.httpStatus || err?.expose
            ? err.message || "Solicitud inválida"
            : status === 413
              ? "El cuerpo de la petición es demasiado grande"
              : "Solicitud inválida";
        return errorResponse(res, mensaje, status);
    }
    return errorResponse(res, "Error interno del servidor", 500);
};
