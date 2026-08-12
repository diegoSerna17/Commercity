import { Router } from "express";
import {
  getProductos,
  getCategorias,
  getVendedores,
  getProductoDetalle,
  validarStockProducto,
  crearProductoVendedor,
  editarProductoVendedor,
  getMisProductos,
} from "../controllers/productos.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";
import upload from "../config/multer.js";

const router = Router();

// Panel Principal (RF87-RF94): catalogo publico con busqueda, filtros y paginacion
router.get("/productos", getProductos);
router.get("/categorias", getCategorias);
router.get("/vendedores", getVendedores);

// Gestion de productos del vendedor (RF45-RF49, RF54)
// Integrado desde Jose Yepes (2026-08-12). Fix 4.1: usa el JWT del vendedor
// (authRequired + requireRoles), no un ID fijo. mis-productos va ANTES de /:id
// para evitar que Express lo tome como id.
router.get(
  "/productos/mis-productos",
  authRequired,
  requireRoles(["vendedor"]),
  getMisProductos
);

// Detalle de producto (RF78/RF79) y validacion de stock (RF86)
// Integrado desde Carlos Perea (2026-08-09). El listado /productos NO se
// duplica: sigue siendo del Panel Principal.
router.get("/productos/:id/validar-stock", validarStockProducto);
router.get("/productos/:id", getProductoDetalle);

router.post(
  "/productos",
  authRequired,
  requireRoles(["vendedor"]),
  upload.single("imagen"),
  crearProductoVendedor
);
router.put(
  "/productos/:id",
  authRequired,
  requireRoles(["vendedor"]),
  upload.single("imagen"),
  editarProductoVendedor
);

export default router;
