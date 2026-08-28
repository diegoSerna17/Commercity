import { useState } from "react";
import Header from "../../components/globales/Header";
import DetalleCompras from "./DetalleCompras";
import {
  formatCOP,
  calcSubtotal,
  calcTotal,
  numProductosLabel,
} from "../../utils/historialUtils.js";
import { EstadoBadge, Avatar } from "../../utils/historialUtils.jsx";

const ORDERS = [
  {
    id: 1,
    vendedor: "Alex Rivera",
    initials: "AR",
    initialsTextClass: "text-brand-orange",
    fechaCorta: "24 Oct, 2026",
    fechaLarga: "24 octubre, 2026",
    estado: "Entregado",
    direccion: "Calle 80 # 45-12, Apto 301",
    ciudad: "Bogotá, Cundinamarca",
    productos: [
      { nombre: "Auriculares Bluetooth Sony WH-1000XM5", cantidad: 1, precioUnit: 680000 },
      { nombre: "Teclado Mecánico Inalámbrico RGB", cantidad: 1, precioUnit: 411000 },
    ],
  },
  {
    id: 2,
    vendedor: "Elena Sanz",
    initials: "ES",
    initialsTextClass: "text-[#86d0ff]",
    fechaCorta: "23 Oct, 2026",
    fechaLarga: "23 octubre, 2026",
    estado: "En Camino",
    direccion: "Av. Américas # 23-45, Piso 3",
    ciudad: "Bogotá, Cundinamarca",
    productos: [
      { nombre: "Laptop Gaming ASUS ROG G15 i7", cantidad: 1, precioUnit: 1600000 },
    ],
  },
  {
    id: 3,
    vendedor: "Julian Torres",
    initials: "JT",
    initialsTextClass: "text-brand-orange",
    fechaCorta: "22 Oct, 2026",
    fechaLarga: "22 octubre, 2026",
    estado: "Entregado",
    direccion: "Carrera 7 # 12-34, Apartamento 201",
    ciudad: "Medellin, Antioquia",
    productos: [
      { nombre: "Audifonos Gamer", cantidad: 2, precioUnit: 283500 },
      { nombre: "Cargador universal", cantidad: 1, precioUnit: 243000 },
      { nombre: "Mouse pc gamer", cantidad: 2, precioUnit: 567000 },
      { nombre: "Estuche premium pc", cantidad: 2, precioUnit: 243000 },
    ],
  },
  {
    id: 4,
    vendedor: "Marco Rossi",
    initials: "MR",
    initialsTextClass: "text-[#ffba67]",
    fechaCorta: "21 Oct, 2026",
    fechaLarga: "21 octubre, 2026",
    estado: "Pendiente",
    direccion: "Transversal 45 # 67-89, Casa 5",
    ciudad: "Cali, Valle del Cauca",
    productos: [
      { nombre: 'Monitor 4K Samsung 27"', cantidad: 1, precioUnit: 980000 },
      { nombre: "Webcam HD Logitech C920", cantidad: 2, precioUnit: 125000 },
      { nombre: "Hub USB-C 7 puertos", cantidad: 1, precioUnit: 120000 },
      { nombre: "Silla ergonómica Pro", cantidad: 1, precioUnit: 650000 },
      { nombre: "Lámpara LED escritorio", cantidad: 1, precioUnit: 80000 },
      { nombre: "Alfombra gaming XL", cantidad: 1, precioUnit: 40000 },
    ],
  },
];

const FILTERS = ["Todo", "Pendiente", "En Camino", "Entregado"];

