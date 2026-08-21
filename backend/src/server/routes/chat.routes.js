import { Router } from "express";
import { authRequired } from "../middleware/auth.middleware.js";
import {
  enviarMensaje,
  listarConversaciones,
  listarMensajesCon,
  marcarComoLeido,
} from "../controllers/chat.controllers.js";

const router = Router();

// Chat interno (RF105): todo requiere usuario autenticado.
router.post("/mensajes", authRequired, enviarMensaje);
router.get("/conversaciones", authRequired, listarConversaciones);
router.get("/mensajes/:receptorId", authRequired, listarMensajesCon);
router.patch("/mensajes/:id/leido", authRequired, marcarComoLeido);

export default router;
