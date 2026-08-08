/**
 * Respuesta exitosa estandar del proyecto.
 * Formato: { success: true, message?, data? }
 */
export const successResponse = (
    res,
    message = "Operación realizada correctamente.",
    data = null,
    statusCode = 200
) => {
    const body = { success: true };
    if (message) body.message = message;
    if (data !== null) body.data = data;
    return res.status(statusCode).json(body);
};

/**
 * Respuesta de error estandar del proyecto.
 * Formato: { success: false, error: { code, message, details? } }
 */
export const errorResponse = (
    res,
    message = "Ha ocurrido un error.",
    statusCode = 400,
    details = null
) => {
    const code = statusCode === 401 ? "UNAUTHORIZED"
        : statusCode === 403 ? "FORBIDDEN"
        : statusCode === 404 ? "NOT_FOUND"
        : statusCode === 400 ? "VALIDATION_ERROR"
        : "INTERNAL_ERROR";

    return res.status(statusCode).json({
        success: false,
        error: { code, message, ...(details ? { details } : {}) }
    });
};
