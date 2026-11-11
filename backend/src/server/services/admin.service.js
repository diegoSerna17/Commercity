import bcrypt from "bcrypt";
import pool from "../config/db.js";
import {
  buscarCuentaCommercity,
  recifrarCuentaBancariaSiEsLegado,
  cifrarCampo,
  buildPrivateRecord,
  buildPublicRecord,
} from "../utils/cuentaBancaria.js";
import { registrarAuditoria, ACCIONES } from "../utils/auditoria.js";
import { destinoPedidosVendedor } from "./pedidos.service.js";
import {
  capitalizar,
  escapeLike,
  mapearReporte,
  QUERY_REPORTES,
} from "../controllers/admin/admin.utils.js";

// ============================================================================
// Servicio del dominio administracion (RF55-RF59, RF68-RF76).
// Concentra el SQL de stats, usuarios, productos, reportes, buscador y cuenta
// bancaria de la plataforma. Los controladores validan, llaman y responden.
// `destinoPedidosVendedor` vive en services/pedidos.service.js por ser regla
// compartida con la baja del comprador.
// ============================================================================

/** Estadisticas del admin (RF55-RF59). */
export async function obtenerStats() {
  const [rows] = await pool.query(`
    SELECT
      (SELECT COUNT(DISTINCT ur.usuario_id) FROM usuario_roles ur
        JOIN roles r ON r.id = ur.rol_id WHERE r.nombre = 'vendedor') AS totalVendedores,
      (SELECT COUNT(DISTINCT ur.usuario_id) FROM usuario_roles ur
        JOIN roles r ON r.id = ur.rol_id WHERE r.nombre = 'comprador') AS totalCompradores,
      (SELECT COUNT(*) FROM productos WHERE eliminado_por_admin = 0) AS totalProductos,
      (SELECT COALESCE(SUM(monto_comision), 0) FROM detalle_pedidos
        WHERE estado_envio <> 'Cancelado') AS totalComisiones
  `);
  const s = rows[0];
  return {
    totalVendedores: Number(s.totalVendedores),
    totalCompradores: Number(s.totalCompradores),
    totalProductos: Number(s.totalProductos),
    totalComisiones: Number(s.totalComisiones),
  };
}

// Fix 4.4: el admin ve TODOS los productos (activos y suspendidos).
// B2 (auditoria 2026-11-04): listado paginado con LIMIT/OFFSET.
export async function listarProductosAdmin({ pagina, porPagina, soloActivos, q }) {
  const offset = (pagina - 1) * porPagina;
  const busqueda = q ? escapeLike(q) : null;

  const condiciones = [];
  const params = [];
  if (soloActivos) condiciones.push("p.eliminado_por_admin = 0");
  if (busqueda) {
    condiciones.push("(p.nombre LIKE ? OR v.nombre_completo LIKE ?)");
    params.push(busqueda, busqueda);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  const [[totalRow]] = await pool.query(
    `SELECT COUNT(*) AS total
       FROM productos p
       JOIN usuarios v ON v.id = p.vendedor_id
       ${where}`,
    params
  );
  const total = Number(totalRow?.total || 0);

  const [rows] = await pool.query(
    `SELECT p.id, p.nombre, p.precio, p.eliminado_por_admin, v.nombre_completo AS vendedor
       FROM productos p
       JOIN usuarios v ON v.id = p.vendedor_id
       ${where}
      ORDER BY p.id
      LIMIT ? OFFSET ?`,
    [...params, porPagina, offset]
  );

  return {
    productos: rows.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: Number(p.precio),
      vendedor: p.vendedor,
      suspendido: p.eliminado_por_admin === 1,
    })),
    total,
  };
}

// RF72/B-R3: suspension logica (nunca DELETE).
export async function suspenderProducto({ id, actorId, ip }) {
  const [result] = await pool.query(
    "UPDATE productos SET eliminado_por_admin = 1 WHERE id = ? AND eliminado_por_admin = 0",
    [id]
  );
  if (result.affectedRows === 0) return false;

  // M-11/B2: auditoria de la suspension (moderacion).
  await registrarAuditoria({
    actorId,
    accion: ACCIONES.PRODUCTO_SUSPENDIDO,
    objetivoTipo: "producto",
    objetivoId: id,
    ip,
  });
  return true;
}

