import { useCallback, useEffect, useState } from "react";
import Header from "../../components/globales/Header";
import DetallePedidos from "./DetallePedidos";
import {
  avanzarEstadoPedido,
  listarVentas,
} from "../../services/tienda.service.js";

// JS Filtros de Pedidos (RF129): el valor se envia al backend.
const FILTROS = [
  { label: "Todo", valor: null },
  { label: "Pendiente", valor: "Pendiente" },
  { label: "En Camino", valor: "En camino" },
  { label: "Entregado", valor: "Entregado" },
  { label: "Cancelado", valor: "Cancelado" },
];

// JS El backend entrega el estado por linea; la interfaz usa "En Camino".
const ETIQUETA_ESTADO = { "En camino": "En Camino" };
const ESTADO_API = { "En Camino": "En camino" };
// RF124: el backend solo acepta el avance de UN nivel.
const SIGUIENTE_ESTADO = { Pendiente: "En camino", "En camino": "Entregado" };

const estadoBadge = {
  Entregado: "bg-primary-fixed-dim/10 text-primary-fixed-dim border border-primary-fixed-dim/40",
  "En Camino": "bg-secondary-fixed-dim/10 text-secondary-fixed-dim border border-secondary-fixed-dim/40",
  Pendiente: "bg-error-container/20 text-error border border-error/40",
  Cancelado: "bg-surface-container/40 text-brand-muted-text border border-brand-muted-text/40",
};

const fmt = (n) => "$" + Math.round(n).toLocaleString("es-CO");

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

/** Traduce la linea de venta de la API a la forma que consumen la tabla y el detalle. */
function mapearVenta(item) {
  const { corta, larga } = formatearFecha(item.fecha_pedido);

  return {
    id: item.id,
    pedidoId: item.pedido_id,
    referencia: item.referencia_pedido,
    cliente: item.nombre_comprador || "Comprador",
    email: item.email_comprador || "",
    avatarColor: "#32324d",
    avatarLetra: iniciales(item.nombre_comprador),
    productos: [
      {
        nombre: item.nombre_producto,
        cantidad: item.cantidad,
        precioUnitario: Number(item.valor_unitario || 0),
      },
    ],
    fecha: corta,
    fechaLarga: larga,
    estado: ETIQUETA_ESTADO[item.estado_envio] || item.estado_envio || "Pendiente",
    monto: Number(item.valor_subtotal || 0),
    neto: Number(item.monto_vendedor || 0),
    comision: Number(item.monto_comision || 0),
  };
}

