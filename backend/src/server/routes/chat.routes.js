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
//   La tabla mensajes_chat ya existe en base.sql (no requiere migracion).
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
