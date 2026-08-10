/**
 * Adapta la respuesta del backend (/api/productos y /api/productos/:id) a la
 * forma que consumen Inicio.jsx y FichaProducto.jsx.
 * Integrado desde Carlos Perea (2026-08-09) y ajustado a los nombres de
 * campos reales del backend central (snake_case en listado y detalle).
 */

const avatarPorDefecto = (nombre) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    nombre || "Vendedor"
  )}&background=1a1a26&color=fff&bold=true&size=80&rounded=true`;

/**
 * @param {object} producto Producto tal cual lo devuelve el backend
 * @returns {object|null} Producto con la forma que espera la UI
 */
export function mapearProductoUI(producto) {
  if (!producto) return null;

  const vendedorId = producto.vendedor?.id ?? producto.vendedor_id;
  const vendedorNombre =
    producto.vendedor?.nombre ?? producto.vendedor ?? "Vendedor";
  const vendedorAvatar =
    producto.vendedor?.foto ?? producto.vendedor_foto ?? avatarPorDefecto(vendedorNombre);

  const descuento = Number(producto.descuento_porcentaje) || 0;
  const precioBase = Number(producto.precio) || 0;
  const precioFinal =
    descuento > 0 ? Math.round(precioBase - (precioBase * descuento) / 100) : precioBase;

  return {
    id: producto.id,
    name: producto.nombre,
    category: producto.categoria?.nombre ?? producto.categoria ?? "General",
    description: producto.descripcion,
    image: producto.imagen_url ?? producto.imagen,
    imageAlt: producto.nombre,
    precioBase,
    price: precioFinal,
    originalPrice: descuento > 0 ? precioBase : null,
    descuento,
    stock: Number(producto.stock) || 0,
    // RF86: estado (Disponible/Agotado) tal cual lo calcula la BD segun el stock
    estado: producto.estado,
    badge: descuento > 0 ? `-${descuento}%` : null,
    badgeBg: descuento > 0 ? "bg-figma-accent-blue" : null,
    vendedorId,
    vendedorNombre,
    vendedorAvatar,
    // RF49: calificacion del vendedor visible junto al producto
    calificacionVendedor: producto.vendedor?.calificacion_promedio ?? null,
  };
}
