// Configuracion de multer para la subida de imagenes (productos y evidencias).
// Integrada desde Jose Yepes (2026-08-12) y ajustada al backend central.
//
// H4 (P2 auditoria 2026-10-05): nombres crypto-aleatorios + validacion
// extension + MIME declarado.
// H4/TASK-4.6 (auditoria 2026-10-11): ademas se validan los MAGIC BYTES reales
// del contenido (JPEG/PNG/WEBP/GIF) con una funcion propia sin dependencias,
// solo se escribe en disco lo que ya paso la validacion (sin huerfanos), los
// errores de subida responden 400/413 y hay un cupo de subidas por usuario.
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// UPLOADS_DIR: por defecto src/server/uploads (servido por app.js). Las pruebas
// pueden redirigirlo con la variable de entorno para no ensuciar el arbol.
export const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, "..", "uploads");

// Asegura que el directorio de destino exista (multer no lo crea solo).
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const FORMATOS_PERMITIDOS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MIME_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** Extensiones validas por firma real detectada. */
const EXTENSIONES_POR_FIRMA = {
  jpeg: [".jpg", ".jpeg"],
  png: [".png"],
  webp: [".webp"],
  gif: [".gif"],
};

/** Extension canonica con la que se guarda cada firma. */
const EXTENSION_CANONICA = { jpeg: ".jpg", png: ".png", webp: ".webp", gif: ".gif" };

/** Limite de subidas por usuario (ventana movil de 1 hora). */
const LIMITE_SUBIDAS_POR_USUARIO = 20;
const VENTANA_SUBIDAS_MS = 60 * 60 * 1000;
const subidasPorUsuario = new Map();

/**
 * Detecta la firma real (magic bytes) de una imagen. Funcion propia, sin
 * dependencias (SEC-002). Soporta JPEG, PNG, WEBP y GIF.
 * @param {Buffer|undefined} buffer
 * @returns {"jpeg"|"png"|"webp"|"gif"|null}
 */
export function detectarFirmaImagen(buffer) {
  if (!buffer || buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return "png";
  }
  // GIF: "GIF87a" | "GIF89a"
  const cabecera6 = buffer.subarray(0, 6).toString("latin1");
  if (cabecera6 === "GIF87a" || cabecera6 === "GIF89a") return "gif";
  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
    buffer.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

/**
 * Borra un archivo subido (limpieza de huerfanos cuando el cuerpo es invalido).
 * @param {{path?: string}|undefined} file
 */
export function borrarArchivoSubido(file) {
  if (!file?.path) return;
  fs.unlink(file.path, () => {
    // best effort: si ya no existe no hay nada que hacer
  });
}

/**
 * Borra la imagen local referenciada por una URL /uploads/<nombre> si el
 * nombre tiene el patron de los archivos que genera esta configuracion
 * (anti path traversal: solo se aceptan nombres propios).
 * @param {string|undefined} url
 */
export function borrarUploadPorUrl(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/")) return;
  const nombre = path.basename(url);
  if (!/^[a-f0-9]{32}\.(jpg|png|webp|gif)$/i.test(nombre)) return;
  fs.unlink(path.join(UPLOADS_DIR, nombre), () => {
    // best effort
  });
}

/**
 * Cupo de subidas por usuario autenticado (ademas del limite por IP de app.js).
 * En NODE_ENV=test se desactiva para no romper la suite.
 */
function limitarSubidasPorUsuario(req, res, next) {
  if (process.env.NODE_ENV === "test") return next();
  const ahora = Date.now();
  const registro = subidasPorUsuario.get(req.userId);
  if (!registro || ahora > registro.reinicia) {
    subidasPorUsuario.set(req.userId, { total: 1, reinicia: ahora + VENTANA_SUBIDAS_MS });
    return next();
  }
  registro.total += 1;
  if (registro.total > LIMITE_SUBIDAS_POR_USUARIO) {
    return res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "Límite de subidas por usuario alcanzado. Intenta de nuevo más tarde.",
      },
    });
  }
  return next();
}

const upload = multer({
  // H4/TASK-4.6: el archivo queda en memoria hasta validar contenido; NADA se
  // escribe en disco si no pasa la validacion (sin huerfanos).
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!FORMATOS_PERMITIDOS.includes(ext) || !MIME_PERMITIDOS.has(file.mimetype)) {
      const err = new Error("Formato de imagen no permitido");
      err.httpStatus = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

/**
 * Middleware de subida para un campo multipart:
 *  1. limita las subidas por usuario,
 *  2. recibe el archivo en memoria,
 *  3. valida extension+MIME y MAGIC BYTES reales,
 *  4. solo entonces lo escribe en uploads/ con nombre crypto-aleatorio.
 * Errores: 413 si excede 5 MB, 400 si el contenido no es una imagen valida.
 * @param {string} campo nombre del campo multipart (p. ej. "imagen")
 * @returns {import("express").RequestHandler[]}
 */
export const subirImagen = (campo) => [
  limitarSubidasPorUsuario,
  (req, res, next) => {
    upload.single(campo)(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            success: false,
            error: { code: "PAYLOAD_TOO_LARGE", message: "La imagen supera el límite de 5 MB" },
          });
        }
        return res.status(400).json({
          success: false,
          error: { code: "UPLOAD_INVALIDO", message: err.message || "Archivo inválido" },
        });
      }

      if (!req.file?.buffer) return next();

      const firma = detectarFirmaImagen(req.file.buffer);
      const ext = path.extname(req.file.originalname || "").toLowerCase();
      if (!firma || !EXTENSIONES_POR_FIRMA[firma].includes(ext)) {
        // El contenido no corresponde a una imagen valida (o no coincide con
        // su extension): no se escribe nada en disco.
        return res.status(400).json({
          success: false,
          error: {
            code: "UPLOAD_INVALIDO",
            message: "El archivo no es una imagen válida (contenido y extensión no coinciden)",
          },
        });
      }

      const nombreArchivo = crypto.randomBytes(16).toString("hex") + EXTENSION_CANONICA[firma];
      const destino = path.join(UPLOADS_DIR, nombreArchivo);
      fs.writeFile(destino, req.file.buffer, (errorEscritura) => {
        if (errorEscritura) return next(errorEscritura);
        req.file.filename = nombreArchivo;
        req.file.path = destino;
        return next();
      });
    });
  },
];

export default upload;
