import { Router } from "express";
import {
  agregarProducto,
  eliminarProducto,
  modificarCantidad,
  listarCarrito,
} from "../controllers/carrito.controllers.js";

const router = Router();

// Operaciones del carrito (tarea asignada: Daniel Palacios)
router.post("/", agregarProducto);            // Agregar producto al carrito
router.delete("/:productoId", eliminarProducto); // Eliminar producto del carrito
router.patch("/:productoId", modificarCantidad); // Modificar cantidad
router.get("/", listarCarrito);               // Agrupar por vendedor + calcular resumen

export default router;
