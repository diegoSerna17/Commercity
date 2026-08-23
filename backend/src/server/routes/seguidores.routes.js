import { Router } from "express";
import {
  seguirUsuario,
  dejarDeSeguir,
  listarSiguiendo,
  listarSeguidores,
} from "../controllers/seguidores.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";

const router = Router();

// ============================================================================
// RUTAS DE SEGUIDORES (seguir / dejar de seguir usuarios)
// ============================================================================

// Las rutas fijas van antes de "/:id" para que no choquen con el parametro.
router.get("/siguiendo", authRequired, listarSiguiendo);
router.get("/seguidores", authRequired, listarSeguidores);
router.post("/", authRequired, seguirUsuario);
router.delete("/:id", authRequired, dejarDeSeguir);

export default router;
