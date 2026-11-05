import { Router } from "express";
import {
  agregarProducto,
  eliminarProducto,
  modificarCantidad,
  listarCarrito,
} from "../controllers/carrito.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  agregarAlCarritoSchema,
  carritoProductoParamsSchema,
  modificarCantidadSchema,
} from "../schemas/carrito.schema.js";

const router = Router();

// Operaciones del carrito (tarea asignada: Daniel Palacios)
// H1 (P0 auditoria 2026-10-05): todas las rutas exigen JWT y el
// comprador_id se deriva SIEMPRE de req.userId (nunca del body/query).
router.post("/", authRequired, validate(agregarAlCarritoSchema), agregarProducto);
router.delete(
  "/:productoId",
  authRequired,
  validate(carritoProductoParamsSchema, "params"),
  eliminarProducto
);
router.patch(
  "/:productoId",
  authRequired,
  validate(carritoProductoParamsSchema, "params"),
  validate(modificarCantidadSchema),
  modificarCantidad
);
router.get("/", authRequired, listarCarrito);

export default router;
