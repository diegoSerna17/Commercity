#!/usr/bin/env node
/**
 * generar-postman.mjs — genera la coleccion Postman v2.1 de CommerCity a partir
 * de docs/api/openapi.json (fuente unica: los esquemas Zod del backend).
 *
 * Uso (desde la raiz del repo):
 *   node tools/generar-postman.mjs
 *
 * Salidas:
 *   docs/api/postman/CommerCity.postman_collection.json
 *   docs/api/postman/CommerCity.local.postman_environment.json
 *
 * Reglas de diseno:
 *   - Una carpeta por etapa segura de ejecucion (no por tag a ciegas): primero se
 *     crea un usuario temporal, luego lecturas, creaciones, actualizaciones y al
 *     final cancelaciones y borrados logicos sobre lo creado.
 *   - Nunca se ejecuta en lote el upsert de la cuenta bancaria de CommerCity ni
 *     el reset de contrasena (requiere token de correo): van a "98 - No ejecutar".
 *   - Sin credenciales reales: el usuario temporal lo crea la propia coleccion y
 *     la clave de administrador queda vacia para que la complete el usuario.
 *   - Sin dependencias nuevas: solo node:fs, node:path y node:url.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_PATH = path.join(ROOT, "docs", "api", "openapi.json");
const OUT_DIR = path.join(ROOT, "docs", "api", "postman");
const COLLECTION_PATH = path.join(OUT_DIR, "CommerCity.postman_collection.json");
const ENVIRONMENT_PATH = path.join(OUT_DIR, "CommerCity.local.postman_environment.json");

const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));

// ---------------------------------------------------------------------------
// 1. Utilidades de esquema
// ---------------------------------------------------------------------------

function resolverRef(ref) {
  if (!ref || !ref.startsWith("#/")) return null;
  return ref
    .slice(2)
    .split("/")
    .reduce((acc, parte) => (acc ? acc[parte] : undefined), spec);
}

function ejemploDesdeEsquema(esquema, profundidad = 0) {
  if (!esquema || profundidad > 4) return null;
  const resuelto = esquema.$ref ? resolverRef(esquema.$ref) : esquema;
  if (!resuelto) return null;

  if (Array.isArray(resuelto.examples) && resuelto.examples.length > 0) {
    return structuredClone(resuelto.examples[0]);
  }
  if ("example" in resuelto) return structuredClone(resuelto.example);
  if ("default" in resuelto) return structuredClone(resuelto.default);
  if (Array.isArray(resuelto.enum) && resuelto.enum.length > 0) return resuelto.enum[0];

  if (resuelto.type === "object" || resuelto.properties) {
    const objeto = {};
    for (const [clave, valor] of Object.entries(resuelto.properties || {})) {
      const ejemplo = ejemploDesdeEsquema(valor, profundidad + 1);
      if (ejemplo !== null && ejemplo !== undefined) objeto[clave] = ejemplo;
    }
    return objeto;
  }
  if (resuelto.type === "array") {
    const item = ejemploDesdeEsquema(resuelto.items, profundidad + 1);
    return item === null ? [] : [item];
  }
  switch (resuelto.type) {
    case "integer":
    case "number":
      return typeof resuelto.minimum === "number" ? resuelto.minimum : 1;
    case "boolean":
      return true;
    case "string":
      return "texto";
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// 2. Mapa de parametros de ruta a variables de la coleccion
// ---------------------------------------------------------------------------

const PARAMETROS = {
  "GET /api/usuarios/perfil-publico/{id}": { id: "vendedorId" },
  "GET /api/productos/{id}/validar-stock": { id: "productoId" },
  "GET /api/productos/{id}": { id: "productoId" },
  "PUT /api/productos/{id}": { id: "productoId" },
  "PATCH /api/pedidos/{id}/estado": { id: "pedidoId" },
  "DELETE /api/carrito/{productoId}": { productoId: "productoId" },
  "PATCH /api/carrito/{productoId}": { productoId: "productoId" },
  "POST /api/historial/compras/{id}/cancelar": { id: "pedidoId" },
  "PATCH /api/admin/usuarios/{id}/estado": { id: "usuarioTemporalId" },
  "DELETE /api/admin/usuarios/{id}": { id: "usuarioTemporalId" },
  "DELETE /api/admin/productos/{id}": { id: "productoId" },
  "PATCH /api/admin/productos/{id}/restaurar": { id: "productoId" },
  "GET /api/admin/reportes/{id}": { id: "reporteId" },
  "DELETE /api/admin/reportes/{id}": { id: "reporteId" },
  "PATCH /api/admin/reportes/{id}/resolver": { id: "reporteId" },
  "GET /api/chat/mensajes/{usuarioId}": { usuarioId: "vendedorId" },
  "PATCH /api/chat/mensajes/{id}/leido": { id: "mensajeId" },
  "PATCH /api/notificaciones/{id}/leida": { id: "notificacionId" },
  "DELETE /api/notificaciones/{id}": { id: "notificacionId" },
  "DELETE /api/seguidores/{id}": { id: "seguimientoId" },
  "GET /api/seguidores/{id}/contadores": { id: "vendedorId" },
};

// ---------------------------------------------------------------------------
// 3. Cuerpos con variables (el resto se toma del ejemplo del esquema)
// ---------------------------------------------------------------------------

const CUERPOS = {
  "POST /api/usuarios/register": {
    email: "{{emailTemporal}}",
    password: "{{passwordTemporal}}",
    nombre_completo: "Usuario temporal QA",
  },
  "POST /api/usuarios/login": {
    email: "{{emailTemporal}}",
    password: "{{passwordTemporal}}",
  },
  "POST /api/usuarios/recover": { email: "{{emailTemporal}}" },
  "POST /api/carrito/": { producto_id: "{{productoId}}", cantidad: 1 },
  "POST /api/calificaciones/vendedor": {
    pedido_id: "{{pedidoId}}",
    vendedor_id: "{{vendedorId}}",
    estrellas: 5,
    comentario: "Prueba de sustentacion",
  },
  "POST /api/chat/": { receptor_id: "{{vendedorId}}", mensaje: "Mensaje de prueba" },
  "POST /api/seguidores/": { seguido_id: "{{vendedorId}}" },
  "PATCH /api/admin/usuarios/{id}/estado": { estado: "activo" },
};

// Campos multipart (los endpoints de archivo no tienen esquema JSON en OpenAPI).
const MULTIPART = {
  "POST /api/productos": [
    { key: "nombre", value: "Producto de prueba QA" },
    { key: "descripcion", value: "Creado por la coleccion de sustentacion" },
    { key: "precio", value: "25000" },
    { key: "stock", value: "10" },
    { key: "descuento", value: "0" },
    { key: "categoria", value: "Pruebas" },
    { key: "imagen", type: "file", src: [] },
  ],
  "PUT /api/productos/{id}": [
    { key: "precio", value: "27000" },
    { key: "stock", value: "8" },
    { key: "imagen", type: "file", src: [] },
  ],
  "POST /api/reportes/": [
    { key: "tipo", value: "producto" },
    { key: "producto_id", value: "{{productoId}}" },
    { key: "motivo", value: "Reporte de prueba de la coleccion" },
    { key: "evidencia", type: "file", src: [] },
  ],
};

// Descripciones corregidas: los comentarios del codigo citan RF que no coinciden con el
// documento oficial 2026-08-20. Aqui se usa la numeracion verificada en
// docs/informes/MATRIZ_RF_ENDPOINTS_2026-10-30.md.
const DESCRIPCIONES = {
  "GET /api/usuarios/perfil-publico/{id}": "Perfil publico de otro usuario por su ID (RF110, RF11, RF12).",
  "DELETE /api/usuarios/cuenta": "Desactivacion logica de la cuenta propia; el usuario sale del token (RF42, RF56).",
  "POST /api/usuarios/logout": "Revoca el token actual en la lista negra de la base (RF2). Exige token.",
  "GET /api/productos": "Catalogo publico con busqueda, filtros y paginacion (RF91 a RF98).",
  "POST /api/productos": "Publica un producto con imagen obligatoria (RF46 a RF49). Precio con IVA incluido (RF48).",
  "GET /api/productos/{id}/validar-stock": "Valida si hay stock suficiente para una cantidad (RF83, RF88).",
  "GET /api/productos/{id}": "Detalle con calificacion promedio y total de calificaciones (RF81, RF82).",
  "GET /api/pedidos/resumen": "Resumen agrupado por vendedor con IVA 19 % y reparto 90/10 en vuelo (RF112, RF117, RF118, RF140). Solo lectura.",
  "POST /api/pedidos/confirmar-pago": "Crea pedido, lineas, descuenta stock y registra el pago en UNA transaccion (RF116 a RF124, RF140). Tarjeta enmascarada: ultimos 4 y marca.",
  "PATCH /api/pedidos/{id}/estado": "Vendedor o administrador avanzan un nivel (RF29, RF127); el comprador cancela con reembolso (RF35, RF89).",
  "GET /api/tienda/mi-cuenta-bancaria/masked": "Version enmascarada para mostrar (RF138).",
  "GET /api/tienda/ventas": "Ventas del vendedor con filtros y resumen 90/10 (RF126, RF128, RF135).",
  "GET /api/tienda/ingresos": "Ingresos del 90 % del vendedor, por transaccion o por dia (RF136, RF139, RF140).",
  "GET /api/tienda/validacion": "Verifica cuenta bancaria, reparto 90/10 y devoluciones (RF130, RF137, RF140).",
  "GET /api/historial/compras": "Compras del comprador agrupadas por pedido con IVA y totales (RF26 a RF32).",
  "POST /api/historial/compras/{id}/cancelar": "Cancela un pedido en estado Pendiente: restituye stock y reembolsa (RF35, RF36, RF89, RF129).",
  "GET /api/admin/stats": "Estadisticas de la plataforma (RF57, RF58, RF60, RF61, RF62).",
  "GET /api/admin/usuarios": "Gestion de usuarios con busqueda (RF70, RF73).",
  "GET /api/admin/productos": "Moderacion de productos con busqueda (RF71, RF74).",
  "GET /api/admin/reportes": "Bandeja de reportes de contenido (RF63 a RF67).",
  "GET /api/admin/busqueda": "Buscador unificado de usuarios y productos (RF72 a RF74).",
  "GET /api/admin/mi-cuenta-bancaria": "Cuenta bancaria de CommerCity para la comision del 10 % (RF79, RNF11 cifrado).",
  "POST /api/admin/mi-cuenta-bancaria": "Alta de la cuenta que recibe la comision (RF79).",
  "POST /api/reportes/": "Reporta un producto o un usuario con evidencia opcional (RF85, RF86, RF108, RF109). El informante sale del JWT.",
  "POST /api/calificaciones/vendedor": "Calificacion de 1 a 5 estrellas tras una compra; una por pedido (RF87, RF107).",
  "POST /api/chat/": "Mensaje de texto al otro usuario (RF105); el multipart se rechaza con 400.",
  "GET /api/seguidores/{id}/contadores": "Totales de seguidores y seguidos para el perfil publico (RF18, RF19, RF106).",
};

// ---------------------------------------------------------------------------
// 4. Captura de ids y tokens
// ---------------------------------------------------------------------------

const CAPTURAS = {
  "POST /api/usuarios/login": [
    "const d = b && b.data ? b.data : {};",
    "if (d.token) {",
    '  pm.collectionVariables.set("token", d.token);',
    '  pm.collectionVariables.set("tokenComprador", d.token);',
    "}",
    "const u = d.user || d.usuario || {};",
    'if (u.id) pm.collectionVariables.set("usuarioTemporalId", String(u.id));',
  ],
  "POST /api/usuarios/register": [
    "const d = b && b.data ? b.data : {};",
    "const u = d.user || d.usuario || d;",
    'if (u && u.id) pm.collectionVariables.set("usuarioTemporalId", String(u.id));',
  ],
  "GET /api/productos": [
    "const d = b && b.data ? b.data : {};",
    "const lista = Array.isArray(d) ? d : (d.productos || d.items || []);",
    "const p = lista[0];",
    'if (p && p.id && !pm.collectionVariables.get("productoId")) pm.collectionVariables.set("productoId", String(p.id));',
  ],
  "GET /api/vendedores": [
    "const d = b && b.data ? b.data : {};",
    "const lista = Array.isArray(d) ? d : (d.vendedores || d.items || []);",
    "const v = lista[0];",
    'if (v && v.id) pm.collectionVariables.set("vendedorId", String(v.id));',
  ],
  "POST /api/productos": [
    "const d = b && b.data ? b.data : {};",
    "const p = d.producto || d;",
    'if (p && p.id) pm.collectionVariables.set("productoId", String(p.id));',
  ],
  "GET /api/carrito/": [
    "const d = b && b.data ? b.data : {};",
    "const lista = Array.isArray(d) ? d : (d.vendedores || []);",
    "const v = lista[0] || {};",
    "const vid = v.vendedor_id || v.id;",
    'if (vid) pm.collectionVariables.set("vendedorId", String(vid));',
  ],
  "POST /api/pedidos/confirmar-pago": [
    "const d = b && b.data ? b.data : {};",
    "const p = d.pedido || d;",
    "const id = p.pedido_id || p.id;",
    'if (id) pm.collectionVariables.set("pedidoId", String(id));',
  ],
  "POST /api/reportes/": [
    "const d = b && b.data ? b.data : {};",
    "const r = d.reporte || d;",
    'if (r && r.id) pm.collectionVariables.set("reporteId", String(r.id));',
  ],
  "POST /api/chat/": [
    "const d = b && b.data ? b.data : {};",
    "const m = d.mensaje || d;",
    'if (m && m.id) pm.collectionVariables.set("mensajeId", String(m.id));',
  ],
  "POST /api/seguidores/": [
    "const d = b && b.data ? b.data : {};",
    "const s = d.seguimiento || d;",
    'if (s && s.id) pm.collectionVariables.set("seguimientoId", String(s.id));',
  ],
  "GET /api/notificaciones/": [
    "const d = b && b.data ? b.data : {};",
    "const lista = Array.isArray(d) ? d : (d.notificaciones || d.items || []);",
    "const n = lista[0];",
    'if (n && n.id) pm.collectionVariables.set("notificacionId", String(n.id));',
  ],
};

// ---------------------------------------------------------------------------
// 5. Etapas de ejecucion
// ---------------------------------------------------------------------------

const ETAPAS = [
  ["00 - Preparacion", "Crea el usuario temporal, inicia sesion y lo habilita como vendedor. Ejecutar siempre primero."],
  ["01 - Casos negativos", "401, 403, 400 y 404. No modifican datos; demuestran el contrato de error."],
  ["02 - Usuarios", "Perfil, directorio y administracion de la propia cuenta."],
  ["03 - Productos", "Catalogo publico y gestion del vendedor."],
  ["04 - Carrito", "Agregar, listar, modificar y eliminar sobre el usuario temporal."],
  ["05 - Pedidos", "Resumen, checkout transaccional y cambio de estado."],
  ["06 - Historial", "Compras del comprador y cancelacion con restitucion de stock."],
  ["07 - Tienda", "Cuenta bancaria, ventas, ingresos y validacion del vendedor."],
  ["08 - Seguidores", "Seguir, listar y contadores publicos."],
  ["09 - Chat", "Mensajes de texto entre el usuario temporal y un vendedor."],
  ["10 - Notificaciones", "Listado, contador, marcado y eliminacion."],
  ["11 - Reportes", "Reporte de producto con evidencia."],
  ["12 - Calificaciones", "Calificacion del vendedor tras la compra."],
  ["13 - Admin", "Requiere tokenAdmin. Gestiona solo lo creado por la coleccion."],
  ["14 - Base y documentacion", "Raiz, salud y visor de la API."],
  ["98 - No ejecutar en lote", "Operaciones peligrosas o que requieren datos externos. Ejecutar a mano y con criterio."],
  ["99 - Cierre y limpieza", "Cierra sesiones y desactiva el usuario temporal. Ejecutar al final."],
];

function etapaDe(metodo, ruta) {
  const clave = `${metodo.toUpperCase()} ${ruta}`;
  if (["POST /api/usuarios/register", "POST /api/usuarios/login", "PATCH /api/usuarios/me/rol"].includes(clave)) {
    return "00 - Preparacion";
  }
  if (["POST /api/usuarios/logout", "POST /api/usuarios/logout-todas", "DELETE /api/usuarios/cuenta"].includes(clave)) {
    return "99 - Cierre y limpieza";
  }
  if (ruta === "/api/usuarios/admin") return "13 - Admin";
  if (
    [
      "POST /api/usuarios/reset-password",
      "GET /api/admin/mi-cuenta-bancaria",
      "GET /api/admin/mi-cuenta-bancaria/masked",
      "POST /api/admin/mi-cuenta-bancaria",
      "PUT /api/admin/mi-cuenta-bancaria",
    ].includes(clave)
  ) {
    return "98 - No ejecutar en lote";
  }
  if (ruta === "/" || ruta === "/health") return "14 - Base y documentacion";
  const tag = (spec.paths[ruta][metodo.toLowerCase()].tags || [])[0] || "Otros";
  const mapa = {
    Usuarios: "02 - Usuarios",
    Productos: "03 - Productos",
    Carrito: "04 - Carrito",
    Pedidos: "05 - Pedidos",
    Historial: "06 - Historial",
    Tienda: "07 - Tienda",
    Seguidores: "08 - Seguidores",
    Chat: "09 - Chat",
    Notificaciones: "10 - Notificaciones",
    Reportes: "11 - Reportes",
    Calificaciones: "12 - Calificaciones",
    Admin: "13 - Admin",
    Base: "14 - Base y documentacion",
  };
  return mapa[tag] || "14 - Base y documentacion";
}

const ORDEN_ETAPAS = new Map(ETAPAS.map(([nombre], i) => [nombre, i]));

// Orden interno: lectura antes de escritura, salvo secuencias que dependen del estado.
const ORDEN_ESPECIAL = {
  "04 - Carrito": ["POST /api/carrito/", "GET /api/carrito/", "PATCH /api/carrito/{productoId}", "DELETE /api/carrito/{productoId}"],
  "07 - Tienda": [
    "POST /api/tienda/mi-cuenta-bancaria",
    "GET /api/tienda/mi-cuenta-bancaria",
    "GET /api/tienda/mi-cuenta-bancaria/masked",
    "PUT /api/tienda/mi-cuenta-bancaria",
    "GET /api/tienda/ventas",
    "GET /api/tienda/ingresos",
    "GET /api/tienda/dashboard/stats",
    "GET /api/tienda/validacion",
  ],
  "13 - Admin": [
    "GET /api/admin/stats",
    "GET /api/admin/usuarios",
    "GET /api/admin/productos",
    "GET /api/admin/reportes",
    "GET /api/admin/busqueda",
    "GET /api/admin/reportes/{id}",
    "GET /api/usuarios/admin",
    "PATCH /api/admin/productos/{id}/restaurar",
    "PATCH /api/admin/reportes/{id}/resolver",
    "PATCH /api/admin/usuarios/{id}/estado",
    "DELETE /api/admin/reportes/{id}",
    "DELETE /api/admin/productos/{id}",
    "DELETE /api/admin/usuarios/{id}",
  ],
};

const RANGO = { get: 0, post: 1, put: 2, patch: 3, delete: 4 };

function ordenar(items, etapa) {
  const especial = ORDEN_ESPECIAL[etapa];
  const claveDe = (op) => `${op.metodo.toUpperCase()} ${op.ruta}`;
  if (especial) {
    const pos = new Map(especial.map((c, i) => [c, i]));
    return [...items].sort((a, b) => {
      const pa = pos.has(claveDe(a)) ? pos.get(claveDe(a)) : 999;
      const pb = pos.has(claveDe(b)) ? pos.get(claveDe(b)) : 999;
      if (pa !== pb) return pa - pb;
      return a.ruta.localeCompare(b.ruta);
    });
  }
  return [...items].sort((a, b) => {
    const ra = RANGO[a.metodo.toLowerCase()] ?? 9;
    const rb = RANGO[b.metodo.toLowerCase()] ?? 9;
    if (ra !== rb) return ra - rb;
    return a.ruta.localeCompare(b.ruta);
  });
}

// ---------------------------------------------------------------------------
// 6. Construccion de requests
// ---------------------------------------------------------------------------

function codigoExito(operacion) {
  const codigos = Object.keys(operacion.responses || {}).map(Number);
  const exitosos = codigos.filter((c) => c >= 200 && c < 300).sort((a, b) => a - b);
  return exitosos.length > 0 ? exitosos[0] : 200;
}

function construirUrl(ruta, operacion) {
  const clave = `${operacion.metodo.toUpperCase()} ${ruta}`;
  const mapa = PARAMETROS[clave] || {};
  const conVariables = ruta.replace(/\{([^}]+)\}/g, (_m, nombre) => `{{${mapa[nombre] || nombre}}}`);

  const query = (operacion.parameters || [])
    .filter((p) => p.in === "query" && p.required)
    .map((p) => {
      const esquema = p.schema?.$ref ? resolverRef(p.schema.$ref) : p.schema || {};
      const valor = p.name === "cantidad" ? "1" : ejemploDesdeEsquema(esquema);
      return { key: p.name, value: String(valor ?? "") };
    });

  const segmentos = conVariables.split("/").filter(Boolean);
  const url = {
    raw: `{{baseUrl}}${conVariables}${query.length ? "?" + query.map((q) => `${q.key}=${q.value}`).join("&") : ""}`,
    host: ["{{baseUrl}}"],
    path: segmentos,
  };
  if (query.length) url.query = query;
  return url;
}

function scriptDePrueba(operacion, codigo, capturas) {
  const lineas = [
    `const ESPERADO = ${codigo};`,
    'pm.test("HTTP " + ESPERADO, function () {',
    "  pm.response.to.have.status(ESPERADO);",
    "});",
    'pm.test("contrato { success, data | error }", function () {',
    "  const b = pm.response.json();",
    '  pm.expect(b, "falta el campo success").to.have.property("success");',
    "  if (b.success === true) {",
    '    pm.expect(b, "respuesta exitosa sin data").to.have.property("data");',
    "  } else {",
    '    pm.expect(b, "respuesta de error sin objeto error").to.have.property("error");',
    '    pm.expect(b.error).to.have.property("code");',
    "  }",
    "});",
  ];
  if (capturas && capturas.length) {
    lineas.push("const b = pm.response.json();");
    lineas.push(...capturas);
  }
  return lineas;
}

function descripcionDe(operacion, ruta, codigo) {
  const clave = `${operacion.metodo.toUpperCase()} ${ruta}`;
  const partes = [];
  if (operacion.summary) partes.push(operacion.summary);
  const descripcion = DESCRIPCIONES[clave] || operacion.description;
  if (descripcion) partes.push(descripcion);
  partes.push(`Codigo esperado: ${codigo}.`);
  if (ruta.startsWith("/api/admin")) partes.push("Requiere {{tokenAdmin}} (rol administrador).");
  else if (operacion.security && operacion.security.length) partes.push("Requiere {{token}} (JWT).");
  else partes.push("Publico: no requiere token.");
  return partes.join("\n\n");
}

function construirRequest(ruta, metodo, operacion) {
  const clave = `${metodo.toUpperCase()} ${ruta}`;
  const codigo = codigoExito(operacion);
  const capturas = CAPTURAS[clave] || null;
  const request = {
    method: metodo.toUpperCase(),
    header: [],
    url: construirUrl(ruta, { ...operacion, metodo }),
  };

  const esAdmin = ruta.startsWith("/api/admin");
  const conSeguridad = Array.isArray(operacion.security) && operacion.security.length > 0;
  if (esAdmin) {
    request.auth = { type: "bearer", bearer: [{ key: "token", value: "{{tokenAdmin}}", type: "string" }] };
  } else if (!conSeguridad) {
    request.auth = { type: "noauth" };
  }

  const contenido = operacion.requestBody?.content || {};
  if (contenido["application/json"]) {
    const esquema = contenido["application/json"].schema || {};
    const ejemplo = CUERPOS[clave] || ejemploDesdeEsquema(esquema) || {};
    request.header.push({ key: "Content-Type", value: "application/json" });
    request.body = {
      mode: "raw",
      raw: JSON.stringify(ejemplo, null, 2),
      options: { raw: { language: "json" } },
    };
  } else if (contenido["multipart/form-data"] || MULTIPART[clave]) {
    const campos = (MULTIPART[clave] || []).map((campo) =>
      campo.type === "file" ? campo : { key: campo.key, value: campo.value, type: "text" },
    );
    request.body = { mode: "formdata", formdata: campos };
  }

  request.description = descripcionDe({ ...operacion, metodo }, ruta, codigo);

  const item = {
    name: `${metodo.toUpperCase()} ${ruta}`,
    request,
    event: [
      {
        listen: "test",
        script: { type: "text/javascript", exec: scriptDePrueba(operacion, codigo, capturas) },
      },
    ],
  };

  if (clave === "POST /api/usuarios/register") {
    item.event.unshift({
      listen: "prerequest",
      script: {
        type: "text/javascript",
        exec: [
          'pm.collectionVariables.set("emailTemporal", "qa+" + Date.now() + "@ejemplo.com");',
        ],
      },
    });
  }

  return item;
}

// ---------------------------------------------------------------------------
// 7. Requests hechos a mano (login admin, docs y negativos)
// ---------------------------------------------------------------------------

function requestSimple({ nombre, metodo, ruta, auth, cuerpo, codigo, pruebas, descripcion }) {
  const url = {
    raw: `{{baseUrl}}${ruta}`,
    host: ["{{baseUrl}}"],
    path: ruta.split("/").filter(Boolean),
  };
  const request = { method: metodo, header: [], url };
  if (auth === "admin") {
    request.auth = { type: "bearer", bearer: [{ key: "token", value: "{{tokenAdmin}}", type: "string" }] };
  } else if (auth === "comprador") {
    request.auth = { type: "bearer", bearer: [{ key: "token", value: "{{tokenComprador}}", type: "string" }] };
  } else {
    request.auth = { type: "noauth" };
  }
  if (cuerpo !== undefined) {
    request.header.push({ key: "Content-Type", value: "application/json" });
    request.body = { mode: "raw", raw: JSON.stringify(cuerpo, null, 2), options: { raw: { language: "json" } } };
  }
  request.description = descripcion;
  return {
    name: nombre,
    request,
    event: [{ listen: "test", script: { type: "text/javascript", exec: pruebas } }],
  };
}

function itemLoginAdmin() {
  return requestSimple({
    nombre: "POST /api/usuarios/login (administrador, opcional)",
    metodo: "POST",
    ruta: "/api/usuarios/login",
    auth: "none",
    cuerpo: { email: "{{adminEmail}}", password: "{{adminPassword}}" },
    codigo: 200,
    descripcion:
      "Helper para la carpeta Admin. Completar adminEmail y adminPassword en el entorno; " +
      "la coleccion NO incluye credenciales reales. Si no se completa, la carpeta 13 fallara con 401.",
    pruebas: [
      'pm.test("HTTP 200", function () { pm.response.to.have.status(200); });',
      "const b = pm.response.json();",
      "if (b.success && b.data && b.data.token) {",
      '  pm.collectionVariables.set("tokenAdmin", b.data.token);',
      '  pm.test("token de administrador capturado", function () { pm.expect(b.data.token).to.be.a("string"); });',
      "} else {",
      '  pm.test("login de administrador pendiente de configurar", function () { pm.expect.fail("Complete adminEmail y adminPassword en el entorno"); });',
      "}",
    ],
  });
}

function itemDocs() {
  return requestSimple({
    nombre: "GET /api/docs (visor Scalar)",
    metodo: "GET",
    ruta: "/api/docs",
    auth: "none",
    codigo: 200,
    descripcion: "Documentacion viva generada desde los esquemas Zod. No forma parte de las 74 operaciones.",
    pruebas: [
      'pm.test("HTTP 200", function () { pm.response.to.have.status(200); });',
      'pm.test("responde HTML", function () { pm.expect(pm.response.headers.get("Content-Type")).to.include("text/html"); });',
    ],
  });
}

function itemHealth() {
  return requestSimple({
    nombre: "GET /health",
    metodo: "GET",
    ruta: "/health",
    auth: "none",
    codigo: 200,
    descripcion: "Salud del servicio: SELECT 1 contra la base. Devuelve 503 si la base no responde.",
    pruebas: [
      'pm.test("HTTP 200", function () { pm.response.to.have.status(200); });',
      "const b = pm.response.json();",
      'pm.test("estado ok", function () { pm.expect(b.success).to.equal(true); });',
    ],
  });
}

function itemRaiz() {
  return requestSimple({
    nombre: "GET /",
    metodo: "GET",
    ruta: "/",
    auth: "none",
    codigo: 200,
    descripcion: "Estado del servidor (mensaje, estado, marca de tiempo y version).",
    pruebas: [
      'pm.test("HTTP 200", function () { pm.response.to.have.status(200); });',
      "const b = pm.response.json();",
      'pm.test("servidor creado", function () { pm.expect(b.success).to.equal(true); });',
    ],
  });
}

function itemsNegativos() {
  const pruebaError = (codigo, campo) => [
    `pm.test("HTTP ${codigo}", function () { pm.response.to.have.status(${codigo}); });`,
    "const b = pm.response.json();",
    'pm.test("success false", function () { pm.expect(b.success).to.equal(false); });',
    `pm.test("error ${campo}", function () { pm.expect(b.error.code).to.equal("${campo}"); });`,
  ];

  return [
    requestSimple({
      nombre: "401 - sin token",
      metodo: "GET",
      ruta: "/api/usuarios/me",
      auth: "none",
      codigo: 401,
      descripcion: "Ruta protegida sin cabecera Authorization: el middleware responde 401 UNAUTHORIZED.",
      pruebas: pruebaError(401, "UNAUTHORIZED"),
    }),
    requestSimple({
      nombre: "401 - credenciales invalidas",
      metodo: "POST",
      ruta: "/api/usuarios/login",
      auth: "none",
      cuerpo: { email: "{{emailTemporal}}", password: "clave-incorrecta-123" },
      codigo: 401,
      descripcion: "Mismo mensaje exista o no la cuenta (anti-enumeracion).",
      pruebas: pruebaError(401, "UNAUTHORIZED"),
    }),
    requestSimple({
      nombre: "403 - rol insuficiente",
      metodo: "GET",
      ruta: "/api/admin/stats",
      auth: "comprador",
      codigo: 403,
      descripcion: "Token valido de comprador en una ruta de administrador: 403 FORBIDDEN.",
      pruebas: pruebaError(403, "FORBIDDEN"),
    }),
    requestSimple({
      nombre: "400 - cuerpo invalido",
      metodo: "POST",
      ruta: "/api/usuarios/register",
      auth: "none",
      cuerpo: { email: "no-es-un-correo", password: "123" },
      codigo: 400,
      descripcion: "Zod rechaza el correo y la contrasena antes de tocar la base.",
      pruebas: [
        'pm.test("HTTP 400", function () { pm.response.to.have.status(400); });',
        "const b = pm.response.json();",
        'pm.test("success false", function () { pm.expect(b.success).to.equal(false); });',
        'pm.test("codigo VALIDATION_ERROR", function () { pm.expect(b.error.code).to.equal("VALIDATION_ERROR"); });',
        'pm.test("detalles de validacion", function () { pm.expect(b.error).to.have.property("details"); });',
      ],
    }),
    requestSimple({
      nombre: "404 - recurso inexistente",
      metodo: "GET",
      ruta: "/api/productos/999999",
      auth: "none",
      codigo: 404,
      descripcion: "Producto inexistente: 404 NOT_FOUND sin exponer la consulta.",
      pruebas: pruebaError(404, "NOT_FOUND"),
    }),
  ];
}

// ---------------------------------------------------------------------------
// 8. Ensamblado
// ---------------------------------------------------------------------------

const operaciones = [];
for (const [ruta, item] of Object.entries(spec.paths)) {
  for (const [metodo, operacion] of Object.entries(item)) {
    if (!["get", "post", "put", "patch", "delete"].includes(metodo)) continue;
    operaciones.push({ ruta, metodo, operacion });
  }
}

const porEtapa = new Map();
for (const op of operaciones) {
  const etapa = etapaDe(op.metodo, op.ruta);
  if (!porEtapa.has(etapa)) porEtapa.set(etapa, []);
  porEtapa.get(etapa).push(op);
}

const carpetas = [];
for (const [nombre, descripcion] of ETAPAS) {
  let items = [];

  if (nombre === "00 - Preparacion") {
    const base = ordenar(porEtapa.get(nombre) || [], nombre).map((op) =>
      construirRequest(op.ruta, op.metodo, op.operacion),
    );
    items = [...base, itemLoginAdmin()];
  } else if (nombre === "01 - Casos negativos") {
    items = itemsNegativos();
  } else if (nombre === "14 - Base y documentacion") {
    const resto = ordenar(porEtapa.get(nombre) || [], nombre)
      .filter((op) => !["/", "/health"].includes(op.ruta))
      .map((op) => construirRequest(op.ruta, op.metodo, op.operacion));
    items = [itemRaiz(), itemHealth(), itemDocs(), ...resto];
  } else {
    items = ordenar(porEtapa.get(nombre) || [], nombre).map((op) =>
      construirRequest(op.ruta, op.metodo, op.operacion),
    );
  }

  if (items.length === 0) continue;
  carpetas.push({ name: nombre, description: descripcion, item: items });
}

const totalRequests = carpetas.reduce((acc, c) => acc + c.item.length, 0);
const totalOperaciones = operaciones.length;

const coleccion = {
  info: {
    name: "CommerCity API - Backend y API REST",
    description:
      `Coleccion generada desde docs/api/openapi.json (v${spec.info?.version || "?"}).\n\n` +
      `Contiene ${totalOperaciones} operaciones documentadas, el visor de documentacion, ` +
      `un login de administrador opcional y 5 casos negativos: ${totalRequests} requests en total.\n\n` +
      "Orden de ejecucion: 00 Preparacion crea un usuario temporal y guarda su token; las carpetas " +
      "02 a 13 trabajan sobre ese usuario y sobre lo que la propia coleccion crea; 99 cierra sesiones " +
      "y desactiva la cuenta temporal. La carpeta 98 agrupa lo que NO debe correr en lote.\n\n" +
      "Requisito: backend corriendo contra una base de DESARROLLO (nunca la compartida) y las variables " +
      "del entorno CommerCity local completadas. La clave de administrador no viene incluida.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: { type: "bearer", bearer: [{ key: "token", value: "{{token}}", type: "string" }] },
  variable: [
    { key: "baseUrl", value: "http://localhost:3000" },
    { key: "token", value: "" },
    { key: "tokenComprador", value: "" },
    { key: "tokenAdmin", value: "" },
    { key: "emailTemporal", value: "" },
    { key: "passwordTemporal", value: "Clave1234" },
    { key: "adminEmail", value: "" },
    { key: "adminPassword", value: "" },
    { key: "productoId", value: "" },
    { key: "pedidoId", value: "" },
    { key: "usuarioTemporalId", value: "" },
    { key: "vendedorId", value: "" },
    { key: "reporteId", value: "" },
    { key: "mensajeId", value: "" },
    { key: "notificacionId", value: "" },
    { key: "seguimientoId", value: "" },
  ],
  item: carpetas,
};

const entorno = {
  id: "b7c1f0a2-4d3e-4f5a-9b6c-0d1e2f3a4b5c",
  name: "CommerCity local",
  values: [
    { key: "baseUrl", value: "http://localhost:3000", type: "default", enabled: true },
    { key: "token", value: "", type: "secret", enabled: true },
    { key: "tokenComprador", value: "", type: "secret", enabled: true },
    { key: "tokenAdmin", value: "", type: "secret", enabled: true },
    { key: "emailTemporal", value: "", type: "default", enabled: true },
    { key: "passwordTemporal", value: "Clave1234", type: "secret", enabled: true },
    { key: "adminEmail", value: "", type: "default", enabled: true },
    { key: "adminPassword", value: "", type: "secret", enabled: true },
    { key: "productoId", value: "", type: "default", enabled: true },
    { key: "pedidoId", value: "", type: "default", enabled: true },
    { key: "usuarioTemporalId", value: "", type: "default", enabled: true },
    { key: "vendedorId", value: "", type: "default", enabled: true },
    { key: "reporteId", value: "", type: "default", enabled: true },
    { key: "mensajeId", value: "", type: "default", enabled: true },
    { key: "notificacionId", value: "", type: "default", enabled: true },
    { key: "seguimientoId", value: "", type: "default", enabled: true },
  ],
  _postman_variable_scope: "environment",
  _postman_exported_using: "tools/generar-postman.mjs",
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(COLLECTION_PATH, JSON.stringify(coleccion, null, 2) + "\n", "utf8");
fs.writeFileSync(ENVIRONMENT_PATH, JSON.stringify(entorno, null, 2) + "\n", "utf8");

const resumen = carpetas.map((c) => `  ${c.name}: ${c.item.length}`).join("\n");
console.log(`openapi v${spec.info?.version} -> ${totalOperaciones} operaciones`);
console.log(`coleccion: ${totalRequests} requests en ${carpetas.length} carpetas`);
console.log(resumen);
console.log(`escrito: ${path.relative(ROOT, COLLECTION_PATH)}`);
console.log(`escrito: ${path.relative(ROOT, ENVIRONMENT_PATH)}`);
