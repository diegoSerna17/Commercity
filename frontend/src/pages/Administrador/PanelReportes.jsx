const FILTROS = [
  { key: "todo", label: "Todo" },
  { key: "pendiente", label: "Pendiente" },
  { key: "resuelto", label: "Resuelto" },
];

/**
 * Seccion de gestion de reportes: filtro por estado, busqueda y acciones.
 */
export default function PanelReportes({
  reportesFiltrados,
  cargando,
  buscarReportes,
  onBuscar,
  filtroReporte,
  onFiltro,
  onAbrirModal,
  onEliminar,
}) {
  return (
    <div className="bg-[#12121a] rounded-xl shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] overflow-hidden">
      <div className="p-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-jakarta font-bold text-xl text-white">Gestión de Reportes</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.key}
                onClick={() => onFiltro(f.key)}
                className={
                  "text-xs font-semibold px-4 py-1.5 rounded-full transition-all " +
                  (filtroReporte === f.key ? "bg-[#ef9918] text-[#12121a]" : "bg-[#32324d] text-[#c7c5d5]")
                }
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar Reportes"
              value={buscarReportes}
              onChange={(e) => onBuscar(e.target.value)}
              className="bg-[#1a1a26] text-[#6b7280] text-sm rounded-full pl-8 pr-4 py-1.5 outline-none focus:ring-1 focus:ring-[#ef9918] w-40 sm:w-52"
            />
            <svg className="absolute left-2.5 top-2 text-[#535B71] pointer-events-none" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full min-w-[700px]">
          <thead className="sticky top-0 z-10 bg-[#12121a]">
            <tr className="bg-[rgba(26,26,38,1)] border-b border-[rgba(50,50,77,0.3)]">
              <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Tipo</th>
              <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Reportado</th>
              <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Reportado por</th>
              <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Fecha</th>
              <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Estado</th>
              <th className="text-right px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} className="text-[#797998] text-sm text-center py-8">Cargando reportes...</td></tr>
            ) : reportesFiltrados.length === 0 ? (
              <tr><td colSpan={6} className="text-[#797998] text-sm text-center py-8">Sin resultados</td></tr>
            ) : (
              reportesFiltrados.map((r) => (
                <tr key={r.id} className="border-t border-[rgba(50,50,77,0.15)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.tipo === "usuario" ? (
                      <span className="border border-[rgba(127,29,29,0.5)] text-[#ef4444] text-[11px] font-bold px-2 py-0.5 rounded font-jakarta">Usuario</span>
                    ) : (
                      <span className="border border-[#5b5dff] text-[#5165f5] text-[11px] font-bold px-2 py-0.5 rounded font-jakarta">Producto</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white text-sm font-bold font-jakarta">{r.reportado}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[#797998] text-sm font-semibold font-jakarta">{r.reportadoPor}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[#797998] text-sm">{r.fecha}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.estado === "resuelto" ? (
                      <span className="bg-[rgba(34,197,94,0.1)] text-[#4ade80] text-[11px] font-bold px-2.5 py-1 rounded-md font-jakarta">Resuelto</span>
                    ) : (
                      <span className="bg-[rgba(239,68,68,0.1)] text-[#f87171] text-[11px] font-bold px-2.5 py-1 rounded-md font-jakarta">Pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onAbrirModal(r.id, r.estado === "pendiente" ? "responder" : "ver")}
                        className="border border-[#797998] text-[#797998] text-[11px] font-bold px-3 py-1.5 rounded font-jakarta hover:bg-[#32324d] transition-colors"
                      >
                        {r.estado === "pendiente" ? "Responder" : "Ver"}
                      </button>
                      <button
                        onClick={() => onEliminar(r.id)}
                        className="border border-[rgba(127,29,29,0.5)] text-[#ef4444] text-[11px] font-bold px-2.5 py-1.5 rounded font-jakarta hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
