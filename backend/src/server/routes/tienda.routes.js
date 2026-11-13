import { Router } from "express";
import {
  getMiCuentaBancaria,
  getMiCuentaBancariaMasked,
  upsertMiCuentaBancaria,
  getHistorialVentas,
  getHistorialIngresos,
  getDashboardStats,
  getValidacionTienda,
} from "../controllers/tienda.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { limiteStepUp } from "../middleware/rate-limit.middleware.js";
import {
  historialIngresosQuerySchema,
  historialVentasQuerySchema,
  upsertCuentaBancariaSchema,
} from "../schemas/tienda.schema.js";

const router = Router();

// Todo el modulo requiere vendedor autenticado (RNF9: solo vendedor gestiona datos bancarios)
const vendedor = [authRequired, requireRoles(["vendedor"])];

// Cuenta bancaria (RNF11 cifrado, RF122 enmascarado)
router.get("/mi-cuenta-bancaria", ...vendedor, getMiCuentaBancaria);
router.get("/mi-cuenta-bancaria/masked", ...vendedor, getMiCuentaBancariaMasked);
router.post(
  "/mi-cuenta-bancaria",
  ...vendedor,
  limiteStepUp,
  validate(upsertCuentaBancariaSchema),
  upsertMiCuentaBancaria
);
router.put(
  "/mi-cuenta-bancaria",
  ...vendedor,
  limiteStepUp,
  validate(upsertCuentaBancariaSchema),
  upsertMiCuentaBancaria
);

// Historial de ventas e ingresos (RF135-RF139)
router.get(
  "/ventas",
  ...vendedor,
  validate(historialVentasQuerySchema, "query"),
  getHistorialVentas
);
router.get(
  "/ingresos",
  ...vendedor,
  validate(historialIngresosQuerySchema, "query"),
  getHistorialIngresos
);
router.get("/dashboard/stats", ...vendedor, getDashboardStats);

// Validacion integral de Mi Tienda (RF130-RF139): cuenta bancaria, 90/10 y devoluciones
router.get("/validacion", ...vendedor, getValidacionTienda);

export default router;
