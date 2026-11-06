import { formatNumber } from "../../utils/formatPrice.js";

/**
 * Tarjetas de resumen del panel: vendedores, compradores, productos y comisiones.
 */
export default function PanelEstadisticas({ stats }) {
  const totalVendedores = stats ? formatNumber(stats.totalVendedores) : "—";
  const totalCompradores = stats ? formatNumber(stats.totalCompradores) : "—";
  const totalProductos = stats ? formatNumber(stats.totalProductos) : "—";
  const totalComisiones = stats ? `$${formatNumber(stats.totalComisiones)}` : "—";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-[#12121a] rounded-xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
        <div className="bg-[#1a1a26] w-10 h-10 rounded-lg flex items-center justify-center mb-4">
          <svg width="22" height="22" fill="none" stroke="#ef9918" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <p className="text-[#797998] text-xs font-bold uppercase tracking-widest mb-1">TOTAL VENDEDORES</p>
        <p className="text-[#f0f0f8] text-3xl font-bold">{totalVendedores}</p>
      </div>
      <div className="bg-[#12121a] rounded-xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
        <div className="bg-[#1a1a26] w-10 h-10 rounded-lg flex items-center justify-center mb-4">
          <svg width="22" height="22" fill="none" stroke="#ef9918" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <p className="text-[#797998] text-xs font-bold uppercase tracking-widest mb-1">TOTAL COMPRADORES</p>
        <p className="text-[#f0f0f8] text-3xl font-bold">{totalCompradores}</p>
      </div>
      <div className="bg-[#12121a] rounded-xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
        <div className="bg-[#1a1a26] w-10 h-10 rounded-lg flex items-center justify-center mb-4">
          <svg width="22" height="22" fill="none" stroke="#ef9918" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" x2="21" y1="6" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <p className="text-[#797998] text-xs font-bold uppercase tracking-widest mb-1">PRODUCTOS PUBLICADOS</p>
        <p className="text-[#f0f0f8] text-3xl font-bold">{totalProductos}</p>
      </div>
      <div className="bg-[#12121a] rounded-xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
        <div className="bg-[#1a1a26] w-10 h-10 rounded-lg flex items-center justify-center mb-4">
          <svg width="22" height="22" fill="none" stroke="#ef9918" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="12" x2="12" y1="1" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="text-[#797998] text-xs font-bold uppercase tracking-widest">COMISIONES TOTALES</p>
          <span className="bg-[rgba(239,153,24,0.2)] text-[#ef9918] text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">Comisión %10</span>
        </div>
        <p className="text-[#f0f0f8] text-3xl font-bold">{totalComisiones}</p>
      </div>
    </div>
  );
}
