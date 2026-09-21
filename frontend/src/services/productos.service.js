import { request } from "../api/client.js";

// Funciones del catalogo de productos (panel principal, RF87-RF94).

/**
 * Lista productos con paginacion y filtros opcionales.
 * Solo envia los parametros que tienen valor.
 * @param {{ page?: number, limit?: number, nombre?: string, categoria?: string, vendedor?: string }} opciones
 */
export const listarProductos = ({
  page = 1,
  limit = 12,
  nombre = "",
  categoria = "",
  vendedor = "",
} = {}) => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (nombre.trim() !== "") params.set("nombre", nombre.trim());
  if (categoria.trim() !== "") params.set("categoria", categoria.trim());
  if (vendedor.trim() !== "") params.set("vendedor", vendedor.trim());

  return request(`/api/productos?${params.toString()}`);
};

// Detalle publico de un producto (RF78/RF79).
export const obtenerProducto = (id) => request(`/api/productos/${id}`);

// Categorias activas para el filtro del catalogo.
export const listarCategorias = () => request("/api/categorias");

// Productos del vendedor autenticado (RF54, requiere JWT de vendedor).
export const listarMisProductos = () => request("/api/productos/mis-productos");

/**
 * Indica si un valor debe incluirse en el FormData (no vacio ni nulo).
 * @param {*} valor
 * @returns {boolean}
 */
function tieneValor(valor) {
  return valor !== undefined && valor !== null && String(valor).trim() !== "";
}

/**
 * Construye el FormData de un producto para la API (multipart).
 * Solo agrega los campos con valor y la imagen unicamente cuando existe.
 * Contrato del backend (POST/PUT /api/productos): "nombre", "descripcion",
 * "precio", "stock", "categoria" (nombre de la categoria, no su id) y
 * "descuento"; el estado Disponible/Agotado lo calcula la base de datos.
 * @param {object} datos Campos del producto
 * @param {File|null|undefined} imagen Archivo de imagen seleccionado
 * @returns {FormData}
 */
function construirFormDataProducto(datos = {}, imagen) {
  const formData = new FormData();
  const { nombre, descripcion, precio, stock, categoria, descuento } = datos;

  if (tieneValor(nombre)) formData.append("nombre", String(nombre).trim());
  if (tieneValor(descripcion)) formData.append("descripcion", String(descripcion).trim());
  if (tieneValor(precio)) formData.append("precio", String(precio));
  if (tieneValor(stock)) formData.append("stock", String(stock));
  if (tieneValor(categoria)) formData.append("categoria", String(categoria).trim());
  if (tieneValor(descuento)) formData.append("descuento", String(descuento));
  if (imagen) formData.append("imagen", imagen);

  return formData;
}

/**
 * Crea un producto del vendedor autenticado (POST /api/productos, RF45/RF46/RF48).
 * La imagen es obligatoria al crear y el estado del producto lo calcula la BD.
 * @param {object} datos Campos del producto
 * @param {File} imagen Archivo de imagen
 * @returns {Promise<{success: boolean, data: {id: number, mensaje: string}}>}
 */
export const crearProducto = (datos, imagen) =>
  request("/api/productos", {
    method: "POST",
    body: construirFormDataProducto(datos, imagen),
    isForm: true,
  });

/**
 * Actualiza un producto propio del vendedor autenticado (PUT /api/productos/:id, RF49).
 * Los campos omitidos conservan su valor actual y la imagen es opcional.
 * @param {number|string} id Identificador del producto
 * @param {object} datos Campos a actualizar
 * @param {File|null|undefined} imagen Nueva imagen (opcional)
 * @returns {Promise<{success: boolean, data: {mensaje: string}}>}
 */
export const actualizarProducto = (id, datos, imagen) =>
  request(`/api/productos/${id}`, {
    method: "PUT",
    body: construirFormDataProducto(datos, imagen),
    isForm: true,
  });
