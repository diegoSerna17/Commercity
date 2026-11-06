import { formatPriceRounded } from "./formatPrice.js";

export function formatCOP(amount) {
  return formatPriceRounded(amount);
}

export function numProductosLabel(productos) {
  const n = productos.length;
  return n === 1 ? "1 producto" : `${n} productos`;
}