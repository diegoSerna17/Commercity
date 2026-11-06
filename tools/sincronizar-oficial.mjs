#!/usr/bin/env node
/**
 * tools/sincronizar-oficial.mjs
 * Prepara la version FUNCIONAL del proyecto para el repositorio oficial
 * (remoto `commercycity`, rama PREVIEW) sin reescribir historial: crea una
 * rama `sync/oficial-AAAA-MM-DD` desde la punta oficial, mergea la rama
 * completa y borra en la punta todo lo que no es codigo ejecutable.
 *
 * Nunca hace push. Los tests y el PR se ejecutan despues, a mano.
 *
 * Uso:
 *   node tools/sincronizar-oficial.mjs [rama] [--dry-run]
 *   rama por defecto: PREVIEW
 */
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REMOTO = "commercycity";
const RAMA_OFICIAL = `${REMOTO}/PREVIEW`;

// Unica lista de exclusiones del repositorio oficial. Todo lo que cuelga de
// estas rutas se borra en la punta del merge; `docs/api/` es la unica
// excepcion porque la sirve el backend y la valida el CI.
const EXCLUIR = ["plan", "CONTRIBUTING.md", "SECURITY.md", "docs"];
const MANTENER = ["docs/api"];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const rama = args.find((a) => !a.startsWith("--")) ?? "PREVIEW";

