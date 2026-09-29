/**
 * Fotos reales de producto por categoria (RNF de contenido del catalogo).
 * Fuente: imagenes ya asignadas a los productos del seed del repositorio
 * (seed_commercity.sql), verificadas por HTTP (200 image/*).
 * Se usa como respaldo cuando la imagen del producto no carga: el producto
 * conserva su identidad por categoria y por id (determinista).
 */
export const FOTOS_PRODUCTO_POR_CATEGORIA = {
  "Computación": [
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop",
  ],
  "Electrodomésticos": [
    "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=300&h=300&fit=crop",
  ],
  "Celulares": [
    "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop",
  ],
  "Calzado": [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1539185441755-769473a23570?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=300&h=300&fit=crop",
  ],
  "Deportes": [
    "https://images.unsplash.com/photo-1614632537190-23e4146777db?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1517438322307-e67111335449?w=300&h=300&fit=crop",
  ],
  "Moda": [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300&h=300&fit=crop",
  ],
  "Hogar": [
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1583845112203-29329902332e?w=300&h=300&fit=crop",
  ],
  "Tecnología": [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=300&h=300&fit=crop",
  ],
  "Belleza": [
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=300&h=300&fit=crop",
  ],
  "Mascotas": [
    "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=300&h=300&fit=crop",
  ],
  "Juguetes": [
    "https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=300&h=300&fit=crop",
  ],
  "Libros y Papelería": [
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&h=300&fit=crop",
  ],
  "Salud y Bienestar": [
    "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop",
  ],
  "Ferretería": [
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=300&h=300&fit=crop",
  ],
  "Audio": [
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&h=300&fit=crop",
  ],
  "Videojuegos": [
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=300&h=300&fit=crop",
  ],
};

/** Normaliza el nombre de categoria para el emparejamiento (sin tildes, minusculas). */
function normalizarCategoria(categoria) {
  return String(categoria || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const INDICE_NORMALIZADO = Object.fromEntries(
  Object.entries(FOTOS_PRODUCTO_POR_CATEGORIA).map(([cat, fotos]) => [
    normalizarCategoria(cat),
    fotos,
  ])
);

/**
 * Devuelve una foto real y estable para un producto segun su categoria e id.
 * @param {string} categoria Nombre de la categoria del producto.
 * @param {number|string} id Id del producto (semilla para elegir la foto).
 * @returns {string|null} URL de la foto, o null si no hay fotos para esa categoria.
 */
export function fotoProductoPorCategoria(categoria, id) {
  const fotos = INDICE_NORMALIZADO[normalizarCategoria(categoria)];
  if (!fotos || fotos.length === 0) return null;
  const n = Number(id);
  const indice = Number.isFinite(n) && n > 0 ? n % fotos.length : 0;
  return fotos[indice];
}
