import { Router } from "express";
import { getUsuarios, getPerfilPublico, eliminarCuentaComprador } from "../controllers/usuarios.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getUsuarios);

// Endpoint publico para ver el perfil de otro usuario por su ID
router.get("/perfil-publico/:id", getPerfilPublico);

// RF40: el comprador elimina su cuenta (desactivacion logica, usa req.userId del token)
router.delete("/cuenta", authRequired, eliminarCuentaComprador);

export default router;
