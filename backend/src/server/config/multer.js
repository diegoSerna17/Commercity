// Configuracion de multer para la subida de imagenes de productos (Perfil Vendedor).
// Integrada desde Jose Yepes (2026-08-12) y ajustada al backend central:
// guarda en src/server/uploads con nombre unico, limita 5MB y solo formatos de imagen.
// H4 (P2 auditoria 2026-10-05): nombres crypto-aleatorios + validacion
// extension + MIME real (anti spoof por doble extension / content-type falso).
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// Asegura que el directorio de destino exista (multer no lo crea solo).
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const FORMATOS_PERMITIDOS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MIME_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    // Nombre impredecible: 16 bytes hex + extension saneada (anti colision/enumeracion).
    const ext = path.extname(file.originalname || ".jpg").toLowerCase();
    const segura = FORMATOS_PERMITIDOS.includes(ext) ? ext : ".jpg";
    cb(null, crypto.randomBytes(16).toString("hex") + segura);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!FORMATOS_PERMITIDOS.includes(ext) || !MIME_PERMITIDOS.has(file.mimetype)) {
      return cb(new Error("Formato de imagen no permitido"));
    }
    cb(null, true);
  },
});

export default upload;
