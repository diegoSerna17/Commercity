import { useCallback, useEffect, useState } from "react";
import Header from "../../components/globales/Header";
import DetalleCompras from "./DetalleCompras";
import { formatCOP, numProductosLabel } from "../../utils/historialUtils.js";
import { EstadoBadge, Avatar } from "../../utils/historialUtils.jsx";
import {
  cancelarCompra,
  listarHistorialCompras,
} from "../../services/historial.service.js";

// JS Filtros del historial (RF30). El valor es el que espera el backend.
const FILTERS = [
  { label: "Todo", valor: null },
  { label: "Pendiente", valor: "Pendiente" },
  { label: "En Camino", valor: "En camino" },
  { label: "Entregado", valor: "Entregado" },
  { label: "Cancelado", valor: "Cancelado" },
];

// JS El backend entrega el estado por linea; la insignia usa "En Camino".
const ETIQUETA_ESTADO = { "En camino": "En Camino" };

function etiquetaEstado(estado) {
  return ETIQUETA_ESTADO[estado] || estado || "Pendiente";
}

function formatearFecha(valor) {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return { corta: "", larga: "" };

  return {
    corta: fecha.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    larga: fecha.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

function iniciales(nombre) {
  return (nombre || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");
}

/** Traduce el pedido de la API a la forma que consumen la tabla y el detalle. */
function mapearPedido(pedido) {
  const vendedores = pedido.vendedores ?? [];
  const { corta, larga } = formatearFecha(pedido.fecha);

  return {
    id: pedido.pedido_id,
    vendedor:
      vendedores.length > 1
        ? `${vendedores.length} vendedores`
        : vendedores[0] || "Vendedor",
    initials: iniciales(vendedores[0]),
    initialsTextClass: "text-brand-orange",
    fechaCorta: corta,
    fechaLarga: larga,
    estado: etiquetaEstado(pedido.estado),
    direccion: pedido.direccion,
    productos: (pedido.items ?? []).map((item) => ({
      detalleId: item.detalle_id,
      nombre: item.producto,
      cantidad: item.cantidad,
      precioUnit: Number(item.precio_unitario || 0),
      estado: item.estado,
    })),
    resumen: pedido.resumen ?? { subtotal: 0, iva: 0, total: 0 },
  };
}

export default function HistorialDeCompras() {
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancelandoId, setCancelandoId] = useState(null);

  /** Consulta GET /api/historial/compras con el filtro de estado opcional. */
  const cargarHistorial = useCallback(async (filtro) => {
    setCargando(true);
    try {
      const res = await listarHistorialCompras(filtro?.valor);
      setPedidos((res.data ?? []).map(mapearPedido));
      setError("");
    } catch (err) {
      setPedidos([]);
      setError(err.message || "No se pudo cargar el historial de compras");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorial(activeFilter);
  }, [activeFilter, cargarHistorial]);

  /** RF135: cancela la linea Pendiente y recarga el historial. */
  async function manejarCancelar(detalleId) {
    setCancelandoId(detalleId);
    try {
      await cancelarCompra(detalleId);
      await cargarHistorial(activeFilter);
    } catch (err) {
      setError(err.message || "No se pudo cancelar la compra");
    } finally {
      setCancelandoId(null);
    }
  }

  const selectedOrder = pedidos.find((o) => o.id === selectedOrderId) ?? null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Historial de compras" />

      <section className="flex-1 p-padding-md sm:p-padding-lg lg:p-padding-xl overflow-y-auto overflow-x-hidden">
        <div className="mb-padding-xl">
        <h1 className="text-headline-md font-bold text-on-surface mb-1">
          Historial Compras
        </h1>
        <p className="text-brand-muted-text text-body-sm sm:text-body-md">
          Visualiza y haz seguimiento de tus compras en el historial.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setActiveFilter(f)}
            className={`h-[32px] px-5 rounded-full text-[12px] tracking-[0.6px] font-semibold transition-colors ${
              activeFilter.label === f.label
                ? "bg-brand-orange text-brand-dark-text"
                : "bg-surface-variant2 text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-report-red-text font-medium text-sm mb-4">{error}</p>
      )}

      {cargando ? (
        <div className="w-full overflow-x-auto rounded-card"
          style={{
            backgroundColor: "var(--color-auth-card-bg)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="text-center py-12 text-brand-muted-text text-[14px]">
                  Cargando tu historial...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="w-full overflow-x-auto rounded-card"
          style={{
            backgroundColor: "var(--color-auth-card-bg)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="text-center py-12 text-brand-muted-text text-[14px]">
                  No hay pedidos para este filtro.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* Tarjetas — solo móvil */}
          <div className="flex flex-col gap-3 md:hidden">
            {pedidos.map((order) => (
                <div
                  key={order.id}
                  className="bg-auth-card-bg rounded-card p-4 flex flex-col gap-3"
                  style={{ border: "1px solid var(--color-border-subtle)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar order={order} />
                      <span className="text-on-surface text-sm font-medium truncate">{order.vendedor}</span>
                    </div>
                    <EstadoBadge estado={order.estado} withBorder />
                  </div>

                  <p className="text-on-surface text-sm">{order.productos.map((p) => p.nombre).join(", ")}</p>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-muted-text">{order.fechaCorta}</span>
                    <span className="text-on-surface font-semibold">{formatCOP(order.resumen.total)}</span>
                  </div>

                  <button
                    onClick={() => setSelectedOrderId(order.id)}
                    className="bg-auth-card-bg border border-[#8e8e93] text-on-surface text-[12px] h-[23px] px-[14px] rounded-full hover:bg-input-bg transition-colors w-fit"
                  >
                    Ver compra
                  </button>
                </div>
              ))}
          </div>

          {/* Tabla — solo desktop */}
          <div
            className="hidden md:block w-full overflow-x-auto rounded-card"
            style={{
              backgroundColor: "var(--color-auth-card-bg)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="bg-surface-variant2/50" style={{ borderBottom: "1px solid rgba(50,50,77,0.2)" }}>
                  {[
                    { label: "VENDEDOR", align: "left" },
                    { label: "PRODUCTOS", align: "left" },
                    { label: "FECHA", align: "left" },
                    { label: "ESTADO", align: "left" },
                    { label: "ACCIÓN", align: "left" },
                    { label: "MONTO", align: "right" },
                  ].map((col) => (
                    <th
                      key={col.label}
                      className={`px-[24px] py-[16px] text-[12px] tracking-[1.2px] uppercase whitespace-nowrap text-brand-muted-text font-semibold ${col.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidos.map((order) => (
                    <tr
                      key={order.id}
                      style={{ borderTop: "1px solid rgba(50,50,77,0.1)" }}
                    >
                      <td className="px-[24px] py-[20px] whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar order={order} />
                          <span className="text-on-surface text-[16px]">
                            {order.vendedor}
                          </span>
                        </div>
                      </td>
                      <td className="px-[24px] py-[20px] whitespace-nowrap">
                        <span className="text-on-surface text-[16px] font-medium">
                          {numProductosLabel(order.productos)}
                        </span>
                      </td>
                      <td className="px-[24px] py-[20px] whitespace-nowrap">
                        <span className="text-brand-muted-text text-[14px]">
                          {order.fechaCorta}
                        </span>
                      </td>
                      <td className="px-[24px] py-[20px] whitespace-nowrap">
                        <EstadoBadge estado={order.estado} withBorder />
                      </td>
                      <td className="px-[24px] py-[20px] whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="bg-auth-card-bg border border-[#8e8e93] text-on-surface text-[12px] h-[23px] px-[14px] rounded-full hover:bg-input-bg transition-colors"
                        >
                          Ver compra
                        </button>
                      </td>
                      <td className="px-[24px] py-[20px] whitespace-nowrap text-right">
                        <span className="text-on-surface text-[16px]">
                          {formatCOP(order.resumen.total)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

        {selectedOrder && (
          <DetalleCompras
            order={selectedOrder}
            onClose={() => setSelectedOrderId(null)}
            onCancelar={manejarCancelar}
            cancelandoId={cancelandoId}
          />
        )}
      </section>
    </div>
  );
}
