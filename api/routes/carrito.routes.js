import { Router } from "express";
import {
  agregarProducto,
  eliminarProducto,
  modificarCantidad,
  listarCarrito,
} from "../controllers/carrito.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";

const router = Router();

// Operaciones del carrito (tarea asignada: Daniel Palacios)
// H1 (P0 auditoria 2026-10-05): todas las rutas exigen JWT y el
// comprador_id se deriva SIEMPRE de req.userId (nunca del body/query).
router.post("/", authRequired, agregarProducto);            // Agregar producto al carrito
router.delete("/:productoId", authRequired, eliminarProducto); // Eliminar producto del carrito
router.patch("/:productoId", authRequired, modificarCantidad); // Modificar cantidad
router.get("/", authRequired, listarCarrito);               // Agrupar por vendedor + calcular resumen

export default router;