// Fix 4.4: restaurar un producto suspendido por error del admin.
export async function restaurarProducto({ id, actorId, ip }) {
  const [result] = await pool.query(
    "UPDATE productos SET eliminado_por_admin = 0 WHERE id = ? AND eliminado_por_admin = 1",
    [id]
  );
  if (result.affectedRows === 0) return false;

  // M-11/B2: auditoria de la restauracion.
  await registrarAuditoria({
    actorId,
    accion: ACCIONES.PRODUCTO_RESTAURADO,
    objetivoTipo: "producto",
    objetivoId: id,
    ip,
  });
  return true;
}

export async function listarUsuariosAdmin({ pagina, porPagina, q }) {
  const offset = (pagina - 1) * porPagina;
  const busqueda = q ? escapeLike(String(q).trim()) : null;
  const where = busqueda ? "WHERE u.nombre_completo LIKE ? OR r.nombre LIKE ?" : "";
  const paramsQ = busqueda ? [busqueda, busqueda] : [];
  const [[totalRow]] = await pool.query(
    `SELECT COUNT(DISTINCT u.id) AS total
       FROM usuarios u
       LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
       LEFT JOIN roles r ON r.id = ur.rol_id
       ${where}`,
    paramsQ
  );
  const total = Number(totalRow?.total || 0);
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre_completo, u.email, u.activo,
            GROUP_CONCAT(r.nombre ORDER BY CASE r.nombre
              WHEN 'administrador' THEN 0 WHEN 'vendedor' THEN 1 ELSE 2 END) AS roles
       FROM usuarios u
       LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
       LEFT JOIN roles r ON r.id = ur.rol_id
       ${where}
       GROUP BY u.id ORDER BY u.id LIMIT ? OFFSET ?`,
    [...paramsQ, porPagina, offset]
  );

  return {
    usuarios: rows.map((u) => ({
      id: u.id,
      nombre: u.nombre_completo,
      email: u.email,
      rol: capitalizar((u.roles || "").split(",")[0]),
      estado: u.activo ? "activo" : "baneado",
    })),
    total,
  };
}

/**
 * M-11 (TASK-4.5): un admin no puede banearse/eliminarse a si mismo ni a otro
 * administrador, y el sistema protege al ultimo administrador activo.
 * @returns {Promise<{status:number,message:string}|null>} error o null si pasa
 */
async function validarObjetivoBaneable(id, actorId) {
  if (Number(id) === Number(actorId)) {
    return { status: 403, message: "No puedes banear tu propia cuenta" };
  }

  const [objetivo] = await pool.query(
    `SELECT u.id,
            MAX(CASE WHEN r.nombre = 'administrador' THEN 1 ELSE 0 END) AS es_admin
       FROM usuarios u
       LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
       LEFT JOIN roles r ON r.id = ur.rol_id
      WHERE u.id = ?
      GROUP BY u.id`,
    [id]
  );
  // Si no existe, el flujo de desactivacion responde 404 (no se duplica aqui).
  if (objetivo.length === 0) return null;

  if (Number(objetivo[0].es_admin) === 1) {
    const [admins] = await pool.query(
      `SELECT COUNT(DISTINCT u.id) AS total
         FROM usuarios u
         JOIN usuario_roles ur ON ur.usuario_id = u.id
         JOIN roles r ON r.id = ur.rol_id
        WHERE r.nombre = 'administrador' AND u.activo = 1`
    );
    const ultimoAdmin = Number(admins[0]?.total || 0) <= 1;
    return {
      status: 403,
      message: ultimoAdmin
        ? "No se puede banear al último administrador activo"
        : "No se puede banear a otro administrador",
    };
  }
  return null;
}

// Helper interno: banear al usuario (activo=0), suspender sus productos y
// resolver el destino de sus pedidos como vendedor (B-R5). Se asume que se
// ejecuta dentro de una transaccion abierta por el llamador.
async function aplicarBaneo(conn, id) {
  const [suspenso] = await conn.query(
    "UPDATE productos SET eliminado_por_admin = 1 WHERE vendedor_id = ? AND eliminado_por_admin = 0",
    [id]
  );
  const [result] = await conn.query(
    "UPDATE usuarios SET activo = 0, token_version = token_version + 1 WHERE id = ?",
    [id]
  );
  if (result.affectedRows === 0) throw new Error("USUARIO_NO_ENCONTRADO");
  const pedidos = await destinoPedidosVendedor(conn, id);
  return { suspendidos: Number(suspenso.affectedRows), ...pedidos };
}

// B-R4: "eliminar"/desactivar = siempre borrado logico (activo=0 + suspender
// productos + destino de pedidos). Abre su propia transaccion.
async function desactivarUsuario(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const motivo = await aplicarBaneo(conn, id);
    await conn.commit();
    return motivo;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * PATCH /api/admin/usuarios/:id/estado.
 * @returns {Promise<{ ok: true, mensaje: string, data: object } | { ok: false, status: number, mensaje: string }>}
 */
export async function cambiarEstadoUsuario({ id, estado, actorId, ip }) {
  if (estado === "activo") {
    // RF74: reactivar SOLO cambia activo=1; no restaura productos suspendidos.
    const [result] = await pool.query(
      "UPDATE usuarios SET activo = 1 WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return { ok: false, status: 404, mensaje: "Usuario no encontrado" };
    }
    // M-11: auditoria de reactivaciones.
    await registrarAuditoria({
      actorId,
      accion: ACCIONES.USUARIO_REACTIVADO,
      objetivoTipo: "usuario",
      objetivoId: id,
      ip,
    });
    return { ok: true, mensaje: "Usuario activado", data: { id, estado: "activo" } };
  }

  // M-11: protecciones antes de banear (self / otros admins / ultimo admin).
  const proteccion = await validarObjetivoBaneable(id, actorId);
  if (proteccion) {
    return { ok: false, status: proteccion.status, mensaje: proteccion.message };
  }

  try {
    const motivo = await desactivarUsuario(id);
    await registrarAuditoria({
      actorId,
      accion: ACCIONES.USUARIO_BANEADO,
      objetivoTipo: "usuario",
      objetivoId: id,
      detalle: motivo,
      ip,
    });
    return { ok: true, mensaje: "Usuario baneado", data: { id, estado: "baneado", motivo } };
  } catch (err) {
    if (err.message === "USUARIO_NO_ENCONTRADO") {
      return { ok: false, status: 404, mensaje: "Usuario no encontrado" };
    }
    throw err;
  }
}

/**
 * DELETE /api/admin/usuarios/:id (borrado logico).
 * @returns {Promise<{ ok: true, mensaje: string, data: object } | { ok: false, status: number, mensaje: string }>}
 */
export async function eliminarUsuarioAdmin({ id, actorId, ip }) {
  // M-11: mismas protecciones que el baneo (self / otros admins / ultimo admin).
  const proteccion = await validarObjetivoBaneable(id, actorId);
  if (proteccion) {
    return { ok: false, status: proteccion.status, mensaje: proteccion.message };
  }

  // B-R4: prohibido el borrado fisico; "eliminar" = desactivacion logica.
  try {
    const motivo = await desactivarUsuario(id);
    await registrarAuditoria({
      actorId,
      accion: ACCIONES.USUARIO_BANEADO,
      objetivoTipo: "usuario",
      objetivoId: id,
      detalle: { ...motivo, origen: "eliminar" },
      ip,
    });
    return { ok: true, mensaje: "Usuario desactivado", data: { id, estado: "baneado", motivo } };
  } catch (err) {
    if (err.message === "USUARIO_NO_ENCONTRADO") {
      return { ok: false, status: 404, mensaje: "Usuario no encontrado" };
    }
    throw err;
  }
}

export async function listarReportes({ pagina, porPagina, q, estado, incluirArchivados }) {
  const busqueda = q ? escapeLike(q) : null;

  const condiciones = [];
  const params = [];
  // A2 (P2): borrado logico. Por defecto se excluyen archivados (mig 011);
  // ?incluir_archivados=1 los incluye (moderacion).
  if (!incluirArchivados) {
    condiciones.push("r.archivado = 0");
  }
  if (estado) {
    condiciones.push("r.estado_reporte = ?");
    params.push(estado === "resuelto" ? "Resuelto" : "Pendiente");
  }
  if (busqueda) {
    condiciones.push(
      "(COALESCE(p.nombre, ru.nombre_completo) LIKE ? OR i.nombre_completo LIKE ? OR r.tipo_reporte LIKE ?)"
    );
    params.push(busqueda, busqueda, busqueda);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const offset = (pagina - 1) * porPagina;

  const [[totalRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM (${QUERY_REPORTES} ${where}) AS reportes_filtrados`,
    params
  );
  const total = Number(totalRow?.total || 0);

  const [rows] = await pool.query(
    `${QUERY_REPORTES} ${where} ORDER BY r.fecha_reporte DESC LIMIT ? OFFSET ?`,
    [...params, porPagina, offset]
  );

  return { reportes: rows.map(mapearReporte), total };
}

