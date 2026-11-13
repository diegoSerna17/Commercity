#!/usr/bin/env node
/**
 * C2 (plan 1.5.5): verificacion del entorno local SIN mostrar valores.
 *
 * Uso (desde backend/):
 *   npm run env:check            # revisa variables y avisos
 *   npm run env:check -- --db    # ademas prueba SELECT 1 (timeout 5 s)
 *
 * Reglas:
 *   - Nunca imprime el valor de una variable: solo presente/ausente/invalida,
 *     el motivo y, para --db, el codigo de error (nunca la cadena de conexion).
 *   - Las validaciones siguen a utils/config.js y config/db.js:
 *       JWT_SECRET >= 32 caracteres y distinto de los valores de ejemplo;
 *       DB_USER/DB_PASSWORD no pueden ser root sin clave fuera de test;
 *       JWT_EXPIRES_IN con formato de jsonwebtoken (30m, 24h, 7d);
 *       CRYPTO_SECRET_KEY obligatoria en produccion.
 *   - Avisos de correo (P4): sin RESEND_API_KEY el correo es simulado; con
 *     RESEND_FROM en resend.dev Resend solo entrega al dueño de la cuenta.
 *   - Sale con codigo 1 si hay variables invalidas o ausentes obligatorias.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import {
  LONGITUD_MINIMA_SECRET,
  VALORES_DE_EJEMPLO,
} from "../src/server/utils/secretos.js";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RUTA_ENV = path.resolve(AQUI, "..", ".env");
const PATRON_EXPIRACION = /^\d+[smhd]$/;

const hayValor = (valor) => String(valor ?? "").length > 0;

/**
 * Evalua las variables de un objeto de entorno (normalmente process.env).
 * No lee el .env ni imprime nada: es la parte pura y testeable del script.
 * @param {Record<string, string|undefined>} entorno Variables a revisar.
 * @returns {{filas: Array<{nombre: string, estado: string, detalle: string, requerida: boolean}>, avisos: string[], errores: string[]}}
 */
