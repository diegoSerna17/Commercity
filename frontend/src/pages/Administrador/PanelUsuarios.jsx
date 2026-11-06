/**
 * Seccion de gestion de usuarios del panel: busqueda, estado y acciones.
 */
export default function PanelUsuarios({
  usuariosFiltrados,
  cargando,
  buscarUsuarios,
  onBuscar,
  onCambiarEstado,
  onEliminar,
}) {
  return (
    <div className="bg-[#12121a] rounded-xl shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] overflow-hidden flex flex-col">
      <div className="p-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-jakarta font-bold text-xl text-white">Gestión de Usuarios</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar usuarios"
            value={buscarUsuarios}
            onChange={(e) => onBuscar(e.target.value)}
            className="bg-[#1a1a26] text-[#6b7280] text-sm rounded-full pl-8 pr-4 py-1.5 outline-none focus:ring-1 focus:ring-[#ef9918] w-36 sm:w-48"
          />
          <svg className="absolute left-2.5 top-2 text-[#535B71] pointer-events-none" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
        <table className="w-full min-w-[520px]">
          <thead className="sticky top-0 z-10 bg-[#12121a]">
            <tr className="bg-[rgba(26,26,38,1)] border-b border-[rgba(50,50,77,0.3)]">
              <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Usuario</th>
              <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Rol</th>
              <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Estado</th>
              <th className="text-right px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={4} className="text-[#797998] text-sm text-center py-8">Cargando usuarios...</td></tr>
            ) : usuariosFiltrados.length === 0 ? (
              <tr><td colSpan={4} className="text-[#797998] text-sm text-center py-8">Sin resultados</td></tr>
            ) : (
              usuariosFiltrados.map((u) => (
                <tr key={u.id} className="border-t border-[rgba(50,50,77,0.15)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="bg-[#1e293b] w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                        <svg width="20" height="20" fill="none" stroke="#797998" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-bold font-jakarta truncate">{u.nombre}</p>
                        <p className="text-[#797998] text-xs truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[#797998] text-sm font-semibold font-jakarta">{u.rol}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {u.estado === "activo" ? (
                      <span className="bg-[rgba(34,197,94,0.1)] text-[#4ade80] text-[11px] font-bold px-2 py-0.5 rounded-md font-jakarta">Activo</span>
                    ) : (
                      <span className="bg-[rgba(239,68,68,0.1)] text-[#f87171] text-[11px] font-bold px-2 py-0.5 rounded-md font-jakarta">Baneado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {u.estado === "activo" ? (
                        <button
                          onClick={() => onCambiarEstado(u.id, "baneado")}
                          className="border border-[#797998] text-[#797998] text-[11px] font-bold px-2.5 py-1 rounded font-jakarta hover:bg-[#32324d] transition-colors"
                        >
                          Banear
                        </button>
                      ) : (
                        <button
                          onClick={() => onCambiarEstado(u.id, "activo")}
                          className="border border-[#ef9918] text-[#ef9918] text-[11px] font-bold px-2.5 py-1 rounded font-jakarta hover:bg-[rgba(239,153,24,0.1)] transition-colors"
                        >
                          Activar
                        </button>
                      )}
                      <button
                        onClick={() => onEliminar(u.id)}
                        className="border border-[rgba(127,29,29,0.5)] text-[#ef4444] text-[11px] font-bold px-2.5 py-1 rounded font-jakarta hover:bg-[rgba(239,68,68,0.08)] transition-colors"
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
