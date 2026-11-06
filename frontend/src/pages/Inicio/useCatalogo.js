import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listarProductos } from "../../services/productos.service.js";
import { mapearProducto } from "../../utils/mapearProducto.js";

// JS Cantidad de productos que se piden por pagina a la API.
export const LIMITE_PRODUCTOS = 12;

/**
 * Catalogo paginado de la pagina de inicio: lee los filtros de la URL,
 * consulta GET /api/productos y acumula las paginas siguientes.
 * @returns {{
 *   busqueda: string,
 *   categoria: string,
 *   productos: Array<object>,
 *   pagina: number,
 *   totalPaginas: number,
 *   totalProductos: number,
 *   hayPaginaSiguiente: boolean,
 *   cargando: boolean,
 *   cargandoMas: boolean,
 *   error: string,
 *   cargarProductos: (numeroPagina: number) => Promise<void>,
 *   cargarMasProductos: () => void
 * }}
 */
export function useCatalogo() {
  // JS Filtros del catalogo leidos de la URL: busqueda (buscador) y categoria.
  const [searchParams] = useSearchParams();
  const busqueda = searchParams.get("busqueda") || "";
  const categoria = searchParams.get("categoria") || "";

  // RE Estado del catalogo real: productos, paginacion, carga y error
  const [productos, setProductos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);
  const [hayPaginaSiguiente, setHayPaginaSiguiente] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");
  // RF87: descarta respuestas viejas si los filtros cambian mientras se carga.
  const solicitudRef = useRef(0);

  // JS Consulta el catalogo paginado contra GET /api/productos
  const cargarProductos = useCallback(async (numeroPagina) => {
    const solicitud = solicitudRef.current + 1;
    solicitudRef.current = solicitud;
    const primeraCarga = numeroPagina === 1;
    if (primeraCarga) setCargando(true);
    else setCargandoMas(true);
    setError("");

    try {
      const res = await listarProductos({
        page: numeroPagina,
        limit: LIMITE_PRODUCTOS,
        nombre: busqueda,
        categoria,
      });
      if (solicitud !== solicitudRef.current) return;
      const data = res.data || {};
      const nuevos = (data.productos || []).map(mapearProducto);

      setProductos((actuales) => (primeraCarga ? nuevos : [...actuales, ...nuevos]));
      setPagina(data.pagina ?? numeroPagina);
      setTotalPaginas(data.totalPaginas ?? 1);
      setTotalProductos(data.totalProductos ?? nuevos.length);
      setHayPaginaSiguiente(Boolean(data.hayPaginaSiguiente));
    } catch (err) {
      if (solicitud !== solicitudRef.current) return;
      // Sin status significa que la peticion no llego al servidor
      setError(
        err.status
          ? err.message || "No se pudieron cargar los productos"
          : "No se pudo conectar con el servidor. Verifica que el backend este activo."
      );
      if (primeraCarga) setProductos([]);
    } finally {
      if (solicitud === solicitudRef.current) {
        setCargando(false);
        setCargandoMas(false);
      }
    }
  }, [busqueda, categoria]);

  useEffect(() => {
    cargarProductos(1);
  }, [cargarProductos]);

  const cargarMasProductos = () => {
    if (hayPaginaSiguiente && !cargandoMas) cargarProductos(pagina + 1);
  };

  return {
    busqueda,
    categoria,
    productos,
    pagina,
    totalPaginas,
    totalProductos,
    hayPaginaSiguiente,
    cargando,
    cargandoMas,
    error,
    cargarProductos,
    cargarMasProductos,
  };
}
