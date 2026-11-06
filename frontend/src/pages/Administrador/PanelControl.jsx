import AdminModalConfirmarEliminar from "../../components/admin/AdminModalConfirmarEliminar";
import AdminModalReporte from "../../components/admin/AdminModalReporte";
import AjustesAdministrador from "./AjustesAdministrador";
import PanelEstadisticas from "./PanelEstadisticas";
import PanelProductos from "./PanelProductos";
import PanelReportes from "./PanelReportes";
import PanelUsuarios from "./PanelUsuarios";
import { useAdminPanel } from "./useAdminPanel.js";

export default function PanelAdministrador() {
  const {
    stats,
    cargando,
    error,
    cargarDatos,
    buscarUsuarios,
    setBuscarUsuarios,
    usuariosFiltrados,
    cambiarEstadoUsuario,
    pedirEliminarUsuario,
    buscarProductos,
    setBuscarProductos,
    productosFiltrados,
    pedirEliminarProducto,
    restaurarProducto,
    buscarReportes,
    setBuscarReportes,
    filtroReporte,
    setFiltroReporte,
    reportesFiltrados,
    abrirModalReporte,
    pedirEliminarReporte,
    modalEliminarUsuario,
    confirmarEliminarUsuario,
    cancelarEliminarUsuario,
    nombreParaConfirmarUsuario,
    modalEliminarProducto,
    confirmarEliminarProducto,
    cancelarEliminarProducto,
    nombreParaConfirmarProducto,
    modalEliminarReporte,
    confirmarEliminarReporte,
    cancelarEliminarReporte,
    nombreParaConfirmarReporte,
    modalReporte,
    reporteActual,
    enviarRespuesta,
    cerrarModalReporte,
    estaBaneado,
    toggleBanearDesdeReporte,
    usuariosEliminadosDesdeReporte,
    productosEliminadosDesdeReporte,
    pedirEliminarUsuarioDesdeReporte,
    pedirEliminarProductoDesdeReporte,
    mostrarAjustes,
    setMostrarAjustes,
  } = useAdminPanel();

  return (
    <div className="bg-[#0a0a0f] text-white min-h-screen font-inter h-screen overflow-y-auto">
      <style>{`
        .panel-admin ::-webkit-scrollbar { width: 4px; height: 4px; }
        .panel-admin ::-webkit-scrollbar-track { background: #12121a; }
        .panel-admin ::-webkit-scrollbar-thumb { background: #32324d; border-radius: 99px; }
        .panel-admin ::-webkit-scrollbar-thumb:hover { background: #797998; }
      `}</style>

      <div className="panel-admin">
        {/* TOP BAR */}
        <header className="bg-[#12121a] border-b border-[rgba(30,41,59,0.5)] h-14 flex items-center px-4 fixed top-0 left-0 right-0 z-30">
          <span className="font-jakarta font-bold text-[#ef9918] text-2xl tracking-tight">CommerCity</span>
          <div className="ml-auto">
            <button
              onClick={() => setMostrarAjustes(true)}
              className="text-[#797998] hover:text-white transition-colors p-1"
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </header>

        <main className="pt-20 pb-12 px-4 sm:px-6 md:px-8 max-w-[1320px] mx-auto">
          <h1 className="font-inter font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-6">Panel De Control</h1>

          {/* Estado de error del panel con reintento */}
          {error && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.08)] px-4 py-3">
              <p className="text-sm font-semibold font-jakarta text-[#f87171]">{error}</p>
              <button
                onClick={() => cargarDatos()}
                className="border border-[#ef9918] text-[#ef9918] text-[11px] font-bold px-3 py-1.5 rounded font-jakarta hover:bg-[rgba(239,153,24,0.1)] transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          <PanelEstadisticas stats={stats} />

          {/* USERS + PRODUCTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <PanelUsuarios
              usuariosFiltrados={usuariosFiltrados}
              cargando={cargando}
              buscarUsuarios={buscarUsuarios}
              onBuscar={setBuscarUsuarios}
              onCambiarEstado={cambiarEstadoUsuario}
              onEliminar={pedirEliminarUsuario}
            />

            <PanelProductos
              productosFiltrados={productosFiltrados}
              cargando={cargando}
              buscarProductos={buscarProductos}
              onBuscar={setBuscarProductos}
              onEliminar={pedirEliminarProducto}
              onRestaurar={restaurarProducto}
            />
          </div>

          <PanelReportes
            reportesFiltrados={reportesFiltrados}
            cargando={cargando}
            buscarReportes={buscarReportes}
            onBuscar={setBuscarReportes}
            filtroReporte={filtroReporte}
            onFiltro={setFiltroReporte}
            onAbrirModal={abrirModalReporte}
            onEliminar={pedirEliminarReporte}
          />
        </main>
      </div>

      {/* Modal de confirmacion para eliminar usuario */}
      {modalEliminarUsuario.abierto && (
        <AdminModalConfirmarEliminar
          tipo="Usuario"
          nombre={nombreParaConfirmarUsuario}
          onConfirmar={confirmarEliminarUsuario}
          onCancelar={cancelarEliminarUsuario}
        />
      )}

      {/* Modal de confirmacion para eliminar producto */}
      {modalEliminarProducto.abierto && (
        <AdminModalConfirmarEliminar
          tipo="Producto"
          nombre={nombreParaConfirmarProducto}
          onConfirmar={confirmarEliminarProducto}
          onCancelar={cancelarEliminarProducto}
        />
      )}

      {/* Modal de confirmacion para archivar reporte */}
      {modalEliminarReporte.abierto && (
        <AdminModalConfirmarEliminar
          tipo="Reporte"
          nombre={nombreParaConfirmarReporte}
          onConfirmar={confirmarEliminarReporte}
          onCancelar={cancelarEliminarReporte}
        />
      )}

      {/* Modal de detalle de reporte */}
      {modalReporte.abierto && reporteActual && (
        <AdminModalReporte
          reporte={reporteActual}
          modo={modalReporte.modo}
          estaBaneado={estaBaneado(reporteActual)}
          usuarioEliminadoDesdeReporte={usuariosEliminadosDesdeReporte.has(reporteActual.reportadoId)}
          productoEliminadoDesdeReporte={productosEliminadosDesdeReporte.has(reporteActual.reportadoId)}
          onEnviarRespuesta={enviarRespuesta}
          onCerrar={cerrarModalReporte}
          onToggleBanear={toggleBanearDesdeReporte}
          onPedirEliminarUsuario={pedirEliminarUsuarioDesdeReporte}
          onPedirEliminarProducto={pedirEliminarProductoDesdeReporte}
        />
      )}
      {mostrarAjustes && <AjustesAdministrador onClose={() => setMostrarAjustes(false)} />}
    </div>
  );
}
