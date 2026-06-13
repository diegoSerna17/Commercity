import { useState } from "react";
import { createPortal } from "react-dom";
import { Bell, User } from "lucide-react";
import Navbar from "../Navbar";
import DetallePedidos from "./DetallePedidos";

const ORDERS = [
  {
    id: 1,
    cliente: "Alex Rivera",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAm5NgRFBJGGznBjExVR75roha-zduR-B2uoUsL8mzkQubIGBsVu4U-z7n15LfPY-kcL4w4ENy9ebypjUdtgXG5wqiN8SV0pKRvRBchZSx1a9pG6om23bBThah1knmExHqmUZ3yM-jPmSKFXRbyMcr26pDZgvies2mZ_jefRHrJIWGgZAWFPTjtvcYmj80jEgDbnUEXV92qIqmi6PZGLQpmvql8oymjzE1qO12Qy0unEZW3G_yPZkbyoBBb-GQPpzLawmnvIoBNvr7F",
    producto: "MacBook Air",
    fecha: "24 Oct, 2026",
    estado: "Entregado",
    monto: "$1,299.000",
    direccion: "Calle 45 # 23-10, Apto 502",
    ciudad: "Bogota, Cundinamarca",
    cantidad: 1,
  },
  {
    id: 2,
    cliente: "Elena Sanz",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB2gJmtjOTqrkPpFMGInq2859lNXzvsmKpwOtsrOOFO1rxLuA5qSNt0dtUxT0gs8aZAnn9nWDfwYvBQ8aYykoU_8DtQeCZjwTXCypJu_z9e2gcf6D7MpdR3L7wWDOep5RRGx_JuuHv9NBJBnSW8vb26bCUP8v4h-amN8gbbFpAaknuZg05fX8sP_ETrmV47y5LkkAHTSuit-TGoZgcRWeuZNLg53c78vPtt_N1c8A8vUmqV6vMlIIhZOttlQeGUGOM5LLEtf5kDJtDI",
    producto: 'Tv LG 45 pulgadas',
    fecha: "23 Oct, 2026",
    estado: "En Camino",
    monto: "$1,900.000",
    direccion: "Carrera 7 # 12-34, Apartamento 201",
    ciudad: "Medellin, Antioquia",
    cantidad: 2,
  },
  {
    id: 3,
    cliente: "Julian Thorne",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBYFGCemJj4YzMh4J_2-LSoOnZj39UxLKZAcTqgE1hg6srPpgmnvd1X1x2x5WslJUWS_x7dxnmnJX-Z0sTlDVD0YYLL8FvF4QvE6DXDuBF0Dz1gC3UY0ns35Kt807WvBp0Bq4Gbj6tVgZCw_ZyhZWrXYPCCtkEFjRw6bkr1CxgI0LnXlAsdTszG4n7kiv7S36fpueDVoEvcq4tJhscAeaFujRLR7fCo3SSxLHjiA3T9LCjBSV5uH9xvMB-jAgWH4JRMYETU1PoMP3v2",
    producto: "iPhone 15 Pro",
    fecha: "22 Oct, 2026",
    estado: "Entregado",
    monto: "$3,000.000",
    direccion: "Av. siempre viva # 742",
    ciudad: "Cali, Valle del Cauca",
    cantidad: 1,
  },
  {
    id: 4,
    cliente: "Marco Rossi",
    avatar: null,
    iniciales: "MR",
    producto: 'iPad Pro 11"',
    fecha: "21 Oct, 2026",
    estado: "Pendiente",
    monto: "$2,799.000",
    direccion: "Calle 10 # 5-67, Casa 3",
    ciudad: "Barranquilla, Atlantico",
    cantidad: 1,
  },
];

const STATUS_STYLES = {
  Entregado: "bg-primary/20 text-primary",
  "En Camino": "bg-accent-blue/20 text-accent-blue",
  Pendiente: "bg-accent-red/20 text-accent-red",
};

const FILTERS = ["Todo", "Pendiente", "En camino", "Entregado"];

const Orders = () => {
  const [activeFilter, setActiveFilter] = useState("Todo");
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <>
      <div className="flex h-screen bg-surface-container-lowest">
        <Navbar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* ===== TOP BAR ===== */}
          <header className="h-16 flex items-center justify-between px-padding-xl border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="text-brand-muted-text border-b-2 border-primary-container pb-4 mt-4">
                Pedidos
              </span>
            </div>
            <div className="flex items-center gap-6">
              <button className="text-brand-muted-text hover:text-on-surface">
                <Bell className="w-6 h-6" />
              </button>
              <button className="text-brand-muted-text hover:text-on-surface">
                <User className="w-6 h-6" />
              </button>
            </div>
          </header>

          {/* ===== PAGE CONTENT ===== */}
          <section className="flex-1 p-padding-xl overflow-y-auto">
            {/* Page Heading */}
            <div className="mb-padding-xl">
              <h2 className="text-headline-md font-bold text-on-surface">
                Pedidos
              </h2>
              <p className="text-brand-muted-text mt-1">
                Gestiona y actualiza el estado de tus pedidos.
              </p>
            </div>

            {/* Status Filters */}
            <div className="flex gap-3 mb-padding-xl">
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

            {/* Orders Table */}
            <div className="rounded-card overflow-hidden border border-surface-container bg-surface-container-low">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-brand-muted-text uppercase border-b border-surface-container">
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Accion</th>
                    <th className="px-6 py-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container/50">
                  {ORDERS.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          {order.avatar ? (
                            <img
                              alt={order.cliente}
                              className="w-9 h-9 rounded-full object-cover"
                              src={order.avatar}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-accent-blue/50 flex items-center justify-center text-xs font-bold text-accent-blue">
                              {order.iniciales}
                            </div>
                          )}
                          <span className="font-medium text-on-surface">
                            {order.cliente}
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
                          className={`px-3 py-1 rounded-md text-[11px] font-bold ${STATUS_STYLES[order.estado]}`}
                        >
                          {order.estado}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-4 py-1 rounded border border-surface-container text-xs text-brand-muted-text hover:bg-surface-container"
                        >
                          Ver detalle
                        </button>
                      </td>
                      <td className="px-6 py-6 text-right font-semibold text-on-surface">
                        {order.monto}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
      {selectedOrder &&
        createPortal(
          <DetallePedidos
            selectedOrder={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />,
          document.body
        )}
    </>
  );
};

export default Orders;
