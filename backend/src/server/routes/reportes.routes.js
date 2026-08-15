import { Router } from "express";
import { crearReporte } from "../controllers/reportes.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import upload from "../config/multer.js";

const router = Router();

// Creacion de reportes (RF62/RF63, RF79, RF101).
// Cualquier usuario autenticado puede reportar un producto o usuario.
// La evidencia es opcional y se sube como archivo multipart "evidencia".
router.post("/", authRequired, upload.single("evidencia"), crearReporte);

export default router;
