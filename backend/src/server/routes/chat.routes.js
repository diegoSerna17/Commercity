import { Router } from "express";
import {
    enviarMensaje,
    listarConversaciones,
    obtenerConversacion,
    marcarMensajeLeido,
} from "../controllers/chat.controllers.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { errorResponse } from "../utils/response.js";

const router = Router();

// ============================================================================
// RUTAS DEL CHAT INTERNO (RF101)
//
// Integracion en el backend oficial (app.js):
//   1. Copiar este archivo a src/server/routes/chat.routes.js
//   2. Importar y montar:
//        import chatRouter from "./routes/chat.routes.js";
//        app.use("/api/chat", chatRouter);
//   La tabla mensajes_chat (6 columnas) esta definida en schema_commercity.sql
//   (hallazgo B2 auditoria 2026-10-06: sin tipo_mensaje/archivo_url).
//   config/multer.chat.js queda DESMONTADO: los adjuntos no tienen columna
//   de persistencia (rama A) y no se aceptan en la ruta.
// ============================================================================

/**
 * H1 (revision del lote 2026-10-06): rechaza el multipart ANTES de multer.
 * Sin la columna archivo_url los adjuntos no se pueden persistir; si multer
 * procesara la peticion, el archivo se escribiria en uploads/ y quedaria
 * huerfano en disco aunque el controller respondiera 400 (llenado de disco
 * a 10MB por peticion sin crear ningun mensaje).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
function rechazarMultipartChat(req, res, next) {
    if (req.is("multipart/*")) {
        return errorResponse(res, "El chat no admite archivos en esta versión", 400);
    }
    return next();
}

// Enviar mensaje de TEXTO (JSON). El multipart se rechaza en la puerta.
router.post("/", authRequired, rechazarMultipartChat, enviarMensaje);

// Listado de conversaciones del usuario autenticado.
router.get("/conversaciones", authRequired, listarConversaciones);

// Historial de mensajes entre el usuario autenticado y otro usuario.
router.get("/mensajes/:usuarioId", authRequired, obtenerConversacion);

// Marcar un mensaje recibido como leido.
router.patch("/mensajes/:id/leido", authRequired, marcarMensajeLeido);

export default router;
