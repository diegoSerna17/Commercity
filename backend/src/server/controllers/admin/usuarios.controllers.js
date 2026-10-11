import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import { validarId, capitalizar, escapeLike } from "./admin.utils.js";
import { destinoPedidosVendedor } from "./pedidos.controllers.js";
import { registrarAuditoria, ACCIONES } from "../../utils/auditoria.js";

export const getUsuarios = async (req, res, next) => {
  try {
    const q = req.query.q ? escapeLike(String(req.query.q).trim()) : null;
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre_completo, u.email, u.activo,
              GROUP_CONCAT(r.nombre ORDER BY CASE r.nombre
                WHEN 'administrador' THEN 0 WHEN 'vendedor' THEN 1 ELSE 2 END) AS roles
         FROM usuarios u
         LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
         LEFT JOIN roles r ON r.id = ur.rol_id
         ${q ? "WHERE u.nombre_completo LIKE ? OR r.nombre LIKE ?" : ""}
         GROUP BY u.id ORDER BY u.id`,
      q ? [q, q] : []
    );
    return successResponse(res, "Lista de usuarios", rows.map((u) => ({
      id: u.id,
      nombre: u.nombre_completo,
      email: u.email,
      rol: capitalizar((u.roles || "").split(",")[0]),
      estado: u.activo ? "activo" : "baneado",
    })));
  } catch (err) {
    next(err);
  }
};

/**
 * M-11 (TASK-4.5): un admin no puede banearse/eliminarse a si mismo ni a otro
 * administrador, y el sistema protege al ultimo administrador activo.
 * @param {number} id objetivo
 * @param {number} actorId admin autenticado
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
export const desactivarUsuario = async (id) => {
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
};

export const cambiarEstadoUsuario = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body ?? {};
    if (!validarId(id)) return errorResponse(res, "ID inválido", 400);
    if (!["activo", "baneado"].includes(estado))
      return errorResponse(res, "Estado inválido (activo|baneado)", 400);

    if (estado === "activo") {
      // RF74: reactivar SOLO cambia activo=1; no restaura productos suspendidos.
      const [result] = await pool.query(
        "UPDATE usuarios SET activo = 1 WHERE id = ?",
        [id]
      );
      if (result.affectedRows === 0)
        return errorResponse(res, "Usuario no encontrado", 404);
      // M-11: auditoria de reactivaciones.
      await registrarAuditoria({
        actorId: req.userId,
        accion: ACCIONES.USUARIO_REACTIVADO,
        objetivoTipo: "usuario",
        objetivoId: id,
        ip: req.ip,
      });
      return successResponse(res, "Usuario activado", { id, estado: "activo" });
    }

    // M-11: protecciones antes de banear (self / otros admins / ultimo admin).
    const proteccion = await validarObjetivoBaneable(id, req.userId);
    if (proteccion) return errorResponse(res, proteccion.message, proteccion.status);

    try {
      const motivo = await desactivarUsuario(id);
      await registrarAuditoria({
        actorId: req.userId,
        accion: ACCIONES.USUARIO_BANEADO,
        objetivoTipo: "usuario",
        objetivoId: id,
        detalle: motivo,
        ip: req.ip,
      });
      return successResponse(res, "Usuario baneado", { id, estado: "baneado", motivo });
    } catch (err) {
      if (err.message === "USUARIO_NO_ENCONTRADO")
        return errorResponse(res, "Usuario no encontrado", 404);
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const eliminarUsuario = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!validarId(id)) return errorResponse(res, "ID inválido", 400);

    // M-11: mismas protecciones que el baneo (self / otros admins / ultimo admin).
    const proteccion = await validarObjetivoBaneable(id, req.userId);
    if (proteccion) return errorResponse(res, proteccion.message, proteccion.status);

    // B-R4: prohibido el borrado fisico; "eliminar" = desactivacion logica.
    try {
      const motivo = await desactivarUsuario(id);
      await registrarAuditoria({
        actorId: req.userId,
        accion: ACCIONES.USUARIO_BANEADO,
        objetivoTipo: "usuario",
        objetivoId: id,
        detalle: { ...motivo, origen: "eliminar" },
        ip: req.ip,
      });
      return successResponse(res, "Usuario desactivado", { id, estado: "baneado", motivo });
    } catch (err) {
      if (err.message === "USUARIO_NO_ENCONTRADO")
        return errorResponse(res, "Usuario no encontrado", 404);
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
