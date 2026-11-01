export function formatPrice(valor) {
  return "$" + valor.toLocaleString("es-CO");
}

/**
 * Precio con simbolo y sin decimales (redondea al peso).
 * Equivale a la copia que vivia en Header, FichaProducto y PerfilVendedor.
 */
export function formatPriceRounded(valor) {
  return "$" + Math.round(valor).toLocaleString("es-CO");
}

/**
 * Cifra sin simbolo de moneda para conteos y campos de entrada.
 * Equivale a la copia que vivia en PanelControl y AgregarProducto.
 */
export function formatNumber(valor) {
  return Number(valor || 0).toLocaleString("es-CO");
}
