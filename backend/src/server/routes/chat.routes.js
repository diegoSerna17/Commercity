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
// RUTAS DEL CHAT INTERNO (RF101)
//
// Integracion en el backend oficial (app.js):
//   1. Copiar este archivo a src/server/routes/chat.routes.js
//   2. Copiar config/multer.chat.js a src/server/config/multer.chat.js
//   3. Importar y montar:
//        import chatRouter from "./routes/chat.routes.js";
//        app.use("/api/chat", chatRouter);
//   La tabla mensajes_chat (6 columnas) esta definida en schema_commercity.sql
//   (hallazgo B2 auditoria 2026-10-06: sin tipo_mensaje/archivo_url; los
//   adjuntos se rechazan con 400 en enviarMensaje).
// ============================================================================

// Enviar mensaje de TEXTO (los multipart se parsean para dar un error claro;
// sin los adjuntos no hay persistencia posible, ver enviarMensaje).
router.post("/", authRequired, uploadChat.single("archivo"), enviarMensaje);

// Listado de conversaciones del usuario autenticado.
router.get("/conversaciones", authRequired, listarConversaciones);

// Historial de mensajes entre el usuario autenticado y otro usuario.
router.get("/mensajes/:usuarioId", authRequired, obtenerConversacion);

// Marcar un mensaje recibido como leido.
router.patch("/mensajes/:id/leido", authRequired, marcarMensajeLeido);

export default router;
