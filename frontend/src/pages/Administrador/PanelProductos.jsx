import { formatPrice } from "../../utils/formatPrice.js";

/**
 * Seccion de gestion de productos: busqueda, suspension y restauracion.
 */
export default function PanelProductos({
  productosFiltrados,
  cargando,
  buscarProductos,
  onBuscar,
  onEliminar,
  onRestaurar,
}) {
  return (
    <div className="bg-[#12121a] rounded-xl shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] overflow-hidden flex flex-col">
      <div className="p-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-jakarta font-bold text-xl text-white">Gestión de Productos</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar Productos"
            value={buscarProductos}
            onChange={(e) => onBuscar(e.target.value)}
            className="bg-[#1a1a26] text-[#6b7280] text-sm rounded-full pl-8 pr-4 py-1.5 outline-none focus:ring-1 focus:ring-[#ef9918] w-36 sm:w-48"
          />
          <svg className="absolute left-2.5 top-2 text-[#535B71] pointer-events-none" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
        <table className="w-full min-w-[480px]">
          <thead className="sticky top-0 z-10 bg-[#12121a]">
            <tr className="bg-[rgba(26,26,38,1)] border-b border-[rgba(50,50,77,0.3)]">
              <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Producto</th>
              <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Vendedor</th>
              <th className="text-right px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={3} className="text-[#797998] text-sm text-center py-8">Cargando productos...</td></tr>
            ) : productosFiltrados.length === 0 ? (
              <tr><td colSpan={3} className="text-[#797998] text-sm text-center py-8">Sin resultados</td></tr>
            ) : (
              productosFiltrados.map((p) => (
                <tr key={p.id} className="border-t border-[rgba(50,50,77,0.15)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="bg-[#1a1a26] border border-[rgba(30,41,59,0.5)] w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                        <svg width="22" height="22" fill="none" stroke="#797998" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
                          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" x2="21" y1="6" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-bold font-jakarta truncate">{p.nombre}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[#797998] text-xs">{formatPrice(p.precio)}</p>
                          {p.suspendido && (
                            <span className="bg-[rgba(239,68,68,0.1)] text-[#f87171] text-[10px] font-bold px-1.5 py-0.5 rounded font-jakarta">Suspendido</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[#797998] text-sm font-semibold font-jakarta">{p.vendedor}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {p.suspendido ? (
                      <button
                        onClick={() => onRestaurar(p.id)}
                        className="border border-[#ef9918] text-[#ef9918] text-[11px] font-bold px-2.5 py-1 rounded font-jakarta hover:bg-[rgba(239,153,24,0.1)] transition-colors"
                        title="Restaurar producto"
                      >
                        Restaurar
                      </button>
                    ) : (
                      <button
                        onClick={() => onEliminar(p.id)}
                        className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[rgba(239,68,68,0.08)] transition-colors ml-auto"
                        title="Eliminar producto"
                      >
                        <svg width="18" height="18" fill="none" stroke="#7F1D1D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 20 20">
                          <polyline points="2.5 5 4.17 5 17.5 5" />
                          <path d="M15.83 5v11.67a1.67 1.67 0 0 1-1.66 1.66H5.83a1.67 1.67 0 0 1-1.66-1.66V5m2.5 0V3.33a1.67 1.67 0 0 1 1.66-1.66h3.34a1.67 1.67 0 0 1 1.66 1.66V5" />
                        </svg>
                      </button>
                    )}
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