export function evaluarEntorno(entorno = {}) {
  const filas = [];
  const avisos = [];
  const errores = [];

  const agregar = (nombre, estado, detalle = "", requerida = true) => {
    filas.push({ nombre, estado, detalle, requerida });
    if (estado === "inválida" || (estado === "ausente" && requerida)) {
      errores.push(nombre);
    }
  };

  const produccion = entorno.NODE_ENV === "production";
  const dbUser = String(entorno.DB_USER ?? "");
  const dbPassword = String(entorno.DB_PASSWORD ?? "");
  const rootSinClave = (!dbUser || dbUser === "root") && !dbPassword;
  // M-7 (auditoria backend 1.5.5): NODE_ENV es obligatorio y solo admite los
  // tres entornos del proyecto; sin el, el servidor arranca como desarrollo.
  const nodeEnv = String(entorno.NODE_ENV ?? "").trim();
  const nodeEnvValido = ["development", "test", "production"].includes(nodeEnv);

  agregar("DB_HOST", hayValor(entorno.DB_HOST) ? "presente" : "ausente");
  agregar("DB_PORT", hayValor(entorno.DB_PORT) ? "presente" : "ausente");
  agregar(
    "DB_USER",
    rootSinClave ? "inválida" : hayValor(dbUser) ? "presente" : "ausente",
    rootSinClave ? "root sin clave: db.js aborta fuera de test" : ""
  );
  agregar(
    "DB_PASSWORD",
    rootSinClave ? "inválida" : hayValor(dbPassword) ? "presente" : "ausente",
    rootSinClave ? "root sin clave: db.js aborta fuera de test" : ""
  );
  agregar("DB_NAME", hayValor(entorno.DB_NAME) ? "presente" : "ausente");
  if (hayValor(entorno.DB_NAME) && entorno.DB_NAME !== "commercity_dev") {
    avisos.push(
      "DB_NAME no es commercity_dev: para pruebas locales se espera la base desechable commercity_dev."
    );
  }

  const jwt = String(entorno.JWT_SECRET ?? "");
  if (!hayValor(jwt)) {
    agregar("JWT_SECRET", "ausente");
  } else if (VALORES_DE_EJEMPLO.has(jwt.toLowerCase())) {
    agregar("JWT_SECRET", "inválida", "no puede ser un valor de ejemplo");
  } else if (jwt.length < LONGITUD_MINIMA_SECRET) {
    agregar("JWT_SECRET", "inválida", `debe tener >= ${LONGITUD_MINIMA_SECRET} caracteres`);
  } else {
    agregar("JWT_SECRET", "presente", `>= ${LONGITUD_MINIMA_SECRET} caracteres`);
  }

  const expiracion = String(entorno.JWT_EXPIRES_IN ?? "").trim();
  if (!expiracion) {
    agregar("JWT_EXPIRES_IN", "ausente", "opcional, default 24h", false);
  } else if (!PATRON_EXPIRACION.test(expiracion)) {
    agregar("JWT_EXPIRES_IN", "inválida", "formato esperado: 30m, 24h, 7d");
  } else {
    agregar("JWT_EXPIRES_IN", "presente");
  }

  agregar("FRONTEND_URL", hayValor(entorno.FRONTEND_URL) ? "presente" : "ausente");

  const cryptoKey = String(entorno.CRYPTO_SECRET_KEY ?? "");
  const cryptoDebil =
    hayValor(cryptoKey) &&
    (VALORES_DE_EJEMPLO.has(cryptoKey.toLowerCase()) ||
      cryptoKey.length < LONGITUD_MINIMA_SECRET);
  if (!hayValor(cryptoKey)) {
    if (produccion) {
      agregar("CRYPTO_SECRET_KEY", "ausente", "obligatoria en produccion");
    } else {
      agregar(
        "CRYPTO_SECRET_KEY",
        "ausente",
        "opcional en desarrollo, se deriva de JWT_SECRET",
        false
      );
    }
  } else if (produccion && cryptoDebil) {
    agregar(
      "CRYPTO_SECRET_KEY",
      "inválida",
      `debe ser aleatoria, propia y >= ${LONGITUD_MINIMA_SECRET} caracteres`
    );
  } else {
    agregar("CRYPTO_SECRET_KEY", "presente");
    if (cryptoDebil) {
      avisos.push(
        "CRYPTO_SECRET_KEY es debil o de ejemplo: en produccion el servidor no arrancara con ese valor."
      );
    }
  }

  const resendKey = String(entorno.RESEND_API_KEY ?? "");
  const resendFrom = String(entorno.RESEND_FROM ?? "");
  if (!hayValor(resendKey)) {
    agregar("RESEND_API_KEY", "ausente", "modo simulado, solo consola", false);
    avisos.push(
      "RESEND_API_KEY ausente: el correo queda en modo simulado (solo consola)."
    );
  } else {
    agregar("RESEND_API_KEY", "presente");
    if (!hayValor(resendFrom)) {
      avisos.push(
        "RESEND_FROM ausente: Resend usa onboarding@resend.dev y solo entrega al dueño de la cuenta."
      );
    } else if (/resend\.dev/i.test(resendFrom)) {
      avisos.push(
        "RESEND_FROM usa resend.dev: Resend solo entrega al dueño de la cuenta; verifica un dominio propio para otros destinatarios."
      );
    }
  }
  agregar(
    "RESEND_FROM",
    hayValor(resendFrom) ? "presente" : "ausente",
    hayValor(resendFrom) ? "" : "opcional",
    false
  );

  agregar(
    "NODE_ENV",
    !nodeEnv ? "ausente" : nodeEnvValido ? "presente" : "inválida",
    !nodeEnv
      ? "obligatoria: development, test o production"
      : nodeEnvValido
        ? ""
        : "use development, test o production"
  );

  return { filas, avisos, errores };
}

