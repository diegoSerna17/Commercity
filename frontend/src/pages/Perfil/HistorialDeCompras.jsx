import { useState, useEffect, useCallback } from "react";
import Header from "../../components/globales/Header";
import { formatPrice } from "../../utils/formatPrice";

// API base del backend (misma convencion que el resto del proyecto).
const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:3000";

const FILTERS = ["Todo", "Pendiente", "En camino", "Entregado", "Cancelado"];

const ESTADOS_UI = {
  Entregado: { className: "bg-primary/20 text-primary", label: "Entregado" },
  "En camino": { className: "bg-accent-blue/20 text-accent-blue", label: "En camino" },
  Pendiente: { className: "bg-error-container/30 text-error", label: "Pendiente" },
  Cancelado: { className: "bg-surface-variant text-brand-muted-text", label: "Cancelado" },
};

/** Formatea una fecha DATETIME a "24 Oct, 2026". */
function formatFecha(d) {
  if (!d) return "-";
  const fecha = new Date(d);
  if (Number.isNaN(fecha.getTime())) return String(d);
  return fecha
    .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    .replace(/\s(\d{4})$/, ", $1");
}

/**
 * Historial de compras del comprador (RF26-RF32).
 * Consume GET /api/historial/compras con el token JWT.
 */
export default function HistorialDeCompras() {
  const [activeFilter, setActiveFilter] = useState("Todo");
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [sinSesion, setSinSesion] = useState(false);

  const cargarHistorial = useCallback(async () => {
    const token = localStorage.getItem("commercity_token") || null;
    if (!token) {
      setSinSesion(true);
      setCargando(false);
      return;
    }
    setSinSesion(false);
    setCargando(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE}/api/historial/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await resp.json().catch(() => null);
      if (!resp.ok) {
        setError(body?.error?.message || "Error al cargar el historial.");
      } else {
        setPedidos(body?.data || []);
      }
    } catch (e) {
      setError("Error de conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  // Filtro por estado (RF30) — aplicado en el cliente sobre el historial cargado.
  const orders = pedidos.filter(
    (p) => activeFilter === "Todo" || p.estado === activeFilter
  );

  const estados = (estado) => ESTADOS_UI[estado] || ESTADOS_UI.Pendiente;

  return (
    <div className="flex h-screen bg-surface-container-lowest overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title="Historial de compras" />

        <section className="flex-1 p-padding-md sm:p-padding-lg lg:p-padding-xl overflow-y-auto overflow-x-hidden">
          <div className="mb-padding-xl">
            <h2 className="text-headline-md font-bold text-on-surface">
              Historial de compras
            </h2>
            <p className="text-brand-muted-text mt-1">
              Visualiza y haz seguimiento de tus compras en el historial.
            </p>
          </div>

          {/* Filtros por estado (RF30) */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-padding-xl">
            {FILTERS.map((f) => {
              const active = f === activeFilter;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 sm:px-5 py-1.5 rounded-button font-semibold text-xs sm:text-sm transition-colors ${
                    active
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-surface-container-high text-brand-muted-text hover:bg-surface-container-highest"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>

          {/* Estados: SIN SESION */}
          {sinSesion && (
            <div className="rounded-card border border-surface-container bg-brand-dark-text px-6 py-12 text-center text-brand-muted-text text-sm">
              Inicia sesión para ver tu historial de compras.
            </div>
          )}

          {/* Estados: CARGANDO */}
          {!sinSesion && cargando && (
            <div className="rounded-card border border-surface-container bg-brand-dark-text px-6 py-12 text-center text-brand-muted-text text-sm">
              Cargando historial...
            </div>
          )}

          {/* Estados: ERROR */}
          {!sinSesion && !cargando && error && (
            <div className="rounded-card border border-error/40 bg-brand-dark-text px-6 py-12 text-center text-error text-sm">
              {error}
              <div className="mt-4">
                <button
                  onClick={cargarHistorial}
                  className="px-5 py-2 rounded-button font-semibold text-sm bg-primary-container text-on-primary-container"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Estados: VACIO */}
          {!sinSesion && !cargando && !error && orders.length === 0 && (
            <div className="rounded-card border border-surface-container bg-brand-dark-text px-6 py-12 text-center text-brand-muted-text text-sm">
              No hay pedidos para este filtro.
            </div>
          )}

          {/* Estados: SUCCESS — vista tarjetas (movil) */}
          {!sinSesion && !cargando && !error && orders.length > 0 && (
            <div className="flex flex-col gap-4 md:hidden">
              {orders.map((pedido) => {
                const status = estados(pedido.estado);
                return (
                  <div
                    key={pedido.pedido_id}
                    className="bg-surface-container-low border border-surface-container rounded-card p-4 flex flex-col gap-3"
                  >
                    {/* Cabecera del pedido */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-on-surface text-sm">
                          Pedido #{pedido.pedido_id}
                        </span>
                        <span className="text-brand-muted-text text-xs truncate">
                          {pedido.vendedores?.join(", ")}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Direccion de envio (RF31) */}
                    <p className="text-brand-muted-text text-xs">
                      Envío: {pedido.direccion || "-"}
                    </p>

                    {/* Items del pedido */}
                    {pedido.items?.map((item) => (
                      <div
                        key={item.detalle_id}
                        className="flex items-center gap-3 border-t border-surface-container/60 pt-3"
                      >
                        {item.imagen ? (
                          <img
                            src={item.imagen}
                            alt={item.producto}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-container-high shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-on-surface font-medium text-sm truncate">
                            {item.producto}
                          </p>
                          <p className="text-brand-muted-text text-xs">
                            {item.cantidad} x {formatPrice(item.precio_unitario)}
                          </p>
                        </div>
                        <span className="font-semibold text-on-surface text-sm">
                          {formatPrice(item.total)}
                        </span>
                      </div>
                    ))}

                    {/* Resumen del pedido (RF31: IVA + total) */}
                    <div className="border-t border-surface-container/60 pt-3 flex flex-col gap-1 text-xs">
                      <div className="flex justify-between text-brand-muted-text">
                        <span>Subtotal</span>
                        <span>{formatPrice(pedido.resumen?.subtotal || 0)}</span>
                      </div>
                      <div className="flex justify-between text-brand-muted-text">
                        <span>IVA (19%)</span>
                        <span>{formatPrice(pedido.resumen?.iva || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-on-surface text-sm">
                        <span>Total</span>
                        <span>{formatPrice(pedido.resumen?.total || 0)}</span>
                      </div>
                    </div>

                    <p className="text-brand-muted-text text-xs">
                      {formatFecha(pedido.fecha)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Estados: SUCCESS — tabla (desktop) */}
          {!sinSesion && !cargando && !error && orders.length > 0 && (
            <div className="hidden md:block rounded-card overflow-x-auto border border-surface-container bg-brand-dark-text">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-brand-muted-text uppercase bg-surface-variant2">
                    <th className="px-6 py-4 text-left">Pedido</th>
                    <th className="px-6 py-4 text-left">Producto</th>
                    <th className="px-6 py-4 text-center">Vendedor</th>
                    <th className="px-6 py-4 text-center">Fecha</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-center">Cantidad</th>
                    <th className="px-6 py-4 text-right">Precio unit.</th>
                    <th className="px-6 py-4 text-right">IVA 19%</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container/50">
                  {orders.map((pedido) =>
                    pedido.items?.map((item) => {
                      const status = estados(item.estado || pedido.estado);
                      return (
                        <tr
                          key={item.detalle_id}
                          className="hover:bg-surface-container/50 transition-colors group"
                        >
                          <td className="px-6 py-6 text-brand-muted-text text-sm whitespace-nowrap">
                            #{pedido.pedido_id}
                            <span className="block text-[11px]">
                              {pedido.direccion || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                              {item.imagen ? (
                                <img
                                  src={item.imagen}
                                  alt={item.producto}
                                  className="w-9 h-9 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-surface-container-high shrink-0" />
                              )}
                              <span className="font-medium text-on-surface">
                                {item.producto}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-brand-muted-text text-sm text-center">
                            {item.vendedor}
                          </td>
                          <td className="px-6 py-6 text-brand-muted-text text-sm text-center whitespace-nowrap">
                            {formatFecha(pedido.fecha)}
                          </td>
                          <td className="px-6 py-6 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-on-surface text-center">
                            {item.cantidad}
                          </td>
                          <td className="px-6 py-6 text-on-surface text-right whitespace-nowrap">
                            {formatPrice(item.precio_unitario)}
                          </td>
                          <td className="px-6 py-6 text-brand-muted-text text-right whitespace-nowrap">
                            {formatPrice(item.iva)}
                          </td>
                          <td className="px-6 py-6 font-semibold text-on-surface text-right whitespace-nowrap">
                            {formatPrice(item.total)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