export default function Pedidos() {
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [filtro, setFiltro] = useState(FILTROS[0]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState(null);
  const [cambiandoId, setCambiandoId] = useState(null);

  /** Consulta GET /api/tienda/ventas del vendedor autenticado (RF119/RF120). */
  const cargarVentas = useCallback(async (filtroActual, numeroPagina) => {
    setCargando(true);
    try {
      const res = await listarVentas({
        estado: filtroActual?.valor,
        pagina: numeroPagina,
      });
      const data = res.data ?? {};
      const nuevas = (data.items ?? []).map(mapearVenta);

      setVentas((actuales) =>
        numeroPagina === 1 ? nuevas : [...actuales, ...nuevas]
      );
      setResumen(data.resumen ?? null);
      setTotalPaginas(data.total_paginas ?? 1);
      setError("");
    } catch (err) {
      if (numeroPagina === 1) setVentas([]);
      setError(err.message || "No se pudieron cargar tus pedidos");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    setPagina(1);
    cargarVentas(filtro, 1);
  }, [filtro, cargarVentas]);

  /** RF122/RF124: avanza un nivel el estado de los envios del pedido. */
  async function manejarCambiarEstado(venta, etiquetaDestino) {
    const estadoApi = ESTADO_API[etiquetaDestino] || etiquetaDestino;
    setCambiandoId(venta.id);
    try {
      await avanzarEstadoPedido(venta.pedidoId, estadoApi);
      await cargarVentas(filtro, 1);
      setPagina(1);
    } catch (err) {
      setError(err.message || "No se pudo actualizar el estado del pedido");
    } finally {
      setCambiandoId(null);
    }
  }

  function cargarMas() {
    const siguiente = pagina + 1;
    setPagina(siguiente);
    cargarVentas(filtro, siguiente);
  }

  const pedidoSeleccionado =
    ventas.find((v) => v.id === pedidoSeleccionadoId) ?? null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Pedidos" />

      <section className="flex-1 p-padding-md sm:p-padding-lg lg:p-padding-xl overflow-y-auto overflow-x-hidden">
        <div className="mb-padding-xl">
          <h1 className="text-headline-md font-bold text-on-surface mb-1">
            Pedidos
          </h1>
          <p className="text-brand-muted-text text-body-sm sm:text-body-md">
            Gestiona y actualiza el estado de tus pedidos.
          </p>
        </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {FILTROS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFiltro(f)}
            className={`h-[32px] px-5 rounded-full text-[12px] tracking-[0.6px] font-semibold transition-colors ${
              filtro.label === f.label
                ? "bg-brand-orange text-brand-dark-text"
                : "bg-surface-variant2 text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {resumen && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4 text-[13px]">
          <span className="text-brand-muted-text">
            Ventas: <span className="text-on-surface font-semibold">{resumen.total_ventas}</span>
          </span>
          <span className="text-brand-muted-text">
            Total vendido: <span className="text-on-surface font-semibold">{fmt(resumen.total_bruto)}</span>
          </span>
          <span className="text-brand-muted-text">
            Neto (90%): <span className="text-brand-orange font-semibold">{fmt(resumen.total_neto_vendedor)}</span>
          </span>
        </div>
      )}

      {error && (
        <p className="text-report-red-text font-medium text-sm mb-4">{error}</p>
      )}

      <div
        className="w-full overflow-x-auto rounded-card"
        style={{
          backgroundColor: "var(--color-auth-card-bg)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="bg-surface-variant2/50" style={{ borderBottom: "1px solid rgba(50,50,77,0.2)" }}>
              {[
                { label: "CLIENTE", align: "left" },
                { label: "PRODUCTOS", align: "left" },
                { label: "FECHA", align: "left" },
                { label: "ESTADO", align: "left" },
                { label: "ACCION", align: "left" },
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
            {cargando && ventas.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-brand-muted-text text-[14px]"
                >
                  Cargando tus pedidos...
                </td>
              </tr>
            ) : ventas.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-brand-muted-text text-[14px]"
                >
                  No hay pedidos para este filtro.
                </td>
              </tr>
            ) : (
              ventas.map((pedido) => (
                <tr
                  key={pedido.id}
                  style={{ borderTop: "1px solid rgba(50,50,77,0.1)" }}
                >
                  <td className="px-[24px] py-[20px] whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-primary-fixed-dim text-[16px] shrink-0"
                        style={{
                          backgroundColor: pedido.avatarColor ?? "#32324d",
                          fontFamily: "var(--font-sans)",
                          fontWeight: 700,
                        }}
                      >
                        {pedido.avatarLetra}
                      </div>
                      <span className="text-on-surface text-[16px]">
                        {pedido.cliente}
                      </span>
                    </div>
                  </td>

                  <td className="px-[24px] py-[20px] whitespace-nowrap">
                    <span className="text-on-surface text-[16px] font-medium">
                      {pedido.productos.length === 1
                        ? "1 producto"
                        : `${pedido.productos.length} productos`}
                    </span>
                  </td>

                  <td className="px-[24px] py-[20px] whitespace-nowrap">
                    <span className="text-brand-muted-text text-[14px]">
                      {pedido.fecha}
                    </span>
                  </td>

                  <td className="px-[24px] py-[20px] whitespace-nowrap">
                    {/* RF124: solo se ofrece el siguiente nivel de estado */}
                    <select
                      value={pedido.estado}
                      onChange={(e) => manejarCambiarEstado(pedido, e.target.value)}
                      disabled={
                        !SIGUIENTE_ESTADO[pedido.estado] ||
                        cambiandoId === pedido.id
                      }
                      className={`h-[23px] pl-[12px] pr-[8px] rounded-full text-[12px] font-medium cursor-pointer outline-none disabled:cursor-not-allowed disabled:opacity-70 ${estadoBadge[pedido.estado] ?? "bg-surface-variant2 text-on-surface-variant"}`}
                    >
                      <option value={pedido.estado} className="bg-auth-card-bg text-on-surface">
                        {pedido.estado}
                      </option>
                      {SIGUIENTE_ESTADO[pedido.estado] && (
                        <option
                          value={ETIQUETA_ESTADO[SIGUIENTE_ESTADO[pedido.estado]] ?? SIGUIENTE_ESTADO[pedido.estado]}
                          className="bg-auth-card-bg text-on-surface"
                        >
                          {ETIQUETA_ESTADO[SIGUIENTE_ESTADO[pedido.estado]] ?? SIGUIENTE_ESTADO[pedido.estado]}
                        </option>
                      )}
                    </select>
                  </td>

                  <td className="px-[24px] py-[20px] whitespace-nowrap">
                    <button
                      onClick={() => setPedidoSeleccionadoId(pedido.id)}
                      className="bg-auth-card-bg border border-[#8e8e93] text-on-surface text-[12px] h-[23px] px-[14px] rounded-full hover:bg-input-bg transition-colors"
                    >
                      Ver detalle
                    </button>
                  </td>

                  <td className="px-[24px] py-[20px] whitespace-nowrap text-right">
                    <span className="text-on-surface text-[16px]">
                      {fmt(pedido.monto)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagina < totalPaginas && (
        <button
          onClick={cargarMas}
          disabled={cargando}
          className="mt-4 self-center h-[36px] px-6 rounded-full bg-surface-variant2 text-on-surface text-[13px] font-semibold hover:bg-surface-container-highest transition-colors disabled:opacity-60"
        >
          {cargando ? "Cargando..." : "Cargar mas pedidos"}
        </button>
      )}

      {pedidoSeleccionado && (
        <DetallePedidos
          pedido={pedidoSeleccionado}
          onClose={() => setPedidoSeleccionadoId(null)}
        />
      )}
      </section>
    </div>
  );
}
