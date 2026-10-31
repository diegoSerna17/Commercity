/**
 * A-3 (CSRF en profundidad): valida Origin/Referer en metodos mutantes cuando
 * la peticion usa la cookie httpOnly `token`.
 *
 * Contexto: la defensa CSRF dependia solo de SameSite=Lax (cookie `token`,
 * ver emitirCookieSesion en usuarios.controllers.js). CORS ya cierra el acceso
 * cross-origin a nivel navegador, pero una web permitida o un form clasico
 * podrian gatillar mutaciones con cookie. Este middleware exige que el
 * Origin (o el origen del Referer como respaldo) este en la misma allowlist
 * que CORS; si no, responde 403 antes de llegar a auth o a los routers.
 *
 * Reglas:
 *  - Solo aplica a POST/PUT/PATCH/DELETE (lecturas GET/HEAD/OPTIONS pasan).
 *  - Si hay `Authorization: Bearer` (el header tiene prioridad en
 *    authRequired), no hay riesgo CSRF clasico y se deja pasar.
 *  - Si hay cookie `token=` sin Bearer:
 *      * con Origin: debe estar permitido, si no 403;
 *      * sin Origin pero con Referer: el origen del Referer debe estar
 *        permitido, si no 403;
 *      * sin Origin ni Referer (curl, apps nativas, Electron loadFile): se
 *        permite porque no son navegadores (CORS ya los contempla). Es una
 *        limitacion documentada, no una excepcion silenciosa.
 *  - `null`/`file://` solo pasan con ALLOW_DESKTOP_ORIGINS=true (igual que CORS).
 */
const METODOS_MUTANTES = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function construirAllowlistOrigen() {
  const lista = [
    process.env.FRONTEND_URL,
    ...String(process.env.CORS_ALLOWLIST || "")
      .split(",")
      .map((origen) => origen.trim()),
  ].filter(Boolean);
  if (process.env.NODE_ENV !== "production") {
    lista.push(
      "http://localhost:5173", // Vite dev por defecto
      "https://localhost", // Capacitor Android (androidScheme https)
      "http://localhost", // Capacitor Android con esquema http / dev
      "capacitor://localhost" // Capacitor iOS
    );
  }
  return lista;
}

function origenDeReferer(referer) {
  try {
    return new URL(String(referer)).origin;
  } catch {
    return null;
  }
}

export function usaCookieAuth(req) {
  // El header Bearer tiene prioridad en authRequired: si esta presente, la
  // autenticacion no depende de la cookie y no hay CSRF clasico que mitigar.
  const authHeader = req.headers.authorization;
  if (authHeader && String(authHeader).startsWith("Bearer ")) return false;
  const cookie = req.headers.cookie || "";
  return /(?:^|;\s*)token=/.test(String(cookie));
}

function origenPermitido(origen, allowlist, desktopPermitido) {
  if (!origen) return false;
  if (allowlist.includes(origen)) return true;
  if (
    desktopPermitido &&
    (origen === "null" ||
      origen === "file://" ||
      String(origen).startsWith("file://"))
  ) {
    return true;
  }
  return false;
}

export function validarOriginCookies(req, res, next) {
  if (!METODOS_MUTANTES.has(req.method)) return next();
  if (!usaCookieAuth(req)) return next();

  const allowlist = construirAllowlistOrigen();
  const desktopPermitido = process.env.ALLOW_DESKTOP_ORIGINS === "true";
  const origin = req.headers.origin;
  const referer = req.headers.referer || req.headers.referrer;

  if (origin) {
    if (origenPermitido(origin, allowlist, desktopPermitido)) return next();
    return res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Origen no permitido." },
    });
  }
  if (referer) {
    const origen = origenDeReferer(referer);
    if (origen && origenPermitido(origen, allowlist, desktopPermitido)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Origen no permitido." },
    });
  }
  // Sin Origin ni Referer: cliente no-navegador (curl, app nativa, Electron
  // loadFile). Se permite; CORS ya contempla este caso.
  return next();
}

export default validarOriginCookies;
