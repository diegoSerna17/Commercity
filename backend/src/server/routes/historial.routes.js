import { Router } from "express";
import { getHistorialComprasComprador, cancelarPedidoComprador } from "../controllers/compras.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";

const router = Router();

// Historial de compras del comprador autenticado (protegido con JWT)
router.get("/compras", authRequired, getHistorialComprasComprador);

// RF135: cancelar un pedido en estado Pendiente (restituye stock y reembolsa)
router.post("/compras/:id/cancelar", authRequired, cancelarPedidoComprador);

export default router;