function git(...a) {
  return execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function gitPermiteFallo(...a) {
  try {
    return {
      ok: true,
      out: execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(),
    };
  } catch (e) {
    return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}`.trim() };
  }
}

function abortar(msg) {
  console.error(`SYNC: ${msg}`);
  process.exit(1);
}

function estaExcluida(ruta) {
  const excluida = EXCLUIR.some((p) => ruta === p || ruta.startsWith(`${p}/`));
  const permitida = MANTENER.some((p) => ruta === p || ruta.startsWith(`${p}/`));
  return excluida && !permitida;
}

// Colapsa cientos de archivos a sus entradas de primer nivel para que `git rm`
// reciba una lista corta (Windows limita la linea de comandos).
const DIRECTORIOS = ["plan", "docs"];
function aEntradasDeBorrado(rutas) {
  const entradas = new Set();
  for (const ruta of rutas) {
    const raiz = DIRECTORIOS.find((d) => ruta.startsWith(`${d}/`));
    entradas.add(raiz ?? ruta);
  }
  return [...entradas].sort();
}

function rutasDeArbol(ref) {
  return git("ls-tree", "-r", "--name-only", ref).split("\n").filter(Boolean);
}

// 1. Arbol limpio y rama completa existente.
const sucio = git("status", "--porcelain");
if (sucio) {
  abortar(`el arbol tiene cambios sin commitear:\n${sucio}\nCommit o descarta antes de sincronizar.`);
}
if (!gitPermiteFallo("rev-parse", "--verify", `refs/heads/${rama}`).ok) {
  abortar(`la rama local ${rama} no existe`);
}

// 2. Traer la punta oficial.
console.log(`SYNC: git fetch ${REMOTO}`);
git("fetch", REMOTO);

const base = git("rev-parse", "--short", RAMA_OFICIAL);
const origen = git("rev-parse", "--short", rama);
const hoy = new Date();
const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
const ramaSync = `sync/oficial-${fecha}`;

if (gitPermiteFallo("rev-parse", "--verify", `refs/heads/${ramaSync}`).ok) {
  abortar(`la rama ${ramaSync} ya existe: renombrala o borrala antes de volver a sincronizar`);
}

// 3. Calcular que se borra (union de la punta oficial y la rama completa).
const enArbol = new Set([...rutasDeArbol(RAMA_OFICIAL), ...rutasDeArbol(rama)]);
const excluidas = [...enArbol].filter(estaExcluida);
const borrados = aEntradasDeBorrado(excluidas);
const conservadas = [...enArbol].filter((r) => !estaExcluida(r));
const tieneOpenapi = conservadas.includes("docs/api/openapi.json");

console.log(`SYNC: base oficial ${RAMA_OFICIAL} = ${base}`);
console.log(`SYNC: rama completa ${rama} = ${origen}`);
console.log(`SYNC: excluir ${excluidas.length} rutas en ${borrados.length} entradas: ${borrados.join(", ")}`);
console.log(`SYNC: conservar ${conservadas.length} archivos; docs/api/openapi.json: ${tieneOpenapi ? "si" : "NO"}`);

if (!tieneOpenapi) abortar("docs/api/openapi.json no aparece en la rama completa; revisa MANTENER");

if (dryRun) {
  console.log(`SYNC: dry-run OK, no se crea rama ni merge`);
  console.log(`SYNC: rama que se crearia: ${ramaSync} (desde ${RAMA_OFICIAL})`);
  console.log(`SYNC: commit previsto: chore(sync): version funcional desde ${origen}`);
  process.exit(0);
}

// 4. Rama de trabajo desde la punta oficial y merge completo sin commit.
console.log(`SYNC: creando ${ramaSync} desde ${RAMA_OFICIAL}`);
git("switch", "-c", ramaSync, RAMA_OFICIAL);

console.log(`SYNC: git merge --no-ff --no-commit ${rama}`);
const merge = gitPermiteFallo("merge", "--no-ff", "--no-commit", rama);
if (!gitPermiteFallo("rev-parse", "-q", "--verify", "MERGE_HEAD").ok) {
  abortar(`el merge no se inicio:\n${merge.out}`);
}
if (!merge.ok) {
  console.log("SYNC: el merge dejo conflictos; se resuelven como borrado las rutas excluidas");
}

// 5. Borrar en la punta lo que no es funcional (resuelve los modify/delete).
const enIndice = git("ls-files").split("\n").filter(Boolean);
const aBorrar = aEntradasDeBorrado([...new Set([...enIndice, ...rutasDeArbol(rama)])].filter(estaExcluida));
if (aBorrar.length > 0) {
  console.log(`SYNC: git rm -r --ignore-unmatch -- ${aBorrar.join(" ")}`);
  const rm = gitPermiteFallo("rm", "-r", "-f", "--ignore-unmatch", "--", ...aBorrar);
  if (!rm.ok) {
    gitPermiteFallo("merge", "--abort");
    abortar(`no se pudo borrar la documentacion:\n${rm.out}`);
  }
}

// 6. Abortar si quedan conflictos en archivos funcionales.
const conflictos = gitPermiteFallo("diff", "--name-only", "--diff-filter=U", "--").out;
if (conflictos) {
  gitPermiteFallo("merge", "--abort");
  abortar(`quedan conflictos en archivos funcionales:\n${conflictos}\nMerge abortado; resuelve a mano en una rama de trabajo.`);
}

// 7. Validar el resultado antes de commitear.
const finales = git("ls-files").split("\n").filter(Boolean);
const sobran = finales.filter(estaExcluida);
if (sobran.length > 0) {
  gitPermiteFallo("merge", "--abort");
  abortar(`quedaron rutas excluidas en el indice:\n${sobran.slice(0, 20).join("\n")}`);
}
if (!finales.includes("docs/api/openapi.json")) {
  gitPermiteFallo("merge", "--abort");
  abortar("falta docs/api/openapi.json en la rama sincronizada");
}

// 8. Commit (sin push).
git("commit", "-m", `chore(sync): version funcional desde ${origen}`);
const commit = git("rev-parse", "--short", "HEAD");

console.log(`SYNC: commit ${commit} en ${ramaSync}`);
console.log(`SYNC: ${finales.length} archivos versionados (${excluidas.length} rutas excluidas)`);
console.log(`SYNC: siguiente paso, revisar y publicar a mano:`);
console.log(`  git diff --stat ${RAMA_OFICIAL}...HEAD`);
console.log(`  git push ${REMOTO} ${ramaSync}`);
console.log(`SYNC: no se hizo push`);
