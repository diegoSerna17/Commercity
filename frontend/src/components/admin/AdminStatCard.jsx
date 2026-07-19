import { BadgeComision } from "./AdminBadges";

export default function AdminStatCard({ icon, label, value, showComisionBadge = false, comisionPorcentaje = "10" }) {
  return (
    <div className="rounded-xl p-6 flex flex-col gap-4 transition-all hover:brightness-110 bg-auth-card-bg shadow-card">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-figma-input-bg">
        {icon}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-bold uppercase tracking-widest font-sans text-brand-muted-text">
          {label}
        </p>
        {showComisionBadge && <BadgeComision porcentaje={comisionPorcentaje} />}
      </div>

      <p className="text-3xl font-bold font-sans text-on-surface">
        {value}
      </p>
    </div>
  );
}