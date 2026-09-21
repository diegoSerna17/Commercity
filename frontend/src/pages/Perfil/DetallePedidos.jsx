import { useEffect } from "react";

const estadoChip = {
  Entregado: {
    bg: "bg-primary-fixed-dim/10",
    text: "text-primary-fixed-dim",
    border: "",
  },
  "En Camino": {
    bg: "bg-secondary-fixed-dim/10",
    text: "text-secondary-fixed-dim",
    border: "border border-secondary-fixed-dim",
  },
  Pendiente: {
    bg: "bg-error-container/20",
    text: "text-error",
    border: "",
  },
};

const fmt = (n) => "$" + n.toLocaleString("es-CO");

export default function DetallePedidos({ pedido, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!pedido) return null;

  const chip = estadoChip[pedido.estado] ?? {
    bg: "bg-surface-variant2",
    text: "text-on-surface-variant",
    border: "",
  };

  const total = pedido.productos.reduce(
    (acc, p) => acc + p.precioUnitario * p.cantidad,
    0
  );

  const hasManyProductos = pedido.productos.length > 5;
  const productListClass = hasManyProductos
    ? "bg-input-bg rounded-card overflow-x-hidden overflow-y-auto max-h-64 divide-y divide-surface-container/30"
    : "bg-input-bg rounded-card overflow-hidden divide-y divide-surface-container/30";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-auth-card-bg rounded-hero shadow-2xl w-[400px] sm:w-[500px] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-on-surface text-2xl font-extrabold tracking-tight leading-tight">
                Detalle del pedido
              </h2>
              <p className="text-brand-muted-text font-bold text-sm mt-1">
                Fecha: {pedido.fechaLarga}
              </p>
            </div>
            <span
              className={`shrink-0 mt-1 px-3 py-1 rounded-full text-xs font-bold ${chip.bg} ${chip.text} ${chip.border}`}
            >
              {pedido.estado}
            </span>
          </div>
        </div>

        <div className="px-6 pb-4">
          <p className="text-brand-muted-text font-bold text-sm mb-2">Comprador</p>
          <div className="bg-input-bg rounded-card p-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-primary-fixed-dim text-sm font-bold shrink-0"
              style={{ backgroundColor: pedido.avatarColor ?? "#32324d" }}
            >
              {pedido.avatarLetra}
            </div>
            <span className="text-on-surface font-semibold text-base">
              {pedido.cliente}
            </span>
          </div>
        </div>

        <div className="px-6 pb-4">
          <p className="text-brand-muted-text font-bold text-sm mb-2">
            {pedido.direccion ? "Dirección de envío" : "Referencia del pago"}
          </p>
          <div className="bg-input-bg rounded-card px-4 py-3">
            <p className="text-on-surface font-semibold text-sm">
              {pedido.direccion ?? pedido.referencia}
            </p>
            {pedido.direccion ? (
              pedido.ciudad && (
                <p className="text-brand-muted-text text-xs mt-0.5">{pedido.ciudad}</p>
              )
            ) : (
              <p className="text-brand-muted-text text-xs mt-0.5">{pedido.email}</p>
            )}
          </div>
        </div>

        <div className="px-6 pb-4">
          <p className="text-brand-muted-text font-bold text-sm mb-2">
            Productos solicitados
          </p>
          <div className={productListClass}>
            {pedido.productos.map((prod, i) => (
              <div
                key={i}
                className="px-4 py-3 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-on-surface font-semibold text-sm">
                    {prod.nombre}
                  </p>
                  <p className="text-brand-muted-text text-xs mt-0.5">
                    Cantidad {prod.cantidad}
                  </p>
                </div>
                <span className="text-brand-orange font-extrabold text-sm flex-shrink-0">
                  {fmt(prod.precioUnitario * prod.cantidad)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-4 flex flex-col gap-2">
          <div className="bg-input-bg rounded-card px-4 py-3 flex justify-between items-center">
            <span className="text-brand-muted-text font-bold text-sm">
              Tu ganancia neta (90%)
            </span>
            <span className="text-brand-orange font-extrabold text-base">
              {fmt(pedido.neto ?? 0)}
            </span>
          </div>
          <div className="bg-input-bg rounded-card px-4 py-3 flex justify-between items-center">
            <span className="text-brand-muted-text font-bold text-sm">
              Comisión plataforma (10%)
            </span>
            <span className="text-brand-muted-text font-extrabold text-base">
              {fmt(pedido.comision ?? 0)}
            </span>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="bg-sidebar-active-bg/70 border border-brand-orange rounded-card px-4 py-4 flex justify-between items-center">
            <span className="text-brand-muted-text font-bold text-base">
              Precio total del pedido
            </span>
            <span className="text-brand-orange font-extrabold text-lg">
              {fmt(total)}
            </span>
          </div>
        </div>

        <div className="border-t border-figma-divider mx-6 mb-4" />
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full border border-[#8e8e93] rounded-card-lg py-3 text-brand-muted-text font-bold text-lg hover:bg-on-surface/5 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
