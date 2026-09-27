// Configuracion de multer para el chat interno (RF101).
// Permite subir tanto imagenes como archivos adjuntos (PDF, DOC, XLS, etc.)
// y guarda en el mismo directorio /uploads que ya sirve app.js de forma estatica.
// Limite de 10MB por archivo.
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// Asegura que el directorio de destino exista (multer no lo crea solo).
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const FORMATOS_PERMITIDOS = [
    ".jpg", ".jpeg", ".png", ".webp", ".gif",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".zip", ".rar",
];

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        // Nombre unico: fecha actual + extension original.
        const nombreUnico = Date.now() + path.extname(file.originalname || "").toLowerCase();
        cb(null, nombreUnico);
    },
});

const uploadChat = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        if (!FORMATOS_PERMITIDOS.includes(ext)) {
            return cb(new Error("Formato de archivo no permitido"));
        }
        cb(null, true);
    },
});

export default uploadChat;
