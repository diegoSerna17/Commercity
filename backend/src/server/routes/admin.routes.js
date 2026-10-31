import { Router } from "express";
import { authRequired } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";
import { getStats } from "../controllers/admin/stats.controllers.js";
import {
  getUsuarios,
  cambiarEstadoUsuario,
  eliminarUsuario,
} from "../controllers/admin/usuarios.controllers.js";
import {
  getProductos,
  eliminarProducto,
  restaurarProducto,
} from "../controllers/admin/productos.controllers.js";
import {
  getReportes,
  getReporte,
  eliminarReporte,
  resolverReporte,
} from "../controllers/admin/reportes.controllers.js";
import { buscarAdmin } from "../controllers/admin/busqueda.controllers.js";
import {
  getMiCuentaBancaria,
  getMiCuentaBancariaMasked,
  upsertMiCuentaBancaria,
} from "../controllers/admin/cuentaBancaria.controllers.js";

const router = Router();

// Fix 4.1 (CRITICO): TODA ruta de /api/admin exige token valido Y rol
// administrador. Sin esto, cualquiera podria banear/suspender/eliminar.
router.use(authRequired, requireRoles(["administrador"]));

// Estadisticas (RF55-RF59)
router.get("/stats", getStats);

// Usuarios (RF67, RF73, RF74)
router.get("/usuarios", getUsuarios);
router.patch("/usuarios/:id/estado", cambiarEstadoUsuario);
router.delete("/usuarios/:id", eliminarUsuario);

// Productos (RF68, RF72)
router.get("/productos", getProductos);
router.delete("/productos/:id", eliminarProducto);
router.patch("/productos/:id/restaurar", restaurarProducto);

// Reportes (RF60-RF66)
router.get("/reportes", getReportes);
router.get("/reportes/:id", getReporte);
router.delete("/reportes/:id", eliminarReporte);
router.patch("/reportes/:id/resolver", resolverReporte);

// Buscador (RF69-RF71)
router.get("/busqueda", buscarAdmin);

// Cuenta bancaria de Commercity (RF75/RF76, RNF11 cifrado)
router.get("/mi-cuenta-bancaria", getMiCuentaBancaria);
router.get("/mi-cuenta-bancaria/masked", getMiCuentaBancariaMasked);
router.post("/mi-cuenta-bancaria", upsertMiCuentaBancaria);
router.put("/mi-cuenta-bancaria", upsertMiCuentaBancaria);

export default router;
