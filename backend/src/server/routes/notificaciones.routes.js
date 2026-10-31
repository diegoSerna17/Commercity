import { Router } from "express";
import {
    listarNotificaciones,
    contarNoLeidas,
    marcarTodasLeidas,
    marcarLeida,
    eliminarNotificacion,
    eliminarTodas,
} from "../controllers/notificaciones.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authRequired, listarNotificaciones);
router.get("/no-leidas", authRequired, contarNoLeidas);
router.patch("/leidas", authRequired, marcarTodasLeidas);
router.patch("/:id/leida", authRequired, marcarLeida);
router.delete("/", authRequired, eliminarTodas);
router.delete("/:id", authRequired, eliminarNotificacion);

export default router;
