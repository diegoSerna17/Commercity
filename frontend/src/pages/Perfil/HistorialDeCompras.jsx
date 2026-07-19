import { useState } from "react";
import Header from "../../components/Header";
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
      encamino: "En Camino",
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

          <div className="flex flex-wrap gap-3 mb-padding-xl">
            {FILTERS.map((f) => {
              const active = f === activeFilter;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-5 py-1.5 rounded-button font-semibold text-sm transition-colors ${
                    active
                      ? "bg-primary-container text-black"
                      : "bg-surface-container-high text-brand-muted-text hover:bg-surface-container-highest"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>

          <div className="rounded-card overflow-x-auto border border-surface-container bg-surface-container-low">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-brand-muted-text uppercase border-b border-surface-container">
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Cantidad</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/50">
                {orders.map((order) => {
                  const status = estadosHistorial[order.status];

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-white/5 transition-colors group"
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
                      <td className="px-6 py-6 text-on-surface font-medium">
                        {order.producto}
                      </td>
                      <td className="px-6 py-6 text-brand-muted-text text-sm">
                        {order.fecha}
                      </td>
                      <td className="px-6 py-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-md text-[11px] font-bold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-on-surface">
                        {order.cantidad}
                      </td>
                      <td className="px-6 py-6 text-right font-semibold text-on-surface">
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