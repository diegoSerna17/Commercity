import { errorResponse } from "../utils/response.js";

/**
 * Middleware de validacion de entrada con Zod.
 * Si el body no cumple el schema, responde 400 con el detalle por campo.
 * @param {import("zod").ZodSchema} schema
 */
export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const details = result.error?.issues?.map(e => ({
            campo: e.path.join("."),
            mensaje: e.message
        })) || [];
        return errorResponse(res, "Datos inválidos", 400, details);
    }
    req.body = result.data;
    next();
};
