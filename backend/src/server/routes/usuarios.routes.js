import { Router } from "express";
import { getUsuarios, getPerfilPublico } from "../controllers/usuarios.controllers.js";

const router = Router();

router.get("/", getUsuarios);

// Endpoint publico para ver el perfil de otro usuario por su ID
router.get("/perfil-publico/:id", getPerfilPublico);

export default router;
