import { useState, useMemo } from "react";
import { IconProduct, IconTrash, IconSearch } from "./AdminIcons";

export default function AdminTablaProductos({
  productos,
  onEliminar,
}) {
  // RE Estado local para busqueda de productos
  const [buscarProductos, setBuscarProductos] = useState("");

  // RE Filtrado memorizado de productos por nombre o vendedor
  const productosFiltrados = useMemo(() => {
    const q = buscarProductos.toLowerCase();
    return productos.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.vendedor.toLowerCase().includes(q)
    );
  }, [productos, buscarProductos]);

  return (
    <div className="rounded-xl overflow-hidden flex flex-col bg-auth-card-bg shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]">
      {/* RE Cabecera con titulo y campo de busqueda */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-sans font-bold text-xl text-on-surface">
          Gestion de Productos
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar Productos"
            value={buscarProductos}
            onChange={(e) => setBuscarProductos(e.target.value)}
            className="text-sm rounded-full pl-8 pr-4 py-1.5 outline-none w-48 font-sans placeholder:text-figma-text-search bg-figma-input-bg text-figma-text-search border border-transparent focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-figma-search-icon">
            <IconSearch />
          </span>
        </div>
      </div>

      {/* RE Tabla con scroll vertical controlado */}
      <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
        <table className="w-full min-w-[480px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[rgba(50,50,77,0.3)] bg-auth-card-bg">
              <th className="text-left px-4 py-2.5 font-sans font-extrabold text-xs tracking-widest uppercase whitespace-nowrap text-brand-muted-text">
                Producto
              </th>
              <th className="text-left px-4 py-2.5 font-sans font-extrabold text-xs tracking-widest uppercase whitespace-nowrap text-brand-muted-text">
                Vendedor
              </th>
              <th className="text-right px-4 py-2.5 font-sans font-extrabold text-xs tracking-widest uppercase whitespace-nowrap text-brand-muted-text">
                Accion
              </th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-sm text-center py-8 font-sans text-brand-muted-text">
                  Sin resultados
                </td>
              </tr>
            ) : (
              productosFiltrados.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-[rgba(50,50,77,0.15)] transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-figma-input-bg border border-figma-divider">
                        <IconProduct />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold font-sans truncate text-on-surface">
                          {p.nombre}
                        </p>
                        <p className="text-xs font-sans text-brand-muted-text">
                          {p.precio}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-semibold font-sans text-brand-muted-text">
                      {p.vendedor}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => onEliminar(p.id)}
                      className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors ml-auto hover:bg-[rgba(239,68,68,0.08)]"
                      title="Eliminar producto"
                    >
                      <IconTrash />
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