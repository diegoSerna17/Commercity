// Configuracion de multer para el chat interno (RF101).
// Permite subir tanto imagenes como archivos adjuntos (PDF, DOC, XLS, etc.)
// y guarda en el mismo directorio /uploads que ya sirve app.js de forma estatica.
// Limite de 10MB por archivo.
// H4 (P2): nombres crypto-aleatorios + validacion extension + MIME.
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// Asegura que el directorio de destino exista (multer no lo crea solo).
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const FORMATOS_PERMITIDOS = [
    ".jpg", ".jpeg", ".png", ".webp", ".gif",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".zip", ".rar",
];
const MIME_PERMITIDOS = new Set([
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "application/zip", "application/x-rar-compressed", "application/vnd.rar",
]);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        // Nombre impredecible: 16 bytes hex + extension saneada.
        const ext = path.extname(file.originalname || "").toLowerCase();
        const segura = FORMATOS_PERMITIDOS.includes(ext) ? ext : ".bin";
        cb(null, crypto.randomBytes(16).toString("hex") + segura);
    },
});

const uploadChat = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        if (!FORMATOS_PERMITIDOS.includes(ext) || !MIME_PERMITIDOS.has(file.mimetype)) {
            return cb(new Error("Formato de archivo no permitido"));
        }
        cb(null, true);
    },
});

export default uploadChat;
