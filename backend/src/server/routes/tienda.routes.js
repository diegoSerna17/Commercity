import { Router } from "express";
import {
  getMiCuentaBancaria,
  getMiCuentaBancariaMasked,
  upsertMiCuentaBancaria,
  getHistorialVentas,
  getHistorialIngresos,
  getDashboardStats,
} from "../controllers/tienda.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const router = Router();

// Todo el modulo requiere vendedor autenticado (RNF9: solo vendedor gestiona datos bancarios)
const vendedor = [authRequired, requireRoles(["vendedor"])];

// Cuenta bancaria (RNF11 cifrado, RF122 enmascarado)
router.get("/mi-cuenta-bancaria", ...vendedor, getMiCuentaBancaria);
router.get("/mi-cuenta-bancaria/masked", ...vendedor, getMiCuentaBancariaMasked);
router.post("/mi-cuenta-bancaria", ...vendedor, upsertMiCuentaBancaria);
router.put("/mi-cuenta-bancaria", ...vendedor, upsertMiCuentaBancaria);

// Historial de ventas e ingresos (RF119-RF123)
router.get("/ventas", ...vendedor, getHistorialVentas);
router.get("/ingresos", ...vendedor, getHistorialIngresos);
router.get("/dashboard/stats", ...vendedor, getDashboardStats);

export default router;