export default function HistorialDeCompras() {
  const [activeFilter, setActiveFilter] = useState("Todo");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const filteredOrders =
    activeFilter === "Todo" ? ORDERS : ORDERS.filter((o) => o.estado === activeFilter);

  const selectedOrder = selectedOrderId
    ? ORDERS.find((o) => o.id === selectedOrderId)
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Historial de compras" />

      <section className="flex-1 p-padding-md sm:p-padding-lg lg:p-padding-xl overflow-y-auto overflow-x-hidden">
        <div className="mb-padding-xl">
        <h1 className="text-headline-md font-bold text-on-surface mb-1">
          Historial Compras
        </h1>
        <p className="text-brand-muted-text text-body-sm sm:text-body-md">
          Visualiza y haz seguimiento de tus compras en el historial.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`h-[32px] px-5 rounded-full text-[12px] tracking-[0.6px] font-semibold transition-colors ${
              activeFilter === f
                ? "bg-brand-orange text-brand-dark-text"
                : "bg-surface-variant2 text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="w-full overflow-x-auto rounded-card"
          style={{
            backgroundColor: "var(--color-auth-card-bg)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="text-center py-12 text-brand-muted-text text-[14px]">
                  No hay pedidos para este filtro.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* Tarjetas — solo móvil */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredOrders.map((order) => {
              const subtotal = calcSubtotal(order.productos);
              const total = calcTotal(subtotal);
              return (
                <div
                  key={order.id}
                  className="bg-auth-card-bg rounded-card p-4 flex flex-col gap-3"
                  style={{ border: "1px solid var(--color-border-subtle)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar order={order} />
                      <span className="text-on-surface text-sm font-medium truncate">{order.vendedor}</span>
                    </div>
                    <EstadoBadge estado={order.estado} withBorder />
                  </div>

                  <p className="text-on-surface text-sm">{order.productos.map((p) => p.nombre).join(", ")}</p>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-muted-text">{order.fechaCorta}</span>
                    <span className="text-on-surface font-semibold">{formatCOP(total)}</span>
                  </div>

                  <button
                    onClick={() => setSelectedOrderId(order.id)}
                    className="bg-auth-card-bg border border-[#8e8e93] text-on-surface text-[12px] h-[23px] px-[14px] rounded-full hover:bg-input-bg transition-colors w-fit"
                  >
                    Ver compra
                  </button>
                </div>
              );
            })}
          </div>

          {/* Tabla — solo desktop */}
          <div
            className="hidden md:block w-full overflow-x-auto rounded-card"
            style={{
              backgroundColor: "var(--color-auth-card-bg)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="bg-surface-variant2/50" style={{ borderBottom: "1px solid rgba(50,50,77,0.2)" }}>
                  {[
                    { label: "VENDEDOR", align: "left" },
                    { label: "PRODUCTOS", align: "left" },
                    { label: "FECHA", align: "left" },
                    { label: "ESTADO", align: "left" },
                    { label: "ACCIÓN", align: "left" },
                    { label: "MONTO", align: "right" },
                  ].map((col) => (
                    <th
                      key={col.label}
                      className={`px-[24px] py-[16px] text-[12px] tracking-[1.2px] uppercase whitespace-nowrap text-brand-muted-text font-semibold ${col.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const subtotal = calcSubtotal(order.productos);
                  const total = calcTotal(subtotal);
                  return (
                    <tr
                      key={order.id}
                      style={{ borderTop: "1px solid rgba(50,50,77,0.1)" }}
                    >
                      <td className="px-[24px] py-[20px] whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar order={order} />
                          <span className="text-on-surface text-[16px]">
                            {order.vendedor}
                          </span>
                        </div>
                      </td>
                      <td className="px-[24px] py-[20px] whitespace-nowrap">
                        <span className="text-on-surface text-[16px] font-medium">
                          {numProductosLabel(order.productos)}
                        </span>
                      </td>
                      <td className="px-[24px] py-[20px] whitespace-nowrap">
                        <span className="text-brand-muted-text text-[14px]">
                          {order.fechaCorta}
                        </span>
                      </td>
                      <td className="px-[24px] py-[20px] whitespace-nowrap">
                        <EstadoBadge estado={order.estado} withBorder />
                      </td>
                      <td className="px-[24px] py-[20px] whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="bg-auth-card-bg border border-[#8e8e93] text-on-surface text-[12px] h-[23px] px-[14px] rounded-full hover:bg-input-bg transition-colors"
                        >
                          Ver compra
                        </button>
                      </td>
                      <td className="px-[24px] py-[20px] whitespace-nowrap text-right">
                        <span className="text-on-surface text-[16px]">
                          {formatCOP(total)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

        {selectedOrder && (
          <DetalleCompras order={selectedOrder} onClose={() => setSelectedOrderId(null)} />
        )}
      </section>
    </div>
  );
}


