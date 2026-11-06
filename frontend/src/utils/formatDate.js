/**
 * Formatos de fecha compartidos por historial y pedidos.
 * @param {string|Date} valor
 * @returns {{corta: string, larga: string}} fecha corta (dd mmm yyyy) y larga
 */
export function formatearFecha(valor) {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return { corta: "", larga: "" };

  return {
    corta: fecha.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    larga: fecha.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

/** Hora local HH:MM de un timestamp ISO (chat y notificaciones). */
export function formatearHora(iso) {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}
