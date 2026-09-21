import { useCallback, useEffect, useState } from "react";
import Header from "../../components/globales/Header";
import PasarelaPago from "./PasarelaPago";
import { getCurrentUser } from "../../api/client.js";
import {
  eliminarProducto,
  listarCarrito,
  modificarCantidad,
} from "../../services/carrito.service.js";
import { obtenerResumenPedido } from "../../services/pedidos.service.js";

/** Icono de la accion eliminar producto del carrito. */
function IconoEliminar() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 4.5h16M6 4.5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5M7.5 9v6M10.5 9v6M2.5 4.5l1 12a1 1 0 0 0 1 .9h9a1 1 0 0 0 1-.9l1-12"
        stroke="var(--color-brand-muted-text)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Icono de respaldo para productos que no tienen imagen cargada. */
function IconoProducto() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-muted-text)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function formatPeso(valor) {
  return "$" + Math.round(valor).toLocaleString("es-CO");
}

export default function Carrito() {
  // El comprador sale de la sesion (login real); el carrito no usa JWT, usa id.
  const compradorId = getCurrentUser()?.id;
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mostrarPago, setMostrarPago] = useState(false);
  const [totales, setTotales] = useState(null);

  /** Carga el carrito real desde GET /api/carrito y aplana los grupos. */
  const cargarCarrito = useCallback(async () => {
    if (!compradorId) {
      setProductos([]);
      setCargando(false);
      setError("Inicia sesión para ver tu carrito");
      return;
    }

    setCargando(true);
    try {
      const res = await listarCarrito(compradorId);
      const items = (res.data?.vendedores ?? []).flatMap((vendedor) =>
        vendedor.items.map((item) => ({
          id: item.producto_id,
          nombre: item.nombre,
          vendedor: vendedor.vendedor_nombre,
          precioUnitario: item.precio_final,
          precioOriginal: item.descuento_porcentaje > 0 ? item.precio : null,
          cantidad: item.cantidad,
          imagenUrl: item.imagen_url,
        }))
      );
      setProductos(items);
      setError("");
    } catch (err) {
      setProductos([]);
      setError(err.message || "No se pudo cargar el carrito");
    } finally {
      setCargando(false);
    }
  }, [compradorId]);

  useEffect(() => {
    cargarCarrito();
  }, [cargarCarrito]);

  async function cambiarCantidad(productoId, cantidad) {
    if (cantidad < 1) {
      return eliminar(productoId);
    }
    try {
      await modificarCantidad(compradorId, productoId, cantidad);
      await cargarCarrito();
    } catch (err) {
      setError(err.message || "No se pudo actualizar la cantidad");
    }
  }

  async function eliminar(productoId) {
    try {
      await eliminarProducto(compradorId, productoId);
      await cargarCarrito();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el producto");
    }
  }

  /** Abre la pasarela con los totales reales de GET /api/pedidos/resumen. */
  async function abrirPasarela() {
    try {
      const res = await obtenerResumenPedido();
      setTotales(res.data?.totales ?? null);
      setError("");
      setMostrarPago(true);
    } catch (err) {
      setError(err.message || "No se pudo obtener el resumen del pedido");
    }
  }

  /** Tras el pago confirmado el backend ya vacio el carrito: solo se recarga. */
  function finalizarCompra() {
    setMostrarPago(false);
    setTotales(null);
    cargarCarrito();
  }

  const totalArticulos = productos.reduce(
    (acc, p) => acc + (p.precioOriginal ?? p.precioUnitario) * p.cantidad,
    0
  );

  const descuentos = productos.reduce(
    (acc, p) =>
      p.precioOriginal
        ? acc + (p.precioOriginal - p.precioUnitario) * p.cantidad
        : acc,
    0
  );

  const total = productos.reduce(
    (acc, p) => acc + p.precioUnitario * p.cantidad,
    0
  );

  const carritoVacio = productos.length === 0;

  return (
    <div className="flex h-dvh bg-surface-container-lowest overflow-hidden">
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header showSearch={false} />

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-6 md:py-8">
          <div className="w-[450px] sm:w-[600px] lg:w-[700px] xl:w-[800px] max-w-[1000px] mx-auto">

            <h1 className="font-sans font-extrabold text-2xl sm:text-3xl tracking-tight text-brand-orange mb-7">
              Carrito de Compras
            </h1>

            {error && (
              <p className="text-report-red-text font-medium text-sm mb-4">
                {error}
              </p>
            )}

            {cargando ? (
              <div className="flex flex-col items-center py-20 text-brand-muted-text gap-4">
                <p className="text-lg font-semibold">Cargando tu carrito...</p>
              </div>
            ) : carritoVacio ? (
              <div className="flex flex-col items-center py-20 text-brand-muted-text gap-4">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-muted-text)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <p className="text-lg font-semibold">Tu carrito está vacío</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mb-8">
                {productos.map((producto) => {
                  const precioLinea = producto.precioUnitario * producto.cantidad;
                  const precioOriginalLinea = producto.precioOriginal
                    ? producto.precioOriginal * producto.cantidad
                    : null;

                  return (
                    <div
                      key={producto.id}
                      className="bg-auth-card-bg rounded-card-lg relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-4"
                    >
                      <button
                        onClick={() => eliminar(producto.id)}
                        className="absolute top-3 right-4 text-brand-muted-text hover:text-error transition-colors flex items-center justify-center"
                        aria-label="Eliminar producto"
                      >
                        <IconoEliminar />
                      </button>

                      <div className="flex items-center gap-4 pr-8 sm:pr-0 sm:flex-1 min-w-0">
                        <div className="flex-shrink-0 w-[70px] h-[70px] flex items-center justify-center rounded-card overflow-hidden bg-input-bg">
                          {producto.imagenUrl ? (
                            <img
                              src={producto.imagenUrl}
                              alt={producto.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <IconoProducto />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-on-surface text-base sm:text-lg leading-snug">
                            {producto.nombre}
                          </p>
                          <p className="text-brand-muted-text font-extrabold text-sm mb-1">
                            {producto.vendedor}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-brand-orange font-medium text-lg">
                              {formatPeso(precioLinea)}
                            </span>
                            {precioOriginalLinea && (
                              <span className="text-figma-accent-blue text-sm line-through">
                                {formatPeso(precioOriginalLinea)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-figma-divider sm:hidden" />

                      <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 sm:ml-auto">
                        <span className="text-brand-muted-text text-xs font-extrabold tracking-widest uppercase whitespace-nowrap">
                          CANTIDAD
                        </span>
                        <div className="flex items-center">
                          <button
                            onClick={() =>
                              cambiarCantidad(producto.id, producto.cantidad - 1)
                            }
                            className="w-9 h-9 sm:w-8 sm:h-8 bg-input-bg border-2 border-figma-divider text-on-surface font-medium text-xl flex items-center justify-center hover:bg-surface-container-highest active:scale-95 transition-all"
                          >
                            −
                          </button>
                          <div className="w-9 h-9 sm:w-8 sm:h-8 bg-auth-card-bg border-2 border-figma-divider text-on-surface font-medium text-base flex items-center justify-center">
                            {producto.cantidad}
                          </div>
                          <button
                            onClick={() =>
                              cambiarCantidad(producto.id, producto.cantidad + 1)
                            }
                            className="w-9 h-9 sm:w-8 sm:h-8 bg-input-bg border-2 border-figma-divider text-on-surface font-medium text-xl flex items-center justify-center hover:bg-surface-container-highest active:scale-95 transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!cargando && !carritoVacio && (
              <>
                <div className="h-px bg-figma-divider mb-5" />

                <div className="flex flex-col gap-1 mb-8">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-brand-muted-text font-extrabold text-lg sm:text-xl">
                      Total de artículos
                    </span>
                    <span className="text-brand-muted-text font-extrabold text-lg sm:text-xl">
                      {formatPeso(totalArticulos)}
                    </span>
                  </div>

                  {descuentos > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-brand-muted-text font-extrabold text-lg sm:text-xl">
                        Descuentos aplicados
                      </span>
                      <span className="text-figma-accent-blue font-extrabold text-lg sm:text-xl">
                        − {formatPeso(descuentos)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-1">
                    <span className="text-on-surface font-extrabold text-xl sm:text-2xl">
                      Total
                    </span>
                    <span className="text-brand-orange font-extrabold text-xl sm:text-2xl">
                      {formatPeso(total)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={abrirPasarela}
                  className="w-full bg-brand-orange text-brand-dark-text font-bold text-xl sm:text-2xl py-4 rounded-hero shadow-lg hover:bg-primary-container active:scale-95 transition-all duration-150"
                >
                  Comprar
                </button>
              </>
            )}

          </div>
        </div>
      </main>

      {mostrarPago && (
        <PasarelaPago
          totales={totales}
          onCancelar={() => setMostrarPago(false)}
          onPagoExitoso={finalizarCompra}
        />
      )}
    </div>
  );
}
