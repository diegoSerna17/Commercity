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
