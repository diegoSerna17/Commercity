import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  detectarFirmaImagen,
  borrarArchivoSubido,
  borrarUploadPorUrl,
  UPLOADS_DIR,
} from "../config/multer.js";

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);
const GIF = Buffer.concat([Buffer.from("GIF89a", "latin1"), Buffer.alloc(16)]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF", "latin1"),
  Buffer.alloc(4),
  Buffer.from("WEBP", "latin1"),
  Buffer.alloc(16),
]);

describe("config/multer.js (TASK-4.6)", () => {
  it("detecta las 4 firmas de imagen soportadas (magic bytes)", () => {
    expect(detectarFirmaImagen(JPEG)).toBe("jpeg");
    expect(detectarFirmaImagen(PNG)).toBe("png");
    expect(detectarFirmaImagen(GIF)).toBe("gif");
    expect(detectarFirmaImagen(WEBP)).toBe("webp");
    // GIF87a tambien es valido
    expect(detectarFirmaImagen(Buffer.concat([Buffer.from("GIF87a", "latin1"), Buffer.alloc(16)]))).toBe("gif");
  });

  it("rechaza contenido que no es imagen, truncado o con cabecera RIFF ajena", () => {
    expect(detectarFirmaImagen(Buffer.from("esto-no-es-una-imagen"))).toBeNull();
    expect(detectarFirmaImagen(Buffer.alloc(4))).toBeNull();
    expect(detectarFirmaImagen(undefined)).toBeNull();
    expect(
      detectarFirmaImagen(Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WAVE"), Buffer.alloc(8)]))
    ).toBeNull();
  });

  it("borrarArchivoSubido ignora archivos sin path (limpieza best-effort)", () => {
    expect(() => borrarArchivoSubido(undefined)).not.toThrow();
    expect(() => borrarArchivoSubido({})).not.toThrow();
  });

  it("borrarUploadPorUrl solo borra nombres propios /uploads/<hex32>.<ext>", () => {
    const unlink = vi.spyOn(fs, "unlink").mockImplementation(() => {});

    borrarUploadPorUrl("/uploads/../../etc/passwd");     // traversal -> ignorado
    borrarUploadPorUrl("https://externo.example/x.jpg"); // externo -> ignorado
    borrarUploadPorUrl("/uploads/no-es-hex.jpg");        // patron ajeno -> ignorado
    borrarUploadPorUrl(undefined);                       // sin url -> ignorado
    expect(unlink).not.toHaveBeenCalled();

    const nombre = "a".repeat(32) + ".jpg";
    borrarUploadPorUrl(`/uploads/${nombre}`);
    expect(unlink).toHaveBeenCalledWith(path.join(UPLOADS_DIR, nombre), expect.any(Function));

    unlink.mockRestore();
  });
});
