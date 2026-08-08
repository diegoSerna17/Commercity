import { Router } from "express";
import {
  getResumenCarrito,
  confirmarPago,
  actualizarEstado,
} from "../controllers/pedidos.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const router = Router();

// Resumen del carrito con desglose de IVA y 90/10 (solo lectura)
router.get("/resumen", authRequired, getResumenCarrito);

// Checkout ACID: pedido + lineas + stock + pago en UNA transaccion (RF134)
router.post("/confirmar-pago", authRequired, confirmarPago);

// El vendedor avanza UN nivel el estado de SUS envios (RF122/RF124)
router.patch("/:id/estado", authRequired, requireRoles(["vendedor", "administrador"]), actualizarEstado);

export default router;
