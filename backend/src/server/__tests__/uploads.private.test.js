import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// Mock de mysql2/promise: createPool devuelve un pool simulado (sin BD real).
vi.mock("mysql2/promise", () => ({
  __esModule: true,
  default: { createPool: vi.fn(() => ({ query: vi.fn(), getConnection: vi.fn() })) },
}));

process.env.JWT_SECRET = process.env.JWT_SECRET || "secreto_test";

const { default: app } = await import("../app.js");

// B2 (auditoria 2026-11-04): las evidencias de reportes viven en
// /uploads/reportes/ y exigen JWT; las imagenes de producto de la raiz siguen
// publicas para el catalogo.
describe("Privacidad de /uploads", () => {
  it("una evidencia de reportes sin token responde 401", async () => {
    const res = await request(app).get("/uploads/reportes/evidencia.jpg");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("un archivo no imagen de la raiz sin token responde 401", async () => {
    const res = await request(app).get("/uploads/documento.pdf");
    expect(res.status).toBe(401);
  });

  it("una imagen de producto de la raiz sigue siendo publica (404 si no existe)", async () => {
    const res = await request(app).get("/uploads/producto-inexistente.jpg");
    expect(res.status).toBe(404);
    expect(res.body.error?.code).not.toBe("UNAUTHORIZED");
  });

  it("M-2: una ruta codificada a reportes no se cuela como publica (401)", async () => {
    const res = await request(app).get("/uploads/%72eportes/evidencia.jpg");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("M-2: una imagen en subcarpeta exige JWT (401)", async () => {
    const res = await request(app).get("/uploads/otra-carpeta/foto.jpg");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("M-2: una codificacion invalida responde 400 INVALID_PATH", async () => {
    const res = await request(app).get("/uploads/%zz.jpg");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_PATH");
  });

  it("1.5.9: una barra invertida codificada no se cuela como imagen de la raiz (401)", async () => {
    // En Windows, express.static interpreta "\" como separador: si el filtro lo
    // dejara pasar, /uploads/reportes%5Cx.jpg leeria la evidencia privada.
    const res = await request(app).get("/uploads/reportes%5Cevidencia.jpg");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("M-2: HEAD sobre una imagen publica de la raiz no exige JWT", async () => {
    const res = await request(app).head("/uploads/producto-inexistente.jpg");
    expect(res.status).toBe(404);
    expect(res.body.error?.code).not.toBe("UNAUTHORIZED");
  });
});
