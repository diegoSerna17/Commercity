export function EstadoBadge({ estado, withBorder = false }) {
  const configs = {
    Entregado: { bg: "bg-primary-fixed-dim/10", text: "text-primary-fixed-dim", border: withBorder ? "border border-primary-fixed-dim/40" : "" },
    "En Camino": {
      bg: "bg-secondary-fixed-dim/10",
      text: "text-secondary-fixed-dim",
      border: withBorder ? "border border-secondary-fixed-dim/40" : "",
    },
    Pendiente: { bg: "bg-error-container/20", text: "text-error", border: withBorder ? "border border-error/40" : "" },
    Cancelado: { bg: "bg-surface-container/40", text: "text-brand-muted-text", border: withBorder ? "border border-brand-muted-text/40" : "" },
  };
  const c = configs[estado] || { bg: "bg-surface-container/30", text: "text-brand-muted-text", border: "" };

  return (
    <span
      className={`inline-flex items-center ${c.bg} ${c.text} ${c.border} text-xs font-medium rounded-button px-3 py-1 whitespace-nowrap`}
    >
      {estado}
    </span>
  );
}

export function Avatar({ order }) {
  return (
    <div
      className={`w-10 h-10 rounded-full bg-surface-variant2 flex items-center justify-center flex-shrink-0 text-sm font-bold ${order.initialsTextClass}`}
    >
      {order.initials}
    </div>
  );
}