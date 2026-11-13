import { Router } from "express";
import { authRequired } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { limiteStepUp } from "../middleware/rate-limit.middleware.js";
import { paramsIdSchema } from "../schemas/common.schema.js";
import {
  adminUsuariosQuerySchema,
  cambiarEstadoUsuarioSchema,
  adminProductosQuerySchema,
  adminReportesQuerySchema,
  resolverReporteSchema,
  busquedaAdminQuerySchema,
  upsertCuentaBancariaAdminSchema,
} from "../schemas/admin.schema.js";
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

// Estadisticas (RF57-RF62)
router.get("/stats", getStats);

// Usuarios (RF70, RF73, RF76)
router.get("/usuarios", validate(adminUsuariosQuerySchema, "query"), getUsuarios);
router.patch(
  "/usuarios/:id/estado",
  validate(paramsIdSchema, "params"),
  validate(cambiarEstadoUsuarioSchema),
  cambiarEstadoUsuario
);
router.delete("/usuarios/:id", validate(paramsIdSchema, "params"), eliminarUsuario);

// Productos (RF71, RF74, RF75)
router.get("/productos", validate(adminProductosQuerySchema, "query"), getProductos);
router.delete("/productos/:id", validate(paramsIdSchema, "params"), eliminarProducto);
router.patch(
  "/productos/:id/restaurar",
  validate(paramsIdSchema, "params"),
  restaurarProducto
);

// Reportes (RF63-RF69)
router.get("/reportes", validate(adminReportesQuerySchema, "query"), getReportes);
router.get("/reportes/:id", validate(paramsIdSchema, "params"), getReporte);
router.delete("/reportes/:id", validate(paramsIdSchema, "params"), eliminarReporte);
router.patch(
  "/reportes/:id/resolver",
  validate(paramsIdSchema, "params"),
  validate(resolverReporteSchema),
  resolverReporte
);

// Buscador (RF72-RF74)
router.get("/busqueda", validate(busquedaAdminQuerySchema, "query"), buscarAdmin);

// Cuenta bancaria de Commercity (RF79, RNF11 cifrado)
router.get("/mi-cuenta-bancaria", getMiCuentaBancaria);
router.get("/mi-cuenta-bancaria/masked", getMiCuentaBancariaMasked);
router.post(
  "/mi-cuenta-bancaria",
  limiteStepUp,
  validate(upsertCuentaBancariaAdminSchema),
  upsertMiCuentaBancaria
);
router.put(
  "/mi-cuenta-bancaria",
  limiteStepUp,
  validate(upsertCuentaBancariaAdminSchema),
  upsertMiCuentaBancaria
);

export default router;
