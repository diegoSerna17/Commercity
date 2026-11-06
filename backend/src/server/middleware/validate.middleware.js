import { errorResponse } from "../utils/response.js";
import { borrarArchivoSubido } from "../config/multer.js";

/**
 * Middleware de validacion de entrada con Zod.
 * Si el valor no cumple el schema, responde 400 con el detalle por campo.
 *
 * @param {import("zod").ZodType} schema
 * @param {"body"|"query"|"params"} [source="body"] parte de la peticion a validar
 * @returns {import("express").RequestHandler}
 */
export const validate = (schema, source = "body") => (req, res, next) => {
    const valor = req[source] ?? {};
    const result = schema.safeParse(valor);
    if (!result.success) {
        // TASK-4.6: si multer ya escribio un archivo y el cuerpo no es valido,
        // no debe quedar huerfano en uploads/.
        if (req.file) borrarArchivoSubido(req.file);
        const details = result.error?.issues?.map(e => ({
            campo: e.path.join("."),
            mensaje: e.message
        })) || [];
        // Mensaje principal = primer error (legible para el usuario final);
        // details conserva el desglose por campo.
        const mensaje = result.error?.issues?.[0]?.message || "Datos inválidos";
        return errorResponse(res, mensaje, 400, details);
    }

    if (source === "query") {
        // Express 5 define req.query como getter de solo lectura: se reemplaza
        // en la instancia para que el controller reciba los valores ya
        // coercionados y con los defaults del schema.
        Object.defineProperty(req, "query", {
            value: result.data,
            writable: true,
            configurable: true,
            enumerable: true,
        });
    } else {
        req[source] = result.data;
    }
    next();
};
