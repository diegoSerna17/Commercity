import { describe, it, expect } from "vitest";

// Smoke de los contratos Zod y del generador OpenAPI: importa TODOS los
// esquemas (los ejercita como codigo, no solo como datos) y construye el
// documento desde el registro. Mantiene viva la cobertura de `schemas/` y
// `docs/` (TASK-1.2/CON-004).
import * as common from "../schemas/common.schema.js";
import * as auth from "../schemas/auth.schemas.js";
import * as usuarios from "../schemas/usuarios.schema.js";
import * as productos from "../schemas/productos.schema.js";
import * as pedidos from "../schemas/pedidos.schema.js";
import * as carrito from "../schemas/carrito.schema.js";
import * as compras from "../schemas/compras.schema.js";
import * as tienda from "../schemas/tienda.schema.js";
import * as chat from "../schemas/chat.schema.js";
import * as notificaciones from "../schemas/notificaciones.schema.js";
import * as calificaciones from "../schemas/calificaciones.schema.js";
import * as seguidores from "../schemas/seguidores.schema.js";
import * as reportes from "../schemas/reportes.schema.js";
import * as admin from "../schemas/admin.schema.js";
import * as cuentaBancaria from "../schemas/cuentaBancaria.schema.js";
import { operaciones } from "../docs/openapi.registry.js";
import { buildOpenApi } from "../docs/openapi.builder.js";

const MODULOS = {
  common, auth, usuarios, productos, pedidos, carrito, compras, tienda,
  chat, notificaciones, calificaciones, seguidores, reportes, admin, cuentaBancaria,
};

describe("contratos Zod y registro OpenAPI (smoke)", () => {
  it("todos los esquemas exportados son Zod y no lanzan al parsear entradas invalidas", () => {
    let revisados = 0;
    for (const exportaciones of Object.values(MODULOS)) {
      for (const valor of Object.values(exportaciones)) {
        if (valor && typeof valor.safeParse === "function") {
          expect(() => valor.safeParse(undefined)).not.toThrow();
          revisados += 1;
        }
      }
    }
    // Los 15 modulos exponen > 30 contratos Zod en total.
    expect(revisados).toBeGreaterThan(30);
  });

  it("el documento OpenAPI se construye desde el registro con las 74 operaciones", () => {
    const doc = buildOpenApi({ version: "0.0.0-test" });

    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info.version).toBe("0.0.0-test");
    const numOps = Object.values(doc.paths).reduce((n, item) => n + Object.keys(item).length, 0);
    expect(numOps).toBe(operaciones.length);
    expect(numOps).toBe(74);

    // Endpoints clave del lote
    expect(doc.paths["/health"].get.operationId).toBe("healthCheck");
    expect(doc.paths["/api/usuarios/logout-todas"].post).toBeTruthy();
    // Multipart documentado (productos) y query paginada (chat)
    expect(doc.paths["/api/productos"].post.requestBody.content["multipart/form-data"]).toBeTruthy();
    expect(
      doc.paths["/api/chat/mensajes/{usuarioId}"].get.parameters.some((p) => p.name === "pagina")
    ).toBe(true);
    // Seguridad declarada donde aplica
    expect(doc.paths["/api/usuarios/me"].get.security).toEqual([{ bearerAuth: [] }]);
  });
});
