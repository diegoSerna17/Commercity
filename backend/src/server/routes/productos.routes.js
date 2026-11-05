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
import { subirImagen } from "../config/multer.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  catalogoQuerySchema,
  productoIdParamsSchema,
  validarStockQuerySchema,
  crearProductoSchema,
  editarProductoSchema,
  misProductosQuerySchema,
} from "../schemas/productos.schema.js";

const router = Router();

// Panel Principal (RF91-RF98): catalogo publico con busqueda, filtros y paginacion
router.get("/productos", validate(catalogoQuerySchema, "query"), getProductos);
router.get("/categorias", getCategorias);
router.get("/vendedores", validate(misProductosQuerySchema, "query"), getVendedores);

// Gestion de productos del vendedor (RF45-RF49, RF54)
// Integrado desde Jose Yepes (2026-08-12). Fix 4.1: usa el JWT del vendedor
// (authRequired + requireRoles), no un ID fijo. mis-productos va ANTES de /:id
// para evitar que Express lo tome como id.
router.get(
  "/productos/mis-productos",
  authRequired,
  requireRoles(["vendedor"]),
  validate(misProductosQuerySchema, "query"),
  getMisProductos
);

// Detalle de producto (RF81/RF82) y validacion de stock (RF83/RF88)
// Integrado desde Carlos Perea (2026-08-09). El listado /productos NO se
// duplica: sigue siendo del Panel Principal.
router.get(
  "/productos/:id/validar-stock",
  validate(productoIdParamsSchema, "params"),
  validate(validarStockQuerySchema, "query"),
  validarStockProducto
);
router.get(
  "/productos/:id",
  validate(productoIdParamsSchema, "params"),
  getProductoDetalle
);

router.post(
  "/productos",
  authRequired,
  requireRoles(["vendedor"]),
  subirImagen("imagen"),
  validate(crearProductoSchema),
  crearProductoVendedor
);
router.put(
  "/productos/:id",
  authRequired,
  requireRoles(["vendedor"]),
  validate(productoIdParamsSchema, "params"),
  subirImagen("imagen"),
  validate(editarProductoSchema),
  editarProductoVendedor
);

export default router;
