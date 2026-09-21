import { Router } from "express";
import {
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

export default router;
