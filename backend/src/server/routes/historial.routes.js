import { Router } from "express";
import { getHistorialComprasComprador } from "../controllers/compras.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";

const router = Router();

// Historial de compras del comprador autenticado (protegido con JWT)
router.get("/compras", authRequired, getHistorialComprasComprador);

export default router;
