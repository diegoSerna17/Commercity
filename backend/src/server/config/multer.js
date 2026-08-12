// Configuracion de multer para la subida de imagenes de productos (Perfil Vendedor).
// Integrada desde Jose Yepes (2026-08-12) y ajustada al backend central:
// guarda en src/server/uploads con nombre unico, limita 5MB y solo formatos de imagen.
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// Asegura que el directorio de destino exista (multer no lo crea solo).
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const FORMATOS_PERMITIDOS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    // Nombre unico: fecha actual + extension original (.jpg, .png, etc.)
    const nombreUnico = Date.now() + path.extname(file.originalname || ".jpg").toLowerCase();
    cb(null, nombreUnico);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!FORMATOS_PERMITIDOS.includes(ext)) {
      return cb(new Error("Formato de imagen no permitido"));
    }
    cb(null, true);
  },
});

export default upload;
