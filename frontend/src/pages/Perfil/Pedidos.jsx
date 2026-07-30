import { useState, useEffect, useRef } from "react";
import Header from "../../components/globales/Header";
import { estadosHistorial } from "../../data/historialCompras";

const ordersData = [
  {
    id: 1,
    cliente: "Alex Rivera",
    initials: "AR",
    avatarBg: "#1e3a5f",
    avatarColor: "#86d0ff",
    producto: "MacBook Air",
    fecha: "24 Oct, 2026",
    estado: "entregado",
    monto: "$1.299.000",
    direccion: "Carrera 12 # 56-78, Piso 3",
    ciudad: "Bogotá, Cundinamarca",
    cantidad: 1,
  },
  {
    id: 2,
    cliente: "Elena Sanz",
    initials: "ES",
    avatarBg: "#1a3a2c",
    avatarColor: "#6ee7b7",
    producto: "Tv LG 45 pulgadas",
    fecha: "23 Oct, 2026",
    estado: "encamino",
    monto: "$1.900.000",
    direccion: "Carrera 7 # 12-34, Apartamento 201",
    ciudad: "Medellín, Antioquia",
    cantidad: 2,
  },
  {
    id: 3,
    cliente: "Julian Thorne",
    initials: "JT",
    avatarBg: "#3b2a1a",
    avatarColor: "#ffba67",
    producto: "iPhone 15 Pro",
    fecha: "22 Oct, 2026",
    estado: "entregado",
    monto: "$3.000.000",
    direccion: "Calle 100 # 45-23, Apto 502",
    ciudad: "Cali, Valle del Cauca",
    cantidad: 1,
  },
  {
    id: 4,
    cliente: "Marco Rossi",
    initials: "MR",
    avatarBg: "#32324d",
    avatarColor: "#ffba67",
    producto: 'iPad Pro 11"',
    fecha: "21 Oct, 2026",
    estado: "pendiente",
    monto: "$2.799.000",
    direccion: "Avenida El Dorado # 103-12",
    ciudad: "Bogotá, Cundinamarca",
    cantidad: 1,
  },
  {
    id: 5,
    cliente: "Valentina Torres",
    initials: "VT",
    avatarBg: "#2a1a3b",
    avatarColor: "#d4a0ff",
    producto: "Samsung Galaxy S24",
    fecha: "20 Oct, 2026",
    estado: "pendiente",
    monto: "$2.100.000",
    direccion: "Calle 72 # 10-34, Apto 301",
    ciudad: "Bogotá, Cundinamarca",
    cantidad: 1,
  },
  {
    id: 6,
    cliente: "Sebastián Mora",
    initials: "SM",
    avatarBg: "#1a2e3b",
    avatarColor: "#67d0e7",
    producto: "Audífonos Sony",
    fecha: "19 Oct, 2026",
    estado: "encamino",
    monto: "$1.450.000",
    direccion: "Carrera 43A # 16-95, Oficina 204",
    ciudad: "Medellín, Antioquia",
    cantidad: 1,
  },
  {
    id: 7,
    cliente: "Camila Ríos",
    initials: "CR",
    avatarBg: "#1a3b22",
    avatarColor: "#6ee7a0",
    producto: "Teclado gamer",
    fecha: "18 Oct, 2026",
    estado: "entregado",
    monto: "$580.000",
    direccion: "Avenida 6N # 23-45, Casa 12",
    ciudad: "Cali, Valle del Cauca",
    cantidad: 2,
  },
  {
    id: 8,
    cliente: "Andrés Pedraza",
    initials: "AP",
    avatarBg: "#3b1a1a",
    avatarColor: "#ff9a9a",
    producto: 'Monitor LG"',
    fecha: "17 Oct, 2026",
    estado: "encamino",
    monto: "$3.200.000",
    direccion: "Calle 15 # 28-60, Barrio El Prado",
    ciudad: "Barranquilla, Atlántico",
    cantidad: 1,
  },
];

const FILTERS = ["Todo", "Pendiente", "En camino", "Entregado"];

