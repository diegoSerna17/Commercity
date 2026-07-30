import { useState } from "react";
import Header from "../../components/globales/Header";
import {
  estadosHistorial,
  historialCompras,
} from "../../data/historialCompras";

const FILTERS = ["Todo", "Pendiente", "En camino", "Entregado"];

export default function HistorialDeCompras() {
  const [activeFilter, setActiveFilter] = useState("Todo");

  const orders = historialCompras.filter((order) => {
    const statusMap = {
      entregado: "Entregado",
      encamino: "En camino",
      pendiente: "Pendiente",
    };
    const orderEstado = statusMap[order.status] || order.status;
    const matchesFilter = activeFilter === "Todo" || orderEstado === activeFilter;
    return matchesFilter;
  });

  return (
    <div className="flex h-screen bg-surface-container-lowest overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title="Historial de compras" />

        <section className="flex-1 p-padding-md sm:p-padding-lg lg:p-padding-xl overflow-y-auto overflow-x-hidden">
          <div className="mb-padding-xl">
            <h2 className="text-headline-md font-bold text-on-surface">
              Historial de compras
            </h2>
            <p className="text-brand-muted-text mt-1">
              Visualiza y haz seguimiento de tus compras en el historial.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 mb-padding-xl">
            {FILTERS.map((f) => {
              const active = f === activeFilter;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 sm:px-5 py-1.5 rounded-button font-semibold text-xs sm:text-sm transition-colors ${
                    active
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-surface-container-high text-brand-muted-text hover:bg-surface-container-highest"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>

          {/* Vista de tarjetas — solo móvil */}
          <div className="flex flex-col gap-3 md:hidden">
            {orders.length === 0 ? (
              <div className="rounded-card border border-surface-container bg-brand-dark-text px-6 py-12 text-center text-brand-muted-text text-sm">
                No hay pedidos para este filtro.
              </div>
            ) : (
              orders.map((order) => {
                const status = estadosHistorial[order.status];

                return (
                  <div
                    key={order.id}
                    className="bg-surface-container-low border border-surface-container rounded-card p-4 flex flex-col gap-3"
                  >
                    {/* Fila 1: Avatar + Vendedor + Estado */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: order.avatarBg }}
                        >
                          <span
                            className="text-sm font-bold"
                            style={{ color: order.avatarColor }}
                          >
                            {order.iniciales}
                          </span>
                        </div>
                        <span className="font-medium text-on-surface text-sm truncate">
                          {order.vendedor}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Fila 2: Producto */}
                    <p className="text-on-surface font-medium text-sm">
                      {order.producto}
                    </p>

                    {/* Fila 3: Fecha + Monto */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-muted-text">{order.fecha}</span>
                      <span className="font-semibold text-on-surface">{order.monto}</span>
                    </div>

                    {/* Fila 4: Cantidad */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-muted-text">Cantidad</span>
                      <span className="text-on-surface">{order.cantidad}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Tabla — solo desktop */}
          <div className="hidden md:block rounded-card overflow-x-auto border border-surface-container bg-brand-dark-text">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-brand-muted-text uppercase bg-surface-variant2">
                  <th className="px-6 py-4 text-left">Vendedor</th>
                  <th className="px-6 py-4 text-center">Producto</th>
                  <th className="px-6 py-4 text-center">Fecha</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Cantidad</th>
                  <th className="px-6 py-4 text-center">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/50">
                {orders.map((order) => {
                  const status = estadosHistorial[order.status];

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-container/50 transition-colors group"
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: order.avatarBg }}
                          >
                            <span
                              className="text-sm font-bold"
                              style={{ color: order.avatarColor }}
                            >
                              {order.iniciales}
                            </span>
                          </div>
                          <span className="font-medium text-on-surface">
                            {order.vendedor}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-on-surface font-medium text-center">
                        {order.producto}
                      </td>
                      <td className="px-6 py-6 text-brand-muted-text text-sm text-center">
                        {order.fecha}
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-on-surface text-center">
                        {order.cantidad}
                      </td>
                      <td className="px-6 py-6 font-semibold text-on-surface text-center">
                        {order.monto}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
