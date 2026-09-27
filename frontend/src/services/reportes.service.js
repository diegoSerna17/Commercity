import { request } from "../api/client.js";

// Reportes de productos y usuarios (RF62/RF63, RF79, RF101).

/**
 * Crea un reporte contra POST /api/reportes con evidencia multipart.
 * El informante lo determina el backend desde el token JWT, nunca desde el body.
 * Solo se agregan al FormData los campos que tienen valor; la evidencia es opcional.
 *
 * @param {object} datos - Datos del reporte
 * @param {"Producto"|"Usuario"} datos.tipo - Tipo de reporte
 * @param {string} datos.motivo - Motivo del reporte (maximo 2000 caracteres)
 * @param {number|string} [datos.productoId] - Producto reportado (obligatorio si tipo es "Producto")
 * @param {number|string} [datos.usuarioReportadoId] - Usuario reportado (obligatorio si tipo es "Usuario")
 * @param {File} [datos.evidencia] - Archivo de evidencia opcional
 * @returns {Promise<{success: boolean, message: string, data: {id: number}}>} Respuesta del backend
 */
export function crearReporte({
  tipo,
  motivo,
  productoId,
  usuarioReportadoId,
  evidencia,
} = {}) {
  const formData = new FormData();

  if (tipo) formData.append("tipo", tipo);
  if (motivo) formData.append("motivo", motivo);
  if (productoId !== undefined && productoId !== null && productoId !== "") {
    formData.append("producto_id", String(productoId));
  }
  if (
    usuarioReportadoId !== undefined &&
    usuarioReportadoId !== null &&
    usuarioReportadoId !== ""
  ) {
    formData.append("usuario_reportado_id", String(usuarioReportadoId));
  }
  if (evidencia) formData.append("evidencia", evidencia);

  return request("/api/reportes", {
    method: "POST",
    body: formData,
    isForm: true,
  });
}
