import { Router } from "express";
import { crearReporte } from "../controllers/reportes.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { subirImagen } from "../config/multer.js";

const router = Router();

// Creacion de reportes (RF62/RF63, RF79, RF101).
// Cualquier usuario autenticado puede reportar un producto o usuario.
// La evidencia es opcional y se sube como archivo multipart "evidencia"
// (imagen validada por magic bytes; TASK-4.6).
router.post("/", authRequired, subirImagen("evidencia"), crearReporte);

export default router;
