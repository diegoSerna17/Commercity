import { useState } from "react";
import Header from "../../components/globales/Header";
import DetallePedidos from "./DetallePedidos";

const PEDIDOS_INICIALES = [
  {
    id: 1,
    cliente: "Alex Rivera",
    avatar: null,
    avatarInicial: true,
    avatarLetra: "AR",
    avatarColor: "#4a3a6a",
    productos: [
      { nombre: "Teclado mecánico", cantidad: 1, precioUnitario: 699000 },
      { nombre: "Mouse inalámbrico", cantidad: 1, precioUnitario: 600000 },
    ],
    fecha: "24 Oct, 2026",
    fechaLarga: "24 octubre, 2026",
    estado: "Entregado",
    direccion: "Calle 45 # 23-10, Apartamento 301",
    ciudad: "Bogotá, Cundinamarca",
    monto: 1299000,
  },
  {
    id: 2,
    cliente: "Elena Sanz",
    avatar: null,
    avatarInicial: true,
    avatarLetra: "ES",
    avatarColor: "#3a4a6a",
    productos: [
      { nombre: "Monitor 4K", cantidad: 1, precioUnitario: 1900000 },
    ],
    fecha: "23 Oct, 2026",
    fechaLarga: "23 octubre, 2026",
    estado: "En Camino",
    direccion: "Av. El Poblado # 10-20, Oficina 5",
    ciudad: "Medellín, Antioquia",
    monto: 1900000,
  },
  {
    id: 3,
    cliente: "Julian Torres",
    avatar: null,
    avatarInicial: true,
    avatarLetra: "JT",
    avatarColor: "#2a5a3a",
    productos: [
      { nombre: "Audifonos Gamer", cantidad: 2, precioUnitario: 350000 },
      { nombre: "Cargador universal", cantidad: 1, precioUnitario: 300000 },
      { nombre: "Mouse pc gamer", cantidad: 2, precioUnitario: 700000 },
      { nombre: "Estuche PC", cantidad: 2, precioUnitario: 300000 },
    ],
    fecha: "22 Oct, 2026",
    fechaLarga: "22 octubre, 2026",
    estado: "Entregado",
    direccion: "Carrera 7 # 12-34, Apartamento 201",
    ciudad: "Medellin, Antioquia",
    monto: 3000000,
  },
  {
    id: 4,
    cliente: "Marco Rossi",
    avatar: null,
    avatarInicial: true,
    avatarLetra: "MR",
    avatarColor: "#32324d",
    productos: [
      { nombre: "Laptop ultrabook", cantidad: 1, precioUnitario: 1200000 },
      { nombre: "Base enfriadora", cantidad: 1, precioUnitario: 300000 },
      { nombre: "Hub USB-C", cantidad: 2, precioUnitario: 250000 },
      { nombre: "Mochila laptop", cantidad: 1, precioUnitario: 349000 },
      { nombre: "Pad escritorio XL", cantidad: 2, precioUnitario: 150000 },
      { nombre: "Webcam HD", cantidad: 1, precioUnitario: 300000 },
    ],
    fecha: "21 Oct, 2026",
    fechaLarga: "21 octubre, 2026",
    estado: "Pendiente",
    direccion: "Calle 100 # 50-30, Casa 12",
    ciudad: "Cali, Valle del Cauca",
    monto: 2799000,
  },
];

const FILTROS = ["Todo", "Pendiente", "En Camino", "Entregado"];

const ESTADOS = ["Pendiente", "En Camino", "Entregado"];

const estadoBadge = {
  Entregado: "bg-primary-fixed-dim/10 text-primary-fixed-dim border border-primary-fixed-dim/40",
  "En Camino": "bg-secondary-fixed-dim/10 text-secondary-fixed-dim border border-secondary-fixed-dim/40",
  Pendiente: "bg-error-container/20 text-error border border-error/40",
};

const fmt = (n) => "$" + n.toLocaleString("es-CO");

