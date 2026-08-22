import { Router } from "express";
import { calificarVendedor } from "../controllers/calificaciones.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";

const router = Router();

// ============================================================================
// RUTAS DE CALIFICACIONES (RF107 del documento 20/08)
// ============================================================================

// Calificar a un vendedor de 1 a 5 estrellas despues de una compra.
router.post("/vendedor", authRequired, calificarVendedor);

export default router;
