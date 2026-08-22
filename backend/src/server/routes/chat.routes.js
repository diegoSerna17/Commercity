import { Router } from "express";
import {
  enviarMensaje,
  listarConversaciones,
  obtenerConversacion,
  marcarMensajeLeido,
} from "../controllers/chat.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import uploadChat from "../config/multer.chat.js";

const router = Router();

// ============================================================================
// RUTAS DEL CHAT INTERNO (RF105 del documento 20/08)
// Integradas desde Diego Serna (2026-08-21).
// ============================================================================

// Enviar mensaje (texto o archivo via multipart "archivo").
router.post("/", authRequired, uploadChat.single("archivo"), enviarMensaje);

// Listado de conversaciones del usuario autenticado.
router.get("/conversaciones", authRequired, listarConversaciones);

// Historial de mensajes entre el usuario autenticado y otro usuario.
router.get("/mensajes/:usuarioId", authRequired, obtenerConversacion);

// Marcar un mensaje recibido como leido.
router.patch("/mensajes/:id/leido", authRequired, marcarMensajeLeido);

export default router;
