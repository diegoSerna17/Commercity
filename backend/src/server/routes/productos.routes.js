import { Router } from "express";
import {
  getProductos,
  getCategorias,
  getVendedores,
  getProductoDetalle,
  validarStockProducto,
} from "../controllers/productos.controllers.js";

const router = Router();

// Panel Principal (RF87-RF94): catalogo publico con busqueda, filtros y paginacion
router.get("/productos", getProductos);
router.get("/categorias", getCategorias);
router.get("/vendedores", getVendedores);

// Detalle de producto (RF78/RF79) y validacion de stock (RF86)
// Integrado desde Carlos Perea (2026-08-09). El listado /productos NO se
// duplica: sigue siendo del Panel Principal.
router.get("/productos/:id/validar-stock", validarStockProducto);
router.get("/productos/:id", getProductoDetalle);

export default router;