/** @returns {Promise<object|null>} reporte mapeado o null si no existe. */
export async function obtenerReporte(id) {
  const [rows] = await pool.query(`${QUERY_REPORTES} WHERE r.id = ?`, [id]);
  if (rows.length === 0) return null;
  return mapearReporte(rows[0]);
}

// Fix 4.2: el reporte es historial de moderacion; se ARCHIVA, nunca se borra
// fisicamente. Requiere la columna archivado (migracion 011).
export async function archivarReporte({ id, actorId, ip }) {
  const [result] = await pool.query(
    "UPDATE reportes SET archivado = 1 WHERE id = ? AND archivado = 0",
    [id]
  );
  if (result.affectedRows === 0) return false;
  // M-11: auditoria del archivado (moderacion).
  await registrarAuditoria({
    actorId,
    accion: ACCIONES.REPORTE_ARCHIVADO,
    objetivoTipo: "reporte",
    objetivoId: id,
    ip,
  });
  return true;
}

export async function resolverReporte({ id, respuesta, actorId, ip }) {
  const [result] = await pool.query(
    `UPDATE reportes SET estado_reporte = 'Resuelto', respuesta_admin = ?, respondido_at = NOW()
      WHERE id = ? AND estado_reporte = 'Pendiente'`,
    [respuesta, id]
  );
  if (result.affectedRows === 0) return false;
  // M-11: auditoria de la resolucion (sin el texto de la respuesta).
  await registrarAuditoria({
    actorId,
    accion: ACCIONES.REPORTE_RESUELTO,
    objetivoTipo: "reporte",
    objetivoId: id,
    detalle: { largo_respuesta: respuesta.length },
    ip,
  });
  return true;
}

