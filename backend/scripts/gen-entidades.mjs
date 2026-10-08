import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { operaciones } from "../src/server/docs/openapi.registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const salida = join(__dirname, "..", "..", "docs", "api", "entidades.md");

const archivos = [
  "common.schema.js",
  "auth.schemas.js",
  "cuentaBancaria.schema.js",
  "usuarios.schema.js",
  "productos.schema.js",
  "pedidos.schema.js",
  "carrito.schema.js",
  "tienda.schema.js",
  "compras.schema.js",
  "chat.schema.js",
  "notificaciones.schema.js",
  "calificaciones.schema.js",
  "seguidores.schema.js",
  "reportes.schema.js",
  "admin.schema.js",
];

// ── Usos por endpoint (identidad de objeto, mismo modulo que el registry) ──
const usos = new Map();
for (const op of operaciones) {
  const etiqueta = `${op.method.toUpperCase()} ${op.path}`;
  for (const s of [op.params, op.query, op.body]) {
    if (!s) continue;
    if (!usos.has(s)) usos.set(s, []);
    usos.get(s).push(etiqueta);
  }
}

const OPTS = { target: "draft-2020-12", io: "input", unrepresentable: "any" };

function tipoDe(js) {
  if (!js || typeof js !== "object") return "—";
  if (js.$ref) return `ref: ${js.$ref.split("/").pop()}`;
  if (js.oneOf) return `uno de (${js.oneOf.length} variantes)`;
  if (js.anyOf) return `cualquiera de (${js.anyOf.length} variantes)`;
  if (js.enum) return `enum: ${js.enum.map((v) => JSON.stringify(v)).join(" \\| ")}`;
  if (js.const !== undefined) return `const: ${JSON.stringify(js.const)}`;
  let t = js.type || "—";
  if (js.format) t += ` (${js.format})`;
  const extras = [];
  if (js.minimum !== undefined) extras.push(`min ${js.minimum}`);
  if (js.maximum !== undefined) extras.push(`max ${js.maximum}`);
  if (js.exclusiveMinimum !== undefined) extras.push(`> ${js.exclusiveMinimum}`);
  if (js.minLength !== undefined) extras.push(`longitud >= ${js.minLength}`);
  if (js.maxLength !== undefined) extras.push(`longitud <= ${js.maxLength}`);
  if (extras.length > 0) t += ` [${extras.join(", ")}]`;
  return t;
}

function raizDe(schema) {
  const js = z.toJSONSchema(schema, OPTS);
  const defs = js.$defs || {};
  const raiz = { ...js };
  delete raiz.$defs;
  delete raiz.$schema;
  if (raiz.$ref) {
    const nombre = raiz.$ref.split("/").pop();
    if (defs[nombre]) return { obj: defs[nombre], nombre };
  }
  return { obj: raiz, nombre: null };
}

const vistos = new Set();
const secciones = [];

for (const archivo of archivos) {
  const mod = await import(`../src/server/schemas/${archivo}`);
  for (const [nombre, schema] of Object.entries(mod)) {
    if (!(schema instanceof z.ZodType)) continue;
    if (vistos.has(schema)) continue;
    vistos.add(schema);
    const { obj, nombre: id } = raizDe(schema);
    const titulo = obj.title || nombre;
    const lineas = [];
    lineas.push(`## ${titulo} (\`${id || nombre}\`)`);
    lineas.push("");
    if (obj.description) {
      lineas.push(`> ${obj.description}`);
      lineas.push("");
    }
    lineas.push(`- **Fuente:** \`backend/src/server/schemas/${archivo}\``);
    const listaUsos = usos.get(schema) || [];
    lineas.push(`- **Usado en:** ${listaUsos.length > 0 ? listaUsos.map((u) => `\`${u}\``).join(", ") : "envoltorio comun / base"}`);
    lineas.push("");
    if (obj.properties) {
      const requeridos = new Set(obj.required || []);
      lineas.push("| Campo | Tipo | Requerido | Descripcion |");
      lineas.push("|---|---|---|---|");
      for (const [campo, js] of Object.entries(obj.properties)) {
        const desc = (js.description || "").replace(/\|/g, "\\|");
        lineas.push(`| \`${campo}\` | ${tipoDe(js)} | ${requeridos.has(campo) ? "si" : "no"} | ${desc} |`);
      }
      lineas.push("");
    } else if (obj.oneOf) {
      lineas.push(`Union discriminada con ${obj.oneOf.length} variantes (ver \`openapi.json#/components/schemas/${id}\`).`);
      lineas.push("");
    }
    if (obj.examples) {
      lineas.push("**Ejemplo:**");
      lineas.push("");
      lineas.push("```json");
      lineas.push(JSON.stringify(obj.examples[0], null, 2));
      lineas.push("```");
      lineas.push("");
    }
    secciones.push({ archivo, titulo, texto: lineas.join("\n") });
  }
}

const porArchivo = new Map();
for (const s of secciones) {
  if (!porArchivo.has(s.archivo)) porArchivo.set(s.archivo, []);
  porArchivo.get(s.archivo).push(s);
}

const md = [];
md.push("# Contratos de datos — CommerCity");
md.push("");
md.push("> Generado con `npm run docs:api` + `npm run docs:entidades` desde `backend/src/server/schemas/`. No editar a mano.");
md.push(`> ${secciones.length} contratos documentados. Fuente de verdad: los esquemas Zod.`);
md.push("");
md.push("## Indice");
md.push("");
for (const s of secciones) {
  const ancla = s.titulo.toLowerCase().replace(/[^a-z0-9áéíóúñü ]/gi, "").trim().replace(/\s+/g, "-");
  md.push(`- [${s.titulo}](#${ancla})`);
}
md.push("");
for (const [archivo, items] of porArchivo) {
  void archivo;
  for (const s of items) {
    md.push(s.texto);
  }
}
mkdirSync(dirname(salida), { recursive: true });
writeFileSync(salida, md.join("\n").replace(/\n{3,}/g, "\n\n") + "\n");
console.log(`[docs:entidades] entidades.md: ${secciones.length} contratos.`);
