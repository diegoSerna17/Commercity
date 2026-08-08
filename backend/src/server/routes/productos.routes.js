import { Router } from "express";
import {
  getProductos,
  getCategorias,
  getVendedores,
} from "../controllers/productos.controllers.js";

const router = Router();

// Panel Principal (RF87-RF94): catalogo publico con busqueda, filtros y paginacion
router.get("/productos", getProductos);
router.get("/categorias", getCategorias);
router.get("/vendedores", getVendedores);

export default router;
