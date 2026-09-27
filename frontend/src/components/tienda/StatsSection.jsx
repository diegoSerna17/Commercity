import { ShoppingBag, DollarSign, Package, Percent, ArrowDownLeft } from "lucide-react";

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-auth-card-bg border border-border-subtle rounded-card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-lg">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-card bg-success/15 flex items-center justify-center text-success shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-sans font-semibold text-brand-muted-text text-xs uppercase tracking-[0.5px] truncate">
          {label}
        </p>
        <p className="font-sans font-bold text-on-surface text-xl sm:text-2xl mt-0.5 leading-[24px] truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

const fmt = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-CO");

function formatearFecha(valor) {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Estadisticas e ingresos reales de Mi Tienda (RF121/RF123, RF130-RF133).
 * @param {{ tarjetas: object|null, ingresos: {resumen: object, items: Array}|null }} props
 */
export default function StatsSection({ tarjetas, ingresos }) {
  const neto = tarjetas?.total_neto_vendedor ?? 0;
  const movimientos = ingresos?.items ?? [];

  return (
    <section className="space-y-3 sm:space-y-4">
      <div>
        <h2 className="font-sans font-bold text-on-surface text-lg sm:text-xl leading-[27px]">
          Estadísticas de tu tienda
        </h2>
        <p className="font-sans text-brand-muted-text text-xs sm:text-sm leading-[21px]">
          Mira cómo va progresando tu negocio
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          label="Ventas Totales"
          value={tarjetas?.total_ventas ?? 0}
          icon={<ShoppingBag className="w-6 h-6" />}
        />
        <StatCard
          label="Dinero Recaudado"
          value={fmt(neto)}
          icon={<DollarSign className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Unidades vendidas"
          value={tarjetas?.unidades_vendidas ?? 0}
          icon={<Package className="w-6 h-6" />}
        />
        <StatCard
          label="Comisión plataforma"
          value={fmt(tarjetas?.total_comision ?? 0)}
          icon={<Percent className="w-6 h-6" />}
        />
        <StatCard
          label="Ingresos netos (90%)"
          value={fmt(ingresos?.resumen?.total_neto_vendedor ?? neto)}
          icon={<ArrowDownLeft className="w-6 h-6" />}
        />
      </div>

      {movimientos.length > 0 && (
        <div className="bg-auth-card-bg border border-border-subtle rounded-card overflow-hidden shadow-lg">
          <p className="px-4 sm:px-5 py-3 font-sans font-bold text-on-surface text-sm border-b border-border-subtle">
            Últimos ingresos
          </p>
          <ul className="divide-y divide-border-subtle">
            {movimientos.map((mov) => (
              <li
                key={mov.id}
                className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-sans font-semibold text-on-surface text-sm truncate">
                    {mov.nombre_producto}
                  </p>
                  <p className="font-sans text-brand-muted-text text-xs mt-0.5">
                    {formatearFecha(mov.fecha_pedido)} · {mov.referencia_pedido} · {mov.estado_envio}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-sans font-bold text-brand-orange text-sm">
                    {fmt(mov.monto_vendedor)}
                  </p>
                  <p className="font-sans text-brand-muted-text text-xs mt-0.5">
                    de {fmt(mov.valor_subtotal)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ingresos?.resumen && (
        <p className="font-sans text-brand-muted-text text-xs">
          Transacciones registradas: {ingresos.resumen.total_transacciones} · Bruto{" "}
          {fmt(ingresos.resumen.total_bruto)} · Comisión {fmt(ingresos.resumen.total_comision_plataforma)} ·{" "}
          {ingresos.resumen.consistencia_90_10_validada
            ? "flujo 90/10 consistente"
            : "revisar consistencia 90/10"}
        </p>
      )}
    </section>
  );
}
