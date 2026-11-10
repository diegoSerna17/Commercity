import { Router } from "express";
import {
  calificarVendedor,
  listarCalificacionesVendedor,
} from "../controllers/calificaciones.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  calificacionSchema,
  calificacionesVendedorParamsSchema,
  calificacionesVendedorQuerySchema,
} from "../schemas/calificaciones.schema.js";

const router = Router();

// ============================================================================
// RUTAS DE CALIFICACIONES (RF107 del documento 20/08)
// ============================================================================

// Calificar a un vendedor de 1 a 5 estrellas despues de una compra.
router.post(
  "/vendedor",
  authRequired,
  validate(calificacionSchema),
  calificarVendedor
);

// RF51: calificaciones recibidas por un vendedor (publico, paginado).
router.get(
  "/vendedor/:id",
  validate(calificacionesVendedorParamsSchema, "params"),
  validate(calificacionesVendedorQuerySchema, "query"),
  listarCalificacionesVendedor
);

export default router;