// RF69-RF71: buscador unificado admin. Intenta FULLTEXT (MATCH...AGAINST) y
// cae al fallback LIKE (escapado) si el indice no existe. `scope` permite
// filtrar a usuario|producto|all (default all).
export async function buscarAdmin({ q, scope }) {
  if (!q) return { usuarios: [], productos: [] };
  const like = escapeLike(q);

  const fulltextProductos = `
    SELECT p.id, p.nombre, p.precio, v.nombre_completo AS vendedor
      FROM productos p
      JOIN usuarios v ON v.id = p.vendedor_id
     WHERE p.eliminado_por_admin = 0
       AND MATCH(p.nombre, p.descripcion) AGAINST(? IN NATURAL LANGUAGE MODE)
     ORDER BY p.id LIMIT 20`;

  const fulltextUsuarios = `
    SELECT u.id, u.nombre_completo, u.email, u.activo,
           GROUP_CONCAT(r.nombre ORDER BY CASE r.nombre
             WHEN 'administrador' THEN 0 WHEN 'vendedor' THEN 1 ELSE 2 END) AS roles
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
      LEFT JOIN roles r ON r.id = ur.rol_id
     WHERE MATCH(u.nombre_completo, u.email) AGAINST(? IN NATURAL LANGUAGE MODE)
     GROUP BY u.id ORDER BY u.id LIMIT 20`;

  const likeProductos = `
    SELECT p.id, p.nombre, p.precio, v.nombre_completo AS vendedor
      FROM productos p
      JOIN usuarios v ON v.id = p.vendedor_id
     WHERE p.eliminado_por_admin = 0
       AND (p.nombre LIKE ? OR v.nombre_completo LIKE ?)
     ORDER BY p.id LIMIT 20`;

  const likeUsuarios = `
    SELECT u.id, u.nombre_completo, u.email, u.activo,
           GROUP_CONCAT(r.nombre ORDER BY CASE r.nombre
             WHEN 'administrador' THEN 0 WHEN 'vendedor' THEN 1 ELSE 2 END) AS roles
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
      LEFT JOIN roles r ON r.id = ur.rol_id
     WHERE u.nombre_completo LIKE ? OR r.nombre LIKE ?
     GROUP BY u.id ORDER BY u.id LIMIT 20`;

  const mapearUsuarios = (rows) =>
    rows.map((u) => ({
      id: u.id,
      nombre: u.nombre_completo,
      email: u.email,
      rol: capitalizar((u.roles || "").split(",")[0]),
      estado: u.activo ? "activo" : "baneado",
    }));
  const mapearProductos = (rows) =>
    rows.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: Number(p.precio),
      vendedor: p.vendedor,
    }));

  const resultado = { usuarios: [], productos: [] };

  if (scope !== "producto") {
    try {
      const [rows] = await pool.query(fulltextUsuarios, [q]);
      resultado.usuarios = mapearUsuarios(rows);
    } catch (_err) {
      const [rows] = await pool.query(likeUsuarios, [like, like]);
      resultado.usuarios = mapearUsuarios(rows);
    }
  }

  if (scope !== "usuario") {
    try {
      const [rows] = await pool.query(fulltextProductos, [q]);
      resultado.productos = mapearProductos(rows);
    } catch (_err) {
      const [rows] = await pool.query(likeProductos, [like, like]);
      resultado.productos = mapearProductos(rows);
    }
  }

  return resultado;
}

