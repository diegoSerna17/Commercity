import { Router } from "express";
import {
  getResumenCarrito,
  confirmarPago,
  actualizarEstado,
} from "../controllers/pedidos.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  confirmarPagoSchema,
  estadoSchema,
  paramsIdSchema,
} from "../schemas/pedidos.schema.js";

const router = Router();

// Resumen del carrito con desglose de IVA y 90/10 (solo lectura)
router.get("/resumen", authRequired, getResumenCarrito);

// Checkout ACID: pedido + lineas + stock + pago en UNA transaccion (RF116-RF124/RF140)
router.post(
  "/confirmar-pago",
  authRequired,
  validate(confirmarPagoSchema),
  confirmarPago
);

// PATCH /:id/estado — DOS caminos (RBAC por ownership DENTRO del controller):
//  - Vendedor/Admin (RF127): avanza 1 nivel (Pendiente → En camino → Entregado).
//  - Comprador (RF35): cancela por detalle_id o general (restituye stock + reembolso).
router.patch(
  "/:id/estado",
  authRequired,
  validate(paramsIdSchema, "params"),
  validate(estadoSchema),
  actualizarEstado
);

export default router;
