import { z } from "zod";
import { operaciones } from "./openapi.registry.js";
import { envoltorioOkSchema, envoltorioErrorSchema } from "../schemas/common.schema.js";

// ============================================================================
// Constructor del documento OpenAPI 3.1 desde esquemas Zod (nativo, sin deps).
// Cada esquema con .meta({ id }) se extrae a components.schemas una vez;
// los usos posteriores referencian #/components/schemas/<Id>.
// ============================================================================

const OPCIONES_JSONSCHEMA = { target: "draft-2020-12", io: "input", unrepresentable: "any" };

/**
 * Convierte un esquema Zod y devuelve su JSON Schema raiz + defs.
 * @param {import("zod").ZodType} schema
 * @returns {{ raiz: object, defs: Record<string, object> }}
 */
function convertir(schema) {
  const js = z.toJSONSchema(schema, OPCIONES_JSONSCHEMA);
  const defs = { ...(js.$defs || {}) };
  const raiz = { ...js };
  delete raiz.$defs;
  delete raiz.$schema;
  return { raiz, defs };
}

export function buildOpenApi({ version }) {
  const componentes = {};
  /** @param {import("zod").ZodType} schema @returns {object} $ref o esquema inline */
  const ref = (schema) => {
    const { raiz, defs } = convertir(schema);
    Object.assign(componentes, defs);
    if (raiz.$ref && typeof raiz.$ref === "string") {
      const nombre = raiz.$ref.split("/").pop();
      if (componentes[nombre]) return { $ref: `#/components/schemas/${nombre}` };
    }
    return raiz;
  };

  // Envoltorios uniformes (todos los responses los referencian).
  const refOk = ref(envoltorioOkSchema);
  const refError = ref(envoltorioErrorSchema);

  /** @param {import("zod").ZodType} schema @returns {{ properties: object, required: string[] }} */
  const propsDe = (schema) => {
    const { raiz, defs } = convertir(schema);
    Object.assign(componentes, defs);
    const nombre = raiz.$ref ? raiz.$ref.split("/").pop() : null;
    const obj = nombre && defs[nombre] ? defs[nombre] : raiz;
    return { properties: obj.properties || {}, required: obj.required || [] };
  };

  const paths = {};
  for (const op of operaciones) {
    const item = (paths[op.path] = paths[op.path] || {});
    /** @type {any} */
    const operacion = {
      operationId: op.operationId,
      tags: [op.tag],
      summary: op.summary,
      description: op.description,
      responses: {},
    };
    if (op.auth) {
      operacion.security = [{ bearerAuth: [] }];
    }
    if (op.roles) {
      operacion["x-roles"] = op.roles;
    }
    const parameters = [];
    if (op.params) {
      const { properties, required } = propsDe(op.params);
      for (const [nombre, esquema] of Object.entries(properties)) {
        parameters.push({
          name: nombre,
          in: "path",
          required: required.includes(nombre),
          schema: esquema,
        });
      }
    }
    if (op.query) {
      const { properties, required } = propsDe(op.query);
      for (const [nombre, esquema] of Object.entries(properties)) {
        parameters.push({
          name: nombre,
          in: "query",
          required: required.includes(nombre),
          schema: esquema,
        });
      }
    }
    if (parameters.length > 0) operacion.parameters = parameters;
    if (op.body) {
      if (op.multipart) {
        const { properties } = propsDe(op.body);
        const archivo = { [op.multipart]: { type: "string", format: "binary", description: "Archivo adjunto" } };
        // Objeto: propiedades + archivo. Union (p. ej. CrearReporte):
        // allOf con el $ref del contrato mas el archivo.
        const esquemaMultipart =
          Object.keys(properties).length > 0
            ? { type: "object", properties: { ...properties, ...archivo } }
            : { allOf: [ref(op.body), { type: "object", properties: archivo }] };
        operacion.requestBody = {
          required: true,
          content: { "multipart/form-data": { schema: esquemaMultipart } },
        };
      } else {
        operacion.requestBody = {
          required: true,
          content: { "application/json": { schema: ref(op.body) } },
        };
      }
    }
    for (const [codigo, resp] of Object.entries(op.responses)) {
      const esOk = String(codigo).startsWith("2");
      operacion.responses[codigo] = {
        description: resp.description,
        content: {
          "application/json": { schema: esOk ? refOk : refError },
        },
      };
    }
    item[op.method] = operacion;
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "CommerCity API",
      version,
      description:
        "API REST de la plataforma CommerCity (comprador, vendedor, administrador). " +
        "Contratos de entrada generados desde esquemas Zod; respuestas con envoltorio uniforme { success, data }.",
    },
    servers: [{ url: "http://localhost:3000", description: "Desarrollo local" }],
    tags: [
      { name: "Base", description: "Verificacion del servidor" },
      { name: "Usuarios", description: "Registro, login, perfil y recuperacion (RF2, RF40)" },
      { name: "Productos", description: "Catalogo publico y gestion del vendedor (RF45-RF49, RF54, RF78-RF94)" },
      { name: "Pedidos", description: "Resumen, checkout ACID y estados (RF35, RF113-RF118, RF134)" },
      { name: "Carrito", description: "Carrito persistente del comprador" },
      { name: "Tienda", description: "Cuenta bancaria, ventas e ingresos del vendedor (RF119-RF123, RF130-RF139)" },
      { name: "Historial", description: "Historial de compras y cancelaciones (RF26-RF32, RF135)" },
      { name: "Chat", description: "Chat interno comprador-vendedor (RF101)" },
      { name: "Notificaciones", description: "Notificaciones internas" },
      { name: "Calificaciones", description: "Calificacion de vendedores (RF107)" },
      { name: "Seguidores", description: "Seguir/dejar de seguir y perfiles publicos (RF106, RF110)" },
      { name: "Reportes", description: "Reportes de contenido (RF60-RF66)" },
      { name: "Admin", description: "Panel de administracion (RF55-RF76, rol administrador)" },
    ],
    paths,
    components: {
      schemas: componentes,
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "JWT Bearer emitido por POST /api/usuarios/login" },
      },
    },
  };
}
