import { useState, useMemo } from "react";
import { IconUser, IconSearch } from "./AdminIcons";
import { BadgeEstadoUsuario } from "./AdminBadges";

export default function AdminTablaUsuarios({
  usuarios,
  onBanear,
  onActivar,
  onEliminar,
}) {
  // RE Estado local para busqueda de usuarios
  const [buscarUsuarios, setBuscarUsuarios] = useState("");

  // RE Filtrado memorizado de usuarios por nombre o rol
  const usuariosFiltrados = useMemo(() => {
    const q = buscarUsuarios.toLowerCase();
    return usuarios.filter(
      (u) => u.nombre.toLowerCase().includes(q) || u.rol.toLowerCase().includes(q)
    );
  }, [usuarios, buscarUsuarios]);

  return (
    <div className="rounded-xl overflow-hidden flex flex-col bg-auth-card-bg shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]">
      {/* RE Cabecera con titulo y campo de busqueda */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-sans font-bold text-xl text-on-surface">
          Gestion de Usuarios
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar usuarios"
            value={buscarUsuarios}
            onChange={(e) => setBuscarUsuarios(e.target.value)}
            className="text-sm rounded-full pl-8 pr-4 py-1.5 outline-none w-48 font-sans placeholder:text-figma-text-search bg-figma-input-bg text-figma-text-search border border-transparent focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
            />
          {/* RE Icono de busqueda posicionado dentro del input */}
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-figma-search-icon">
            <IconSearch />
          </span>
        </div>
      </div>

      {/* RE Tabla con scroll vertical controlado */}
      <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
        <table className="w-full min-w-[520px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[rgba(50,50,77,0.3)] bg-auth-card-bg">
              <th className="text-left px-4 py-2.5 font-sans font-extrabold text-xs tracking-widest uppercase whitespace-nowrap text-brand-muted-text">
                Usuario
              </th>
              <th className="text-left px-4 py-2.5 font-sans font-extrabold text-xs tracking-widest uppercase whitespace-nowrap text-brand-muted-text">
                Rol
              </th>
              <th className="text-left px-4 py-2.5 font-sans font-extrabold text-xs tracking-widest uppercase whitespace-nowrap text-brand-muted-text">
                Estado
              </th>
              <th className="text-right px-4 py-2.5 font-sans font-extrabold text-xs tracking-widest uppercase whitespace-nowrap text-brand-muted-text">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-sm text-center py-8 font-sans text-brand-muted-text">
                  Sin resultados
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-[rgba(50,50,77,0.15)] transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-surface-container">
                        <IconUser />
                      </div>
                      <span className="text-sm font-bold font-sans truncate text-on-surface">
                        {u.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-semibold font-sans text-brand-muted-text">
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <BadgeEstadoUsuario estado={u.estado} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {u.estado === "activo" ? (
                        <button
                          onClick={() => onBanear(u.id)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded font-sans transition-colors border border-brand-muted-text text-brand-muted-text hover:bg-figma-input-bg"
                        >
                          Banear
                        </button>
                      ) : (
                        <button
                          onClick={() => onActivar(u.id)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded font-sans transition-colors border border-brand-orange text-brand-orange hover:bg-[rgba(239,153,24,0.1)]"
                        >
                          Activar
                        </button>
                      )}
                      <button
                        onClick={() => onEliminar(u.id)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded font-sans transition-colors border border-[rgba(127,29,29,0.5)] text-accent-red hover:bg-[rgba(239,68,68,0.08)]"
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