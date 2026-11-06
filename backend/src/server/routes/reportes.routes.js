import { Router } from "express";
import { crearReporte } from "../controllers/reportes.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { subirImagen } from "../config/multer.js";
import { validate } from "../middleware/validate.middleware.js";
import { crearReporteSchema } from "../schemas/reportes.schema.js";

const router = Router();

// Creacion de reportes (RF63-RF69, RF85, RF86, RF108, RF109).
// Cualquier usuario autenticado puede reportar un producto o usuario.
// La evidencia es opcional y se sube como archivo multipart "evidencia"
// (imagen validada por magic bytes; TASK-4.6). Se guarda en la subcarpeta
// privada uploads/reportes/ (B2, auditoria 2026-11-04).
router.post(
  "/",
  authRequired,
  subirImagen("evidencia", "reportes"),
  validate(crearReporteSchema),
  crearReporte
);

export default router;
