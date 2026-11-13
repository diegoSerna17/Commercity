/**
 * Utilidades financieras de CommerCity.
 * Integradas desde el modulo de Carlos Vidal (Pedidos y Pago) tras revision v1.0.
 * RF117/RF134: subtotal = precio / 1.19, IVA = subtotal x 0.19, reparto 90% vendedor / 10% comision.
 * RF117: el IVA se calcula en vuelo, nunca se persiste.
 * RF136: montos en pesos colombianos (COP), DECIMAL(12,2).
 */

export const IVA_RATE = 0.19;
export const COMISION_VENDEDOR = 0.9;
export const COMISION_PLATAFORMA = 0.1;

export const round2 = (valor) => Math.round((valor + Number.EPSILON) * 100) / 100;

/**
 * Calcula una linea del pedido a partir del precio base (ya incluye IVA),
 * el descuento porcentual y la cantidad.
 * @param {number} precio precio unitario final publicado (IVA incluido)
 * @param {number} descuentoPorcentaje 0-100
 * @param {number} cantidad
 * @returns {{precioFinal: number, subtotal: number, iva: number, total: number,
 *            montoVendedor: number, montoComision: number}}
 */
export function calcularLinea(precio, descuentoPorcentaje, cantidad) {
  const precioFinal = round2(precio * (1 - (descuentoPorcentaje || 0) / 100));
  const subtotal = round2((precioFinal * cantidad) / (1 + IVA_RATE));
  const iva = round2(subtotal * IVA_RATE);
  const total = round2(subtotal + iva);
  // Lote 3 (1.5.8): la comision se deriva del subtotal, no se redondea por
  // separado. Con subtotales de centavos, 90% + 10% redondeados podian sumar
  // un centavo de mas y romper la conciliacion 90/10.
  const montoVendedor = round2(subtotal * COMISION_VENDEDOR);
  return {
    precioFinal,
    subtotal,
    iva,
    total,
    montoVendedor,
    montoComision: round2(subtotal - montoVendedor),
  };
}

/**
 * Agrega los totales de un conjunto de lineas.
 * @param {Array<{subtotal: number, iva: number}>} lineas
 * @returns {{subtotal: number, iva: number, total: number}}
 */
export function calcularTotales(lineas) {
  const subtotal = round2(lineas.reduce((acc, l) => acc + l.subtotal, 0));
  const iva = round2(lineas.reduce((acc, l) => acc + l.iva, 0));
  return { subtotal, iva, total: round2(subtotal + iva) };
}