/**
 * Convierte el resultado de evaluarEntorno en lineas de consola.
 * Solo usa nombres, estados y motivos fijos: jamas interpola valores.
 * @param {{filas: Array, avisos: string[], errores: string[]}} resultado
 * @returns {string[]} Lineas listas para console.log.
 */
export function formatearReporte({ filas, avisos, errores }) {
  const lineas = ["CommerCity - verificacion del entorno (sin mostrar valores)", ""];

  for (const fila of filas) {
    const detalle = fila.detalle ? ` (${fila.detalle})` : "";
    lineas.push(`${fila.nombre.padEnd(18)} ${fila.estado}${detalle}`);
  }

  if (avisos.length > 0) {
    lineas.push("", "Avisos:");
    for (const aviso of avisos) lineas.push(` - ${aviso}`);
  }

  lineas.push("");
  lineas.push(
    errores.length === 0
      ? `Resultado: OK (${filas.length} variables revisadas, ${avisos.length} aviso(s)).`
      : `Resultado: FALLO (${errores.length} variable(s) con problema: ${errores.join(", ")}).`
  );
  return lineas;
}

/**
 * Prueba de conectividad opcional (--db): SELECT 1 con timeout.
 * @param {Record<string, string|undefined>} entorno
 * @returns {Promise<{ok: boolean, codigo?: string, omitido?: boolean}>}
 */
export async function probarDb(entorno = {}) {
  const faltan = ["DB_HOST", "DB_USER", "DB_NAME"].filter(
    (nombre) => !hayValor(entorno[nombre])
  );
  if (faltan.length > 0) {
    return { ok: false, omitido: true, codigo: `faltan ${faltan.join("/")}` };
  }

  let conexion;
  try {
    conexion = await mysql.createConnection({
      host: entorno.DB_HOST,
      port: Number(entorno.DB_PORT) || 3306,
      user: entorno.DB_USER,
      password: entorno.DB_PASSWORD || "",
      database: entorno.DB_NAME,
      connectTimeout: 5000,
    });
    await conexion.query("SELECT 1");
    return { ok: true };
  } catch (error) {
    // Solo el codigo: el mensaje puede incluir host/usuario y no debe salir.
    return { ok: false, codigo: error?.code || "ERROR" };
  } finally {
    if (conexion) {
      try {
        await conexion.end();
      } catch {
        // el cierre no cambia el resultado de la prueba
      }
    }
  }
}

/**
 * Punto de entrada del script.
 * @param {string[]} argv Argumentos (soporta --db).
 * @param {Record<string, string|undefined>} entorno Variables a evaluar.
 * @returns {Promise<number>} Codigo de salida (0 OK, 1 con problemas).
 */
export async function main(argv = process.argv.slice(2), entorno = process.env) {
  dotenv.config({ path: RUTA_ENV, quiet: true });

  const resultado = evaluarEntorno(entorno);
  for (const linea of formatearReporte(resultado)) console.log(linea);

  let ok = resultado.errores.length === 0;

  if (argv.includes("--db")) {
    const prueba = await probarDb(entorno);
    if (prueba.ok) {
      console.log("db: ok (SELECT 1)");
    } else if (prueba.omitido) {
      console.log(`db: omitido (${prueba.codigo})`);
      ok = false;
    } else {
      console.log(`db: error (${prueba.codigo})`);
      ok = false;
    }
  }

  return ok ? 0 : 1;
}

// Solo se ejecuta al invocarlo como script; importarlo desde las pruebas no
// dispara la revision ni lee el .env.
const ejecutadoDirectamente =
  hayValor(process.argv[1]) &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (ejecutadoDirectamente) {
  main()
    .then((codigo) => {
      process.exitCode = codigo;
    })
    .catch((error) => {
      console.error(`env:check: error inesperado (${error?.code || "ERROR"})`);
      process.exitCode = 1;
    });
}
