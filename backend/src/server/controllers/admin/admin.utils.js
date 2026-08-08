/**
 * Utilidades del modulo admin (integradas desde AVANCES/SPRING 1/JUAN CABRERA).
 */

export const validarId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

export const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const escapeLike = (q) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export const formatFecha = (d) =>
  d
    ? new Date(d)
        .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        .replace(/\s(\d{4})$/, ", $1")
    : "";

export const mapearReporte = (r) => ({
  id: r.id,
  tipo: r.tipo_reporte === "Producto" ? "producto" : "usuario",
  reportado:
    r.tipo_reporte === "Producto" ? r.producto_nombre : r.usuario_reportado_nombre,
  reportadoId:
    r.tipo_reporte === "Producto" ? r.producto_id : r.usuario_reportado_id,
  reportadoInfo: r.usuario_reportado_email || null,
  reportadoPrecio: r.producto_precio != null ? Number(r.producto_precio) : null,
  reportadoVendedor: r.producto_vendedor || null,
  reportadoPor: r.informante_nombre || "",
  reportadoPorInfo: r.informante_email || null,
  fecha: formatFecha(r.fecha_reporte),
  estado: r.estado_reporte === "Resuelto" ? "resuelto" : "pendiente",
  motivo: r.motivo || "",
  descripcion: r.motivo || "",
  evidencias: r.evidencia_url ? r.evidencia_url.split(",").filter(Boolean).length : 0,
  respuesta: r.respuesta_admin || "",
});

export const QUERY_REPORTES = `
  SELECT r.id, r.tipo_reporte, r.motivo, r.evidencia_url, r.estado_reporte,
         r.respuesta_admin, r.fecha_reporte, r.producto_id, r.usuario_reportado_id,
         p.nombre AS producto_nombre, p.precio AS producto_precio,
         pv.nombre_completo AS producto_vendedor,
         ru.nombre_completo AS usuario_reportado_nombre, ru.email AS usuario_reportado_email,
         i.nombre_completo AS informante_nombre, i.email AS informante_email
  FROM reportes r
  LEFT JOIN productos p  ON p.id = r.producto_id
  LEFT JOIN usuarios pv  ON pv.id = p.vendedor_id
  LEFT JOIN usuarios ru  ON ru.id = r.usuario_reportado_id
  LEFT JOIN usuarios i   ON i.id = r.informante_id`;
