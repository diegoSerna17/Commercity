import { Router } from "express";
import {
  getResumenCarrito,
  confirmarPago,
  actualizarEstado,
} from "../controllers/pedidos.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";

const router = Router();

// Resumen del carrito con desglose de IVA y 90/10 (solo lectura)
router.get("/resumen", authRequired, getResumenCarrito);

// Checkout ACID: pedido + lineas + stock + pago en UNA transaccion (RF134)
router.post("/confirmar-pago", authRequired, confirmarPago);

// PATCH /:id/estado — DOS caminos (RBAC por ownership DENTRO del controller):
//  - Vendedor/Admin (RF122/RF124): avanza 1 nivel (Pendiente → En camino → Entregado).
//  - Comprador (RF35): cancela por detalle_id o general (restituye stock + reembolso).
router.patch("/:id/estado", authRequired, actualizarEstado);

export default router;
