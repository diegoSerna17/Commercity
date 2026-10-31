import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildOpenApi } from "../src/server/docs/openapi.builder.js";
import { operaciones } from "../src/server/docs/openapi.registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = join(__dirname, "..");
const rootDir = join(backendDir, "..");

// Version unica: backend/package.json (sincronizada con VERSION a 1.3.0).
const { version } = JSON.parse(readFileSync(join(backendDir, "package.json"), "utf8"));
const doc = buildOpenApi({ version });

// ── Validacion estructural (falla con exit 1) ──
const errores = [];
if (doc.openapi !== "3.1.0") errores.push(`openapi debe ser 3.1.0 (es ${doc.openapi})`);
const numPaths = Object.keys(doc.paths).length;
const numOps = Object.values(doc.paths).reduce((n, item) => n + Object.keys(item).length, 0);
// Actualizar SOLO al agregar/quitar rutas de forma intencional (guard anti-drift).
const OPERACIONES_ESPERADAS = 74; // + logout-todas (TASK-4.3) + /health (TASK-8.4)
if (operaciones.length !== OPERACIONES_ESPERADAS) errores.push(`el registro debe tener ${OPERACIONES_ESPERADAS} operaciones (tiene ${operaciones.length})`);
if (numOps !== OPERACIONES_ESPERADAS) errores.push(`el documento debe tener ${OPERACIONES_ESPERADAS} operaciones (tiene ${numOps}, ${numPaths} paths)`);
const ids = new Set();
for (const op of operaciones) {
  if (!op.operationId || !op.summary || !op.responses || Object.keys(op.responses).length === 0) {
    errores.push(`operacion incompleta: ${op.method} ${op.path}`);
  }
  if (ids.has(op.operationId)) errores.push(`operationId duplicado: ${op.operationId}`);
  ids.add(op.operationId);
}
// Todo $ref interno debe resolver en components.schemas.
const texto = JSON.stringify(doc);
const refs = [...texto.matchAll(/#\/components\/schemas\/([A-Za-z0-9_]+)/g)].map((m) => m[1]);
for (const r of new Set(refs)) {
  if (!doc.components.schemas[r]) errores.push(`$ref sin resolver: ${r}`);
}
if (errores.length > 0) {
  for (const e of errores) console.error(`[docs:api] ERROR: ${e}`);
  process.exit(1);
}

const salida = join(rootDir, "docs", "api", "openapi.json");
mkdirSync(dirname(salida), { recursive: true });
writeFileSync(salida, JSON.stringify(doc, null, 2) + "\n");
console.log(
  `[docs:api] openapi.json v${version}: ${numPaths} paths, ${numOps} operaciones, ${Object.keys(doc.components.schemas).length} esquemas.`
);
