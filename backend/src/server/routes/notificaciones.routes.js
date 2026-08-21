import { Router } from "express";
import { authRequired } from "../middleware/auth.middleware.js";
import {
    listarNotificaciones,
    contarNoLeidas,
    marcarComoLeida,
    marcarTodasLeidas,
    eliminarNotificacion,
    eliminarTodas,
} from "../controllers/notificaciones.controllers.js";

const router = Router();

// Campana de notificaciones (RF99-RF104). Todas las rutas exigen JWT:
// la campana pertenece al usuario autenticado.

// RF100/RF101: listado reciente (con filtro opcional ?tipo= y ?limite=)
router.get("/", authRequired, listarNotificaciones);

// RF104: indicador de no leidas sobre el icono de la campana
router.get("/no-leidas", authRequired, contarNoLeidas);

// Marcar todas como leidas (limpia el indicador RF104)
router.patch("/leidas", authRequired, marcarTodasLeidas);

// Marcar una notificacion como leida
router.patch("/:id/leida", authRequired, marcarComoLeida);

// RF102: limpiar todas las notificaciones de forma masiva
router.delete("/", authRequired, eliminarTodas);

// RF102: eliminar una notificacion individual
router.delete("/:id", authRequired, eliminarNotificacion);

export default router;
