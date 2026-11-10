import { Router } from "express";
import {
    contarSeguidores,
    dejarDeSeguir,
    listarSeguidores,
    listarSiguiendo,
    seguirUsuario,
} from "../controllers/seguidores.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { seguidoresQuerySchema, seguirSchema, seguidorIdParamsSchema } from "../schemas/seguidores.schema.js";

const router = Router();

router.get(
    "/siguiendo",
    authRequired,
    validate(seguidoresQuerySchema, "query"),
    listarSiguiendo
);
router.get(
    "/seguidores",
    authRequired,
    validate(seguidoresQuerySchema, "query"),
    listarSeguidores
);
router.post("/", authRequired, validate(seguirSchema), seguirUsuario);
router.delete(
    "/:id",
    authRequired,
    validate(seguidorIdParamsSchema, "params"),
    dejarDeSeguir
);
// Contadores publicos de un usuario (perfil publico del vendedor).
router.get(
    "/:id/contadores",
    validate(seguidorIdParamsSchema, "params"),
    contarSeguidores
);

export default router;
