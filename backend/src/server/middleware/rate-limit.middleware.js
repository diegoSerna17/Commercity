import rateLimit from "express-rate-limit";

/**
 * Rate limits compartidos por app.js y las rutas.
 *
 * 1.5.9: `limitePorVentana` vivia en app.js. Los limitadores de step-up deben
 * correr DESPUES de authRequired (necesitan req.userId), y app.js monta sus
 * limites antes de los routers; por eso la fabrica se movio a este modulo para
 * que las rutas puedan crear su propio limitador sin importar app.js (ciclo).
 *
 * Los limitadores con `skip` se desactivan en NODE_ENV=test para no romper
 * Vitest/Supertest; el skip se evalua por peticion.
 */
export const MENSAJE_RATE_LIMIT = {
  success: false,
  error: { code: "RATE_LIMIT", message: "Demasiadas peticiones." },
};

export const limitePorVentana = ({
  windowMs,
  max,
  keyGenerator,
  skip,
  skipSuccessfulRequests = false,
}) =>
  rateLimit({
    windowMs,
    max,
    keyGenerator,
    message: MENSAJE_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skip || (() => process.env.NODE_ENV === "test"),
    skipSuccessfulRequests,
  });

/**
 * Step-up de operaciones sensibles (cuenta bancaria, baja de cuenta):
 * 5 FALLOS por usuario cada 15 minutos. Se monta SIEMPRE despues de
 * authRequired para que la clave sea req.userId y no la IP compartida.
 * Los aciertos no consumen cupo (skipSuccessfulRequests).
 */
export const limiteStepUp = limitePorVentana({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `stepup:${req.userId}`,
  skipSuccessfulRequests: true,
});
