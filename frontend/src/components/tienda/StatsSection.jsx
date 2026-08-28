import { ShoppingBag, DollarSign } from "lucide-react";

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

export default function StatsSection({ totalVentas, dineroRecaudado }) {
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
          value={totalVentas}
          icon={<ShoppingBag className="w-6 h-6" />}
        />
        <StatCard
          label="Dinero Recaudado"
          value={dineroRecaudado}
          icon={<DollarSign className="w-6 h-6" />}
        />
      </div>
    </section>
  );
}