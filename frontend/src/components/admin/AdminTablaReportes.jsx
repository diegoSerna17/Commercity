// RE Titulo: AdminTablaReportes - Tabla de gestion de reportes del panel administrador
//
// RE Implementacion React: useState para busqueda y filtro, useMemo para filtrado combinado,
// RE props para abrir modal de detalle desde el padre
//
// JS Codigo y componentes: filtros Todo/Pendiente/Resuelto, columna Tipo con badge,
// JS Reportado, Reportado por, Fecha, Estado, Acciones (Responder/Ver)
//
// TW Clases Tailwind: botones de filtro tipo pildora con bg-brand-orange activo

import { useState, useMemo } from "react";
import { IconSearch } from "./AdminIcons";
import { BadgeTipo, BadgeEstadoReporte } from "./AdminBadges";

export default function AdminTablaReportes({
  reportes,
  onAbrirModal,
}) {
  // RE Estados locales: texto de busqueda y filtro activo (todo/pendiente/resuelto)
  const [buscarReportes, setBuscarReportes] = useState("");
  const [filtroReporte, setFiltroReporte] = useState("todo");

  // RE Filtrado memorizado combinando texto de busqueda y estado del filtro
  const reportesFiltrados = useMemo(() => {
    const q = buscarReportes.toLowerCase();
    return reportes.filter((r) => {
      // JS Filtro por estado: todo muestra todos, pendiente/resuelto filtra
      const matchFiltro = filtroReporte === "todo" || r.estado === filtroReporte;
      const matchQ =
        r.reportado.toLowerCase().includes(q) ||
        r.reportadoPor.toLowerCase().includes(q) ||
        r.tipo.toLowerCase().includes(q);
      return matchFiltro && matchQ;
    });
  }, [reportes, buscarReportes, filtroReporte]);

  // JS Datos de los botones de filtro
  const filtros = [
    { key: "todo", label: "Todo" },
    { key: "pendiente", label: "Pendiente" },
    { key: "resuelto", label: "Resuelto" },
  ];

  return (
    <div className="rounded-xl overflow-hidden bg-auth-card-bg shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]">
      {/* RE Cabecera con titulo, botones de filtro y campo de busqueda */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-sans font-bold text-xl text-on-surface">
          Gestion de Reportes
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* RE Botones de filtro tipo pildora */}
          <div className="flex gap-2">
            {filtros.map((f) => {
              const activo = filtroReporte === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFiltroReporte(f.key)}
                  className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all font-sans ${
                    activo
                      ? "bg-brand-orange text-brand-dark-text"
                      : "bg-figma-input-bg text-on-surface hover:bg-surface-container-highest"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* RE Campo de busqueda para reportes */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar Reportes"
              value={buscarReportes}
              onChange={(e) => setBuscarReportes(e.target.value)}
              className="text-sm rounded-full pl-8 pr-4 py-1.5 outline-none w-52 font-sans placeholder:text-figma-text-search bg-figma-input-bg text-figma-text-search border border-transparent focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-figma-search-icon">
              <IconSearch />
            </span>
          </div>
        </div>
      </div>

      {/* RE Tabla de reportes con scroll vertical */}
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full min-w-[700px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[rgba(50,50,77,0.3)] bg-auth-card-bg">
              <th className="text-left px-4 py-2.5 font-sans font-extrabold text-xs tracking-widest uppercase whitespace-nowrap text-brand-muted-text">
                Tipo
              </th>
              <th className="text-left px-4 py-2.5 font-sans font-extrabold text-xs tracking-widest uppercase whitespace-nowrap text-brand-muted-text">
                Reportado
              </th>
              <th className="text-left px-4 py-2.5 font-sans font-extrabold text-xs tracking-widest uppercase whitespace-nowrap text-brand-muted-text">
                Reportado por
              </th>
              <th className="text-left px-4 py-2.5 font-sans font-extrabold text-xs tracking-widest uppercase whitespace-nowrap text-brand-muted-text">
                Fecha
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
            {reportesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-sm text-center py-8 font-sans text-brand-muted-text">
                  Sin resultados
                </td>
              </tr>
            ) : (
              reportesFiltrados.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[rgba(50,50,77,0.15)] transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <BadgeTipo tipo={r.tipo} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-bold font-sans text-on-surface">
                      {r.reportado}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-semibold font-sans text-brand-muted-text">
                      {r.reportadoPor}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-sans text-brand-muted-text">
                      {r.fecha}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <BadgeEstadoReporte estado={r.estado} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => onAbrirModal(r.id, r.estado === "pendiente" ? "responder" : "ver")}
                      className="text-[11px] font-bold px-3 py-1.5 rounded font-sans transition-colors border border-brand-muted-text text-brand-muted-text hover:bg-figma-input-bg"
                    >
                      {r.estado === "pendiente" ? "Responder" : "Ver"}
                    </button>
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