function StatusDropdown({ order, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const status = estadosHistorial[order.estado];

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
      >
        {status.label}
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-1 z-50 rounded-xl overflow-hidden shadow-xl min-w-[130px] bg-surface-container-high border border-surface-container">
          {Object.entries(estadosHistorial).map(([val, c]) => (
            <button
              key={val}
              onClick={() => {
                onStatusChange(order.id, val);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-surface-container-highest transition-colors block ${c.className}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderModal({ order, onClose }) {
  const status = estadosHistorial[order.estado];

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="
          relative
          bg-surface-container-low
          rounded-hero
          shadow-2xl
          flex
          flex-col
          overflow-hidden
          w-full
          max-w-[95vw]
          sm:w-[820px]
          sm:max-w-[820px]
          sm:min-w-[700px]
          h-[90vh]
          shrink-0
          flex-none
        "
      >
        {/* Header */}
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 shrink-0">
          <h2 className="text-headline-md font-bold text-on-surface tracking-tight mb-1">
            Detalle del pedido
          </h2>

          <p className="text-brand-muted-text text-sm mb-4">
            Fecha: {order.fecha}
          </p>

          <span
            className={`inline-flex items-center rounded-full px-4 py-1.5 border font-bold text-sm ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-4 sm:pb-6 space-y-4 sm:space-y-5">
          <div>
            <p className="text-brand-muted-text text-sm font-bold mb-3">
              Cliente
            </p>

            <div className="bg-surface-container rounded-xl px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                style={{
                  backgroundColor: order.avatarBg,
                  color: order.avatarColor,
                }}
              >
                {order.initials}
              </div>

              <span className="font-semibold text-on-surface text-sm sm:text-base">
                {order.cliente}
              </span>
            </div>
          </div>

          <div>
            <p className="text-brand-muted-text text-sm font-bold mb-3">
              Dirección de envío
            </p>

            <div className="bg-surface-container rounded-xl px-4 sm:px-5 py-3 sm:py-4">
              <p className="font-semibold text-on-surface text-sm sm:text-base">
                {order.direccion}
              </p>

              <p className="text-brand-muted-text text-xs sm:text-sm mt-1">
                {order.ciudad}
              </p>
            </div>
          </div>

          <div>
            <p className="text-brand-muted-text text-sm font-bold mb-3">
              Producto solicitado
            </p>

            <div className="bg-surface-container rounded-xl px-4 sm:px-5 py-3 sm:py-4">
              <p className="font-semibold text-on-surface text-sm sm:text-base">
                {order.producto}
              </p>

              <div className="border-t border-surface-container/50 mt-3 pt-3">
                <p className="font-semibold text-brand-muted-text text-sm">
                  Cantidad: {order.cantidad} unidad
                  {order.cantidad > 1 ? "es" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-primary bg-surface-container-high rounded-xl px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
            <span className="text-brand-muted-text text-sm font-bold">
              Precio total del pedido
            </span>

            <span className="text-primary font-bold text-lg sm:text-xl">
              {order.monto}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-t border-surface-container shrink-0">
          <button
            onClick={onClose}
            className="w-full border border-outline rounded-xl py-3 sm:py-3.5 font-bold text-brand-muted-text text-sm sm:text-base hover:bg-surface-container transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Pedidos() {
  const [orders, setOrders] = useState(ordersData);
  const [activeFilter, setActiveFilter] = useState("Todo");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = orders.filter((order) => {
    const statusMap = {
      pendiente: "Pendiente",
      encamino: "En camino",
      entregado: "Entregado",
    };
    const orderEstado = statusMap[order.estado] || order.estado;
    return activeFilter === "Todo" || orderEstado === activeFilter;
  });

  function handleStatusChange(orderId, newEstado) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, estado: newEstado } : o))
    );
  }

  return (
    <div className="flex h-screen bg-surface-container-lowest overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title="Pedidos" />

        <section className="flex-1 p-padding-md sm:p-padding-lg lg:p-padding-xl overflow-y-auto overflow-x-hidden">
          <div className="mb-padding-xl">
            <h2 className="text-headline-md font-bold text-on-surface">
              Pedidos
            </h2>
            <p className="text-brand-muted-text mt-1">
              Gestiona y actualiza el estado de tus pedidos.
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
            {filteredOrders.length === 0 ? (
              <div className="rounded-card border border-surface-container bg-brand-dark-text px-6 py-12 text-center text-brand-muted-text text-sm">
                No hay pedidos para este filtro.
              </div>
            ) : (
              filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-surface-container-low border border-surface-container rounded-card p-4 flex flex-col gap-3"
                  >
                    {/* Fila 1: Avatar + Cliente + Estado */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                          style={{
                            backgroundColor: order.avatarBg,
                            color: order.avatarColor,
                          }}
                        >
                          {order.initials}
                        </div>
                        <span className="font-medium text-on-surface text-sm truncate">
                          {order.cliente}
                        </span>
                      </div>
                      <StatusDropdown
                        order={order}
                        onStatusChange={handleStatusChange}
                      />
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

                    {/* Fila 4: Botón detalle */}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="w-full py-2 rounded-xl border border-surface-container text-xs text-brand-muted-text hover:bg-surface-container transition-colors"
                    >
                      Ver detalle
                    </button>
                  </div>
                ))
            )}
          </div>

          {/* Tabla — solo desktop */}
          <div className="hidden md:block rounded-card overflow-x-auto border border-surface-container bg-brand-dark-text">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-brand-muted-text uppercase bg-surface-variant2">
                  <th className="px-6 py-4 text-left">Cliente</th>
                  <th className="px-6 py-4 text-center">Producto</th>
                  <th className="px-6 py-4 text-center">Fecha</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Acción</th>
                  <th className="px-6 py-4 text-center">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/50">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-brand-muted-text text-sm"
                    >
                      No hay pedidos para este filtro.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-surface-container/50 transition-colors group"
                      >
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                              style={{ backgroundColor: order.avatarBg, color: order.avatarColor }}
                            >
                              {order.initials}
                            </div>
                            <span className="font-medium text-on-surface">
                              {order.cliente}
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
                          <StatusDropdown
                            order={order}
                            onStatusChange={handleStatusChange}
                          />
                        </td>
                        <td className="px-6 py-6 text-center">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-4 py-1 rounded-xl border border-surface-container text-xs text-brand-muted-text hover:bg-surface-container"
                          >
                            Ver detalle
                          </button>
                        </td>
                        <td className="px-6 py-6 font-semibold text-on-surface text-center">
                          {order.monto}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
