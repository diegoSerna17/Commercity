import { Router } from "express";
import {
    contarSeguidores,
    dejarDeSeguir,
    listarSeguidores,
    listarSiguiendo,
    seguirUsuario,
} from "../controllers/seguidores.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/siguiendo", authRequired, listarSiguiendo);
router.get("/seguidores", authRequired, listarSeguidores);
router.post("/", authRequired, seguirUsuario);
router.delete("/:id", authRequired, dejarDeSeguir);
// Contadores publicos de un usuario (perfil publico del vendedor).
router.get("/:id/contadores", contarSeguidores);

export default router;
