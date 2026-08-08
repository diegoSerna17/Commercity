import { Router } from "express";
import {
    getUsuarios,
    getPerfilPublico,
    eliminarCuentaComprador,
    register,
    login,
    logout,
    getPerfil,
    cambiarRol,
    solicitarRecuperacion,
    restablecerPassword,
    adminGetDatos,
} from "../controllers/usuarios.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    registerSchema,
    loginSchema,
    recoverSchema,
    resetSchema,
    cambiarRolSchema,
} from "../schemas/auth.schemas.js";

const router = Router();

// Verificacion del servidor
router.get("/", getUsuarios);

// Endpoint publico para ver el perfil de otro usuario por su ID
router.get("/perfil-publico/:id", getPerfilPublico);

// RF40: el comprador elimina su cuenta (desactivacion logica, usa req.userId del token)
router.delete("/cuenta", authRequired, eliminarCuentaComprador);

// ===== Autenticacion (publicas) =====
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/recover", validate(recoverSchema), solicitarRecuperacion);
router.post("/reset-password", validate(resetSchema), restablecerPassword);

// ===== Rutas protegidas (requieren Bearer Token) =====
// Fix 3.3: logout exige token para poder revocarlo (RF2)
router.post("/logout", authRequired, logout);
router.get("/me", authRequired, getPerfil);
router.patch("/me/rol", authRequired, validate(cambiarRolSchema), cambiarRol);

// ===== Ruta admin (requiere rol administrador) =====
router.get("/admin", authRequired, requireRoles(["administrador"]), adminGetDatos);

export default router;
