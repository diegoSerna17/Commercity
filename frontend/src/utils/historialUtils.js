import { formatPriceRounded } from "./formatPrice.js";

export const IVA_RATE = 0.19;

export function formatCOP(amount) {
  return formatPriceRounded(amount);
}

export function calcSubtotal(productos) {
  return productos.reduce((sum, p) => sum + p.cantidad * p.precioUnit, 0);
}

export function calcIVA(subtotal) {
  return subtotal * IVA_RATE;
}

export function calcTotal(subtotal) {
  return subtotal + calcIVA(subtotal);
}

export function numProductosLabel(productos) {
  const n = productos.length;
  return n === 1 ? "1 producto" : `${n} productos`;
}