/**
 * GET /api/admin/mi-cuenta-bancaria - Cuenta de Commercity ENMASCARADA por
 * defecto (B-7). El numero y el titular completos solo se devuelven con el
 * parametro explicito ?revelar=completa.
 */
export async function obtenerCuentaCommercity({ revelarCompleta }) {
  const fila = await recifrarCuentaBancariaSiEsLegado(await buscarCuentaCommercity());
  if (!fila) {
    return {
      mensaje: "Sin cuenta bancaria de Commercity registrada",
      data: { registrado: false, datos: null },
    };
  }
  if (revelarCompleta) {
    return {
      mensaje: "Cuenta bancaria de Commercity obtenida",
      data: { registrado: true, datos: buildPrivateRecord(fila) },
    };
  }
  return {
    mensaje: "Cuenta bancaria de Commercity (enmascarada)",
    data: { registrado: true, datos: buildPublicRecord(fila) },
  };
}

/**
 * POST/PUT /api/admin/mi-cuenta-bancaria - Upsert de la cuenta de Commercity.
 * El registro se crea/actualiza SIEMPRE con es_commercity = 1 (RF76).
 * @returns {Promise<{ ok: true, mensaje: string, data: object, status: number } | { ok: false, status: number, mensaje: string }>}
 */
export async function guardarCuentaCommercity({ usuarioId, data, ip }) {
  const conn = await pool.getConnection();
  try {
    // M-12 (TASK-4.5): step-up obligatorio con la contrasena del administrador
    // (la cuenta de la plataforma recibe la comision del 10%).
    const [adminFila] = await pool.query(
      "SELECT password FROM usuarios WHERE id = ? LIMIT 1",
      [usuarioId]
    );
    const passwordValida =
      adminFila.length > 0 && (await bcrypt.compare(data.password, adminFila[0].password));
    if (!passwordValida) {
      return { ok: false, status: 403, mensaje: "Contraseña incorrecta (operación sensible)" };
    }

    // M-10: v2 con AAD = usuario_id (el admin registrador).
    const encryptedTitular = cifrarCampo(data.titular_nombre, usuarioId);
    const encryptedNumero = cifrarCampo(data.numero_cuenta, usuarioId);

    await conn.beginTransaction();
    const [existing] = await conn.query(
      "SELECT id FROM datos_bancarios WHERE es_commercity = 1 LIMIT 1"
    );

    if (existing.length === 0) {
      await conn.query(
        `INSERT INTO datos_bancarios
           (usuario_id, titular_nombre, banco, tipo_cuenta, numero_cuenta, es_commercity)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [usuarioId, encryptedTitular, data.banco, data.tipo_cuenta, encryptedNumero]
      );
    } else {
      await conn.query(
        `UPDATE datos_bancarios
            SET usuario_id = ?, titular_nombre = ?, banco = ?, tipo_cuenta = ?,
                numero_cuenta = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND es_commercity = 1`,
        [usuarioId, encryptedTitular, data.banco, data.tipo_cuenta, encryptedNumero, existing[0].id]
      );
    }

    await conn.commit();

    const fila = await buscarCuentaCommercity();
    // M-11: auditoria del cambio de la cuenta de la plataforma (sin datos sensibles).
    await registrarAuditoria({
      actorId: usuarioId,
      accion: ACCIONES.CUENTA_PLATAFORMA_CAMBIADA,
      objetivoTipo: "datos_bancarios",
      objetivoId: fila?.id ?? existing[0]?.id ?? null,
      detalle: {
        banco: data.banco,
        tipo_cuenta: data.tipo_cuenta,
        es_actualizacion: existing.length > 0,
      },
      ip,
    });

    return {
      ok: true,
      mensaje:
        existing.length === 0
          ? "Cuenta bancaria de Commercity registrada correctamente."
          : "Cuenta bancaria de Commercity actualizada correctamente.",
      data: { registrado: true, es_actualizacion: existing.length > 0, datos: buildPrivateRecord(fila) },
      status: existing.length === 0 ? 201 : 200,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