export default function Pedidos() {
  const [pedidos, setPedidos] = useState(PEDIDOS_INICIALES);
  const [filtro, setFiltro] = useState("Todo");
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState(null);

  const pedidosFiltrados =
    filtro === "Todo"
      ? pedidos
      : pedidos.filter((p) => p.estado === filtro);

  const pedidoSeleccionado = pedidoSeleccionadoId
    ? pedidos.find((p) => p.id === pedidoSeleccionadoId)
    : null;

  function handleCambiarEstado(id, nuevoEstado) {
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p))
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Pedidos" />

      <section className="flex-1 p-padding-md sm:p-padding-lg lg:p-padding-xl overflow-y-auto overflow-x-hidden">
        <div className="mb-padding-xl">
          <h1 className="text-headline-md font-bold text-on-surface mb-1">
            Pedidos
          </h1>
          <p className="text-brand-muted-text text-body-sm sm:text-body-md">
            Gestiona y actualiza el estado de tus pedidos.
          </p>
        </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {FILTROS.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`h-[32px] px-5 rounded-full text-[12px] tracking-[0.6px] font-semibold transition-colors ${
              filtro === f
                ? "bg-brand-orange text-brand-dark-text"
                : "bg-surface-variant2 text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div
        className="w-full overflow-x-auto rounded-card"
        style={{
          backgroundColor: "var(--color-auth-card-bg)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="bg-surface-variant2/50" style={{ borderBottom: "1px solid rgba(50,50,77,0.2)" }}>
              {[
                { label: "CLIENTE", align: "left" },
                { label: "PRODUCTOS", align: "left" },
                { label: "FECHA", align: "left" },
                { label: "ESTADO", align: "left" },
                { label: "ACCION", align: "left" },
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
            {pedidosFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-brand-muted-text text-[14px]"
                >
                  No hay pedidos para este filtro.
                </td>
              </tr>
            ) : (
              pedidosFiltrados.map((pedido) => (
                <tr
                  key={pedido.id}
                  style={{ borderTop: "1px solid rgba(50,50,77,0.1)" }}
                >
                  <td className="px-[24px] py-[20px] whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-primary-fixed-dim text-[16px] shrink-0"
                        style={{
                          backgroundColor: pedido.avatarColor ?? "#32324d",
                          fontFamily: "var(--font-sans)",
                          fontWeight: 700,
                        }}
                      >
                        {pedido.avatarLetra}
                      </div>
                      <span
                        className="text-on-surface text-[16px]"
                      >
                        {pedido.cliente}
                      </span>
                    </div>
                  </td>

                  <td className="px-[24px] py-[20px] whitespace-nowrap">
                    <span
                      className="text-on-surface text-[16px] font-medium"
                    >
                      {pedido.productos.length === 1
                        ? "1 producto"
                        : `${pedido.productos.length} productos`}
                    </span>
                  </td>

                  <td className="px-[24px] py-[20px] whitespace-nowrap">
                    <span
                      className="text-brand-muted-text text-[14px]"
                    >
                      {pedido.fecha}
                    </span>
                  </td>

                  <td className="px-[24px] py-[20px] whitespace-nowrap">
                    <select
                      value={pedido.estado}
                      onChange={(e) =>
                        handleCambiarEstado(pedido.id, e.target.value)
                      }
                      className={`h-[23px] pl-[12px] pr-[8px] rounded-full text-[12px] font-medium cursor-pointer outline-none ${estadoBadge[pedido.estado] ?? "bg-surface-variant2 text-on-surface-variant"}`}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e} className="bg-auth-card-bg text-on-surface">
                          {e}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-[24px] py-[20px] whitespace-nowrap">
                    <button
                      onClick={() => setPedidoSeleccionadoId(pedido.id)}
                      className="bg-auth-card-bg border border-[#8e8e93] text-on-surface text-[12px] h-[23px] px-[14px] rounded-full hover:bg-input-bg transition-colors"
                    >
                      Ver detalle
                    </button>
                  </td>

                  <td className="px-[24px] py-[20px] whitespace-nowrap text-right">
                    <span
                      className="text-on-surface text-[16px]"
                    >
                      {fmt(pedido.monto)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pedidoSeleccionado && (
        <DetallePedidos
          pedido={pedidoSeleccionado}
          onClose={() => setPedidoSeleccionadoId(null)}
        />
      )}
      </section>
    </div>
  );
}
