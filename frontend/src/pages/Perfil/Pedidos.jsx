import { useCallback, useEffect, useRef, useState } from "react";
import Header from "../../components/globales/Header";
import DetallePedidos from "./DetallePedidos";
import {
  avanzarEstadoPedido,
  listarVentas,
} from "../../services/tienda.service.js";
import PedidosTabla from "./PedidosTabla.jsx";
import {
  ESTADO_API,
  FILTROS,
  fmt,
  mapearVenta,
} from "./pedidosFormato.js";

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
  // RF119: descarta respuestas viejas si el filtro cambia mientras se carga.
  const solicitudRef = useRef(0);

  /** Consulta GET /api/tienda/ventas del vendedor autenticado (RF119/RF120). */
  const cargarVentas = useCallback(async (filtroActual, numeroPagina) => {
    const solicitud = solicitudRef.current + 1;
    solicitudRef.current = solicitud;
    setCargando(true);
    try {
      const res = await listarVentas({
        estado: filtroActual?.valor,
        pagina: numeroPagina,
      });
      if (solicitud !== solicitudRef.current) return;
      const data = res.data ?? {};
      const nuevas = (data.items ?? []).map(mapearVenta);

      setVentas((actuales) =>
        numeroPagina === 1 ? nuevas : [...actuales, ...nuevas]
      );
      setResumen(data.resumen ?? null);
      setTotalPaginas(data.total_paginas ?? 1);
      setError("");
    } catch (err) {
      if (solicitud !== solicitudRef.current) return;
      if (numeroPagina === 1) setVentas([]);
      setError(err.message || "No se pudieron cargar tus pedidos");
    } finally {
      if (solicitud === solicitudRef.current) setCargando(false);
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
              type="button"
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

        <PedidosTabla
          ventas={ventas}
          cargando={cargando}
          cambiandoId={cambiandoId}
          onCambiarEstado={manejarCambiarEstado}
          onVerDetalle={setPedidoSeleccionadoId}
        />

        {pagina < totalPaginas && (
          <button
            type="button"
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
