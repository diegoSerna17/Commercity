import { formatNumber } from "./formatPrice.js";

/**
 * Convierte el texto del input de precio ("25.000") al entero que espera la
 * API. Vacio o sin digitos -> NaN (el formulario lo marca como invalido).
 * @param {string} valor
 * @returns {number}
 */
export function limpiarPrecio(valor) {
  const soloNumeros = (valor || "").replace(/\./g, "").replace(/[^0-9]/g, "");
  return soloNumeros === "" ? NaN : parseInt(soloNumeros, 10);
}

/**
 * Valores iniciales del formulario de producto.
 * @param {object|null} producto Producto a editar (null al crear)
 * @returns {{nombre: string, descripcion: string, precioTexto: string, stock: string, descuento: string, categoria: string}}
 */
export function valoresInicialesProducto(producto) {
  return {
    nombre: producto?.nombre ?? "",
    descripcion: producto?.descripcion ?? "",
    precioTexto:
      producto?.precio != null
        ? formatNumber(Math.round(Number(producto.precio)))
        : "",
    stock: producto?.stock != null ? String(producto.stock) : "",
    descuento: producto?.descuento_porcentaje
      ? String(producto.descuento_porcentaje)
      : "",
    categoria: producto?.categoria_nombre ?? "",
  };
}
